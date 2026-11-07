'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { useCreateStoryStore } from '@/store/media/modalStores';
import { useStoryStore } from '@/store/media/storyStore';
import { mediaAvatar } from '@/lib/media/user';

export default function StoriesRow() {
  const rowRef = useRef<HTMLDivElement>(null);
  const auth = useSihuAuth();
  const openCreate = useCreateStoryStore(s => s.open);
  const groups = useStoryStore(s => s.groups);
  const loading = useStoryStore(s => s.loading);
  const load = useStoryStore(s => s.load);
  const openViewer = useStoryStore(s => s.openViewer);

  useEffect(() => {
    void load();
  }, [load]);

  const ownGroup = useMemo(
    () => groups.find(group => group.userId === auth.user?.id),
    [groups, auth.user?.id],
  );
  const otherGroups = useMemo(
    () => groups.filter(group => group.userId !== auth.user?.id),
    [groups, auth.user?.id],
  );

  const ownAvatar = mediaAvatar(auth.user?.name, auth.user?.email, auth.user?.avatarUrl);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  const openOwnStory = () => {
    if (ownGroup) openViewer(ownGroup.userId);
    else openCreate();
  };

  return (
    <div className="relative mb-4 border border-slate-200 rounded-2xl bg-white py-3 mx-0 sm:mx-0">
      <button
        onClick={() => scroll('left')}
        className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow items-center justify-center hover:bg-slate-50 transition-colors"
        aria-label="Scroll stories left"
      >
        <ChevronLeft size={15} className="text-slate-600" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow items-center justify-center hover:bg-slate-50 transition-colors"
        aria-label="Scroll stories right"
      >
        <ChevronRight size={15} className="text-slate-600" />
      </button>

      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto px-3 sm:px-6"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <button
              onClick={openOwnStory}
              className={`block rounded-full p-[2px] ${
                ownGroup?.hasUnseen
                  ? 'bg-gradient-to-tr from-sky-400 to-emerald-400'
                  : 'bg-slate-200'
              }`}
              aria-label={ownGroup ? 'View your story' : 'Add your story'}
            >
              <Image
                src={ownAvatar}
                alt="Your story"
                width={52}
                height={52}
                className="rounded-full object-cover border-2 border-white"
              />
            </button>
            <button
              onClick={openCreate}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white hover:bg-sky-400 transition-colors"
              aria-label="Create a story"
            >
              <Plus size={10} strokeWidth={3} className="text-white" />
            </button>
          </div>
          <span className="text-[10px] text-slate-600 font-medium w-[52px] text-center truncate leading-tight">
            Your story
          </span>
        </div>

        {otherGroups.map(group => (
          <button
            key={group.userId}
            onClick={() => openViewer(group.userId)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:opacity-70 transition-opacity"
          >
            <div
              className={`p-[2px] rounded-full ${
                group.hasUnseen
                  ? 'bg-gradient-to-tr from-sky-400 to-emerald-400'
                  : 'bg-slate-300'
              }`}
            >
              <Image
                src={mediaAvatar(group.username, null, group.avatarUrl)}
                alt={group.username}
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-white"
              />
            </div>
            <span className="text-[10px] text-slate-600 font-medium w-[52px] text-center truncate leading-tight">
              {group.username}
            </span>
          </button>
        ))}

        {loading && otherGroups.length === 0 && (
          <div className="flex items-center justify-center px-4 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
