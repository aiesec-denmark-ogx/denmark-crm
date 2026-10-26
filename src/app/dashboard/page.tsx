import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/SignOutButton';
import { DashboardTable } from '@/components/DashboardTable';
import { NotificationBell } from '@/components/NotificationBell';
import { Logo } from '@/components/Logo';
import type { Ep } from '@/lib/types';

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: eps } = await supabase
    .from('eps')
    .select('*')
    .order('next_followup_date', { ascending: true, nullsFirst: false });

  const { data: commentRows } = await supabase.from('comments').select('ep_id');
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
