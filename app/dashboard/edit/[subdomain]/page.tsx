import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTenantBySubdomain, getUserByProviderId, getPortfoliosByTenantId } from '@/lib/db';
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
  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) {
    redirect('/dashboard');
  }

  // Get user from database
  const dbUser = await getUserByProviderId(user.id);

  if (!dbUser || tenant.owner_id !== dbUser.id) {
    redirect('/dashboard');
  }

  // Get portfolio
  const portfolios = await getPortfoliosByTenantId(tenant.id);
  const portfolio = portfolios[0];

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
            published: portfolio.published,
          }}
        />
      </main>
    </div>
  );
}

