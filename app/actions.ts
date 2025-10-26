'use server';

import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db/client';
import { getUserByProviderId, getTenantBySubdomain } from '@/lib/db';
import type { Tenant, Portfolio } from '@/lib/db/types';

// Define action state types
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
  tenantId: number;
  createdAt: number;
}

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

  // Check if subdomain exists in database
  const existingTenant = await getTenantBySubdomain(sanitizedSubdomain);

  if (existingTenant) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'This subdomain is already taken',
    };
  }

  // Get user from database
  const dbUser = await getUserByProviderId(user.id);

  if (!dbUser) {
    return { success: false, error: 'User not found in database' };
  }

  try {
    // Create tenant in database
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        subdomain: sanitizedSubdomain,
        display_name: displayName,
        owner_id: dbUser.id,
        emoji: icon,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      throw tenantError || new Error('Failed to create tenant');
    }

    // Create default portfolio
    const { error: portfolioError } = await supabaseAdmin
      .from('portfolios')
      .insert({
        tenant_id: tenant.id,
        title: displayName,
        description: `Welcome to ${displayName}'s portfolio`,
        template: 'default',
        published: true,
      });

    if (portfolioError) {
      throw portfolioError;
    }

    // Cache subdomain data in Redis
    const cacheData: CachedSubdomainData = {
      emoji: icon,
      displayName,
      tenantId: tenant.id,
      createdAt: Date.now(),
    };
    
    await redis.set(`subdomain:${sanitizedSubdomain}`, JSON.stringify(cacheData));

    revalidatePath('/dashboard');
    
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
  } catch (error) {
    console.error('Error creating subdomain:', error);
    return { success: false, error: 'Failed to create subdomain' };
  }
}

export async function deleteSubdomainAction(
  prevState: SubdomainActionState | null,
  formData: FormData
): Promise<SubdomainActionState> {
  const subdomain = formData.get('subdomain') as string;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  try {
    // Delete from Redis
    await redis.del(`subdomain:${subdomain}`);

    // Delete from database (portfolios will be cascade deleted)
    const tenant = await getTenantBySubdomain(subdomain);

    if (tenant) {
      // Verify ownership
      const dbUser = await getUserByProviderId(user.id);
      if (!dbUser || tenant.owner_id !== dbUser.id) {
        return { success: false, error: 'You do not have permission to delete this subdomain' };
      }

      // Delete tenant (portfolios will be cascade deleted due to foreign key constraint)
      const { error } = await supabaseAdmin
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (error) {
        throw error;
      }
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Domain deleted successfully' };
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return { success: false, error: 'Failed to delete subdomain' };
  }
}

