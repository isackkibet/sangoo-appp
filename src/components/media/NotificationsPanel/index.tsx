'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { useMediaNotificationsStore } from '@/store/media/modalStores';
import { MEDIA_NOTIFICATIONS, type MediaNotification } from '@/lib/media/mockData';

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
          onClick={() => setFollowing(v => !v)}
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

  if (!isOpen) return null;

  const filtered = MEDIA_NOTIFICATIONS.filter(n => {
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
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-12">No notifications</p>
          ) : (
            filtered.map(n => <NotificationRow key={n.id} n={n} />)
          )}
        </div>
      </aside>
    </>
  );
}
