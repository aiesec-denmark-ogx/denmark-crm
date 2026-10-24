'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Logo, LogoMark } from '@/components/Logo';

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
    <main className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand-blue-dark px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 15%, var(--brand-blue) 0%, transparent 45%), radial-gradient(circle at 85% 75%, var(--brand-orange) 0%, transparent 35%)',
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'var(--brand-blue)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full opacity-10"
          style={{ background: 'var(--brand-orange)' }}
        />

        <div className="relative text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">
          AIESEC Denmark
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <span className="font-display text-5xl font-bold tracking-tight">Synapse</span>
          </div>
          <p className="font-accent mt-4 max-w-xs text-lg leading-relaxed text-white/80 italic">
            The home base for every Global Volunteer and Global Talent exchange — from first
            sign-up to Realised.
          </p>
          <div className="mt-8 h-1 w-12 rounded-full bg-brand-orange" />
        </div>

        <div className="relative text-xs text-white/50">OGX &middot; Odense &middot; Kopenhag &middot; Aarhus</div>
      </div>

      {/* Sign-in panel */}
      <div className="flex flex-1 flex-col items-center justify-start bg-white px-6 pt-20 lg:justify-center lg:pt-0 dark:bg-neutral-950">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="text-xs font-semibold tracking-[0.2em] text-brand-blue uppercase">
              AIESEC Denmark
            </div>
            <div className="mt-1">
              <Logo size={30} textClassName="font-display text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in with your @aiesec.dk Google account to continue.
          </p>

          {searchParams.get('error') === 'domain' && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              This CRM is only available to @aiesec.dk accounts.
            </p>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:shadow disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            {loading ? (
              'Redirecting…'
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-600">
            Access is restricted to AIESEC Denmark members.
          </p>
        </div>
      </div>
    </main>
  );
}
