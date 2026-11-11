'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function EpManagerSection({
  epId,
  initialManager,
}: {
  epId: string;
  initialManager: Profile | null;
}) {
  const [manager, setManager] = useState<Profile | null>(initialManager);
  const [branchMates, setBranchMates] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || branchMates.length > 0) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('*').order('name');
      setBranchMates((data as Profile[]) ?? []);
    })();
  }, [open, branchMates.length]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function assign(profile: Profile | null) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('eps')
      .update({ manager_id: profile?.id ?? null })
      .eq('id', epId);
    if (updateError) {
      setError(updateError.message);
    } else {
      setManager(profile);
      setOpen(false);
    }
    setSaving(false);
  }

  return (
    <section ref={containerRef} className="relative flex flex-col gap-3">
      <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">EP manager</h2>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex w-full items-center justify-between rounded-md bg-neutral-100 px-4 py-3 text-left disabled:opacity-50 dark:bg-neutral-800"
      >
        {manager ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {manager.name ?? manager.email}
            </div>
            <div className="truncate text-sm text-neutral-500 dark:text-neutral-400">{manager.email}</div>
          </div>
        ) : (
          <span className="text-sm text-neutral-400">Unassigned — click to pick someone</span>
        )}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
          className="text-neutral-400"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {open && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
          {manager && (
            <button
              type="button"
              onClick={() => assign(null)}
              className="block w-full border-b border-neutral-100 px-4 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              Unassign
            </button>
          )}
          {branchMates.length === 0 ? (
            <p className="px-4 py-2 text-sm text-neutral-400">Loading…</p>
          ) : (
            branchMates.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => assign(p)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{p.name ?? p.email}</span>
                <span className="ml-2 text-xs text-neutral-400">{p.branch}</span>
              </button>
            ))
          )}
        </div>
      )}
    </section>
  );
}
