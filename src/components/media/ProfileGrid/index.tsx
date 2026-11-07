'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Grid3X3, Film, Bookmark, Repeat2, BadgeCheck, Settings, ImagePlus, Trash2 } from 'lucide-react';
import { MEDIA_USER, MEDIA_POSTS, type MediaPost } from '@/lib/media/mockData';
import { useSihuAuth } from '@/components/auth/SihuAuth';
import { useMediaFeedStore } from '@/store/media/feedStore';
import { useCreatePostStore } from '@/store/media/modalStores';
import { mediaAvatar, mediaFullName, mediaUsername } from '@/lib/media/user';

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

export default function ProfileGrid() {
  const [tab, setTab] = useState('Posts');
  const auth = useSihuAuth();
  const realPosts = useMediaFeedStore(s => s.posts);
  const load = useMediaFeedStore(s => s.load);
  const openCreate = useCreatePostStore(s => s.open);

  useEffect(() => {
    void load();
  }, [load]);

  const signedIn = auth.signedIn && auth.user;
  const username = signedIn
    ? mediaUsername(auth.user?.name, auth.user?.email)
    : MEDIA_USER.username;
  const fullName = signedIn
    ? mediaFullName(auth.user?.name, auth.user?.email)
    : MEDIA_USER.full_name;
  const avatar = signedIn
    ? mediaAvatar(auth.user?.name, auth.user?.email, auth.user?.avatarUrl)
    : mediaAvatar(null, null, MEDIA_USER.avatar_url);

  const myPosts = signedIn ? realPosts.filter(p => p.user.id === auth.user?.id) : [];
  const repostedPosts = signedIn ? realPosts.filter(p => p.is_reposted) : [];

  const postsForTab =
    tab === 'Reposts'
      ? repostedPosts
      : tab === 'Posts'
        ? signedIn
          ? myPosts
          : MEDIA_POSTS
        : [];

  const postCount = signedIn ? myPosts.length : MEDIA_USER.posts;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row gap-8 mb-8">
        <Image
          src={avatar}
          alt={fullName}
          width={96}
          height={96}
          className="rounded-full object-cover ring-4 ring-sky-300 sm:w-36 sm:h-36"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              {username}
              {(signedIn ? false : MEDIA_USER.is_verified) && (
                <BadgeCheck size={18} className="text-sky-500" />
              )}
            </h1>
            <button
              onClick={() => openCreate('post')}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Share a photo
            </button>
            <button className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors">
              <Settings size={16} className="text-slate-700" />
            </button>
          </div>

          <div className="flex gap-6 mb-4">
            {[
              { label: 'posts', value: postCount },
              { label: 'followers', value: MEDIA_USER.followers },
              { label: 'following', value: MEDIA_USER.following },
            ].map(s => (
              <button key={s.label} className="text-center hover:opacity-70 transition-opacity">
                <span className="block text-[15px] font-bold text-slate-900">
                  {s.value.toLocaleString()}
                </span>
                <span className="text-[13px] text-slate-600">{s.label}</span>
              </button>
            ))}
          </div>

          <p className="text-[14px] font-semibold text-slate-900">{fullName}</p>
          <p className="text-[14px] text-slate-700 mt-0.5 whitespace-pre-line">
            {signedIn
              ? auth.user?.email ?? 'Sharing stories from the Lake Victoria Basin.'
              : MEDIA_USER.bio}
          </p>
          {!signedIn && MEDIA_USER.website && (
            <a
              href={MEDIA_USER.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-sky-600 font-semibold hover:underline mt-1 inline-block"
            >
              {MEDIA_USER.website.replace('https://', '')}
            </a>
          )}
          {!signedIn && (
            <Link
              href="/login?next=/media/feed"
              className="text-[13px] font-semibold text-sky-600 hover:text-sky-700 mt-2 inline-block"
            >
              Sign in to see your posts
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
            {tab === 'Posts'
              ? signedIn
                ? 'You have not shared a photo yet'
                : `No ${tab.toLowerCase()} yet`
              : `No ${tab.toLowerCase()} yet`}
          </p>
          {signedIn && tab === 'Posts' && (
            <button
              onClick={() => openCreate('post')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[13px] font-semibold transition-colors"
            >
              <ImagePlus size={15} /> Share your first photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
