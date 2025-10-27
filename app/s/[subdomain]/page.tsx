// app\s\[subdomain]\page.tsx
import Link from 'next/link';
import type { Metadata } from 'next/types';
import { notFound } from 'next/navigation';
import { getSubdomainData } from '@/lib/subdomains';
import { protocol, rootDomain } from '@/lib/utils';
import { getPortfoliosByTenantId } from '@/lib/db';
import { parseMediaFiles, type MediaFile } from '@/lib/db/types';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

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

  const portfolios = await getPortfoliosByTenantId(subdomainData.tenantId);
  const portfolio = portfolios[0];
  
  // Type-safe media files parsing using helper
  const mediaFiles = portfolio?.media_files 
    ? parseMediaFiles(portfolio.media_files)
    : [];

  const renderMedia = (file: MediaFile) => {
    switch (file.type) {
      case 'image':
        return (
          <img
            key={file.id}
            src={file.url}
            alt={file.name}
            className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
          />
        );
      case 'video':
        return (
          <video
            key={file.id}
            src={file.url}
            controls
            className="w-full h-64 rounded-lg shadow-md"
          />
        );
      case 'audio':
        return (
          <div key={file.id} className="w-full p-4 bg-gray-50 rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎵</span>
              <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
            </div>
            <audio src={file.url} controls className="w-full" />
          </div>
        );
      case 'document':
        return (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
          >
            <span className="text-3xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{file.name}</p>
              {file.size && (
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="absolute top-4 right-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to {rootDomain}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-4xl w-full px-4">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-bold text-5xl shadow-xl">
            {subdomainData.displayName.charAt(0).toUpperCase()}
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-3">
            {subdomainData.displayName}
          </h1>
          
          <p className="text-lg text-gray-600 mb-4">
            {subdomain}.{rootDomain}
          </p>

          <div className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-8 capitalize">
            {subdomainData.plan} Plan
          </div>

          {portfolio ? (
            <div className="mt-12 text-left bg-white p-8 rounded-2xl shadow-lg">
              {portfolio.content && (
                <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed mb-8">
                  {portfolio.content}
                </div>
              )}

              {mediaFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Media Gallery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediaFiles.map(renderMedia)}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500 text-center">
                Last updated: {new Date(portfolio.updated_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center bg-white p-12 rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Portfolio Coming Soon
              </h2>
              <p className="text-gray-600">
                This portfolio is currently being prepared.
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-8 text-sm text-gray-500">
        <p>Powered by {rootDomain}</p>
      </footer>
    </div>
  );
}
