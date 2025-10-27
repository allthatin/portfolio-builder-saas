// lib/subdomains.ts
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/db/client';
import { getTenantBySlug } from '@/lib/db';
import type { Tenant } from '@/lib/db/types';

type SubdomainData = {
  displayName: string;
  tenantId: string; //uuid
  slug: string;
  plan: string;
  createdAt: number;
};

/**
 * Get subdomain/tenant data by slug
 * First checks Redis cache, then falls back to database
 */
export async function getSubdomainData(slug: string): Promise<SubdomainData | null> {
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Try cache first
  try {
    const cached = await redis.get(`subdomain:${sanitizedSlug}`);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      // Validate that cached data has required properties
      if (
        parsed &&
        typeof parsed === 'object' &&
        'displayName' in parsed &&
        'tenantId' in parsed &&
        'slug' in parsed &&
        'plan' in parsed &&
        'createdAt' in parsed
      ) {
        return parsed as SubdomainData;
      }
    }
  } catch (error) {
    console.error('Redis error:', error);
  }

  // Fallback to database
  try {
    const tenant = await getTenantBySlug(sanitizedSlug);

    if (!tenant) {
      return null;
    }

    const data: SubdomainData = {
      displayName: tenant.display_name,
      tenantId: tenant.id,
      slug: tenant.slug,
      plan: tenant.plan,
      createdAt: new Date(tenant.created_at).getTime(),
    };

    // Cache for future requests
    try {
      await redis.set(
        `subdomain:${sanitizedSlug}`, 
        JSON.stringify(data),
        { EX: 3600 } // 1 hour cache
      );
    } catch (error) {
      console.error('Redis cache error:', error);
    }

    return data;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Get all tenants/subdomains
 * Returns list of all tenants ordered by creation date
 */
export async function getAllSubdomains() {
  try {
    // Get all tenants from database, ordered by creation date (newest first)
    const { data: allTenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, display_name, plan, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (allTenants || []).map((tenant) => ({
      slug: tenant.slug,
      displayName: tenant.display_name,
      tenantId: tenant.id,
      plan: tenant.plan,
      createdAt: new Date(tenant.created_at).getTime(),
    }));
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return [];
  }
}

/**
 * Get tenants by profile ID
 * Note: Your schema doesn't have owner_id in tenants table
 * You'll need to join with profiles table if you want to filter by user
 */
export async function getUserTenants(profileId: string) {
  try {
    // Get tenants where the profile is a member
    const { data: userTenants, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        tenant_id,
        tenants:tenant_id (
          id,
          slug,
          display_name,
          plan,
          created_at
        )
      `)
      .eq('id', profileId);

    if (error) {
      throw error;
    }

    // Filter out null tenants and map to desired format
    return (userTenants || [])
      .filter((item) => item.tenants)
      .map((item) => {
        const tenant = Array.isArray(item.tenants) ? item.tenants[0] : item.tenants;
        return {
          slug: tenant.slug,
          displayName: tenant.display_name,
          tenantId: tenant.id,
          plan: tenant.plan,
          createdAt: new Date(tenant.created_at).getTime(),
        };
      });
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}

/**
 * Get all profiles for a specific tenant
 */
export async function getTenantProfiles(tenantId: string) {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, nickname, name, avatar_url, role, is_admin, date_joined')
      .eq('tenant_id', tenantId)
      .order('date_joined', { ascending: false });

    if (error) {
      throw error;
    }

    return profiles || [];
  } catch (error) {
    console.error('Failed to fetch tenant profiles:', error);
    return [];
  }
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  try {
    const tenant = await getTenantBySlug(sanitizedSlug);
    return !tenant;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Invalidate subdomain cache
 */
export async function invalidateSubdomainCache(slug: string) {
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  try {
    await redis.del(`subdomain:${sanitizedSlug}`);
  } catch (error) {
    console.error('Failed to invalidate cache:', error);
  }
}

/**
 * Get tenant with full details including settings
 */
export async function getTenantWithSettings(slug: string): Promise<Tenant | null> {
  try {
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return tenant;
  } catch (error) {
    console.error('Failed to fetch tenant with settings:', error);
    return null;
  }
}
