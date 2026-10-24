'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'aiesec.dk',
          prompt: 'select_account',
        },
      },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Synapse
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          AIESEC Denmark OGX CRM
        </p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Sign in with your @aiesec.dk Google account.
        </p>

        {searchParams.get('error') === 'domain' && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            This CRM is only available to @aiesec.dk accounts.
          </p>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          {loading ? 'Redirecting…' : 'Continue with Google'}
        </button>
      </div>
    </main>
  );
}
