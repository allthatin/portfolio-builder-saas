// lib/subdomains.ts
import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.subdomain, sanitizedSubdomain),
    });

    if (!tenant) {
      return null;
    }

    const data: SubdomainData = {
      emoji: tenant.emoji || '📄',
      displayName: tenant.displayName,
      tenantId: tenant.id,
      createdAt: new Date(tenant.createdAt).getTime(),
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
    const allTenants = await db
      .select({
        id: tenants.id,
        subdomain: tenants.subdomain,
        displayName: tenants.displayName,
        emoji: tenants.emoji,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    return allTenants.map((tenant) => ({
      subdomain: tenant.subdomain,
      emoji: tenant.emoji || '📄',
      displayName: tenant.displayName,
      createdAt: new Date(tenant.createdAt).getTime(),
    }));
  } catch (error) {
    console.error('Failed to fetch tenants:', error);
    return [];
  }
}

// 특정 사용자의 테넌트만 가져오기 (필요한 경우)
export async function getUserTenants(ownerId: number) {
  try {
    const userTenants = await db
      .select({
        id: tenants.id,
        subdomain: tenants.subdomain,
        displayName: tenants.displayName,
        emoji: tenants.emoji,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .where(eq(tenants.ownerId, ownerId))
      .orderBy(desc(tenants.createdAt));

    return userTenants.map((tenant) => ({
      subdomain: tenant.subdomain,
      emoji: tenant.emoji || '📄',
      displayName: tenant.displayName,
      createdAt: new Date(tenant.createdAt).getTime(),
    }));
  } catch (error) {
    console.error('Failed to fetch user tenants:', error);
    return [];
  }
}
