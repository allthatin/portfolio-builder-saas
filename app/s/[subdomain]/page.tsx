import { db } from '@/lib/db';
import { tenants, portfolios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { cacheGet, cacheSet } from '@/lib/redis';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantPage({ params }: PageProps) {
  const { subdomain } = await params;
  
  // Try to get from cache first
  const cacheKey = `tenant:${subdomain}`;
  let tenant = await cacheGet<any>(cacheKey);

  if (!tenant) {
    // Fetch from database
    const result = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (result.length === 0) {
      notFound();
    }

    tenant = result[0];
    // Cache for 5 minutes
    await cacheSet(cacheKey, tenant, 300);
  }

  // Fetch portfolio
  const portfolioCacheKey = `portfolio:tenant:${tenant.id}`;
  let portfolio = await cacheGet<any>(portfolioCacheKey);

  if (!portfolio) {
    const portfolioResult = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.tenantId, tenant.id))
      .limit(1);

    portfolio = portfolioResult[0] || null;
    if (portfolio) {
      await cacheSet(portfolioCacheKey, portfolio, 300);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          {tenant.emoji && (
            <div className="text-6xl mb-4">{tenant.emoji}</div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {tenant.displayName}
          </h1>
          <p className="text-lg text-gray-600">
            @{tenant.subdomain}
          </p>
        </div>

        {portfolio ? (
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold mb-4">{portfolio.title}</h2>
            {portfolio.description && (
              <p className="text-gray-700 mb-6">{portfolio.description}</p>
            )}
            {portfolio.content && (
              <div className="whitespace-pre-wrap">{portfolio.content}</div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No portfolio content yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { subdomain } = await params;
  
  const result = await db
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .limit(1);

  if (result.length === 0) {
    return {
      title: 'Not Found',
    };
  }

  const tenant = result[0];

  return {
    title: `${tenant.displayName} - Portfolio`,
    description: `Portfolio of ${tenant.displayName}`,
  };
}

