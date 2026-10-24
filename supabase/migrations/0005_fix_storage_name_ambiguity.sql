-- Bug: inside the EXISTS subquery, the bare `name` column reference was
-- being resolved to `eps.name` (EPs have their own `name` column) instead
-- of the intended `storage.objects.name` (the uploaded file's path). That
-- meant the uuid cast was running on the EP's person name, never matching
-- any eps.id, so every upload/open/delete was silently denied by RLS.
-- Fix: qualify the column explicitly as storage.objects.name.

drop policy if exists "ep_documents_storage_select" on storage.objects;
drop policy if exists "ep_documents_storage_insert" on storage.objects;
drop policy if exists "ep_documents_storage_delete" on storage.objects;

create policy "ep_documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(storage.objects.name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(storage.objects.name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );

create policy "ep_documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'ep-documents'
    and exists (
      select 1 from public.eps
      where eps.id = (storage.foldername(storage.objects.name))[1]::uuid
        and (public.current_branch() = 'MC Denmark' or eps.entity = public.current_branch())
    )
  );
