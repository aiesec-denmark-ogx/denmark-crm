import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Server Component / Route Handler client — reads the session from request cookies. */
export async function createClient() {
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
            // Called from a Server Component where cookies can't be written.
            // Harmless as long as middleware is also refreshing the session.
          }
        },
      },
    }
  );
}
