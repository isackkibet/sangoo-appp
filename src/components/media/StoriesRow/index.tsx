'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { MEDIA_STORIES, MEDIA_USER } from '@/lib/media/mockData';
import { mediaAvatar } from '@/lib/media/user';

export default function StoriesRow() {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <div className="relative mb-4 border border-slate-200 rounded-2xl bg-white py-3 mx-0 sm:mx-0">
      {/* Arrows — only on sm+ (pointer devices). Touch users swipe natively. */}
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

      {/* Scroll strip */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto px-3 sm:px-6"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {/* Own story bubble */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative">
            <Image
              src={mediaAvatar(null, null, MEDIA_USER.avatar_url)}
              alt="Your story"
              width={52}
              height={52}
              className="rounded-full object-cover border-2 border-slate-200"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white">
              <Plus size={10} strokeWidth={3} className="text-white" />
            </span>
          </div>
          <span className="text-[10px] text-slate-600 font-medium w-[52px] text-center truncate leading-tight">
            Your story
          </span>
        </div>

        {MEDIA_STORIES.map(s => (
          <button key={s.userId} className="flex flex-col items-center gap-1.5 shrink-0 active:opacity-70 transition-opacity">
            <div
              className={`p-[2px] rounded-full ${
                s.hasUnseen
                  ? 'bg-gradient-to-tr from-sky-400 to-emerald-400'
                  : 'bg-slate-300'
              }`}
            >
              <Image
                src={mediaAvatar(s.username, null, s.avatarUrl)}
                alt={s.username}
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-white"
              />
            </div>
            <span className="text-[10px] text-slate-600 font-medium w-[52px] text-center truncate leading-tight">
              {s.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
