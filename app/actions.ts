'use server';

import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import type { Database } from '@/lib/db/database.types';
import { isRedirectError } from 'next/dist/client/components/redirect-error'; // ✅ Fixed import

// ============================================
// TYPE DEFINITIONS
// ============================================

interface SubdomainActionState {
  subdomain?: string;
  icon?: string;
  displayName?: string;
  success: boolean;
  error?: string;
  message?: string;
}

interface CachedSubdomainData {
  emoji: string;
  displayName: string;
  tenantId: string;
  createdAt: number;
}

// ============================================
// VALIDATION HELPERS
// ============================================

export async function isValidIcon(str: string): Promise<boolean> {
  if (str.length > 10) {
    return false;
  }

  try {
    const emojiPattern = /[\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    console.warn('Emoji regex validation failed, using fallback validation', error);
  }

  return str.length >= 1 && str.length <= 10;
}

// ============================================
// SUBDOMAIN ACTIONS
// ============================================

export async function createSubdomainAction(
  prevState: SubdomainActionState | null,
  formData: FormData
): Promise<SubdomainActionState> {
  const subdomain = formData.get('subdomain') as string;
  const icon = formData.get('icon') as string;
  const displayName = formData.get('displayName') as string;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to create a subdomain' };
  }

  if (!subdomain || !icon || !displayName) {
    return { success: false, error: 'Subdomain, icon, and display name are required' };
  }

  if (!(await isValidIcon(icon))) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'Please enter a valid emoji (maximum 10 characters)',
    };
  }

  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.',
    };
  }

  // Check if subdomain exists in Redis cache
  const cachedSubdomain = await redis.get(`subdomain:${sanitizedSubdomain}`);
  if (cachedSubdomain) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'This subdomain is already taken',
    };
  }
  const supabaseAdmin = getSupabaseAdmin();
  // Check if subdomain exists in database
  const { data: existingTenant } = await supabaseAdmin
    .from('tenants')
    .select('id, slug')
    .eq('slug', sanitizedSubdomain)
    .single();

  if (existingTenant) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'This subdomain is already taken',
    };
  }

  // Get user profile from database
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, nickname')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'User profile not found in database' };
  }

  try {
    // Type-safe tenant insert using generated types
    type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
    
    const tenantData: TenantInsert = {
      slug: sanitizedSubdomain,
      display_name: displayName,
      settings: {
        emoji: icon,
      },
      plan: 'free',
    };

    // Create tenant in database
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert(tenantData)
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant creation error:', tenantError);
      throw tenantError || new Error('Failed to create tenant');
    }

    // Update user profile with tenant_id
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ tenant_id: tenant.id })
      .eq('id', user.id);

    if (updateProfileError) {
      console.error('Profile update error:', updateProfileError);
    }

    // Create default portfolio
    type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];
    
    const portfolioData: PortfolioInsert = {
      tenant_id: tenant.id,
      content: JSON.stringify({
        title: displayName,
        description: `Welcome to ${displayName}'s portfolio`,
      }),
      editor_id: user.id,
      is_hidden: false,
    };

    const { error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .insert(portfolioData);

    if (portfolioError) {
      console.error('Portfolio creation error:', portfolioError);
    }

    // Cache subdomain data in Redis
    const cacheData: CachedSubdomainData = {
      emoji: icon,
      displayName,
      tenantId: tenant.id,
      createdAt: Date.now(),
    };
    
    await redis.set(
      `subdomain:${sanitizedSubdomain}`, 
      JSON.stringify(cacheData),
      { EX: 60 * 60 * 24 * 7 }
    );

    revalidatePath('/dashboard');
    
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    
    redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
  } catch (error: unknown) {
    if (isRedirectError(error)) {
      throw error;
    }
    
    console.error('Error creating subdomain:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create subdomain' 
    };
  }
}

export async function deleteSubdomainAction(
  prevState: SubdomainActionState | null,
  formData: FormData
): Promise<SubdomainActionState> {
  const subdomain = formData.get('subdomain') as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug')
      .eq('slug', subdomain)
      .single();

    if (tenantError || !tenant) {
      return { success: false, error: 'Subdomain not found' };
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.tenant_id !== tenant.id) {
      return { success: false, error: 'You do not have permission to delete this subdomain' };
    }

    const { error: deleteError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenant.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      throw deleteError;
    }

    await redis.del(`subdomain:${subdomain}`);

    revalidatePath('/dashboard');
    return { success: true, message: 'Domain deleted successfully' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    
    console.error('Error deleting subdomain:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete subdomain' 
    };
  }
}
