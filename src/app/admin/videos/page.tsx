"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2, Plus, RefreshCw, Trash2, Video } from "lucide-react";
import { adminFetch, formatAdminDate } from "@/lib/admin/client";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

type VideoRow = {
  id: string;
  url: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  createdAt: string;
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ videos: VideoRow[] }>("/api/admin/sango-news");
      setVideos(data.videos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load videos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await adminFetch("/api/admin/sango-news", {
        method: "POST",
        body: JSON.stringify({ url, title, description, source, publishedAt }),
      });
      setUrl("");
      setTitle("");
      setDescription("");
      setSource("");
      setPublishedAt("");
      setNotice("Video added to the Sango News section.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the video.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (video: VideoRow) => {
    if (!window.confirm(`Remove "${video.title}" from Sango News?`)) return;
    setBusyId(video.id);
    setError(null);
    setNotice(null);
    try {
      await adminFetch(`/api/admin/sango-news?id=${encodeURIComponent(video.id)}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the video.");
    } finally {
      setBusyId(null);
    }
  };

  const previewId = extractYouTubeId(url);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Plus size={20} />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Post a video link</h2>
            <p className="text-xs text-slate-500">YouTube links appear in the Sango News section.</p>
          </div>
        </div>

        <form onSubmit={add} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">YouTube link</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://youtu.be/..."
              required
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </label>

          {previewId && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <img
                src={getYouTubeThumbnail(previewId, "mq")}
                alt=""
                className="h-14 w-24 rounded-lg object-cover"
              />
              <p className="text-xs text-slate-500">
                Video ID: <span className="font-mono text-slate-700">{previewId}</span>
              </p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Headline for the video"
              required
              maxLength={240}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Short summary shown on the card"
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Source</span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="e.g. KBC Channel 1"
                maxLength={120}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">Published date</span>
              <input
                type="date"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            {saving ? "Adding video..." : "Add to Sango News"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900">Published videos</h2>
            <p className="text-xs text-slate-500">These links show on the portal homepage.</p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {videos.length === 0 && !loading && (
          <p className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-sm text-slate-500">
            No videos yet. Add the first one.
          </p>
        )}

        {videos.map((video) => {
          const id = extractYouTubeId(video.url);
          return (
            <article
              key={video.id}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              {id ? (
                <img
                  src={getYouTubeThumbnail(id, "mq")}
                  alt=""
                  className="h-20 w-32 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Video size={22} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-semibold text-slate-900">{video.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {video.source || "Sango News"} · {formatAdminDate(video.publishedAt)}
                </p>
                <div className="mt-2 flex gap-3">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
                  >
                    Watch <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={() => void remove(video)}
                    disabled={busyId === video.id}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-60"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
