import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/db/types';

// Create a singleton Supabase client for server-side database operations
// This client uses the service role key for full database access

const globalForDb = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin =
  globalForDb.supabase ??
  createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.supabase = supabaseAdmin;
}
