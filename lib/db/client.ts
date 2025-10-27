// lib/db/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  // 런타임에만 실행됨
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing Supabase environment variables:\n` +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}`
    );
  }

  cachedClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}