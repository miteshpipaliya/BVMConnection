import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import type { AuthError, User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const protectedPrefixes = [
  '/home', '/explore', '/communities', '/reels', '/events', '/messages',
  '/notifications', '/bookmarks', '/connections', '/settings', '/posts', '/profile',
];

export async function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname === prefix || request.nextUrl.pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next({ request });
    return NextResponse.redirect(new URL('/login?reason=configuration', request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: Parameters<SetAllCookies>[0]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  let currentUser: User | null = null;
  let userError: AuthError | null = null;
  if (!claimsError && claims?.claims?.sub) {
    const result = await supabase.auth.getUser();
    currentUser = result.data.user;
    userError = result.error;
  }
  if (claimsError || userError || !claims?.claims?.sub || !currentUser?.email_confirmed_at) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
