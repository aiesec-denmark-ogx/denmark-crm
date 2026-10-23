import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Middleware takes it from here: it will send the user to /onboarding
  // if they don't have a profile yet, or let them through to the app.
  return NextResponse.redirect(`${origin}/`);
}
