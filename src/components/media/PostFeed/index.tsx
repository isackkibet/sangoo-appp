'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_POSTS } from '@/lib/media/mockData';
import MediaPostCard from '@/components/media/MediaPostCard';
import { useMediaFeedStore } from '@/store/media/feedStore';

const TABS = [
  { label: 'For You', value: 'home' },
  { label: 'Following', value: 'following' },
] as const;

const PAGE_SIZE = 5;

export default function PostFeed() {
  const [tab, setTab] = useState<'home' | 'following'>('home');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const realPosts = useMediaFeedStore(s => s.posts);
  const load = useMediaFeedStore(s => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  const allPosts = useMemo(() => {
    const ids = new Set(realPosts.map(p => p.id));
    return [...realPosts, ...MEDIA_POSTS.filter(p => !ids.has(p.id))];
  }, [realPosts]);

  const posts = allPosts.slice(0, visibleCount);
  const hasMore = visibleCount < allPosts.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore) {
          setVisibleCount(c => Math.min(c + PAGE_SIZE, allPosts.length));
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, allPosts.length]);

  return (
    <div>
      <div className="flex border-b border-slate-200 mb-4">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setVisibleCount(PAGE_SIZE); }}
            className={`flex-1 py-3 text-[14px] font-semibold transition-colors relative ${
              tab === t.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {tab === t.value && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-slate-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {posts.map(p => (
          <MediaPostCard key={p.id} post={p} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {!hasMore && (
        <p className="py-10 text-center text-slate-400 text-sm">You&apos;re all caught up ✓</p>
      )}
    </div>
  );
}
