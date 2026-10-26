'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EpDocument } from '@/lib/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsSection({ epId }: { epId: string }) {
  const [documents, setDocuments] = useState<EpDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from('ep_documents')
      .select('*')
      .eq('ep_id', epId)
      .order('created_at', { ascending: false });
    setDocuments((data as EpDocument[]) ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/epId-change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const path = `${epId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('ep-documents').upload(path, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const { error: insertError } = await supabase.from('ep_documents').insert({
        ep_id: epId,
        file_name: file.name,
        storage_path: path,
        size_bytes: file.size,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleOpen(doc: EpDocument) {
    const supabase = createClient();
    const { data, error: urlError } = await supabase.storage
      .from('ep-documents')
      .createSignedUrl(doc.storage_path, 60);
    if (urlError || !data) {
      setError(urlError?.message ?? 'Could not open file.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  async function handleDelete(doc: EpDocument) {
    if (!window.confirm(`Delete "${doc.file_name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from('ep-documents').remove([doc.storage_path]);
    await supabase.from('ep_documents').delete().eq('id', doc.id);
    await load();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">Files</h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label="Add file"
          style={{ width: 28, height: 28 }}
          className="flex shrink-0 items-center justify-center rounded-md bg-brand-blue text-base leading-none text-white hover:brightness-110 disabled:opacity-50"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {uploading && <p className="text-sm text-neutral-400">Uploading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {documents.length === 0 && !uploading ? (
        <p className="text-sm text-neutral-400">No files yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-neutral-100 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 px-3 py-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ flexShrink: 0 }}
                className="text-red-500"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <button type="button" onClick={() => handleOpen(doc)} className="min-w-0 flex-1 truncate text-left">
                <div className="truncate text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100">
                  {doc.file_name}
                </div>
                <div className="text-xs text-neutral-400">{formatBytes(doc.size_bytes)}</div>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(doc)}
                aria-label="Delete file"
                style={{ width: 22, height: 22 }}
                className="flex shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
