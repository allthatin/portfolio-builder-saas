'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';

type SearchResult = {
  type: 'tenant' | 'portfolio';
  id: number;
  subdomain: string;
  displayName: string;
  emoji: string | null;
  title?: string;
  description?: string | null;
};

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPortfolios = async () => {
      if (query.trim().length === 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchPortfolios, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search portfolios..."
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={`${protocol}://${result.subdomain}.${rootDomain}`}
              className="block px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              onClick={() => {
                setShowResults(false);
                setQuery('');
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{result.emoji || '📄'}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {result.subdomain}.{rootDomain}
                  </div>
                  {result.type === 'portfolio' && result.title && (
                    <div className="text-sm text-gray-600 mt-1">{result.title}</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showResults && query && !loading && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-6 text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}

