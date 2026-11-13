'use client';

import { create } from 'zustand';
import type { MediaPost } from '@/lib/media/mockData';

export type FeedScope = 'for-you' | 'following';
const PAGE = 12;

interface FeedState {
  posts: MediaPost[];
  /** 'for-you' = everyone's public posts; 'following' = people you follow. */
  scope: FeedScope;
  nextCursor: number | null;
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setScope: (scope: FeedScope) => void;
  prepend: (post: MediaPost) => void;
  removePost: (postId: string) => Promise<void>;
  toggleLike: (post: MediaPost) => Promise<void>;
  toggleRepost: (post: MediaPost) => Promise<void>;
  toggleSave: (post: MediaPost) => Promise<void>;
  /** Record a share (after the share actually happened) and update the count. */
  recordShare: (postId: string, channel: ShareChannel) => Promise<void>;
  /** Record a genuine view once per post per browser session. */
  recordView: (postId: string) => void;
  /** Pull the latest counts for the loaded posts (same numbers for everyone). */
  refreshStats: () => Promise<void>;
  /** Update fields of a loaded post (e.g. a new comment count). */
  patchPost: (postId: string, patch: Partial<MediaPost>) => void;
}

export type ShareChannel = 'native' | 'link' | 'whatsapp' | 'x' | 'facebook' | 'telegram';

type Stats = Pick<MediaPost, 'id' | 'like_count' | 'comment_count' | 'repost_count' | 'share_count' | 'view_count' | 'is_liked' | 'is_reposted' | 'is_saved'>;

// Posts already sent as viewed in this tab (the server also de-duplicates per day).
const viewedThisSession = new Set<string>();

function replacePost(posts: MediaPost[], id: string, patch: Partial<MediaPost>): MediaPost[] {
  return posts.map(p => (p.id === id ? { ...p, ...patch } : p));
}

export const useMediaFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  scope: 'for-you',
  nextCursor: null,
  loading: false,
  loadingMore: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    const { loading, loaded, scope } = get();
    if (loading || (loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/media/posts?scope=${scope}&limit=${PAGE}`, { cache: 'no-store' });
      const data = (await res.json()) as { posts?: MediaPost[]; nextCursor?: number | null; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not load the feed.');
      if (get().scope !== scope) return; // the tab changed while loading
      set({ posts: data.posts ?? [], nextCursor: data.nextCursor ?? null, loaded: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not load the feed.' });
    } finally {
      set({ loading: false });
    }
  },

  // Next page of posts when the reader reaches the end of the list.
  loadMore: async () => {
    const { loading, loadingMore, nextCursor, scope } = get();
    if (loading || loadingMore || nextCursor === null) return;
    set({ loadingMore: true });
    try {
      const res = await fetch(`/api/media/posts?scope=${scope}&limit=${PAGE}&cursor=${nextCursor}`, { cache: 'no-store' });
      const data = (await res.json()) as { posts?: MediaPost[]; nextCursor?: number | null };
      if (!res.ok || get().scope !== scope) return;
      set(state => {
        const ids = new Set(state.posts.map(p => p.id));
        return { posts: [...state.posts, ...(data.posts ?? []).filter(p => !ids.has(p.id))], nextCursor: data.nextCursor ?? null };
      });
    } finally {
      set({ loadingMore: false });
    }
  },

  setScope: (scope) => {
    if (get().scope === scope) return;
    set({ scope, posts: [], nextCursor: null, loaded: false, loading: false, error: null });
    void get().load();
  },

  prepend: (post) =>
    set(state => ({
      posts: [post, ...state.posts.filter(p => p.id !== post.id)],
    })),

  removePost: async (postId) => {
    const previous = get().posts;
    set({ posts: previous.filter(p => p.id !== postId) });

    try {
      const res = await fetch(`/api/media/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Could not delete the post.');
      }
    } catch (error) {
      set({ posts: previous });
      throw error;
    }
  },

  toggleLike: async (post) => {
    const optimistic = !post.is_liked;
    const previous = get().posts;
    set({
      posts: replacePost(previous, post.id, {
        is_liked: optimistic,
        like_count: Math.max(0, post.like_count + (optimistic ? 1 : -1)),
      }),
    });

    try {
      const res = await fetch(`/api/media/posts/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('like failed');
      const data = (await res.json()) as { liked: boolean; likeCount: number };
      set(state => ({
        posts: replacePost(state.posts, post.id, {
          is_liked: data.liked,
          like_count: data.likeCount,
        }),
      }));
    } catch {
      set({ posts: previous });
    }
  },

  toggleRepost: async (post) => {
    const optimistic = !post.is_reposted;
    const previous = get().posts;
    set({
      posts: replacePost(previous, post.id, {
        is_reposted: optimistic,
        repost_count: Math.max(0, (post.repost_count ?? 0) + (optimistic ? 1 : -1)),
      }),
    });

    try {
      const res = await fetch(`/api/media/posts/${post.id}/repost`, { method: 'POST' });
      if (!res.ok) throw new Error('repost failed');
      const data = (await res.json()) as { reposted: boolean; repostCount: number };
      set(state => ({
        posts: replacePost(state.posts, post.id, {
          is_reposted: data.reposted,
          repost_count: data.repostCount,
        }),
      }));
    } catch {
      set({ posts: previous });
    }
  },

  toggleSave: async (post) => {
    const optimistic = !post.is_saved;
    set(state => ({ posts: replacePost(state.posts, post.id, { is_saved: optimistic }) }));
    try {
      const res = await fetch(`/api/media/posts/${post.id}/save`, { method: 'POST' });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { saved: boolean };
      set(state => ({ posts: replacePost(state.posts, post.id, { is_saved: data.saved }) }));
    } catch {
      set(state => ({ posts: replacePost(state.posts, post.id, { is_saved: post.is_saved }) }));
    }
  },

  recordShare: async (postId, channel) => {
    try {
      const res = await fetch(`/api/media/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { shareCount: number };
      set(state => ({ posts: replacePost(state.posts, postId, { share_count: data.shareCount }) }));
    } catch { /* the share itself already happened */ }
  },

  recordView: (postId) => {
    if (viewedThisSession.has(postId)) return;
    viewedThisSession.add(postId);
    void fetch(`/api/media/posts/${postId}/view`, { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { viewCount: number } | null) => {
        if (data) set(state => ({ posts: replacePost(state.posts, postId, { view_count: data.viewCount }) }));
      })
      .catch(() => viewedThisSession.delete(postId));
  },

  patchPost: (postId, patch) => set(state => ({ posts: replacePost(state.posts, postId, patch) })),

  refreshStats: async () => {
    const ids = get().posts.slice(0, 50).map(p => p.id);
    if (ids.length === 0) return;
    try {
      const res = await fetch(`/api/media/posts/stats?ids=${ids.join(',')}`, { cache: 'no-store' });
      if (!res.ok) return;
      const { stats } = (await res.json()) as { stats: Stats[] };
      const byId = new Map(stats.map(st => [st.id, st]));
      set(state => ({
        posts: state.posts.map(p => {
          const st = byId.get(p.id);
          return st ? { ...p, ...st } : p;
        }),
      }));
    } catch { /* keep the last known numbers */ }
  },
}));
