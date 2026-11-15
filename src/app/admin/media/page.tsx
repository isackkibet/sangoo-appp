"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Video,
} from "lucide-react";
import {
  adminFetch,
  formatAdminDateTime,
} from "@/lib/admin/client";

type Author = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

type Post = {
  id: string;
  caption: string;
  type: string;
  category: string;
  visibility: string;
  created_at: string;
  image_url: string | null;
  image_kind: string | null;
  like_count: number;
  comment_count: number;
  share_count: number;
  author: Author;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post_caption: string;
  author: Author;
};

type Story = {
  id: string;
  kind: string;
  url: string;
  caption: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  author: Author;
};

type Tab = "posts" | "comments" | "stories";

export default function AdminMediaPage() {
  const [tab, setTab] = useState<Tab>("posts");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError(null);
    try {
      const q = encodeURIComponent(search);
      const [postData, commentData, storyData] = await Promise.all([
        adminFetch<{ posts: Post[] }>(`/api/admin/posts?q=${q}`),
        adminFetch<{ comments: Comment[] }>(`/api/admin/comments?q=${q}`),
        adminFetch<{ stories: Story[] }>(`/api/admin/stories?q=${q}`),
      ]);
      setPosts(postData.posts);
      setComments(commentData.comments);
      setStories(storyData.stories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load media.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (kind: Tab, id: string) => {
    const label = kind === "posts" ? "post" : kind === "comments" ? "comment" : "story";
    if (!window.confirm(`Delete this ${label}? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not delete the ${label}.`);
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: Tab; label: string; count: number; icon: typeof ImageIcon }[] = [
    { id: "posts", label: "Posts", count: posts.length, icon: ImageIcon },
    { id: "comments", label: "Comments", count: comments.length, icon: MessageSquare },
    { id: "stories", label: "Stories", count: stories.length, icon: Video },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Search and remove illegal or abusive content. Deleted content is removed from the app.
        </p>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load(query);
              }}
              placeholder="Search caption or user"
              className="w-64 rounded-full border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
          <button
            onClick={() => void load(query)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-300 hover:border-slate-900"
            }`}
          >
            <Icon size={15} /> {label}
            <span
              className={`rounded-full px-1.5 text-[11px] ${
                tab === id ? "bg-white/15" : "bg-slate-100 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {tab === "posts" && (
        <div className="space-y-3">
          {posts.length === 0 && !loading && (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
              No posts found.
            </p>
          )}
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              {post.image_url ? (
                <img
                  src={post.image_url}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <ImageIcon size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">@{post.author.username}</span>
                  <span>{post.category}</span>
                  <span>{post.visibility}</span>
                  <span>{formatAdminDateTime(post.created_at)}</span>
                </div>
                <p className="mt-1 line-clamp-3 text-sm text-slate-700">
                  {post.caption || "No caption"}
                </p>
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  <span>{post.like_count} likes</span>
                  <span>{post.comment_count} comments</span>
                  <span>{post.share_count} shares</span>
                </div>
              </div>
              <button
                onClick={() => void remove("posts", post.id)}
                disabled={busyId === post.id}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                <Trash2 size={15} /> Delete
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="space-y-3">
          {comments.length === 0 && !loading && (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
              No comments found.
            </p>
          )}
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <MessageSquare size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">@{comment.author.username}</span>
                  <span>{formatAdminDateTime(comment.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-800">{comment.content}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                  On: {comment.post_caption || comment.post_id}
                </p>
              </div>
              <button
                onClick={() => void remove("comments", comment.id)}
                disabled={busyId === comment.id}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                <Trash2 size={15} /> Delete
              </button>
            </article>
          ))}
        </div>
      )}

      {tab === "stories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stories.length === 0 && !loading && (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
              No stories found.
            </p>
          )}
          {stories.map((story) => (
            <article
              key={story.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-[4/5] bg-slate-900">
                {story.kind === "video" ? (
                  <video
                    src={story.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img src={story.url} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {story.kind}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">@{story.author.username}</span>
                  <span>{story.view_count} views</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                  {story.caption || "No caption"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatAdminDateTime(story.created_at)}
                </p>
                <button
                  onClick={() => void remove("stories", story.id)}
                  disabled={busyId === story.id}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 size={15} /> Delete story
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 flex items-start gap-3">
        <ShieldAlert className="mt-0.5 shrink-0" size={18} />
        <p>
          Deleting content also removes its stored media from the server. Use it for illegal
          content, harassment, or repeated policy violations.
        </p>
      </div>
    </div>
  );
}
