import Link from 'next/link';
import { requireAuthedUser, requireProfile } from '@/lib/auth';
import { SignOutButton } from '@/components/SignOutButton';
import { DashboardTable } from '@/components/DashboardTable';
import { NotificationBell } from '@/components/NotificationBell';
import { Logo } from '@/components/Logo';
import type { Ep, Profile } from '@/lib/types';

export default async function DashboardPage() {
  const { supabase, user } = await requireAuthedUser();

  const [{ data: profileRow }, { data: eps }, { data: commentRows }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
    supabase
      .from('eps')
      .select('*')
      .order('next_followup_date', { ascending: true, nullsFirst: false }),
    supabase.from('comments').select('ep_id'),
  ]);
  const profile = requireProfile(profileRow ?? null);
  const commentCounts: Record<string, number> = {};
  for (const row of commentRows ?? []) {
    commentCounts[row.ep_id] = (commentCounts[row.ep_id] ?? 0) + 1;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <Logo height={60} />
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {profile.branch === 'MC Denmark' ? 'Viewing all branches' : `Viewing ${profile.branch}`}
            {' · '}
            {user.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/eps/new"
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110"
          >
            + New EP
          </Link>
          <NotificationBell myId={user.id} />
          <SignOutButton />
        </div>
      </header>

      <DashboardTable eps={(eps as Ep[]) ?? []} commentCounts={commentCounts} />
    </main>
  );
}
