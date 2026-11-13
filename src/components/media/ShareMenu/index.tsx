'use client';

import { useEffect, useRef, useState } from 'react';
import { Link2, Check, Share2, MessageCircle, Send } from 'lucide-react';
import type { MediaPost } from '@/lib/media/types';
import { useMediaFeedStore, type ShareChannel } from '@/store/media/feedStore';

/**
 * Share a post. A share is recorded only once it actually happens: the
 * native share sheet completes, the link is copied, or a share page opens.
 */
export default function ShareMenu({ post, onClose, align = 'left' }: { post: MediaPost; onClose: () => void; align?: 'left' | 'right' }) {
  const recordShare = useMediaFeedStore(s => s.recordShare);
  const boxRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  // Rendered only after a click, so this always runs in the browser.
  const canNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const url = typeof window !== 'undefined' ? `${window.location.origin}/media/feed?post=${encodeURIComponent(post.id)}` : '';
  const text = post.caption ? `${post.caption.slice(0, 120)} — ${post.user.full_name || post.user.username} on SIHU Media` : `${post.user.full_name || post.user.username} on SIHU Media`;

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (!boxRef.current?.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const done = (channel: ShareChannel) => { void recordShare(post.id, channel); };

  const shareNative = async () => {
    try {
      await navigator.share({ title: 'SIHU Media', text, url });
      done('native');
      onClose();
    } catch { /* cancelled: not a share */ }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      done('link');
      setTimeout(onClose, 900);
    } catch { /* clipboard blocked: nothing recorded */ }
  };

  const openApp = (channel: ShareChannel, href: string) => {
    // (window.open returns null with noopener, so it can't be used to confirm.)
    window.open(href, '_blank', 'noopener,noreferrer');
    done(channel);
    onClose();
  };

  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const apps: { channel: ShareChannel; label: string; href: string; Icon: typeof Share2 }[] = [
    { channel: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, Icon: MessageCircle },
    { channel: 'x', label: 'X', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, Icon: Share2 },
    { channel: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: Share2 },
    { channel: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}`, Icon: Send },
  ];

  const item = 'w-full flex items-center gap-3 px-3 py-2.5 text-left text-[13.5px] font-medium text-slate-800 hover:bg-slate-50 transition-colors';

  return (
    <div
      ref={boxRef}
      role="menu"
      aria-label="Share post"
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} bottom-full mb-2 z-30 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden py-1`}
    >
      {canNative && (
        <button role="menuitem" onClick={shareNative} className={item}>
          <Share2 size={17} className="text-sky-600" /> Share…
        </button>
      )}
      <button role="menuitem" onClick={copyLink} className={item}>
        {copied ? <Check size={17} className="text-emerald-600" /> : <Link2 size={17} className="text-slate-500" />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <div className="h-px bg-slate-100 my-1" />
      {apps.map(a => (
        <button key={a.channel} role="menuitem" onClick={() => openApp(a.channel, a.href)} className={item}>
          <a.Icon size={17} className="text-slate-500" /> {a.label}
        </button>
      ))}
    </div>
  );
}
