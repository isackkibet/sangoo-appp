"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { Article } from "@/constants/articles";
import { articleService } from "@/services/articleService";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; items: Article[] };

/** The newest SIHU stories (same sources and order as the news portal). */
export default function LatestStories() {
  const [load, setLoad] = React.useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    articleService
      .getArticles()
      .then((items) => alive && setLoad({ status: "ready", items: items.slice(0, 3) }))
      .catch(() => alive && setLoad({ status: "error" }));
    return () => { alive = false; };
  }, [attempt]);

  return (
    <section className="py-16 md:py-24 bg-[#f6f8fb]" aria-labelledby="latest-title">
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">Latest from SIHU</p>
            <h2 id="latest-title" className="font-heading text-[30px] md:text-[40px] font-bold leading-tight mt-3">Stories from the basin</h2>
          </div>
          <Link href="/portal" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-[14px] font-semibold transition-colors">All news <ArrowRight size={16} /></Link>
        </div>

        {load.status === "loading" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10 animate-pulse" aria-busy="true" aria-label="Loading stories">
            {[0, 1, 2].map((i) => <div key={i} className={`h-[320px] rounded-3xl bg-slate-200 ${i === 0 ? "sm:col-span-2" : ""}`} />)}
          </div>
        )}

        {load.status === "error" && (
          <div className="mt-10 rounded-3xl bg-white border border-slate-200 p-8 text-center" role="alert">
            <p className="font-semibold text-slate-900">Stories could not be loaded.</p>
            <button onClick={() => { setLoad({ status: "loading" }); setAttempt((a) => a + 1); }} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-sky-600">
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        )}

        {load.status === "ready" && load.items.length === 0 && (
          <div className="mt-10 rounded-3xl bg-white border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-900">No stories published yet.</p>
            <Link href="/portal/submit" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-sky-600">Submit the first story <ArrowRight size={15} /></Link>
          </div>
        )}

        {load.status === "ready" && load.items.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {load.items.map((a, i) => (
              <Link key={a.id} href={`/portal/article/${a.id}`}
                className={`group flex flex-col rounded-3xl overflow-hidden bg-white border border-slate-200/80 hover:shadow-[0_20px_40px_-22px_rgba(15,23,42,0.35)] hover:-translate-y-1 transition-all ${i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-1" : ""}`}>
                <span className={`relative block overflow-hidden bg-slate-200 ${i === 0 ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
                  <Image src={a.image || "/images/lake-fisherman-hero.jpg"} alt={a.title} fill sizes={i === 0 ? "(max-width: 1024px) 100vw, 640px" : "(max-width: 640px) 100vw, 320px"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-sm">{a.category}</span>
                </span>
                <span className="p-5 flex flex-col flex-1">
                  <span className={`font-heading font-bold text-slate-900 leading-snug group-hover:text-sky-700 transition-colors ${i === 0 ? "text-[21px] line-clamp-2" : "text-[16.5px] line-clamp-3"}`}>{a.title}</span>
                  {i === 0 && <span className="text-[14.5px] text-slate-600 leading-relaxed mt-2 line-clamp-2">{a.excerpt}</span>}
                  <span className="mt-auto pt-4 text-[13px] text-slate-500"><span className="font-semibold text-slate-700">{a.author}</span> · {a.time}</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <Link href="/portal" className="sm:hidden mt-6 flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-slate-900 text-white text-[15px] font-semibold">All news <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}
