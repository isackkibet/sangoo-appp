'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Heart, MessageCircle, Repeat2, Send, Bookmark, Eye,
  MoreHorizontal, MapPin, BadgeCheck, Trash2,
} from 'lucide-react';
import ShareMenu from '@/components/media/ShareMenu';
import MediaCarousel from '@/components/media/MediaCarousel';
import { usePostViewStore } from '@/store/media/modalStores';
import { useMediaFeedStore } from '@/store/media/feedStore';
import type { MediaPost } from '@/lib/media/mockData';

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** 999 · 1.2k · 3.4M — every number is a real count from the database. */
export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/.0$/, '')}k`;
  return String(n);
}

// Cap extreme aspect ratios to a sensible range — prevents portrait images
// from filling the entire screen on mobile.
function safeAspectRatio(w: number, h: number): string {
  const ratio = w / h;
  if (ratio > 1.91) return '1.91 / 1'; // landscape max (Facebook/IG standard)
  if (ratio < 0.5625) return '9 / 16';  // portrait max (story / reel)
  return `${w} / ${h}`;
}

interface Props {
  post: MediaPost;
}

export default function MediaPostCard({ post }: Props) {
  const real = Boolean(post.is_real);
  const toggleLike = useMediaFeedStore(s => s.toggleLike);
  const toggleRepost = useMediaFeedStore(s => s.toggleRepost);
  const removePost = useMediaFeedStore(s => s.removePost);
  const toggleSave = useMediaFeedStore(s => s.toggleSave);
  const recordView = useMediaFeedStore(s => s.recordView);
  const [shareOpen, setShareOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.is_liked);
  const [saved, setSaved] = useState(post.is_saved);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count);
  const [localReposted, setLocalReposted] = useState(post.is_reposted);
  const [localRepostCount, setLocalRepostCount] = useState(post.repost_count ?? 0);
  const { open: openModal } = usePostViewStore();

  const liked = real ? post.is_liked : localLiked;
  const likeCount = real ? post.like_count : localLikeCount;
  const reposted = real ? Boolean(post.is_reposted) : localReposted;
  const repostCount = real ? post.repost_count ?? 0 : localRepostCount;
  const isSaved = real ? Boolean(post.is_saved) : saved;
  const shareCount = post.share_count ?? 0;
  const viewCount = post.view_count ?? 0;
  // Authors who hid likes still see their own count.
  const showLikeCount = !post.hide_likes || Boolean(post.is_owner);

  // A genuine view: at least 60% of the post on screen for 1.5 seconds.
  useEffect(() => {
    const el = articleRef.current;
    if (!real || !el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer ??= setTimeout(() => { recordView(post.id); observer.disconnect(); }, 1500);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [real, post.id, recordView]);

  const handleSave = () => {
    if (real) { void toggleSave(post); return; }
    setSaved(v => !v);
  };

  const handleLike = () => {
    if (real) {
      void toggleLike(post);
      return;
    }
    setLocalLiked(v => !v);
    setLocalLikeCount(c => (localLiked ? c - 1 : c + 1));
  };

  const handleRepost = () => {
    if (real) {
      void toggleRepost(post);
      return;
    }
    setLocalReposted(v => !v);
    setLocalRepostCount(c => (localReposted ? c - 1 : c + 1));
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('Delete this post? The photo or video will be removed permanently.')) {
      return;
    }
    setDeleting(true);
    try {
      await removePost(post.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete the post.');
      setDeleting(false);
    }
  };

  const openPost = () => openModal(post);

  const mediaSize = post.images[0] ?? post.videos[0];
  const aspectRatio = safeAspectRatio(
    mediaSize?.width ?? 1,
    mediaSize?.height ?? 1,
  );

  return (
    <article ref={articleRef} className="border-b border-slate-100 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-1 pt-4 pb-3">
        <Link href="/media/profile" className="flex items-center gap-2.5">
          <Image
            src={post.user.avatar_url}
            alt={post.user.username}
            width={36}
            height={36}
            className="rounded-full object-cover ring-2 ring-sky-300 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-slate-900 leading-tight flex items-center gap-1 truncate" title={`@${post.user.username}`}>
              {post.user.full_name || post.user.username}
              {post.user.is_verified && <BadgeCheck size={12} className="text-sky-500 shrink-0" />}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {timeAgo(post.created_at)}
              {post.location_name && (
                <> · <MapPin size={9} className="inline" /> {post.location_name}</>
              )}
            </p>
          </div>
        </Link>
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            disabled={deleting}
            aria-label="Post options"
            className="text-slate-400 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && post.is_owner && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} /> Delete post
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media — full bleed on mobile, rounded on sm+ */}
      <MediaCarousel
        post={post}
        aspectRatio={aspectRatio}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 630px, 468px"
        dotsBelow
        onDoubleClick={handleLike}
        onClick={openPost}
      />

      {/* Actions — each count is real recorded activity */}
      <div className="flex items-center gap-0.5 px-1.5 sm:px-0 mt-1.5 text-slate-600">
        <button
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-all active:scale-90 hover:bg-slate-50 ${
            liked ? 'text-red-500' : ''
          }`}
        >
          <Heart size={21} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} />
          {showLikeCount && <span className="text-[13px] font-semibold tabular-nums">{formatCount(likeCount)}</span>}
        </button>
        <button
          onClick={openPost}
          aria-label={`Comments (${post.comment_count})`}
          className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90 transition-all hover:bg-slate-50"
        >
          <MessageCircle size={21} strokeWidth={1.8} />
          <span className="text-[13px] font-semibold tabular-nums">{formatCount(post.comment_count)}</span>
        </button>
        <button
          onClick={handleRepost}
          aria-pressed={reposted}
          aria-label={reposted ? 'Undo repost' : 'Repost'}
          className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90 transition-all hover:bg-slate-50 ${
            reposted ? 'text-emerald-600' : ''
          }`}
        >
          <Repeat2 size={21} strokeWidth={1.8} />
          <span className="text-[13px] font-semibold tabular-nums">{formatCount(repostCount)}</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShareOpen(v => !v)}
            aria-label="Share"
            aria-expanded={shareOpen}
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full active:scale-90 transition-all hover:bg-slate-50"
          >
            <Send size={20} strokeWidth={1.8} />
            <span className="text-[13px] font-semibold tabular-nums">{formatCount(shareCount)}</span>
          </button>
          {shareOpen && <ShareMenu post={post} onClose={() => setShareOpen(false)} />}
        </div>
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-slate-500"
          title={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}
          aria-label={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}
        >
          <Eye size={20} strokeWidth={1.8} />
          <span className="text-[13px] font-semibold tabular-nums">{formatCount(viewCount)}</span>
        </span>
        <button
          onClick={handleSave}
          aria-pressed={isSaved}
          aria-label={isSaved ? 'Remove from saved' : 'Save'}
          className={`p-2 rounded-full ml-auto transition-all active:scale-90 hover:bg-slate-50 ${
            isSaved ? 'text-slate-900' : ''
          }`}
        >
          <Bookmark size={21} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>

      {/* Caption */}
      <div className="px-3 sm:px-1 space-y-0.5 mt-0.5">
        <p className="text-[14px] text-slate-800 leading-snug line-clamp-3">
          <Link
            href="/media/profile"
            className="font-semibold mr-1 hover:underline"
          >
            {post.user.full_name || post.user.username}
          </Link>
          {post.caption}
        </p>
        {!post.comments_off && post.comment_count > 0 && (
          <button
            onClick={openPost}
            className="text-[12px] text-slate-400 mt-0.5"
          >
            View all {post.comment_count} comments
          </button>
        )}
        {post.comments[0] && (
          <p className="text-[12px] text-slate-700 line-clamp-1">
            <span className="font-semibold">{post.comments[0].user.username}</span>{' '}
            {post.comments[0].content}
          </p>
        )}
        <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 capitalize mt-1">
          #{post.category}
        </span>
      </div>
    </article>
  );
}
