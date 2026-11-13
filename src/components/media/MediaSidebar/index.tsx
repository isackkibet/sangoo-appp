'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Search, Compass, Film, Send, Heart, PlusSquare, User, ArrowLeft, Bell,
} from 'lucide-react';
import { useMediaSearchStore, useMediaNotificationsStore, useCreatePostStore } from '@/store/media/modalStores';

import { useSihuAuth } from '@/components/auth/SihuAuth';
import { mediaAvatar, mediaFullName, mediaUsername } from '@/lib/media/user';

type NavAction = { href: string } | { action: () => void };

interface NavItem {
  label: string;
  nav: NavAction;
  Icon: React.ElementType;
}

function useNav(): NavItem[] {
  const { open: openSearch } = useMediaSearchStore();
  const { open: openNotifs } = useMediaNotificationsStore();
  const { open: openCreate } = useCreatePostStore();

  return [
    { label: 'Feed',       nav: { href: '/media/feed' },    Icon: Home },
    { label: 'Search',     nav: { action: openSearch },     Icon: Search },
    { label: 'Explore',    nav: { href: '/media/explore' }, Icon: Compass },
    { label: 'Reels',      nav: { href: '/media/reels' },   Icon: Film },
    { label: 'Messages',   nav: { href: '/media/direct' },  Icon: Send },
    { label: 'Notifications', nav: { action: openNotifs }, Icon: Bell },
    { label: 'Liked',      nav: { href: '/media/liked' },   Icon: Heart },
    { label: 'Create',     nav: { action: openCreate },     Icon: PlusSquare },
    { label: 'Profile',    nav: { href: '/media/profile' }, Icon: User },
  ];
}

const MOBILE_LABELS = new Set(['Feed', 'Explore', 'Reels', 'Create', 'Profile']);

function NavLink({ item, on }: { item: NavItem; on: boolean }) {
  const cls = `flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] transition-colors ${
    on
      ? 'bg-slate-100 text-slate-900 font-semibold'
      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

  if ('href' in item.nav) {
    return (
      <Link href={item.nav.href} className={cls}>
        <item.Icon size={22} strokeWidth={on ? 2.5 : 1.8} />
        {item.label}
      </Link>
    );
  }

  return (
    <button onClick={item.nav.action} className={cls + ' w-full text-left'}>
      <item.Icon size={22} strokeWidth={on ? 2.5 : 1.8} />
      {item.label}
    </button>
  );
}

function MobileNavItem({ item, on }: { item: NavItem; on: boolean }) {
  const cls = `flex flex-col items-center justify-center gap-0.5 px-3 py-1 ${on ? 'text-sky-600' : 'text-slate-500'}`;

  const inner = (
    <>
      <item.Icon size={22} strokeWidth={on ? 2.5 : 1.8} />
      <span className="text-[10px] font-medium">{item.label}</span>
    </>
  );

  if ('href' in item.nav) {
    return <Link href={item.nav.href} className={cls}>{inner}</Link>;
  }

  return <button onClick={item.nav.action} className={cls}>{inner}</button>;
}

export default function MediaSidebar() {
  const path = usePathname() ?? '';
  const navItems = useNav();
  const auth = useSihuAuth();

  const profileName = auth.signedIn
    ? mediaUsername(auth.user?.name, auth.user?.email)
    : mediaUsername(null, null);
  const profileFullName = auth.signedIn
    ? mediaFullName(auth.user?.name, auth.user?.email)
    : mediaFullName(null, null);
  const profileAvatar = auth.signedIn
    ? mediaAvatar(auth.user?.name, auth.user?.email, auth.user?.avatarUrl)
    : mediaAvatar(null, null);

  const active = (item: NavItem) => {
    if (!('href' in item.nav)) return false;
    const href = item.nav.href;
    return href === '/media/feed' ? path === '/media' || path === '/media/feed' : path.startsWith(href);
  };

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[244px] xl:w-[280px] flex-col border-r border-slate-200 bg-white z-40 px-3 py-6">
        <Link
          href="/portal"
          className="flex items-center gap-2 px-3 py-2 mb-3 text-sm text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to SIHU</span>
        </Link>

        <Link href="/media/feed" className="flex items-center gap-2 px-3 py-2 mb-5">
          <Image
            src="/images/logo-main.png"
            alt="SIHU"
            width={110}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="text-[12px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
            Media
          </span>
        </Link>

        <nav className="flex-1 flex flex-col gap-0.5">
          {navItems.map(item => (
            <NavLink key={item.label} item={item} on={active(item)} />
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-100">
          <Link
            href="/media/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Image
              src={profileAvatar}
              alt={profileFullName}
              width={36}
              height={36}
              className="rounded-full object-cover ring-2 ring-sky-400"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">{profileName}</p>
              <p className="text-[12px] text-slate-500 truncate">{profileFullName}</p>
            </div>
          </Link>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-1 h-14 safe-bottom" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.filter(n => MOBILE_LABELS.has(n.label)).map(item => (
          <MobileNavItem key={item.label} item={item} on={active(item)} />
        ))}
      </nav>
    </>
  );
}
