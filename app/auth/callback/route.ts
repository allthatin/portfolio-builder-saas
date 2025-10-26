import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db/client';
import { getUserByProviderId } from '@/lib/db';
import type { User } from '@/lib/db/types';

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
          const existingUser = await getUserByProviderId(providerId);

          if (!existingUser) {
            // Create new user
            const { error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email!,
                name: user.user_metadata.full_name || user.user_metadata.name || null,
                avatar_url: user.user_metadata.avatar_url || null,
                provider,
                provider_id: providerId,
              });

            if (insertError) {
              console.error('[Auth] Error creating user:', insertError);
            }
          } else {
            // Update existing user
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                email: user.email!,
                name: user.user_metadata.full_name || user.user_metadata.name || null,
                avatar_url: user.user_metadata.avatar_url || null,
              })
              .eq('provider_id', providerId);

            if (updateError) {
              console.error('[Auth] Error updating user:', updateError);
            }
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

