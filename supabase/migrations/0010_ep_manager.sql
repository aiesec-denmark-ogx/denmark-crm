-- EP manager: lets someone in a branch be assigned as the person responsible
-- for a given EP, so everyone looking at the record can see who owns it.

-- A display name for profiles — we only ever stored email + branch before.
-- Backfill it from the Google profile data Supabase Auth already captured at
-- sign-in (raw_user_meta_data.full_name / .name), so existing users get a
-- real name without having to sign in again.
alter table public.profiles add column name text;

update public.profiles p
set name = coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
from auth.users u
where u.id = p.id;

alter table public.eps add column manager_id uuid references public.profiles (id);
create index eps_manager_id_idx on public.eps (manager_id);

-- No new RLS needed: profiles_select_branch_mates (0002) already lets anyone
-- see their branch-mates' profiles to pick from, and eps_update_branch_scoped
-- (0001) already lets anyone in the branch edit manager_id like any other
-- field on the EP.
