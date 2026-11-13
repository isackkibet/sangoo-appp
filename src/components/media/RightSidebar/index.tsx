'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { MEDIA_USER, MEDIA_SUGGESTED_USERS } from '@/lib/media/mockData';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { mediaAvatar, mediaFullName, mediaUsername } from '@/lib/media/user';

export default function RightSidebar() {
  const auth = useSihuAuth();

  const username = auth.signedIn
    ? mediaUsername(auth.user?.name, auth.user?.email)
    : MEDIA_USER.username;
  const fullName = auth.signedIn
    ? mediaFullName(auth.user?.name, auth.user?.email)
    : MEDIA_USER.full_name;
  const avatar = auth.signedIn
    ? mediaAvatar(auth.user?.name, auth.user?.email, auth.user?.avatarUrl)
    : mediaAvatar(null, null, MEDIA_USER.avatar_url);

  return (
    <div className="sticky top-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/media/profile">
          <Image
            src={avatar}
            alt={fullName}
            width={48}
            height={48}
            className="rounded-full object-cover ring-2 ring-sky-400"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href="/media/profile"
            className="text-[14px] font-semibold text-slate-900 hover:underline flex items-center gap-1"
          >
            {username}
            {!auth.signedIn && MEDIA_USER.is_verified && (
              <BadgeCheck size={13} className="text-sky-500" />
            )}
          </Link>
          <p className="text-[12px] text-slate-500 truncate">{fullName}</p>
        </div>
        <Link href="/portal" className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 shrink-0">
          News Portal
        </Link>
      </div>

      {!auth.signedIn && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <p className="text-[13px] font-semibold text-slate-900">Join the community</p>
          <p className="text-[12.5px] text-slate-600 mt-1 leading-relaxed">
            Sign in to upload photos, like posts and reshare stories.
          </p>
          <Link
            href="/login?next=/media/feed"
            className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[12.5px] font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Suggestions: only shown when there are any (the list was always empty, leaving an orphan heading). */}
      {MEDIA_SUGGESTED_USERS.length > 0 && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-slate-500">Suggested for you</span>
          <Link href="/media/explore" className="text-[12px] font-semibold text-slate-900 hover:text-slate-600">
            See all
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {MEDIA_SUGGESTED_USERS.map(u => (
            <div key={u.id} className="flex items-center gap-3">
              <Image
                src={mediaAvatar(u.full_name, null, u.avatar_url)}
                alt={u.full_name}
                width={36}
                height={36}
                className="rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 flex items-center gap-1 leading-tight">
                  {u.username}
                  {u.is_verified && <BadgeCheck size={11} className="text-sky-500" />}
                </p>
                <p className="text-[11px] text-slate-500">
                  {u.mutual_count > 0 ? `${u.mutual_count} mutual` : 'Suggested'}
                </p>
              </div>
              <Link href="/media/explore" className="text-[12px] font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Quick links to the rest of SIHU */}
      <div className="rounded-2xl border border-slate-200 p-4">
        <p className="text-[13px] font-semibold text-slate-900">More from SIHU</p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[12.5px]">
          {[
            { href: '/portal', label: 'News' },
            { href: '/map', label: 'Basin map' },
            { href: '/ai', label: 'AI Assistant' },
            { href: '/portal/submit', label: 'Submit a story' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-sky-700">{l.label}</Link>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-400 space-y-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {[
            { label: 'About', href: '/#story' },
            { label: 'Help', href: '/#contact' },
            { label: 'Locations', href: '/map' },
            { label: 'Contact', href: '/#contact' },
          ].map(l => (
            <Link key={l.label} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="mt-1">© 2026 SIHU Media · Sango Information Hub</p>
      </div>
    </div>
  );
}
