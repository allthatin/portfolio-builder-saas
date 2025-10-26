import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/client';
import type { SearchResult } from '@/lib/db/types';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Use the PostgreSQL full-text search function
    const { data: results, error } = await supabaseAdmin
      .rpc('search_portfolios_and_tenants', {
        search_query: query.trim(),
      });

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    // Format results to match the expected structure
    const formattedResults = (results || []).map((result: SearchResult) => ({
      type: result.result_type,
      id: result.id,
      subdomain: result.subdomain,
      displayName: result.display_name,
      emoji: result.emoji,
      ...(result.result_type === 'portfolio' && {
        title: result.title,
        description: result.description,
      }),
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

