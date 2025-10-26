import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Upsert user to database
        const provider = user.app_metadata.provider || 'google';
        const providerId = user.id;

        try {
          // Check if user exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.providerId, providerId))
            .limit(1);

          if (existingUser.length === 0) {
            // Create new user
            await db.insert(users).values({
              email: user.email!,
              name: user.user_metadata.full_name || user.user_metadata.name || null,
              avatarUrl: user.user_metadata.avatar_url || null,
              provider,
              providerId,
            });
          } else {
            // Update existing user
            await db
              .update(users)
              .set({
                email: user.email!,
                name: user.user_metadata.full_name || user.user_metadata.name || null,
                avatarUrl: user.user_metadata.avatar_url || null,
                updatedAt: new Date(),
              })
              .where(eq(users.providerId, providerId));
          }
        } catch (dbError) {
          console.error('[Auth] Database error:', dbError);
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`);
}

