// lib/db/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

// ✅ 전역 변수로 캐싱 (import 시점에 실행 안 됨)
const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

export function getSupabaseAdmin() {
  if (globalForSupabase.supabase) {
    return globalForSupabase.supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `Missing Supabase environment variables:\n` +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓' : '✗'}\n` +
      `Available env keys: ${Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ')}`
    );
  }

  const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForSupabase.supabase = client;
  }

  return client;
}
