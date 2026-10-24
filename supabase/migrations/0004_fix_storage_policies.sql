-- Re-create the ep-documents storage policies idempotently. If 0002 only
-- partially applied (e.g. a statement failed and aborted the rest of that
-- transaction), the select policy could exist without insert/delete, which
-- shows up as "new row violates row-level security policy" on upload.

drop policy if exists "ep_documents_storage_select" on storage.objects;
drop policy if exists "ep_documents_storage_insert" on storage.objects;
drop policy if exists "ep_documents_storage_delete" on storage.objects;

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
