'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Heart, MessageCircle, Play, RefreshCw, Camera } from 'lucide-react';
import type { MediaPost } from '@/lib/media/types';
import { usePostViewStore } from '@/store/media/modalStores';

/*
 * The SIHU Media gallery: every member's public photos and videos from the
 * database (it used to render an always-empty placeholder list).
 * Videos show their thumbnail with a play badge; tapping opens the post.
 */
const TABS: { label: string; category?: string; videos?: boolean }[] = [
  { label: 'For You' },
  { label: 'Videos', videos: true },
  { label: 'Environment', category: 'environment' },
  { label: 'Community', category: 'community' },
  { label: 'Fisheries', category: 'fisheries' },
  { label: 'Youth', category: 'youth' },
  { label: 'News', category: 'news' },
];

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; posts: MediaPost[] };

function Tile({ p, tall, onOpen }: { p: MediaPost; tall: boolean; onOpen: () => void }) {
  const image = p.images[0];
  const video = p.videos[0];
  const [failed, setFailed] = useState(false);
  return (
    <button
      onClick={onOpen}
      className={`relative overflow-hidden rounded-sm bg-slate-200 group text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${tall ? 'row-span-2' : ''}`}
      style={{ aspectRatio: tall ? '0.8' : '1' }}
      aria-label={p.caption || (video ? 'Video' : 'Photo')}
    >
      {image && !failed ? (
        <Image src={image.url} alt={image.alt_text || p.caption || 'Photo'} fill sizes="(max-width: 768px) 33vw, 300px" onError={() => setFailed(true)} className="object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : video?.poster_url && !failed ? (
        <Image src={video.poster_url} alt={p.caption || 'Video'} fill sizes="(max-width: 768px) 33vw, 300px" onError={() => setFailed(true)} className="object-cover group-hover:scale-105 transition-transform duration-300" />
      ) : video ? (
        <video src={video.url} muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-slate-400"><Camera size={22} /></span>
      )}
      {video && (
        <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white flex items-center justify-center">
          <Play size={13} fill="white" />
        </span>
      )}
      <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
        {!p.hide_likes && (
          <span className="flex items-center gap-1 text-[13px] font-semibold"><Heart size={16} fill="white" /> {p.like_count}</span>
        )}
        {!p.comments_off && (
          <span className="flex items-center gap-1 text-[13px] font-semibold"><MessageCircle size={16} fill="white" /> {p.comment_count}</span>
        )}
      </span>
    </button>
  );
}

export default function ExploreGrid() {
  const [tab, setTab] = useState(TABS[0]);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const openPost = usePostViewStore(s => s.open);

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ limit: '30', scope: tab.videos ? 'reels' : 'explore' });
    if (tab.category) params.set('category', tab.category);
    fetch(`/api/media/posts?${params}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { posts?: MediaPost[] }) => { if (alive) setLoad({ status: 'ready', posts: d.posts ?? [] }); })
      .catch(() => { if (alive) setLoad({ status: 'error' }); });
    return () => { alive = false; };
  }, [tab, attempt]);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }} role="tablist">
        {TABS.map(t => (
          <button
            key={t.label}
            role="tab"
            aria-selected={tab.label === t.label}
            onClick={() => { setLoad({ status: 'loading' }); setTab(t); }}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              tab.label === t.label ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {load.status === 'loading' && (
        <div className="grid grid-cols-3 gap-1 animate-pulse" aria-busy="true" aria-label="Loading gallery">
          {Array.from({ length: 9 }, (_, i) => <div key={i} className="aspect-square rounded-sm bg-slate-200" />)}
        </div>
      )}

      {load.status === 'error' && (
        <div className="py-16 text-center" role="alert">
          <p className="font-semibold text-slate-800">The gallery could not be loaded.</p>
          <button onClick={() => { setLoad({ status: 'loading' }); setAttempt(a => a + 1); }} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-sky-600">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {load.status === 'ready' && load.posts.length === 0 && (
        <div className="py-16 text-center text-slate-500">
          <Camera size={30} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-700">{tab.videos ? 'No videos yet' : 'Nothing here yet'}</p>
          <p className="text-[13.5px] mt-1">Posts shared by members will appear here.</p>
        </div>
      )}

      {load.status === 'ready' && load.posts.length > 0 && (
        <div className="grid grid-cols-3 gap-1">
          {load.posts.map((p, i) => (
            <Tile key={p.id} p={p} tall={i % 5 === 2} onOpen={() => openPost(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
