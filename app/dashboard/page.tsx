import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAllSubdomains } from '@/lib/subdomains';
import { SubdomainForm } from '@/components/subdomain-form';
import { DashboardContent } from './dashboard-content';

export const metadata = {
  title: 'Dashboard | Portfolio Builder',
  description: 'Manage your portfolio sites',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const tenants = await getAllSubdomains();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Portfolio Builder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Portfolios</h2>
            <p className="text-gray-600">Create and manage your portfolio sites</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="flex justify-center">
              <SubdomainForm />
            </div>
            <div>
              <DashboardContent tenants={tenants} userEmail={user.email || ''} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

