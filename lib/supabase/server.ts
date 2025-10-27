// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  // ✅ 런타임에만 next/headers import
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );
  }

  throw new Error('createClient can only be used in Server Components');
}
