import { createClient } from '@/lib/supabase/server';

// Expanded allowed file types
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': { ext: ['.jpg', '.jpeg'], category: 'image' as const, maxSize: 10 },
  'image/png': { ext: ['.png'], category: 'image' as const, maxSize: 10 },
  'image/gif': { ext: ['.gif'], category: 'image' as const, maxSize: 10 },
  'image/webp': { ext: ['.webp'], category: 'image' as const, maxSize: 10 },
  'image/svg+xml': { ext: ['.svg'], category: 'image' as const, maxSize: 2 },
  'image/avif': { ext: ['.avif'], category: 'image' as const, maxSize: 10 },
  
  // Videos
  'video/mp4': { ext: ['.mp4'], category: 'video' as const, maxSize: 100 },
  'video/webm': { ext: ['.webm'], category: 'video' as const, maxSize: 100 },
  'video/quicktime': { ext: ['.mov'], category: 'video' as const, maxSize: 100 },
  'video/x-msvideo': { ext: ['.avi'], category: 'video' as const, maxSize: 100 },
  
  // Audio
  'audio/mpeg': { ext: ['.mp3'], category: 'audio' as const, maxSize: 20 },
  'audio/wav': { ext: ['.wav'], category: 'audio' as const, maxSize: 20 },
  'audio/ogg': { ext: ['.ogg'], category: 'audio' as const, maxSize: 20 },
  'audio/webm': { ext: ['.weba'], category: 'audio' as const, maxSize: 20 },
  'audio/aac': { ext: ['.aac'], category: 'audio' as const, maxSize: 20 },
  'audio/flac': { ext: ['.flac'], category: 'audio' as const, maxSize: 50 },
  
  // Documents
  'application/pdf': { ext: ['.pdf'], category: 'document' as const, maxSize: 20 },
  'application/msword': { ext: ['.doc'], category: 'document' as const, maxSize: 20 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    ext: ['.docx'], category: 'document' as const, maxSize: 20 
  },
  'application/vnd.ms-excel': { ext: ['.xls'], category: 'document' as const, maxSize: 20 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    ext: ['.xlsx'], category: 'document' as const, maxSize: 20 
  },
  'application/vnd.ms-powerpoint': { ext: ['.ppt'], category: 'document' as const, maxSize: 30 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { 
    ext: ['.pptx'], category: 'document' as const, maxSize: 30 
  },
  'text/plain': { ext: ['.txt'], category: 'document' as const, maxSize: 5 },
  'text/markdown': { ext: ['.md'], category: 'document' as const, maxSize: 5 },
  'text/csv': { ext: ['.csv'], category: 'document' as const, maxSize: 10 },
} as const;

export type FileCategory = 'image' | 'video' | 'audio' | 'document';

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const fileType = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES];
  
  if (!fileType) {
    return { 
      valid: false, 
      error: `File type "${file.type}" is not supported. Allowed: images, videos, audio, documents` 
    };
  }
  
  const maxSizeMB = fileType.maxSize;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size must be less than ${maxSizeMB}MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)` 
    };
  }
  
  return { valid: true };
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
  const fileType = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES];
  return fileType?.category || 'document';
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string, 
  path: string, 
  file: File
): Promise<{ url: string; path: string }> {
  const supabase = await createClient();

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, path: data.path };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Get a signed URL for a private file
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List files in a storage bucket
 */
export async function listFiles(bucket: string, path: string = '') {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).list(path);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}
