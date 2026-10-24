-- AIESEC Denmark OGX CRM (Synapse) — comments, @mentions, notifications, documents
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- ─────────────────────────────────────────────────────────────────────────
-- Let people see profiles of others they could plausibly @mention: their own
-- branch-mates, or everyone if they're MC Denmark. (0001 only let you see
-- your own profile row, which was fine until we needed to list/display
-- other users.)
-- ─────────────────────────────────────────────────────────────────────────

create policy "profiles_select_branch_mates" on public.profiles
  for select using (
    public.current_branch() = 'MC Denmark' or branch = public.current_branch()
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Comments (with @mentions) on an EP
-- ─────────────────────────────────────────────────────────────────────────

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  ep_id uuid not null references public.eps (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index comments_ep_id_idx on public.comments (ep_id);

alter table public.comments enable row level security;

create policy "comments_select_branch_scoped" on public.comments
  for select using (
    exists (
      select 1 from public.eps
      where eps.id = comments.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "comments_insert_branch_scoped" on public.comments
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.eps
      where eps.id = comments.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Notifications — "you were @mentioned". In-app only (no email/push).
-- Rows are created only by the trigger below (security definer); there is
-- deliberately no insert policy for ordinary users.
-- ─────────────────────────────────────────────────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  ep_id uuid not null references public.eps (id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, read);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid());

create or replace function public.notify_mentioned_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mentioned_id uuid;
begin
  foreach mentioned_id in array new.mentioned_user_ids loop
    if mentioned_id is distinct from new.author_id then
      insert into public.notifications (recipient_id, comment_id, ep_id)
      values (mentioned_id, new.id, new.ep_id);
    end if;
  end loop;
  return new;
end;
$$;

create trigger comments_notify_mentions
  after insert on public.comments
  for each row execute function public.notify_mentioned_users();

-- ─────────────────────────────────────────────────────────────────────────
-- EP documents (PDFs etc.) — metadata here, bytes in Supabase Storage.
-- Files live at `{ep_id}/{filename}` in the `ep-documents` bucket so the
-- storage policies below can join back to `eps` for branch scoping.
-- ─────────────────────────────────────────────────────────────────────────

create table public.ep_documents (
  id uuid primary key default gen_random_uuid(),
  ep_id uuid not null references public.eps (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index ep_documents_ep_id_idx on public.ep_documents (ep_id);

alter table public.ep_documents enable row level security;

create policy "ep_documents_select_branch_scoped" on public.ep_documents
  for select using (
    exists (
      select 1 from public.eps
      where eps.id = ep_documents.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_insert_branch_scoped" on public.ep_documents
  for insert with check (
    exists (
      select 1 from public.eps
      where eps.id = ep_documents.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_delete_branch_scoped" on public.ep_documents
  for delete using (
    exists (
      select 1 from public.eps
      where eps.id = ep_documents.ep_id
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

insert into storage.buckets (id, name, public)
values ('ep-documents', 'ep-documents', false)
on conflict (id) do nothing;

create policy "ep_documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );
