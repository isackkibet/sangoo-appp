'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Heart, MessageCircle, Repeat2, Send, Bookmark,
  MoreHorizontal, MapPin, BadgeCheck,
} from 'lucide-react';
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

function formatCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
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

  const openPost = () => openModal(post);

  const mediaSize = post.images[0] ?? post.videos[0];
  const aspectRatio = safeAspectRatio(
    mediaSize?.width ?? 1,
    mediaSize?.height ?? 1,
  );

  return (
    <article className="border-b border-slate-100 pb-4">
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
            <p className="text-[14px] font-semibold text-slate-900 leading-tight flex items-center gap-1 truncate">
              {post.user.username}
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
        <button className="text-slate-400 p-1.5 rounded-full hover:bg-slate-100 transition-colors shrink-0">
          <MoreHorizontal size={18} />
        </button>
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

      {/* Actions */}
      <div className="flex items-center gap-0.5 px-2 sm:px-1 mt-1.5">
        <button
          onClick={handleLike}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            liked ? 'text-red-500' : 'text-slate-500'
          }`}
        >
          <Heart size={22} fill={liked ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
        <button
          onClick={openPost}
          className="p-2 rounded-full text-slate-500 active:scale-90 transition-all"
        >
          <MessageCircle size={22} strokeWidth={1.8} />
        </button>
        <button
          onClick={handleRepost}
          className={`p-2 rounded-full active:scale-90 transition-all ${
            reposted ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Repeat2 size={22} strokeWidth={1.8} />
        </button>
        <button className="p-2 rounded-full text-slate-500 active:scale-90 transition-all">
          <Send size={22} strokeWidth={1.8} />
        </button>
        <button
          onClick={() => setSaved(v => !v)}
          className={`p-2 rounded-full ml-auto transition-all active:scale-90 ${
            saved ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          <Bookmark size={22} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>

      {/* Stats + caption */}
      <div className="px-3 sm:px-1 space-y-0.5 mt-0.5">
        {!post.hide_likes && (
          <p className="text-[13px] font-semibold text-slate-900">
            {formatCount(likeCount)} likes
          </p>
        )}
        {repostCount > 0 && (
          <p className="text-[12px] font-semibold text-emerald-700">
            {formatCount(repostCount)} reshares
          </p>
        )}
        <p className="text-[14px] text-slate-800 leading-snug line-clamp-3">
          <Link
            href="/media/profile"
            className="font-semibold mr-1 hover:underline"
          >
            {post.user.username}
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
