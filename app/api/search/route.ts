import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { portfolios, tenants } from '@/lib/db/schema';
import { like, or, eq } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Search in portfolios and tenants
    const searchPattern = `%${query}%`;

    // Search tenants by subdomain or display name
    const tenantResults = await db
      .select()
      .from(tenants)
      .where(
        or(
          like(tenants.subdomain, searchPattern),
          like(tenants.displayName, searchPattern)
        )
      )
      .limit(10);

    // Search portfolios by title, description, or content
    const portfolioResults = await db
      .select({
        portfolio: portfolios,
        tenant: tenants,
      })
      .from(portfolios)
      .innerJoin(tenants, eq(portfolios.tenantId, tenants.id))
      .where(
        or(
          like(portfolios.title, searchPattern),
          like(portfolios.description, searchPattern),
          like(portfolios.content, searchPattern)
        )
      )
      .limit(10);

    // Combine and format results
    const results = [
      ...tenantResults.map((tenant) => ({
        type: 'tenant' as const,
        id: tenant.id,
        subdomain: tenant.subdomain,
        displayName: tenant.displayName,
        emoji: tenant.emoji,
      })),
      ...portfolioResults.map(({ portfolio, tenant }) => ({
        type: 'portfolio' as const,
        id: portfolio.id,
        subdomain: tenant.subdomain,
        displayName: tenant.displayName,
        emoji: tenant.emoji,
        title: portfolio.title,
        description: portfolio.description,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

