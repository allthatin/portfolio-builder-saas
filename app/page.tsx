// app\page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { SearchBar } from '@/components/search-bar';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900">Portfolio Builder</div>
        <div className="space-x-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Create Your Portfolio in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Build a beautiful portfolio website with your own custom subdomain.
            No coding required.
          </p>
          <div className="mb-12">
            <SearchBar />
          </div>
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Fast Setup</h3>
            <p className="text-gray-600">
              Get your portfolio live in minutes with our easy-to-use platform.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Beautiful Templates</h3>
            <p className="text-gray-600">
              Choose from professionally designed templates that look great on any device.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-xl font-semibold mb-2">Custom Domain</h3>
            <p className="text-gray-600">
              Get your own subdomain or connect a custom domain to showcase your work.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
