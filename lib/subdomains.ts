// lib/subdomains.ts
import { redis } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/db/client';
import { getTenantBySubdomain } from '@/lib/db';
import type { Tenant } from '@/lib/db/types';

type SubdomainData = {
  emoji: string;
  displayName: string;
  tenantId: number;
  createdAt: number;
};

export async function getSubdomainData(subdomain: string): Promise<SubdomainData | null> {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Try cache first
  try {
    const cached = await redis.get(`subdomain:${sanitizedSubdomain}`);
    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }
  } catch (error) {
    console.error('Redis error:', error);
  }

  // Fallback to database
  try {
    const tenant = await getTenantBySubdomain(sanitizedSubdomain);

    if (!tenant) {
      return null;
    }

    const data: SubdomainData = {
      emoji: tenant.emoji || '📄',
      displayName: tenant.display_name,
      tenantId: tenant.id,
      createdAt: new Date(tenant.created_at).getTime(),
    };

    // Cache for future requests
    try {
      await redis.set(
        `subdomain:${sanitizedSubdomain}`, 
        JSON.stringify(data),
        { EX: 3600 } // 1시간 캐시
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

export async function getAllSubdomains() {
  try {
    // Get all tenants from database, ordered by creation date (newest first)
    const { data: allTenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id, subdomain, display_name, emoji, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (allTenants || []).map((tenant: Tenant) => ({
      subdomain: tenant.subdomain,
      emoji: tenant.emoji || '📄',
      displayName: tenant.display_name,
      createdAt: new Date(tenant.created_at).getTime(),
    }));
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return [];
  }
}

// 특정 사용자의 테넌트만 가져오기 (필요한 경우)
export async function getUserTenants(ownerId: number) {
  try {
    const { data: userTenants, error } = await supabaseAdmin
      .from('tenants')
      .select('id, subdomain, display_name, emoji, created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (userTenants || []).map((tenant: Tenant) => ({
      subdomain: tenant.subdomain,
      emoji: tenant.emoji || '📄',
      displayName: tenant.display_name,
      createdAt: new Date(tenant.created_at).getTime(),
    }));
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}

