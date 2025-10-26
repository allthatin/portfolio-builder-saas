import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tenants, portfolios } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { PortfolioEditor } from './portfolio-editor';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function EditPortfolioPage({ params }: PageProps) {
  const { subdomain } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get tenant
  const tenant = await db.query.tenants.findFirst({
    where: (tenants, { eq }) => eq(tenants.subdomain, subdomain),
  });

  if (!tenant) {
    redirect('/dashboard');
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.providerId, user.id),
  });

  if (!dbUser || tenant.ownerId !== dbUser.id) {
    redirect('/dashboard');
  }

  // Get portfolio
  const portfolio = await db.query.portfolios.findFirst({
    where: (portfolios, { eq }) => eq(portfolios.tenantId, tenant.id),
  });

  if (!portfolio) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Edit Portfolio</h1>
          <a
            href="/dashboard"
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <PortfolioEditor
          subdomain={subdomain}
          portfolio={{
            id: portfolio.id,
            title: portfolio.title,
            description: portfolio.description || '',
            content: portfolio.content || '',
            published: portfolio.published === 1,
          }}
        />
      </main>
    </div>
  );
}

