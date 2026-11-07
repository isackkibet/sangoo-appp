'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X, Heart, MessageCircle, Repeat2, Send, Bookmark, MoreHorizontal, BadgeCheck, MapPin, Trash2 } from 'lucide-react';
import { usePostViewStore } from '@/store/media/modalStores';
import { useMediaFeedStore } from '@/store/media/feedStore';
import MediaCarousel from '@/components/media/MediaCarousel';
import CommentsList from '@/components/media/PostViewModal/CommentsList';
import CommentInput from '@/components/media/PostViewModal/CommentInput';
import type { MediaComment } from '@/lib/media/mockData';

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function PostViewModal() {
  const { isOpen, post, initialIndex, close } = usePostViewStore();
  const livePost = useMediaFeedStore(s =>
    post ? s.posts.find(p => p.id === post.id) : undefined,
  );
  const toggleLike = useMediaFeedStore(s => s.toggleLike);
  const toggleRepost = useMediaFeedStore(s => s.toggleRepost);
  const removePost = useMediaFeedStore(s => s.removePost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [comments, setComments] = useState<MediaComment[]>([]);

  if (!isOpen || !post) return null;

  const real = Boolean(post.is_real);
  const current = real && livePost ? livePost : post;
  const isLiked = real ? current.is_liked : liked;
  const isReposted = real ? Boolean(current.is_reposted) : reposted;
  const totalLikes = real ? current.like_count : post.like_count + likeCount;

  const handleLike = () => {
    if (real) {
      void toggleLike(current);
      return;
    }
    setLiked(v => !v);
    setLikeCount(c => (liked ? c - 1 : c + 1));
  };

  const handleRepost = () => {
    if (real) {
      void toggleRepost(current);
      return;
    }
    setReposted(v => !v);
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!window.confirm('Delete this post? The photo or video will be removed permanently.')) {
      return;
    }
    setDeleting(true);
    try {
      await removePost(current.id);
      close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete the post.');
      setDeleting(false);
    }
  };

  const handleComment = (text: string) => {
    setComments(prev => [{
      id: `new-${Date.now()}`,
      content: text,
      created_at: new Date().toISOString(),
      like_count: 0,
      user: { id: 'sihu-demo-001', username: 'sihu_hub', avatar_url: 'https://picsum.photos/seed/sihu/32/32' },
      replies: [],
    }, ...prev]);
  };

  const allComments = [...comments, ...post.comments];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={close}
    >
      <button
        onClick={close}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
      >
        <X size={20} />
      </button>

      <div
        className="bg-white rounded-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl max-h-[90vh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Left — media */}
        <div className="md:w-[55%] bg-black flex items-center justify-center">
          <MediaCarousel
            post={post}
            aspectRatio="1"
            sizes="(max-width: 768px) 100vw, 55vw"
            initialIndex={initialIndex}
            objectFit="contain"
            onDoubleClick={handleLike}
          />
        </div>

        {/* Right — info */}
        <div className="md:w-[45%] flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
            <Image
              src={post.user.avatar_url}
              alt={post.user.username}
              width={36}
              height={36}
              className="rounded-full object-cover ring-2 ring-sky-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-slate-900 flex items-center gap-1">
                {post.user.username}
                {post.user.is_verified && <BadgeCheck size={13} className="text-sky-500" />}
              </p>
              {post.location_name && (
                <p className="text-[11px] text-slate-500 flex items-center gap-0.5">
                  <MapPin size={10} /> {post.location_name}
                </p>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                disabled={deleting}
                aria-label="Post options"
                className="text-slate-400 hover:text-slate-700 p-1 disabled:opacity-50"
              >
                <MoreHorizontal size={20} />
              </button>
              {menuOpen && current.is_owner && (
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

          {/* Caption + comments */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {post.caption && (
              <div className="flex gap-3">
                <Image
                  src={post.user.avatar_url}
                  alt={post.user.username}
                  width={32}
                  height={32}
                  className="rounded-full object-cover shrink-0 self-start"
                />
                <div>
                  <p className="text-[13px] text-slate-800">
                    <span className="font-semibold mr-1">{post.user.username}</span>
                    {post.caption}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">{timeAgo(post.created_at)}</p>
                </div>
              </div>
            )}
            <CommentsList comments={allComments} />
          </div>

          {/* Action bar */}
          <div className="shrink-0 border-t border-slate-100">
            <div className="flex items-center gap-1 px-3 py-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={1.8} />
              </button>
              <button className="p-2 rounded-full text-slate-600 hover:text-slate-900">
                <MessageCircle size={22} strokeWidth={1.8} />
              </button>
              <button
                onClick={handleRepost}
                className={`p-2 rounded-full transition-colors ${isReposted ? 'text-emerald-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Repeat2 size={22} strokeWidth={1.8} />
              </button>
              <button className="p-2 rounded-full text-slate-600 hover:text-slate-900">
                <Send size={22} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setSaved(v => !v)}
                className={`p-2 rounded-full ml-auto transition-colors ${saved ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <Bookmark size={22} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
              </button>
            </div>
            <div className="px-4 pb-1">
              {!post.hide_likes && (
                <p className="text-[13px] font-semibold text-slate-900">
                  {totalLikes.toLocaleString()} likes
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(post.created_at)}</p>
            </div>
            <CommentInput onSubmit={handleComment} />
          </div>
        </div>
      </div>
    </div>
  );
}
