'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Ep } from '@/lib/types';
import { ALL_STATUSES, type Status } from '@/lib/status';
import { StatusBadge } from '@/components/StatusBadge';

export function DashboardTable({ eps }: { eps: Ep[] }) {
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

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Next follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filtered.map((ep) => (
              <tr
                key={ep.id}
                className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <td className="px-4 py-3">
                  <Link href={`/eps/${ep.id}`} className="font-medium hover:underline">
                    {ep.name}
                  </Link>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {ep.expa_ep_id}
                  </div>
                </td>
                <td className="px-4 py-3">{ep.entity}</td>
                <td className="px-4 py-3">{ep.desired_product ?? '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={ep.status} />
                </td>
                <td className="px-4 py-3">
                  {ep.next_followup_date
                    ? new Date(ep.next_followup_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                  No EPs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
