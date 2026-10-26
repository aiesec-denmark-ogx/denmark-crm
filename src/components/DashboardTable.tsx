'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Ep } from '@/lib/types';
import { ALL_STATUSES, type Status } from '@/lib/status';
import { StatusBadge } from '@/components/StatusBadge';

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} - ${time}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DashboardTable({
  eps,
  commentCounts,
}: {
  eps: Ep[];
  commentCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return eps.filter((ep) => {
      if (statusFilter !== 'all' && ep.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          ep.name.toLowerCase().includes(q) || ep.expa_ep_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [eps, statusFilter, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search by name or EXPA ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length} of {eps.length} EPs
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 px-4 py-8 text-center text-neutral-400 dark:border-neutral-800">
          No EPs match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ep) => {
            const followUp = formatDateTime(ep.next_followup_date);
            const updated = formatDate(ep.updated_at);
            const count = commentCounts[ep.id] ?? 0;

            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => router.push(`/eps/${ep.id}`)}
                className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <div>
                  <div className="font-medium text-neutral-900 dark:text-neutral-100">
                    {ep.name}
                  </div>
                  <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {ep.entity}
                    {ep.desired_product ? ` · ${ep.desired_product}` : ''}
                  </div>
                </div>

                <div>
                  <StatusBadge status={ep.status} />
                </div>

                <div className="text-sm">
                  {followUp ? (
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {followUp}
                    </span>
                  ) : (
                    <span className="text-neutral-400">No follow-up set</span>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-2.5 text-xs text-neutral-400 dark:border-neutral-800">
                  <span>{updated ? `Updated ${updated}` : ''}</span>
                  <span className="flex items-center gap-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
