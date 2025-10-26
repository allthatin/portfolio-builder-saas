import { redis } from '@/lib/redis';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  const tenant = await db.query.tenants.findFirst({
    where: (tenants, { eq }) => eq(tenants.subdomain, sanitizedSubdomain),
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
    await redis.set(`subdomain:${sanitizedSubdomain}`, JSON.stringify(data));
  } catch (error) {
    console.error('Redis cache error:', error);
  }

  return data;
}

export async function getAllSubdomains() {
  // Get all tenants from database
  const allTenants = await db.select().from(tenants).orderBy(tenants.createdAt);

  return allTenants.map((tenant) => ({
    subdomain: tenant.subdomain,
    emoji: tenant.emoji || '📄',
    displayName: tenant.displayName,
    createdAt: new Date(tenant.createdAt).getTime(),
  }));
}

