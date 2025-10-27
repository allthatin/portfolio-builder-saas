import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db/client';
import { getProfileById } from '@/lib/db';
import type { SocialProvider } from '@/lib/db/types';
export const dynamic = 'force-dynamic'
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
        // Upsert user to profiles table
        const provider = user.app_metadata.provider || 'google';
        const providerId = user.id;

        try {
          // Check if profile exists
          const existingProfile = await getProfileById(providerId);

          if (!existingProfile) {
            // Create new profile
            const { error: insertError } = await supabaseAdmin
              .from('profiles')
              .insert({
                id: providerId,
                email: user.email!,
                name: user.user_metadata.full_name || user.user_metadata.name || null,
                nickname: user.user_metadata.full_name || user.user_metadata.name || null,
                avatar_url: user.user_metadata.avatar_url || null,
                provider: provider as SocialProvider,
                role: 'user',
                date_joined: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('[Auth] Error creating profile:', insertError);
            }
          } else {
            // Update existing profile
            const { error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({
                email: user.email!,
                name: user.user_metadata.full_name || user.user_metadata.name || null,
                nickname: user.user_metadata.full_name || user.user_metadata.name || null,
                avatar_url: user.user_metadata.avatar_url || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', providerId);

            if (updateError) {
              console.error('[Auth] Error updating profile:', updateError);
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