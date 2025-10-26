import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { portfolios, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portfolioId = parseInt(id);

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

    const body = await request.json();
    const { title, description, content, published } = body;

    // Get portfolio and verify ownership
    const portfolio = await db.query.portfolios.findFirst({
      where: (portfolios, { eq }) => eq(portfolios.id, portfolioId),
    });

    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }

    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, portfolio.tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const dbUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.providerId, user.id),
    });

    if (!dbUser || tenant.ownerId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update portfolio
    await db
      .update(portfolios)
      .set({
        title,
        description,
        content,
        published: published ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(portfolios.id, portfolioId));

    // Invalidate cache
    try {
      await redis.del(`subdomain:${tenant.subdomain}`);
      await redis.del(`portfolio:tenant:${tenant.id}`);
    } catch (error) {
      console.error('Redis cache invalidation error:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

