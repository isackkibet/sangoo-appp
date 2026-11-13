"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Heart, MapPin, MessageCircle, PlayCircle, RefreshCw } from "lucide-react";
import type { MediaPost } from "@/lib/media/types";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; posts: MediaPost[] };

const ago = (iso: string) => {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
};

/** Photo with a calm placeholder if the file can't be loaded (e.g. stored on a retired storage project). */
function ReportPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-700 to-slate-900 text-slate-300">
        <Camera size={26} />
        <span className="text-[12px]">Photo unavailable</span>
      </span>
    );
  }
  return <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 25vw" onError={() => setFailed(true)} className="object-cover transition-transform duration-700 group-hover:scale-105" />;
}

/**
 * Public community reports from the SIHU database, visible without logging in.
 * Uses the public feed endpoint, which only returns public posts from public accounts.
 */
export default function CommunityReports() {
  const [load, setLoad] = React.useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/media/posts?scope=explore&limit=8")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { posts?: MediaPost[] }) => alive && setLoad({ status: "ready", posts: (d.posts ?? []).filter((p) => p.images.length + p.videos.length > 0) }))
      .catch(() => alive && setLoad({ status: "error" }));
    return () => { alive = false; };
  }, [attempt]);

  return (
    <section id="community" className="scroll-mt-20 py-16 md:py-24 bg-white" aria-labelledby="community-title">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">Community reports</p>
            <h2 id="community-title" className="font-heading text-[30px] md:text-[40px] font-bold leading-tight mt-3">Shared by people around the lake</h2>
            <p className="text-[15.5px] text-slate-600 mt-3 leading-relaxed">Photos and updates posted by SIHU members. Join to share your own report, like and comment.</p>
          </div>
          <Link href="/media/feed" className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[14px] font-semibold transition-colors">
            Open the community <ArrowRight size={16} />
          </Link>
        </div>

        {load.status === "loading" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-10 animate-pulse" aria-busy="true" aria-label="Loading community reports">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-200" />)}
          </div>
        )}

        {load.status === "error" && (
          <div className="mt-10 rounded-3xl bg-[#f6f8fb] border border-slate-200 p-8 text-center" role="alert">
            <p className="font-semibold text-slate-900">Community reports could not be loaded.</p>
            <p className="text-[14px] text-slate-500 mt-1">The community database may be busy. Please try again.</p>
            <button onClick={() => { setLoad({ status: "loading" }); setAttempt((a) => a + 1); }} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-sky-600">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {load.status === "ready" && load.posts.length === 0 && (
          <div className="mt-10 rounded-3xl bg-[#f6f8fb] border border-dashed border-slate-300 p-8 flex flex-col sm:flex-row items-center gap-5">
            <span className="w-12 h-12 rounded-2xl bg-white text-sky-700 flex items-center justify-center ring-1 ring-slate-200"><Camera size={22} /></span>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-slate-900">No public community reports yet.</p>
              <p className="text-[14px] text-slate-500 mt-1">Be the first to share a photo or update from your area.</p>
            </div>
            <Link href="/login?next=/media/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-600 text-white text-[14px] font-semibold hover:bg-sky-500">Share a report</Link>
          </div>
        )}

        {load.status === "ready" && load.posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-10">
            {load.posts.slice(0, 8).map((p) => {
              const cover = p.images[0] ?? null;
              const video = !cover ? p.videos[0] : null;
              const place = p.location_name?.trim();
              return (
                <Link key={p.id} href={`/login?next=${encodeURIComponent("/media/feed")}`} title="Log in to open the community feed"
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300">
                  {cover ? (
                    <ReportPhoto src={cover.url} alt={cover.alt_text || p.caption || "Community report"} />
                  ) : video ? (
                    <video src={video.url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  {video && <PlayCircle className="absolute top-3 right-3 text-white drop-shadow" size={22} />}
                  <span className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 md:p-4 text-white">
                    {p.caption && <span className="block text-[13.5px] font-semibold leading-snug line-clamp-2">{p.caption}</span>}
                    <span className="flex items-center gap-1.5 text-[12px] text-slate-200 mt-1">
                      <span className="font-semibold truncate">@{p.user.username}</span> · {ago(p.created_at)}
                    </span>
                    <span className="flex items-center gap-3 text-[12px] text-slate-200 mt-1.5">
                      {!p.hide_likes && <span className="inline-flex items-center gap-1"><Heart size={13} /> {p.like_count}</span>}
                      {!p.comments_off && <span className="inline-flex items-center gap-1"><MessageCircle size={13} /> {p.comment_count}</span>}
                      {place && <span className="inline-flex items-center gap-1 min-w-0"><MapPin size={13} className="shrink-0" /> <span className="truncate capitalize">{place}</span></span>}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
