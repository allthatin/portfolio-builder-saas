import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { searchProfiles } from '@/lib/db';
import type { 
  ProfileSearchResult, 
  MarketItem, 
  Portfolio, 
  Tenant 
} from '@/lib/db/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'
interface SearchResultItem {
  type: 'profile' | 'market' | 'portfolio' | 'tenant';
  id: string;
  nickname?: string;
  description?: string;
  job?: string;
  rank?: number;
  title?: string;
  slug?: string;
  content?: string;
  displayName?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all'; // profiles, market, portfolios, tenants, or all
    const tenantId = searchParams.get('tenant_id');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    const results: SearchResultItem[] = [];

    try {
      // Search profiles if requested
      if (type === 'all' || type === 'profiles') {
        const profileResults: ProfileSearchResult[] = await searchProfiles(query.trim(), tenantId, 10);
        const formattedProfiles: SearchResultItem[] = profileResults.map(profile => ({
          type: 'profile',
          id: profile.id,
          nickname: profile.nickname,
          description: profile.description,
          job: profile.job,
          rank: profile.rank,
        }));
        results.push(...formattedProfiles);
      }

      // Search market items if requested
      if (type === 'all' || type === 'market') {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: marketItems, error: marketError } = await supabaseAdmin
          .from('market_items')
          .select('id, title, description, slug')
          .eq('tenant_id', tenantId)
          .eq('is_hidden', false)
          .textSearch('title', query.trim(), { type: 'websearch' })
          .limit(10);

        if (!marketError && marketItems) {
          const formattedMarket: SearchResultItem[] = marketItems.map((item: Pick<MarketItem, 'id' | 'title' | 'description' | 'slug'>) => ({
            type: 'market',
            id: item.id,
            title: item.title,
            description: item.description,
            slug: item.slug,
          }));
          results.push(...formattedMarket);
        }
      }

      // Search portfolios if requested
      if (type === 'all' || type === 'portfolios') {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: portfolios, error: portfolioError } = await supabaseAdmin
          .from('portfolios')
          .select('id, content')
          .eq('tenant_id', tenantId)
          .eq('is_hidden', false)
          .textSearch('content', query.trim(), { type: 'websearch' })
          .limit(10);

        if (!portfolioError && portfolios) {
          const formattedPortfolios: SearchResultItem[] = portfolios.map((portfolio: Pick<Portfolio, 'id' | 'content'>) => ({
            type: 'portfolio',
            id: portfolio.id,
            content: portfolio.content,
          }));
          results.push(...formattedPortfolios);
        }
      }

      // Search tenants if requested
      if (type === 'all' || type === 'tenants') {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: tenants, error: tenantError } = await supabaseAdmin
          .from('tenants')
          .select('id, display_name, slug')
          .textSearch('display_name', query.trim(), { type: 'websearch' })
          .limit(10);

        if (!tenantError && tenants) {
          const formattedTenants: SearchResultItem[] = tenants.map((tenant: Pick<Tenant, 'id' | 'display_name' | 'slug'>) => ({
            type: 'tenant',
            id: tenant.id,
            displayName: tenant.display_name,
            slug: tenant.slug,
          }));
          results.push(...formattedTenants);
        }
      }

    } catch (searchError) {
      console.error('Search operation error:', searchError);
      // Continue with empty results rather than failing completely
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}