-- AIESEC Denmark OGX CRM — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────

create type branch_enum as enum ('Odense', 'Kopenhag', 'Aarhus', 'MC Denmark');

create type product_enum as enum ('Global Volunteer', 'Global Talent');

create type status_enum as enum (
  -- main pipeline (green)
  'Open', 'Applied', 'Accepted', 'Paid', 'Approved', 'Realised', 'Finished', 'Completed',
  -- secondary cycle (yellow)
  'Consecutive Approval', 'Re-integrated',
  -- dropped out of the pipeline (red)
  'Dropped', 'Rejected', 'Withdrawn', 'No Response'
);

create type background_enum as enum (
  'BA', 'BD', 'IT', 'Finance', 'Engineering', 'Marketing',
  'Education Sciences', 'Humanities/Social Studies', 'Languages',
  'Political Sciences', 'Law', 'Natural Sciences', 'Other'
);

create type language_enum as enum (
  'English', 'Spanish', 'Portuguese', 'Danish', 'Arabic', 'Other'
);

create type citizenship_enum as enum (
  'Danish', 'Europe - EU', 'Europe - non-EU', 'Others'
);

create type referral_enum as enum (
  'Social Media', 'Friend Referral', 'Stand/Event'
);

create type region_enum as enum (
  'Americas', 'Europe', 'MEA', 'AP', 'Don''t know yet', 'Open to anything'
);

-- ─────────────────────────────────────────────────────────────────────────
-- Profiles (one row per logged-in user, created at onboarding)
-- ─────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@aiesec\.dk$'),
  branch branch_enum not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Helper: branch of the currently logged-in user. SECURITY DEFINER so it can
-- read `profiles` even though RLS on `profiles` only allows reading your own row.
create or replace function public.current_branch()
returns branch_enum
language sql
stable
security definer
set search_path = public
as $$
  select branch from public.profiles where id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- EPs (Exchange Participants) — the core CRM record
-- ─────────────────────────────────────────────────────────────────────────

create table public.eps (
  id uuid primary key default gen_random_uuid(),

  -- identity
  name text not null,
  expa_ep_id text not null unique,
  expa_email text,
  phone_number text,
  personal_emails text[] not null default '{}',

  -- ownership / pipeline
  entity branch_enum not null,
  status status_enum not null default 'Open',
  desired_product product_enum,

  -- background
  background background_enum,
  university text[] not null default '{}',
  university_expa text,
  languages_spoken language_enum[] not null default '{}',
  languages_other text,
  citizenship citizenship_enum,
  referral referral_enum,

  -- preferences (sdgs only relevant for Global Volunteer, industries for Global Talent)
  sdgs text[] not null default '{}',
  industries text[] not null default '{}',
  desired_region region_enum,
  countries_desired text[] not null default '{}',
  earliest_start_date date,

  -- follow-up
  next_followup_date timestamptz,
  next_touchpoint_description text,

  -- compliance
  gdpr_accepted boolean not null default false,

  -- bookkeeping
  date_registered timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index eps_entity_idx on public.eps (entity);
create index eps_status_idx on public.eps (status);

alter table public.eps enable row level security;

create policy "eps_select_branch_scoped" on public.eps
  for select using (
    public.current_branch() = 'MC Denmark' or entity = public.current_branch()
  );

create policy "eps_insert_branch_scoped" on public.eps
  for insert with check (
    public.current_branch() = 'MC Denmark' or entity = public.current_branch()
  );

create policy "eps_update_branch_scoped" on public.eps
  for update using (
    public.current_branch() = 'MC Denmark' or entity = public.current_branch()
  );

create policy "eps_delete_branch_scoped" on public.eps
  for delete using (
    public.current_branch() = 'MC Denmark' or entity = public.current_branch()
  );

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger eps_set_updated_at
  before update on public.eps
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Status history — one row per status an EP has ever had, timestamped.
-- Powers the "Process Time" (Open→Applied→Accepted→Approved) calculations.
-- ─────────────────────────────────────────────────────────────────────────

create table public.ep_status_history (
  id uuid primary key default gen_random_uuid(),
  ep_id uuid not null references public.eps (id) on delete cascade,
  status status_enum not null,
  changed_at timestamptz not null default now()
);

create index ep_status_history_ep_id_idx on public.ep_status_history (ep_id);

alter table public.ep_status_history enable row level security;

create policy "ep_status_history_select_branch_scoped" on public.ep_status_history
  for select using (
    exists (
      select 1 from public.eps
      where eps.id = ep_status_history.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

-- record the initial status on insert, and every subsequent change on update.
-- security definer: this is a system-maintained audit trail, not something
-- users insert into directly, so it must bypass the (intentionally absent)
-- insert policy on ep_status_history rather than need one.
create or replace function public.record_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.ep_status_history (ep_id, status, changed_at)
    values (new.id, new.status, new.date_registered);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.ep_status_history (ep_id, status, changed_at)
    values (new.id, new.status, now());
  end if;
  return new;
end;
$$;

create trigger eps_record_status_change
  after insert or update on public.eps
  for each row execute function public.record_status_change();

-- Pivoted view: first time each EP entered Open / Applied / Accepted / Approved.
-- The app computes the day/hour deltas between these columns.
create view public.ep_process_times as
select
  ep_id,
  min(changed_at) filter (where status = 'Open')     as open_at,
  min(changed_at) filter (where status = 'Applied')  as applied_at,
  min(changed_at) filter (where status = 'Accepted') as accepted_at,
  min(changed_at) filter (where status = 'Approved') as approved_at
from public.ep_status_history
group by ep_id;
