import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

const ALLOWED_EMAIL_DOMAIN = 'aiesec.dk';

/**
 * The auth half of the DAL guard: session + domain allow-list only. Returns
 * the live `supabase` client too, so a page can fire its profile lookup
 * alongside its own data queries in one Promise.all instead of paying for
 * them one round-trip at a time.
 */
export async function requireAuthedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const email = user.email ?? '';
  if (!email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    await supabase.auth.signOut();
    redirect('/login?error=domain');
  }

  return { supabase, user: { id: user.id, email } };
}

/** Redirects to onboarding if the (already-fetched) profile is missing. */
export function requireProfile(profile: Profile | null): Profile {
  if (!profile) redirect('/onboarding');
  return profile;
}

/**
 * Data Access Layer guard for every protected page. Proxy (src/proxy.ts)
 * only checks "is there a session" cheaply; this does the real checks close
 * to the data: domain allow-list, and that onboarding (branch selection) is
 * complete. Call this at the top of every protected Server Component that
 * doesn't need to parallelize the profile lookup with its own queries.
 */
export async function requireUser(): Promise<{
  user: { id: string; email: string };
  profile: Profile;
}> {
  const { supabase, user } = await requireAuthedUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  return { user, profile: requireProfile(profile) };
}
