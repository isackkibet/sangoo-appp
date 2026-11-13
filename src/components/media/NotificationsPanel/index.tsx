'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X, RefreshCw, Bell } from 'lucide-react';
import { useMediaNotificationsStore } from '@/store/media/modalStores';
import type { MediaNotification } from '@/lib/media/types';

const FILTERS = ['All', 'Follows', 'Comments', 'Likes'];

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h`;
  if (h < 24 * 7) return `${Math.floor(h / 24)}d`;
  return `${Math.floor(h / (24 * 7))}w`;
}

function NotificationRow({ n }: { n: MediaNotification }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  // Real follow / unfollow (this button used to only flip local state).
  const toggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/media/users/${encodeURIComponent(n.actor.username)}/follow`, { method: 'POST' });
      if (r.ok) { const d = (await r.json()) as { following: boolean; pending: boolean }; setFollowing(d.following || d.pending); }
    } finally { setBusy(false); }
  };

  return (
    <div className={`flex items-center gap-3 py-2.5 px-1 rounded-xl ${!n.read ? 'bg-sky-50' : ''}`}>
      <div className="relative shrink-0">
        <Image
          src={n.actor.avatar_url}
          alt={n.actor.username}
          width={44}
          height={44}
          className="rounded-full object-cover"
        />
        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[11px]">
          {n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'follow' ? '👤' : '📌'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-slate-800 leading-snug">
          <span className="font-semibold">{n.actor.username}</span>{' '}
          {n.text}
          {' '}
          <span className="text-slate-400">{timeAgo(n.created_at)}</span>
        </p>
      </div>
      {n.type === 'follow' ? (
        <button
          onClick={toggleFollow}
          disabled={busy}
          className={`shrink-0 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${
            following
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-sky-500 text-white hover:bg-sky-600'
          }`}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      ) : n.post_image ? (
        <Image
          src={n.post_image}
          alt="post"
          width={44}
          height={44}
          className="rounded-lg object-cover shrink-0"
        />
      ) : null}
    </div>
  );
}

export default function NotificationsPanel() {
  const { isOpen, close } = useMediaNotificationsStore();
  const [filter, setFilter] = useState('All');
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [items, setItems] = useState<MediaNotification[]>([]);
  const [attempt, setAttempt] = useState(0);

  // Load the member's real notifications whenever the panel opens, then mark them read.
  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetch('/api/media/notifications')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { notifications: MediaNotification[]; unread: number }) => {
        if (!alive) return;
        setItems(d.notifications);
        setState('ready');
        if (d.unread > 0) void fetch('/api/media/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      })
      .catch(() => alive && setState('error'));
    return () => { alive = false; };
  }, [isOpen, attempt]);

  if (!isOpen) return null;

  const filtered = items.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Follows') return n.type === 'follow';
    if (filter === 'Comments') return n.type === 'comment';
    if (filter === 'Likes') return n.type === 'like';
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={close} />
      <aside className="fixed left-0 lg:left-[244px] xl:left-[280px] top-0 h-full w-[380px] max-w-full bg-white z-50 flex flex-col shadow-2xl border-r border-slate-200">
        <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
          <h2 className="text-[18px] font-bold text-slate-900">Notifications</h2>
          <button onClick={close} className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-4 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {state === 'loading' ? (
            <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading notifications">
              {[0, 1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
            </div>
          ) : state === 'error' ? (
            <div className="text-center py-12" role="alert">
              <p className="text-slate-700 text-sm font-semibold">Notifications could not be loaded.</p>
              <button onClick={() => { setState('loading'); setAttempt(a => a + 1); }} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[12.5px] font-semibold hover:bg-sky-600">
                <RefreshCw size={13} /> Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"><Bell size={20} /></span>
              <p className="text-slate-700 text-sm font-semibold mt-3">{filter === 'All' ? 'No notifications yet' : `No ${filter.toLowerCase()} yet`}</p>
              <p className="text-slate-400 text-[12.5px] mt-1">Likes, comments and new followers will show up here.</p>
            </div>
          ) : (
            filtered.map(n => <NotificationRow key={n.id} n={n} />)
          )}
        </div>
      </aside>
    </>
  );
}
