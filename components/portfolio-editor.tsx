'use client';

import { useState } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { useRouter } from 'next/navigation';
import { parseMediaFiles, type Portfolio, type MediaFile } from '@/lib/db/types';

interface PortfolioEditorProps {
  subdomain: string;
  portfolio: Portfolio;
}

export function PortfolioEditor({ subdomain, portfolio }: PortfolioEditorProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    content: portfolio.content || '',
    is_hidden: portfolio.is_hidden ?? false,
    media_files: parseMediaFiles(portfolio.media_files),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleMediaUpload = (mediaFile: MediaFile) => {
    setFormData({
      ...formData,
      media_files: [...formData.media_files, mediaFile],
    });
  };

  const handleRemoveMedia = (id: string) => {
    setFormData({
      ...formData,
      media_files: formData.media_files.filter((file) => file.id !== id),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch(`/api/portfolio/${portfolio.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save portfolio');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Revalidate the portfolio page
      await fetch(`/api/revalidate?path=/s/${subdomain}`, { method: 'POST' });
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const renderMediaPreview = (file: MediaFile) => {
    switch (file.type) {
      case 'image':
        return (
          <img 
            src={file.url} 
            alt={file.name} 
            className="w-full h-full object-cover" 
          />
        );
      case 'video':
        return (
          <video 
            src={file.url} 
            controls 
            className="w-full h-full object-cover"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <audio src={file.url} controls className="w-full px-4" />
          </div>
        );
      case 'document':
        return (
          <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100 p-4">
            <span className="text-4xl mb-2">📄</span>
            <span className="text-xs text-gray-600 text-center break-all">{file.name}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <span className="text-4xl">📎</span>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Your Portfolio</h2>
          <p className="text-gray-600">Update your portfolio content and media</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            Portfolio saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Content
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={20}
              placeholder="Write your portfolio content here... (Supports markdown)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500">Supports plain text and markdown</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Files
            </label>
            <ImageUpload onUpload={handleMediaUpload} />
            
            {/* Media Gallery */}
            {formData.media_files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.media_files.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                      {renderMediaPreview(file)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(file.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_hidden"
              checked={!formData.is_hidden}
              onChange={(e) => setFormData({ ...formData, is_hidden: !e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_hidden" className="text-sm font-medium text-gray-700">
              Publish portfolio (make it visible to everyone)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
