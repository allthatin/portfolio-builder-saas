// lib/db/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

const globalForDb = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

// Safer environment variable access for Edge Runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // During build time, throw a more descriptive error
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing Supabase environment variables:
      NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}
      SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}
    `);
  } else {
    console.warn('Missing Supabase environment variables - this might be expected during build');
  }
}

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? (globalForDb.supabase ??
    createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }))
  : null;

if (process.env.NODE_ENV !== 'production' && supabaseAdmin) {
  globalForDb.supabase = supabaseAdmin;
}

// Export a function that throws if client is not available
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized - check environment variables');
  }
  return supabaseAdmin;
}