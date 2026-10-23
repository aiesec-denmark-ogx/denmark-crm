import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client — bypasses Row Level Security.
 * NEVER import this into client/browser code or expose the key via NEXT_PUBLIC_*.
 * Used only by the Typeform webhook route, which writes EPs on behalf of no
 * logged-in user and therefore cannot rely on the branch-scoped RLS policies.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
