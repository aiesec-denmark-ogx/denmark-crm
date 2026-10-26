'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comment, Profile } from '@/lib/types';

type CommentWithAuthor = Comment & { authorEmail: string };

export function CommentSection({ epId, myId }: { epId: string; myId: string }) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [mentionable, setMentionable] = useState<Profile[]>([]);
  const [body, setBody] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function load() {
    const supabase = createClient();

    const { data: profiles } = await supabase.from('profiles').select('*');
    const byId = new Map((profiles ?? []).map((p: Profile) => [p.id, p.email]));
    setMentionable((profiles as Profile[]) ?? []);

    const { data: rows } = await supabase
      .from('comments')
      .select('*')
      .eq('ep_id', epId)
      .order('created_at', { ascending: true });

    setComments(
      ((rows as Comment[]) ?? []).map((c) => ({
        ...c,
        authorEmail: byId.get(c.author_id) ?? 'Unknown',
      }))
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount/epId-change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setBody(value);

    const cursor = e.target.selectionStart;
    const upToCursor = value.slice(0, cursor);
    const match = upToCursor.match(/(?:^|\s)@([^\s@]*)$/);
    setMentionQuery(match ? match[1] : null);
  }

  function pickMention(profile: Profile) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const upToCursor = body.slice(0, cursor);
    const afterCursor = body.slice(cursor);
    const replaced = upToCursor.replace(/@([^\s@]*)$/, `@${profile.email} `);
    const nextBody = replaced + afterCursor;
    setBody(nextBody);
    setMentionQuery(null);
    requestAnimationFrame(() => textarea.focus());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    setError(null);

    try {
      const supabase = createClient();
      // Scan the final text for "@<email>" against everyone mentionable, rather
      // than relying only on dropdown-click state — this also catches an email
      // typed out by hand instead of picked from the suggestion list.
      const usedMentions = mentionable
        .filter((p) => body.includes(`@${p.email}`))
        .map((p) => p.id);
      const { error: insertError } = await supabase.from('comments').insert({
        ep_id: epId,
        author_id: myId,
        body: body.trim(),
        mentioned_user_ids: usedMentions,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  }

  const suggestions =
    mentionQuery !== null
      ? mentionable.filter((p) => p.email.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
      : [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">Comments</h2>

      <div className="flex flex-col gap-3">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800"
          >
            <div className="mb-1 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">{c.authorEmail}</span>
              <span>{new Date(c.created_at).toLocaleString('en-GB')}</span>
            </div>
            <p className="whitespace-pre-wrap text-neutral-900 dark:text-neutral-100">
              {c.body.split(/(@[^\s]+@[^\s]+)/g).map((part, i) =>
                part.startsWith('@') ? (
                  <span key={i} className="font-medium text-blue-600 dark:text-blue-400">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          rows={3}
          placeholder="Write a comment… type @ to mention someone"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        {suggestions.length > 0 && (
          <div className="absolute bottom-full mb-1 w-64 rounded-md border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            {suggestions.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => pickMention(p)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {p.email}
                <span className="ml-2 text-xs text-neutral-400">{p.branch}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="self-start rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {posting ? 'Posting…' : 'Post comment'}
        </button>
      </form>
    </section>
  );
}
