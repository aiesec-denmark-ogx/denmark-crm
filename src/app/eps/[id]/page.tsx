import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuthedUser, requireProfile } from '@/lib/auth';
import { EpForm } from '@/components/EpForm';
import { DocumentsSection } from '@/components/DocumentsSection';
import { CommentSection } from '@/components/CommentSection';
import { formatDuration } from '@/lib/status';
import type { Ep, EpProcessTimes, Profile } from '@/lib/types';

export default async function EpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthedUser();

  const [{ data: profileRow }, { data: ep }, { data: times }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
    supabase.from('eps').select('*').eq('id', id).single<Ep>(),
    supabase.from('ep_process_times').select('*').eq('ep_id', id).maybeSingle<EpProcessTimes>(),
  ]);
  const profile = requireProfile(profileRow ?? null);
  if (!ep) notFound();

  const steps: Array<[string, string | null | undefined, string | null | undefined]> = [
    ['Open → Applied', times?.open_at, times?.applied_at],
    ['Applied → Accepted', times?.applied_at, times?.accepted_at],
    ['Accepted → Approved', times?.accepted_at, times?.approved_at],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="-ml-24 mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-1.5 text-sm font-medium text-white hover:brightness-110"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {ep.name}
        </h1>
        {!ep.expa_ep_id.startsWith('PENDING-') && (
          <Link
            href={`https://expa.aiesec.org/people/${ep.expa_ep_id}`}
            target="_blank"
            className="text-sm font-medium text-brand-blue underline"
          >
            View on EXPA ↗
          </Link>
        )}
      </div>

      <section className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-4 text-sm sm:grid-cols-3 dark:border-neutral-800">
        {steps.map(([label, from, to]) => (
          <div key={label}>
            <div className="text-neutral-500 dark:text-neutral-400">{label}</div>
            <div className="font-display text-base font-bold text-brand-blue">
              {from && to ? formatDuration(new Date(to).getTime() - new Date(from).getTime()) : '—'}
            </div>
          </div>
        ))}
      </section>

      <EpForm initial={ep} myBranch={profile.branch} />

      <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

      <DocumentsSection epId={ep.id} />

      <hr className="my-8 border-neutral-200 dark:border-neutral-800" />

      <CommentSection epId={ep.id} myId={user.id} />
    </main>
  );
}
