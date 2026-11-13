"use client";

import React from "react";
import Link from "next/link";
import { Newspaper, Users, Camera, Heart, MessageCircle, MapPin, RefreshCw, Video } from "lucide-react";
import type { SihuStats } from "@/app/api/stats/route";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; data: SihuStats };

/** Live SIHU numbers from /api/stats (real counts only). */
export function useSihuStats() {
  const [load, setLoad] = React.useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: SihuStats) => alive && setLoad({ status: "ready", data }))
      .catch(() => alive && setLoad({ status: "error" }));
    return () => { alive = false; };
  }, [attempt]);
  const retry = () => { setLoad({ status: "loading" }); setAttempt((a) => a + 1); };
  return { load, retry };
}

const fmt = (n: number) => n.toLocaleString("en-KE");
const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
};

type Tile = { Icon: typeof Newspaper; value: number; label: string; href?: string };

export default function SihuStatsPanel({ dark = false }: { dark?: boolean }) {
  const { load, retry } = useSihuStats();
  const card = dark ? "bg-white/[0.06] border-white/10 text-white" : "bg-white border-slate-200/80 text-slate-900";
  const muted = dark ? "text-slate-300" : "text-slate-500";

  if (load.status === "loading") {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading SIHU numbers">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-[118px] rounded-2xl border animate-pulse ${dark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`} />)}
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${card}`} role="alert">
        <div>
          <p className="font-semibold">SIHU numbers are unavailable right now.</p>
          <p className={`text-[14px] mt-1 ${muted}`}>We only show live counts, so nothing is displayed until the data can be reached.</p>
        </div>
        <button onClick={retry} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[13px] font-semibold">
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  const { data } = load;
  const c = data.community;
  const tiles: Tile[] = [
    { Icon: Newspaper, value: data.stories, label: "stories published", href: "/portal" },
    ...(c
      ? [
          { Icon: Camera, value: c.posts, label: "community reports shared", href: "/media/feed" },
          { Icon: c.videos > 0 ? Video : Camera, value: c.photos + c.videos, label: c.videos > 0 ? "photos & videos from the field" : "photos from the field", href: "/media/explore" },
          { Icon: Users, value: c.members, label: c.members === 1 ? "registered member" : "registered members", href: "/login?next=/media/feed" },
          { Icon: Heart, value: c.likes, label: "likes on community reports" },
          { Icon: MessageCircle, value: c.comments, label: "comments" },
          { Icon: MapPin, value: c.places, label: c.places === 1 ? "place reported from" : "places reported from", href: "/map" },
        ]
      : []),
  ].filter((t) => t.value > 0 || t.label === "community reports shared");

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {tiles.slice(0, 8).map((t) => {
          const inner = (
            <>
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? "bg-sky-400/15 text-sky-300" : "bg-sky-50 text-sky-700"}`}><t.Icon size={17} /></span>
              <span className="block font-heading text-[28px] sm:text-[34px] font-bold leading-none mt-3 tabular-nums">{fmt(t.value)}</span>
              <span className={`block text-[13px] mt-1.5 leading-snug ${muted}`}>{t.label}</span>
            </>
          );
          const cls = `block rounded-2xl border p-4 sm:p-5 transition-all ${card} ${t.href ? (dark ? "hover:bg-white/[0.1] hover:border-sky-400/40" : "hover:border-sky-300 hover:shadow-[0_14px_30px_-18px_rgba(2,132,199,0.5)]") : ""}`;
          return t.href ? <Link key={t.label} href={t.href} className={cls}>{inner}</Link> : <div key={t.label} className={cls}>{inner}</div>;
        })}
      </div>
      <p className={`text-[12.5px] mt-3 ${muted}`}>
        Live counts from the SIHU database{c?.latestPostAt ? ` · latest community report ${ago(c.latestPostAt)}` : ""}.
        {!c && " Community numbers are temporarily unavailable."}
      </p>
    </div>
  );
}
