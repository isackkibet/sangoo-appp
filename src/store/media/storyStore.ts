'use client';

import { create } from 'zustand';
import type { StoryGroup } from '@/lib/media/types';

interface StoryState {
  groups: StoryGroup[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  viewerOpen: boolean;
  viewerUserId: string | null;
  viewerIndex: number;
  load: (force?: boolean) => Promise<void>;
  openViewer: (userId: string, index?: number) => void;
  closeViewer: () => void;
  setViewerIndex: (index: number) => void;
  markViewed: (storyId: string) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
}

function firstUnseenIndex(group: StoryGroup): number {
  const index = group.items.findIndex(item => !item.is_viewed && !item.is_owner);
  return index < 0 ? 0 : index;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  groups: [],
  loading: false,
  loaded: false,
  error: null,
  viewerOpen: false,
  viewerUserId: null,
  viewerIndex: 0,

  load: async (force = false) => {
    const { loading, loaded } = get();
    if (loading || (loaded && !force)) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/media/stories', { cache: 'no-store' });
      const data = (await res.json()) as { groups?: StoryGroup[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Could not load stories.');
      set({ groups: data.groups ?? [], loaded: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Could not load stories.' });
    } finally {
      set({ loading: false });
    }
  },

  openViewer: (userId, index) => {
    const group = get().groups.find(item => item.userId === userId);
    const nextIndex = index ?? (group ? firstUnseenIndex(group) : 0);
    set({ viewerOpen: true, viewerUserId: userId, viewerIndex: nextIndex });
  },

  closeViewer: () => set({ viewerOpen: false, viewerUserId: null, viewerIndex: 0 }),

  setViewerIndex: (index) => set({ viewerIndex: Math.max(0, index) }),

  markViewed: async (storyId) => {
    const previous = get().groups;
    const groups = previous.map(group => {
      const items = group.items.map(item =>
        item.id === storyId ? { ...item, is_viewed: true } : item,
      );
      return {
        ...group,
        items,
        hasUnseen: items.some(item => !item.is_viewed && !item.is_owner),
      };
    });
    set({ groups });

    try {
      const res = await fetch(`/api/media/stories/${storyId}/view`, { method: 'POST' });
      if (!res.ok) set({ groups: previous });
    } catch {
      set({ groups: previous });
    }
  },

  deleteStory: async (storyId) => {
    const previous = get().groups;
    const previousIndex = get().viewerIndex;
    const previousViewerOpen = get().viewerOpen;
    const previousViewerUserId = get().viewerUserId;

    let deletedGroupId: string | null = null;
    let remainingInGroup = 0;
    const groups = previous.flatMap(group => {
      const items = group.items.filter(item => item.id !== storyId);
      if (items.length === group.items.length) return [group];
      deletedGroupId = group.userId;
      remainingInGroup = items.length;
      if (items.length === 0) return [];
      return [{ ...group, items }];
    });

    set({ groups });

    if (deletedGroupId && get().viewerUserId === deletedGroupId) {
      if (remainingInGroup === 0) {
        set({ viewerOpen: false, viewerUserId: null, viewerIndex: 0 });
      } else {
        set({ viewerIndex: Math.min(previousIndex, remainingInGroup - 1) });
      }
    }

    try {
      const res = await fetch(`/api/media/stories/${storyId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Could not delete the story.');
      }
    } catch (error) {
      set({
        groups: previous,
        viewerOpen: previousViewerOpen,
        viewerUserId: previousViewerUserId,
        viewerIndex: previousIndex,
      });
      throw error;
    }
  },
}));
