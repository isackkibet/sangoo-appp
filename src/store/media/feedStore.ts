'use client';

import { create } from 'zustand';
import type { MediaPost } from '@/lib/media/mockData';

interface FeedState {
  posts: MediaPost[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  prepend: (post: MediaPost) => void;
  removePost: (postId: string) => Promise<void>;
  toggleLike: (post: MediaPost) => Promise<void>;
  toggleRepost: (post: MediaPost) => Promise<void>;
}

function replacePost(posts: MediaPost[], id: string, patch: Partial<MediaPost>): MediaPost[] {
  return posts.map(p => (p.id === id ? { ...p, ...patch } : p));
}

export const useMediaFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  loading: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    const { loading, loaded } = get();
    if (loading || (loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/media/posts', { cache: 'no-store' });
      const data = (await res.json()) as { posts?: MediaPost[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not load the feed.');
      set({ posts: data.posts ?? [], loaded: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not load the feed.' });
    } finally {
      set({ loading: false });
    }
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
}));
