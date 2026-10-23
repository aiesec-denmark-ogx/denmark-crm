import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Optimistic auth check only (per Next.js guidance: Proxy runs on every
 * request, including prefetches, so it must stay cheap — no DB queries here).
 *
 * The real authorization — @aiesec.dk domain enforcement, branch scoping,
 * onboarding redirect — lives in the Data Access Layer (`src/lib/auth.ts`),
 * called from each protected page, and in Postgres Row Level Security.
 */
const PUBLIC_PATH_PREFIXES = ['/login', '/auth/callback', '/api/typeform-webhook'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the session cookie if needed — required by @supabase/ssr even
  // though this is "just" a cookie read, since Supabase may rotate the token.
  // Fail closed: if Supabase is unreachable, treat the request as unauthenticated
  // rather than letting an unhandled error take down every page.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
