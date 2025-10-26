import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const supabaseResponse = await updateSession(request);
  
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(rootDomain, '');
  
  // If there's a subdomain and it's not 'www', rewrite to the tenant page
  if (subdomain && subdomain !== hostname && subdomain !== 'www') {
    url.pathname = `/s/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url, supabaseResponse);
  }
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

