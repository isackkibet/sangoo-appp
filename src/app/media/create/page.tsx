'use client';

import { PlusSquare, Image as ImageIcon, Film, Mic } from 'lucide-react';
import { useCreatePostStore } from '@/store/media/modalStores';

export default function CreatePage() {
  const openCreate = useCreatePostStore(s => s.open);

  return (
    <div className="px-4 py-10 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <PlusSquare size={28} className="text-sky-500" />
        <h1 className="text-xl font-bold text-slate-900">Create</h1>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => openCreate('post')}
          className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors shrink-0">
            <ImageIcon size={22} className="text-sky-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Photo / Video post</p>
            <p className="text-[12px] text-slate-500">Upload a photo or short video with a caption</p>
          </div>
        </button>

        <button
          onClick={() => openCreate('reel')}
          className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors shrink-0">
            <Film size={22} className="text-sky-500" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Reel</p>
            <p className="text-[12px] text-slate-500">Share a short video reel</p>
          </div>
        </button>

        {[
          { label: 'Podcast clip', desc: 'Audio clips are coming soon', Icon: Mic },
        ].map(({ label, desc, Icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50 text-left opacity-60 cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Icon size={22} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-700">{label}</p>
              <p className="text-[12px] text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
