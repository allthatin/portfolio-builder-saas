import Link from 'next/link';
import type { Metadata } from 'next/types';
import { notFound } from 'next/navigation';
import { getSubdomainData } from '@/lib/subdomains';
import { protocol, rootDomain } from '@/lib/utils';
import { db } from '@/lib/db';
import { portfolios } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

// Enable ISR with 60 second revalidation
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain } = await params;
  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    return {
      title: rootDomain,
    };
  }

  return {
    title: `${subdomainData.displayName} - Portfolio`,
    description: `Portfolio page for ${subdomainData.displayName}`,
  };
}

export default async function SubdomainPage({ params }: PageProps) {
  const { subdomain } = await params;
  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    notFound();
  }

  // Fetch portfolio data
  const portfolio = await db.query.portfolios.findFirst({
    where: (portfolios, { eq }) => eq(portfolios.tenantId, subdomainData.tenantId),
  });

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="absolute top-4 right-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="text-9xl mb-6">{subdomainData.emoji}</div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Welcome to {subdomainData.displayName}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {subdomain}.{rootDomain}
          </p>

          {portfolio && (
            <div className="mt-12 text-left bg-white p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">{portfolio.title}</h2>
              {portfolio.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">{portfolio.description}</p>
              )}
              {portfolio.content && (
                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {portfolio.content}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

