-- Store file size so the UI can show "105 KB" etc. without a separate storage call.
alter table public.ep_documents add column size_bytes bigint not null default 0;
