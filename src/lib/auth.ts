import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

const ALLOWED_EMAIL_DOMAIN = 'aiesec.dk';

/**
 * Data Access Layer guard for every protected page. Proxy (src/proxy.ts)
 * only checks "is there a session" cheaply; this does the real checks close
 * to the data: domain allow-list, and that onboarding (branch selection) is
 * complete. Call this at the top of every protected Server Component.
 */
export async function requireUser(): Promise<{
  user: { id: string; email: string };
  profile: Profile;
}> {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<Profile>();

  if (!profile) redirect('/onboarding');

  return { user: { id: user.id, email }, profile };
}
