'use client';

import Image from 'next/image';
import { ImagePlus, Video } from 'lucide-react';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { useCreatePostStore } from '@/store/media/modalStores';
import { mediaAvatar } from '@/lib/media/user';

export default function MediaComposer() {
  const auth = useSihuAuth();
  const openCreate = useCreatePostStore(s => s.open);

  const avatar = mediaAvatar(auth.user?.name, auth.user?.email, auth.user?.avatarUrl);

  return (
    <div className="flex items-center gap-3 px-3 sm:px-1 py-3 mb-2 border-b border-slate-100">
      <Image
        src={avatar}
        alt={auth.name ?? 'Your profile'}
        width={40}
        height={40}
        className="rounded-full object-cover ring-2 ring-sky-300 shrink-0"
      />
      <button
        onClick={() => openCreate('post')}
        className="flex-1 flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-left transition-colors min-w-0"
      >
        <span className="text-[14px] text-slate-500 truncate">
          Share a photo or video...
        </span>
        <span className="flex items-center gap-1.5 shrink-0 text-sky-600">
          <ImagePlus size={18} />
          <Video size={18} />
        </span>
      </button>
    </div>
  );
}
