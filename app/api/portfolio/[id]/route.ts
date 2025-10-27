// app/api/portfolio/[id]/route.ts
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/db/client';
import { getPortfolioById, getTenantById } from '@/lib/db';
import type { UpdatePortfolio, Json } from '@/lib/db/types';
import { NextRequest, NextResponse } from 'next/server';
// import { redis } from '@/lib/redis'; // ✅ Redis 제거 (Edge에서 작동 안 함)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

interface UpdatePortfolioRequest {
  content?: string | null;
  is_hidden?: boolean | null;
  media_files?: Json;
  essence_metadata?: Json;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await getPortfolioById(id);

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    if (portfolio.editor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenant = await getTenantById(portfolio.tenant_id);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json() as UpdatePortfolioRequest;
    const { content, is_hidden, media_files } = body;

    const updateData: UpdatePortfolio = {
      updated_at: new Date().toISOString(),
    };
    
    if (content !== undefined) updateData.content = content;
    if (is_hidden !== undefined) updateData.is_hidden = is_hidden;
    if (media_files !== undefined) updateData.media_files = media_files;
    
    const supabaseAdmin = getSupabaseAdmin();
    const { data: updatedPortfolio, error } = await supabaseAdmin
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // ✅ Redis 캐시 무효화 제거 (Edge Runtime에서 작동 안 함)
    // Edge Runtime에서는 revalidatePath/revalidateTag 사용
    // import { revalidatePath } from 'next/cache'
    // revalidatePath(`/${tenant.slug}`)

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json({ error: 'Failed to update portfolio' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const portfolio = await getPortfolioById(id);

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    if (portfolio.editor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenant = await getTenantById(portfolio.tenant_id);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json({ error: 'Failed to delete portfolio' }, { status: 500 });
  }
}
