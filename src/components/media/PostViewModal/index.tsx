'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X, Heart, MessageCircle, Repeat2, Send, Bookmark, Eye, MoreHorizontal, BadgeCheck, MapPin, Trash2 } from 'lucide-react';
import ShareMenu from '@/components/media/ShareMenu';
import { formatCount } from '@/components/media/MediaPostCard';
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
  const toggleSave = useMediaFeedStore(s => s.toggleSave);
  const recordView = useMediaFeedStore(s => s.recordView);
  const patchPost = useMediaFeedStore(s => s.patchPost);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  // Real comments from the database (null until loaded for this post).
  const [comments, setComments] = useState<{ postId: string; list: MediaComment[] } | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  // New comment count for a post opened from a shared link (not in the loaded feed).
  const [ownCommentCount, setOwnCommentCount] = useState<{ postId: string; n: number } | null>(null);

  const postId = post?.id ?? null;
  const isReal = Boolean(post?.is_real);

  // Opening a post counts as a genuine view and loads its comments.
  useEffect(() => {
    if (!isOpen || !postId || !isReal) return;
    recordView(postId);
    let alive = true;
    fetch(`/api/media/posts/${postId}/comments`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { comments: MediaComment[] }) => { if (alive) setComments({ postId, list: d.comments }); })
      .catch(() => { if (alive) setComments({ postId, list: [] }); });
    return () => { alive = false; };
  }, [isOpen, postId, isReal, recordView]);

  if (!isOpen || !post) return null;

  const real = Boolean(post.is_real);
  const base = real && livePost ? livePost : post;
  const current = !livePost && ownCommentCount?.postId === post.id ? { ...base, comment_count: ownCommentCount.n } : base;
  const isLiked = real ? current.is_liked : liked;
  const isReposted = real ? Boolean(current.is_reposted) : reposted;
  const totalLikes = real ? current.like_count : post.like_count + likeCount;
  const isSaved = real ? Boolean(current.is_saved) : saved;
  const showLikeCount = !current.hide_likes || Boolean(current.is_owner);
  const loadedComments = comments && comments.postId === post.id ? comments.list : null;

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

  // Comments are saved to the database (they used to be a local, fake entry).
  const handleComment = async (text: string) => {
    setCommentError(null);
    try {
      const res = await fetch(`/api/media/posts/${current.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = (await res.json()) as { comment?: MediaComment; error?: string };
      if (!res.ok || !data.comment) throw new Error(data.error || 'Could not post the comment.');
      const added = data.comment;
      setComments(prev => ({ postId: current.id, list: [...(prev && prev.postId === current.id ? prev.list : []), added] }));
      const next = current.comment_count + 1;
      patchPost(current.id, { comment_count: next });
      setOwnCommentCount({ postId: current.id, n: next });
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : 'Could not post the comment.');
    }
  };

  const allComments = loadedComments ?? post.comments;

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

          {/* Action bar — real counts from the database */}
          <div className="shrink-0 border-t border-slate-100">
            <div className="flex items-center gap-0.5 px-2 py-1.5 text-slate-600">
              <button
                onClick={handleLike}
                aria-pressed={isLiked}
                aria-label={isLiked ? 'Unlike' : 'Like'}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-slate-50 ${isLiked ? 'text-red-500' : ''}`}
              >
                <Heart size={21} fill={isLiked ? 'currentColor' : 'none'} strokeWidth={1.8} />
                {showLikeCount && <span className="text-[13px] font-semibold tabular-nums">{formatCount(totalLikes)}</span>}
              </button>
              <span className="inline-flex items-center gap-1.5 px-2 py-1.5" aria-label={`${current.comment_count} comments`}>
                <MessageCircle size={21} strokeWidth={1.8} />
                <span className="text-[13px] font-semibold tabular-nums">{formatCount(current.comment_count)}</span>
              </span>
              <button
                onClick={handleRepost}
                aria-pressed={isReposted}
                aria-label={isReposted ? 'Undo repost' : 'Repost'}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-slate-50 ${isReposted ? 'text-emerald-600' : ''}`}
              >
                <Repeat2 size={21} strokeWidth={1.8} />
                <span className="text-[13px] font-semibold tabular-nums">{formatCount(current.repost_count ?? 0)}</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShareOpen(v => !v)}
                  aria-label="Share"
                  aria-expanded={shareOpen}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors hover:bg-slate-50"
                >
                  <Send size={20} strokeWidth={1.8} />
                  <span className="text-[13px] font-semibold tabular-nums">{formatCount(current.share_count ?? 0)}</span>
                </button>
                {shareOpen && <ShareMenu post={current} onClose={() => setShareOpen(false)} />}
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-1.5 text-slate-500" aria-label={`${current.view_count ?? 0} views`}>
                <Eye size={20} strokeWidth={1.8} />
                <span className="text-[13px] font-semibold tabular-nums">{formatCount(current.view_count ?? 0)}</span>
              </span>
              <button
                onClick={() => (real ? void toggleSave(current) : setSaved(v => !v))}
                aria-pressed={isSaved}
                aria-label={isSaved ? 'Remove from saved' : 'Save'}
                className={`p-2 rounded-full ml-auto transition-colors hover:bg-slate-50 ${isSaved ? 'text-slate-900' : ''}`}
              >
                <Bookmark size={21} fill={isSaved ? 'currentColor' : 'none'} strokeWidth={1.8} />
              </button>
            </div>
            <div className="px-4 pb-1">
              <p className="text-[11px] text-slate-400">{timeAgo(post.created_at)}</p>
              {commentError && <p className="text-[12px] text-red-600 mt-1" role="alert">{commentError}</p>}
            </div>
            {current.comments_off
              ? <p className="px-4 py-3 border-t border-slate-100 text-[12.5px] text-slate-400">Comments are turned off for this post.</p>
              : <CommentInput onSubmit={(t) => void handleComment(t)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
