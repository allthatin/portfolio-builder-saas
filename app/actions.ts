'use server';

import { redis } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { tenants, portfolios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export function isValidIcon(str: string) {
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

export async function createSubdomainAction(prevState: any, formData: FormData) {
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

  if (!isValidIcon(icon)) {
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
  const existingTenant = await db
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, sanitizedSubdomain))
    .limit(1);

  if (existingTenant.length > 0) {
    return {
      subdomain,
      icon,
      displayName,
      success: false,
      error: 'This subdomain is already taken',
    };
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.providerId, user.id),
  });

  if (!dbUser) {
    return { success: false, error: 'User not found in database' };
  }

  try {
    // Create tenant in database
    const [tenant] = await db
      .insert(tenants)
      .values({
        subdomain: sanitizedSubdomain,
        displayName,
        ownerId: dbUser.id,
        emoji: icon,
      })
      .$returningId();

    // Create default portfolio
    await db.insert(portfolios).values({
      tenantId: tenant.id,
      title: displayName,
      description: `Welcome to ${displayName}'s portfolio`,
      template: 'default',
      published: 1,
    });

    // Cache subdomain data in Redis
    await redis.set(`subdomain:${sanitizedSubdomain}`, JSON.stringify({
      emoji: icon,
      displayName,
      tenantId: tenant.id,
      createdAt: Date.now(),
    }));

    revalidatePath('/dashboard');
    
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
  } catch (error) {
    console.error('Error creating subdomain:', error);
    return { success: false, error: 'Failed to create subdomain' };
  }
}

export async function deleteSubdomainAction(prevState: any, formData: FormData) {
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

    // Delete from database
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.subdomain, subdomain),
    });

    if (tenant) {
      // Delete portfolios first (foreign key constraint)
      await db.delete(portfolios).where(eq(portfolios.tenantId, tenant.id));
      // Delete tenant
      await db.delete(tenants).where(eq(tenants.id, tenant.id));
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Domain deleted successfully' };
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    return { success: false, error: 'Failed to delete subdomain' };
  }
}

