'use client';

import { useState } from 'react';
import { ALLOWED_FILE_TYPES, getFileCategory } from '@/lib/supabase/storage';
import type { MediaFile } from '@/lib/db/types';

interface ImageUploadProps {
  onUpload: (mediaFile: MediaFile) => void;
  currentImage?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({ 
  onUpload, 
  currentImage,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv',
  maxSizeMB = 100
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'document'>('image');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedType = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
    if (!allowedType) {
      setError(`File type "${file.type}" is not supported. Please upload a valid file.`);
      return;
    }

    // Validate file size
    const maxSize = allowedType.maxSize * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size must be less than ${allowedType.maxSize}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setError(null);
    setUploading(true);

    const category = getFileCategory(file.type);
    setFileType(category);

    // Show preview for images and videos
    if (category === 'image' || category === 'video') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      const data = await response.json();
      
      // Create MediaFile object matching existing type
      const mediaFile: MediaFile = {
        id: crypto.randomUUID(),
        url: data.url,
        path: data.path,
        type: category,
        name: file.name,
        size: file.size,
      };

      onUpload(mediaFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    if (!preview) return null;

    switch (fileType) {
      case 'image':
        return (
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover" 
          />
        );
      case 'video':
        return (
          <video 
            src={preview} 
            controls 
            className="w-full h-full object-cover"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <audio src={preview} controls className="w-full px-2" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            <span className="text-4xl">📄</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {preview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
            {renderPreview()}
          </div>
        )}
        <div className="flex-1">
          <label
            htmlFor="file-upload"
            className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : preview ? 'Change File' : 'Upload File'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-2">
            Max {maxSizeMB}MB • Images, Videos, Audio, Documents
          </p>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
