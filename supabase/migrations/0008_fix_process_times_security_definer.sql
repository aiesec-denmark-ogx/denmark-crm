-- Supabase Advisor flagged ep_process_times as a "Security Definer View": a
-- plain `create view` runs with the view owner's privileges by default, which
-- bypasses the branch-scoped RLS policy on the underlying ep_status_history
-- table. Any signed-in user could query this view directly via the REST API
-- and see process-time data for EPs in branches other than their own.
-- security_invoker makes the view run with the querying user's own
-- permissions instead, so the existing RLS policy on ep_status_history is
-- enforced as intended.
alter view public.ep_process_times set (security_invoker = true);
