'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Trash2, X } from 'lucide-react';
import { useStoryStore } from '@/store/media/storyStore';
import { mediaAvatar } from '@/lib/media/user';

function timeAgo(value: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

export default function StoryViewer() {
  const groups = useStoryStore(s => s.groups);
  const viewerOpen = useStoryStore(s => s.viewerOpen);
  const viewerUserId = useStoryStore(s => s.viewerUserId);
  const viewerIndex = useStoryStore(s => s.viewerIndex);
  const close = useStoryStore(s => s.closeViewer);
  const setViewerIndex = useStoryStore(s => s.setViewerIndex);
  const markViewed = useStoryStore(s => s.markViewed);
  const deleteStory = useStoryStore(s => s.deleteStory);

  const [progress, setProgress] = useState(0);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewedRef = useRef<Set<string>>(new Set());

  const group = groups.find(item => item.userId === viewerUserId);
  const items = group?.items ?? [];
  const safeIndex = items.length > 0 ? Math.min(viewerIndex, items.length - 1) : 0;
  const current = items[safeIndex];
  const currentId = current?.id;
  const duration = current
    ? current.kind === 'video'
      ? Math.max(1000, current.duration_ms ?? 15000)
      : 5000
    : 5000;

  const advance = useCallback(() => {
    if (items.length === 0) {
      close();
      return;
    }
    if (safeIndex < items.length - 1) setViewerIndex(safeIndex + 1);
    else close();
  }, [items.length, safeIndex, setViewerIndex, close]);

  const previous = useCallback(() => {
    if (safeIndex > 0) setViewerIndex(safeIndex - 1);
  }, [safeIndex, setViewerIndex]);

  const shouldMarkViewed = Boolean(current && !current.is_viewed && !current.is_owner);

  useEffect(() => {
    if (!currentId || !shouldMarkViewed || viewedRef.current.has(currentId)) return;
    viewedRef.current.add(currentId);
    void markViewed(currentId);
  }, [currentId, shouldMarkViewed, markViewed]);

  useEffect(() => {
    if (!currentId) return;
    setProgress(0);
    const started = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const pct = Math.min(1, (now - started) / duration);
      setProgress(pct);
      if (pct >= 1) {
        advance();
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [currentId, duration, advance]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') advance();
      if (event.key === 'ArrowLeft') previous();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewerOpen, advance, previous, close]);

  useEffect(() => {
    if (!viewerOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [viewerOpen]);

  useEffect(() => {
    setError(null);
    setDeleteBusy(false);
  }, [currentId]);

  if (!viewerOpen || !group || !current) return null;

  const remove = async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteStory(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the story.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[430px] h-full sm:h-[min(92vh,860px)] overflow-hidden bg-slate-950 sm:rounded-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="absolute inset-x-3 top-2.5 z-30 flex gap-1">
          {items.map((item, index) => (
            <div key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white"
                style={{
                  width: `${index < safeIndex ? 100 : index === safeIndex ? progress * 100 : 0}%`,
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-7">
          <Image
            src={mediaAvatar(group.username, null, group.avatarUrl)}
            alt={group.username}
            width={34}
            height={34}
            className="rounded-full object-cover border border-white/40"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-white">{group.username}</p>
            <p className="text-[11px] text-white/70">{timeAgo(current.created_at)}</p>
          </div>
          {current.is_owner && (
            <button
              onClick={() => void remove()}
              disabled={deleteBusy}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50"
              aria-label="Delete story"
            >
              {deleteBusy ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
            </button>
          )}
          <button
            onClick={close}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Close story"
          >
            <X size={20} />
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black">
          {current.kind === 'video' ? (
            <video
              key={current.id}
              src={current.url}
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <Image
              key={current.id}
              src={current.url}
              alt={current.caption || `${group.username}'s story`}
              fill
              sizes="430px"
              unoptimized
              priority
              className="object-contain"
            />
          )}
        </div>

        <div className="absolute inset-x-0 top-16 bottom-24 z-10 flex">
          <button
            onClick={previous}
            className="h-full w-[35%]"
            aria-label="Previous story"
          >
            <ChevronLeft
              size={28}
              className="ml-2 text-white/0 transition-colors hover:text-white/70"
            />
          </button>
          <button
            onClick={advance}
            className="h-full w-[65%]"
            aria-label="Next story"
          >
            <ChevronRight
              size={28}
              className="ml-auto mr-2 text-white/0 transition-colors hover:text-white/70"
            />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-5 pt-12">
          {error && (
            <p className="mb-2 rounded-lg bg-rose-500/20 px-3 py-2 text-[12.5px] text-rose-100">
              {error}
            </p>
          )}
          {current.caption && (
            <p className="text-[14px] leading-relaxed text-white">{current.caption}</p>
          )}
          {current.is_owner && (
            <p className="mt-1 text-[11.5px] text-white/60">
              {current.view_count} {current.view_count === 1 ? 'view' : 'views'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
