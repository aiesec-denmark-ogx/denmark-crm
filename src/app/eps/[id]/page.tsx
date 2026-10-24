import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EpForm } from '@/components/EpForm';
import { DocumentsSection } from '@/components/DocumentsSection';
import { CommentSection } from '@/components/CommentSection';
import { formatDuration } from '@/lib/status';
import type { Ep, EpProcessTimes } from '@/lib/types';

export default async function EpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: ep } = await supabase.from('eps').select('*').eq('id', id).single<Ep>();
  if (!ep) notFound();

  const { data: times } = await supabase
    .from('ep_process_times')
    .select('*')
    .eq('ep_id', id)
    .maybeSingle<EpProcessTimes>();

  const steps: Array<[string, string | null | undefined, string | null | undefined]> = [
    ['Open → Applied', times?.open_at, times?.applied_at],
    ['Applied → Accepted', times?.applied_at, times?.accepted_at],
    ['Accepted → Approved', times?.accepted_at, times?.approved_at],
  ];

  return (
    <>
      <div className="px-4 pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </Link>
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {ep.name}
        </h1>
        <Link
          href={`https://expa.aiesec.org/people/${ep.expa_ep_id}`}
          target="_blank"
          className="text-sm text-neutral-500 underline dark:text-neutral-400"
        >
          View on EXPA ↗
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-3 rounded-lg border border-neutral-200 p-4 text-sm sm:grid-cols-3 dark:border-neutral-800">
        {steps.map(([label, from, to]) => (
          <div key={label}>
            <div className="text-neutral-500 dark:text-neutral-400">{label}</div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
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
    </>
  );
}
