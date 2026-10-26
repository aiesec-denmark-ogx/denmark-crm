'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SELECTABLE_BRANCHES, type Branch } from '@/lib/options';

export default function OnboardingPage() {
  const router = useRouter();
  const [branch, setBranch] = useState<Branch | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branch) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      branch,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Which branch are you with?
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          This decides which EP records you can see. You can&apos;t change this yourself
          afterwards — ask an MC Denmark admin if it needs to change.
        </p>

        <div className="mt-6 space-y-2">
          {SELECTABLE_BRANCHES.map((option) => (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                branch === option
                  ? 'border-brand-blue bg-blue-50 dark:bg-neutral-800'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="branch"
                value={option}
                checked={branch === option}
                onChange={() => setBranch(option)}
                className="h-4 w-4"
              />
              {option}
            </label>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!branch || saving}
          className="mt-6 w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </main>
  );
}
