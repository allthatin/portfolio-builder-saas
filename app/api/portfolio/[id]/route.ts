import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db/client';
import { getPortfolioById, getTenantById, getUserByProviderId } from '@/lib/db';
import type { Portfolio } from '@/lib/db/types';
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const portfolioId = parseInt(id, 10);

    if (isNaN(portfolioId)) {
      return NextResponse.json({ error: 'Invalid portfolio ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio and verify ownership
    const portfolio = await getPortfolioById(portfolioId);

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const tenant = await getTenantById(portfolio.tenant_id);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const dbUser = await getUserByProviderId(user.id);

    if (!dbUser || tenant.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update portfolio
    const body = await request.json();
    const { title, description, content, template, published, seo_meta } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (template !== undefined) updateData.template = template;
    if (published !== undefined) updateData.published = published;
    if (seo_meta !== undefined) updateData.seo_meta = seo_meta;

    const { data: updatedPortfolio, error } = await supabaseAdmin
      .from('portfolios')
      .update(updateData)
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Invalidate cache
    try {
      await redis.del(`subdomain:${tenant.subdomain}`);
      await redis.del(`portfolio:tenant:${tenant.id}`);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const portfolioId = parseInt(id, 10);

    if (isNaN(portfolioId)) {
      return NextResponse.json({ error: 'Invalid portfolio ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get portfolio and verify ownership
    const portfolio = await getPortfolioById(portfolioId);

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const tenant = await getTenantById(portfolio.tenant_id);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const dbUser = await getUserByProviderId(user.id);

    if (!dbUser || tenant.owner_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete portfolio
    const { error } = await supabaseAdmin
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);

    if (error) {
      throw error;
    }

    // Invalidate cache
    try {
      await redis.del(`subdomain:${tenant.subdomain}`);
      await redis.del(`portfolio:tenant:${tenant.id}`);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}

