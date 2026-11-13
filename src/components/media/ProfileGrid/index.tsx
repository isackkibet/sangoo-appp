'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Grid3X3, Film, Bookmark, Repeat2, BadgeCheck, ImagePlus, Trash2, MapPin, Link2, Lock, Pencil, RefreshCw } from 'lucide-react';
import type { MediaPost } from '@/lib/media/mockData';
import type { MediaUser, ProfileResponse } from '@/lib/media/types';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { useMediaFeedStore } from '@/store/media/feedStore';
import { useCreatePostStore } from '@/store/media/modalStores';
import EditProfileModal from '@/components/media/EditProfileModal';

const TABS = [
  { label: 'Posts', Icon: Grid3X3 },
  { label: 'Reels', Icon: Film },
  { label: 'Saved', Icon: Bookmark },
  { label: 'Reposts', Icon: Repeat2 },
];

function PostGrid({ posts }: { posts: MediaPost[] }) {
  const removePost = useMediaFeedStore(s => s.removePost);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Delete this post? The photo or video will be removed permanently.')) {
      return;
    }
    setDeletingId(postId);
    try {
      await removePost(postId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not delete the post.');
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1 mt-1">
      {posts.map(p => {
        const image = p.images[0];
        const video = p.videos[0];
        if (!image && !video) return null;

        return (
          <div
            key={p.id}
            className="relative aspect-square bg-slate-900 overflow-hidden group"
          >
            <Link href="/media/feed" className="absolute inset-0 block">
              {image ? (
                <Image
                  src={image.url}
                  alt={p.caption}
                  fill
                  sizes="(max-width: 768px) 33vw, 280px"
                  className="object-cover group-hover:brightness-75 transition-all"
                />
              ) : (
                <>
                  <video
                    src={video.url}
                    poster={video.poster_url ?? undefined}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover group-hover:brightness-75 transition-all"
                  />
                  <Film size={20} className="absolute top-2 right-2 text-white drop-shadow" />
                </>
              )}
            </Link>
            {p.is_owner && p.is_real && (
              <button
                onClick={() => handleDelete(p.id)}
                disabled={deletingId === p.id}
                aria-label="Delete post"
                className="absolute bottom-1.5 right-1.5 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/*
 * Your profile, loaded from the SIHU database: your name, @username, bio,
 * location, website and real post / follower / following counts.
 * (It used to show your email address as the bio and placeholder counts.)
 */
export default function ProfileGrid() {
  const [tab, setTab] = useState('Posts');
  const auth = useSihuAuth();
  const realPosts = useMediaFeedStore(s => s.posts);
  const loadFeed = useMediaFeedStore(s => s.load);
  const openCreate = useCreatePostStore(s => s.open);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    let alive = true;
    fetch('/api/media/profile', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: ProfileResponse) => { if (alive) { setProfile(d); setState('ready'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [attempt]);

  const onSaved = (user: MediaUser) => {
    setProfile(p => (p ? { ...p, user: { ...p.user, ...user } } : p));
    setEditing(false);
    // New name / username everywhere: header, feed cards.
    void auth.refresh();
    void loadFeed(true);
  };

  if (state === 'loading') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse" aria-busy="true" aria-label="Loading profile">
        <div className="flex gap-8">
          <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-3 pt-2"><div className="h-6 w-48 rounded bg-slate-200" /><div className="h-4 w-32 rounded bg-slate-200" /><div className="h-4 w-64 rounded bg-slate-200" /></div>
        </div>
      </div>
    );
  }

  if (state === 'error' || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center" role="alert">
        <p className="font-semibold text-slate-800">Your profile could not be loaded.</p>
        <button onClick={() => { setState('loading'); setAttempt(a => a + 1); }} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-sky-600">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const user = profile.user;
  const displayName = user.full_name || user.username;
  // Posts: from the profile (all of yours), kept fresh with the feed's live copies.
  const liveById = new Map(realPosts.map(p => [p.id, p]));
  const myPosts = profile.posts.map(p => liveById.get(p.id) ?? p);
  const repostedPosts = realPosts.filter(p => p.is_reposted);
  const postsForTab = tab === 'Reposts' ? repostedPosts : tab === 'Posts' ? myPosts : [];
  const website = user.website?.trim();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 mb-8">
        <Image
          src={user.avatar_url}
          alt={displayName}
          width={144}
          height={144}
          className="w-24 h-24 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-sky-300 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-3 mb-1">
            <div className="min-w-0">
              <h1 className="text-[22px] sm:text-[26px] font-bold text-slate-900 leading-tight flex items-center gap-2 break-words">
                {displayName}
                {user.is_verified && <BadgeCheck size={20} className="text-sky-500 shrink-0" />}
                {user.is_private && <Lock size={16} className="text-slate-400 shrink-0" aria-label="Private account" />}
              </h1>
              <p className="text-[14px] text-slate-500 mt-0.5">@{user.username}</p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[13px] font-semibold text-slate-800 transition-colors"
              >
                <Pencil size={14} /> Edit profile
              </button>
              <button
                onClick={() => openCreate('post')}
                className="px-4 py-2 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Share a photo
              </button>
            </div>
          </div>

          <div className="flex gap-6 my-4">
            {[
              { label: user.post_count === 1 ? 'post' : 'posts', value: user.post_count ?? myPosts.length },
              { label: user.follower_count === 1 ? 'follower' : 'followers', value: user.follower_count ?? 0 },
              { label: 'following', value: user.following_count ?? 0 },
            ].map(s => (
              <p key={s.label} className="text-center">
                <span className="block text-[16px] font-bold text-slate-900 tabular-nums">{s.value.toLocaleString()}</span>
                <span className="text-[13px] text-slate-600">{s.label}</span>
              </p>
            ))}
          </div>

          {user.bio ? (
            <p className="text-[14px] text-slate-700 whitespace-pre-line">{user.bio}</p>
          ) : (
            <button onClick={() => setEditing(true)} className="text-[13.5px] text-sky-600 font-semibold hover:underline">+ Add a bio</button>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[13.5px]">
            {user.location && <span className="inline-flex items-center gap-1 text-slate-500"><MapPin size={13} /> {user.location}</span>}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 font-semibold hover:underline">
                <Link2 size={13} /> {website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          {!auth.signedIn && (
            <Link href="/login?next=/media/profile" className="text-[13px] font-semibold text-sky-600 hover:text-sky-700 mt-2 inline-block">
              Sign in to edit your profile
            </Link>
          )}
        </div>
      </div>

      <div className="flex border-t border-slate-200">
        {TABS.map(({ label, Icon }) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-semibold tracking-wider uppercase transition-colors border-t-2 -mt-px ${
              tab === label
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {postsForTab.length > 0 ? (
        <PostGrid posts={postsForTab} />
      ) : (
        <div className="py-20 text-center text-slate-400">
          <ImagePlus size={34} className="mx-auto mb-3 text-slate-300" />
          <p className="text-[15px]">
            {tab === 'Posts' ? 'You have not shared a photo yet' : `No ${tab.toLowerCase()} yet`}
          </p>
          {tab === 'Posts' && (
            <button
              onClick={() => openCreate('post')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[13px] font-semibold transition-colors"
            >
              <ImagePlus size={15} /> Share your first photo
            </button>
          )}
        </div>
      )}

      {editing && <EditProfileModal user={user} onClose={() => setEditing(false)} onSaved={onSaved} />}
    </div>
  );
}
