'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type NotificationRow = {
  id: string;
  read: boolean;
  created_at: string;
  ep_id: string;
  comments: { body: string; author_id: string } | null;
  eps: { name: string } | null;
};

export function NotificationBell({ myId }: { myId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from('notifications')
      .select('id, read, created_at, ep_id, comments(body, author_id), eps(name)')
      .eq('recipient_id', myId)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as unknown as NotificationRow[]) ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleOpen(n: NotificationRow) {
    const supabase = createClient();
    if (!n.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    router.push(`/eps/${n.ep_id}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-neutral-400">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleOpen(n)}
                className={`block w-full border-b border-neutral-100 px-4 py-2.5 text-left text-sm last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 ${
                  n.read ? 'opacity-60' : ''
                }`}
              >
                <div className="font-medium text-neutral-800 dark:text-neutral-200">
                  {n.eps?.name ?? 'Unknown EP'}
                </div>
                <div className="truncate text-neutral-500 dark:text-neutral-400">
                  {n.comments?.body}
                </div>
                <div className="mt-0.5 text-xs text-neutral-400">
                  {new Date(n.created_at).toLocaleString('en-GB')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
