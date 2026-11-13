'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Users, Camera } from 'lucide-react';
import MediaPostCard from '@/components/media/MediaPostCard';
import { useMediaFeedStore, type FeedScope } from '@/store/media/feedStore';
import { useCreatePostStore, usePostViewStore } from '@/store/media/modalStores';
import type { MediaPost } from '@/lib/media/types';

const STATS_REFRESH_MS = 20_000;

/*
 * The community feed, like Instagram / TikTok:
 *  - For You: every member's public photos and videos, newest first.
 *  - Following: posts from people you follow.
 * More posts load automatically as you scroll.
 */
const TABS: { label: string; value: FeedScope }[] = [
  { label: 'For You', value: 'for-you' },
  { label: 'Following', value: 'following' },
];

export default function PostFeed() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const posts = useMediaFeedStore(s => s.posts);
  const scope = useMediaFeedStore(s => s.scope);
  const loading = useMediaFeedStore(s => s.loading);
  const loaded = useMediaFeedStore(s => s.loaded);
  const loadingMore = useMediaFeedStore(s => s.loadingMore);
  const error = useMediaFeedStore(s => s.error);
  const nextCursor = useMediaFeedStore(s => s.nextCursor);
  const load = useMediaFeedStore(s => s.load);
  const loadMore = useMediaFeedStore(s => s.loadMore);
  const setScope = useMediaFeedStore(s => s.setScope);
  const openCreate = useCreatePostStore(s => s.open);
  const refreshStats = useMediaFeedStore(s => s.refreshStats);
  const openPost = usePostViewStore(s => s.open);
  const hasMore = nextCursor !== null;

  useEffect(() => {
    void load();
  }, [load]);

  // Live counts: refresh while the feed is visible, and on returning to the tab,
  // so every member sees the same engagement numbers without reloading.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') void refreshStats(); };
    const id = setInterval(tick, STATS_REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [refreshStats]);

  // Shared links (/media/feed?post=<id>) open that post.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('post');
    if (!id) return;
    fetch(`/api/media/posts/${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: { post?: MediaPost } | null) => { if (d?.post) openPost(d.post); })
      .catch(() => {});
  }, [openPost]);

  // Fetch the next page when the reader nears the bottom.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) void loadMore(); },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, posts.length]);

  return (
    <div>
      <div className="flex border-b border-slate-200 mb-4" role="tablist" aria-label="Feed">
        {TABS.map(t => (
          <button
            key={t.value}
            role="tab"
            aria-selected={scope === t.value}
            onClick={() => setScope(t.value)}
            className={`flex-1 py-3 text-[14px] font-semibold transition-colors relative ${
              scope === t.value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {scope === t.value && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-slate-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* First load */}
      {loading && posts.length === 0 && (
        <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Loading posts">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 rounded-full bg-slate-200" /><div className="h-3 w-32 rounded bg-slate-200" /></div>
              <div className="aspect-square rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && posts.length === 0 && !loading && (
        <div className="py-12 text-center" role="alert">
          <p className="text-slate-700 font-semibold">The feed could not be loaded.</p>
          <p className="text-slate-400 text-sm mt-1">{error}</p>
          <button onClick={() => void load(true)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-sky-600">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {loaded && !error && posts.length === 0 && (
        <div className="py-14 text-center">
          <span className="mx-auto w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            {scope === 'following' ? <Users size={24} /> : <Camera size={24} />}
          </span>
          {scope === 'following' ? (
            <>
              <p className="text-slate-800 font-semibold mt-4">No posts from people you follow yet</p>
              <p className="text-slate-500 text-sm mt-1">Follow members from their profiles, or see everyone&apos;s posts in For You.</p>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => setScope('for-you')} className="px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-sky-600">See For You</button>
                <Link href="/media/explore" className="px-4 py-2 rounded-full border border-slate-300 text-slate-800 text-[13px] font-semibold hover:border-slate-500">Explore members</Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-800 font-semibold mt-4">No posts yet</p>
              <p className="text-slate-500 text-sm mt-1">Be the first to share a photo or video from your area.</p>
              <button onClick={() => openCreate()} className="mt-4 px-4 py-2 rounded-full bg-sky-600 text-white text-[13px] font-semibold hover:bg-sky-500">Create a post</button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col">
        {posts.map(p => (
          <MediaPostCard key={p.id} post={p} />
        ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="py-6 flex justify-center" aria-label="Loading more posts">
          <span className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      )}

      {loaded && posts.length > 0 && !hasMore && (
        <p className="py-10 text-center text-slate-400 text-sm">You&apos;re all caught up ✓</p>
      )}
    </div>
  );
}
