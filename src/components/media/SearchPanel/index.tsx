'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useMediaSearchStore } from '@/store/media/modalStores';
import { MEDIA_SUGGESTED_USERS, MEDIA_POSTS } from '@/lib/media/mockData';
import { mediaAvatar } from '@/lib/media/user';

export default function SearchPanel() {
  const { isOpen, close } = useMediaSearchStore();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedUsers = q
    ? MEDIA_SUGGESTED_USERS.filter(
        u => u.username.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q),
      )
    : MEDIA_SUGGESTED_USERS;

  const matchedPosts = q
    ? MEDIA_POSTS.filter(p => p.caption.toLowerCase().includes(q) || p.category.includes(q))
    : [];

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={close} />
      <aside className="fixed left-0 lg:left-[244px] xl:left-[280px] top-0 h-full w-[380px] max-w-full bg-white z-50 flex flex-col shadow-2xl border-r border-slate-200">
        <div className="px-4 pt-6 pb-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search people, topics..."
              className="flex-1 bg-transparent text-[14px] text-slate-800 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!q && (
            <p className="text-[12px] font-semibold text-slate-500 mb-3 uppercase tracking-wider">
              Suggested
            </p>
          )}

          {matchedUsers.map(u => (
            <div key={u.id} className="flex items-center gap-3 py-2.5 rounded-xl hover:bg-slate-50 px-1 -mx-1 transition-colors">
              <Image
                src={mediaAvatar(u.full_name, null, u.avatar_url)}
                alt={u.full_name}
                width={44}
                height={44}
                className="rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-900 truncate">{u.username}</p>
                <p className="text-[12px] text-slate-500 truncate">{u.full_name}</p>
              </div>
            </div>
          ))}

          {matchedPosts.length > 0 && (
            <>
              <p className="text-[12px] font-semibold text-slate-500 mt-4 mb-3 uppercase tracking-wider">
                Posts
              </p>
              <div className="grid grid-cols-3 gap-1">
                {matchedPosts.map(p => (
                  <div key={p.id} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    <Image src={p.images[0].url} alt={p.caption} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </>
          )}

          {q && matchedUsers.length === 0 && matchedPosts.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-12">No results for "{query}"</p>
          )}
        </div>
      </aside>
    </>
  );
}
