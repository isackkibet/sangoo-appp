"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import NewsHero from "./NewsHero";
import NewsCategories from "./NewsCategories";
import Link from "next/link";
import Image from "next/image";
import { Article, defaultTicker, Podcast, Event } from "@/constants/articles";
import { articleService } from "@/services/articleService";
import { podcastService } from "@/services/podcastService";
import { eventService } from "@/services/eventService";
import { kaiEvents, kaiMedia, kaiPodcasts, type MediaItem } from "@/services/kaiHubService";
import {
  Clock,
  ArrowRight,
  Volume2,
  MapPin,
  PlayCircle,
  CalendarDays,
  Search,
  ExternalLink,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Headphones,
} from "lucide-react";

const FALLBACK = "/images/lake-fisherman-hero.jpg";

/** next/image with a quiet fallback when a remote picture is missing. */
function SafeImage({ src, alt, sizes, className, priority }: { src: string | null | undefined; alt: string; sizes: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <Image src={!src || failed ? FALLBACK : src} alt={alt} fill sizes={sizes} className={className} priority={priority} onError={() => setFailed(true)} />
  );
}

function SectionHead({ id, title, sub, children }: { id?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-28 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-8 border-b border-slate-200">
      <div>
        <h2 className="font-heading text-[26px] md:text-[30px] font-bold text-slate-900 leading-tight">{title}</h2>
        {sub && <p className="text-[15px] text-slate-500 mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export default function NewsPortal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickerItems, setTickerItems] = useState<{ id: string; text: string }[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaFilter, setMediaFilter] = useState<"all" | "photo" | "video">("all");
  const [openMedia, setOpenMedia] = useState<number | null>(null);
  const [visible, setVisible] = useState(9);

  useEffect(() => {
    setIsMounted(true);

    // Check if we need to force reset for the new real-world content migration
    const MIGRATION_VERSION = "2026_04_03_REAL_NEWS";
    const currentVersion = localStorage.getItem("sango_news_version");

    if (currentVersion !== MIGRATION_VERSION) {
      localStorage.removeItem("sango_articles");
      localStorage.removeItem("sango_podcasts");
      localStorage.removeItem("sango_ticker");
      localStorage.setItem("sango_news_version", MIGRATION_VERSION);
    }

    // Load data asynchronously
    const loadData = async () => {
      try {
        const [articlesData, podcastsData, eventsData, hubPodcasts, hubEvents, hubMedia] = await Promise.all([
          articleService.getArticles(),
          podcastService.getPodcasts(),
          eventService.getEvents(),
          kaiPodcasts().catch(() => []),
          kaiEvents().catch(() => []),
          kaiMedia().catch(() => []),
        ]);
        setArticles(articlesData);
        // Posts from the SIHU admin come first, then the site's own.
        setPodcasts([...hubPodcasts, ...podcastsData]);
        setEvents([...hubEvents, ...eventsData]);
        setMedia(hubMedia);
      } catch (error) {
        console.error("Error loading data:", error);
        setArticles([]);
        setPodcasts([]);
        setEvents([]);
      } finally {
        setLoaded(true);
      }
    };

    loadData();

    const storedTicker = localStorage.getItem("sango_ticker");
    setTickerItems(storedTicker ? JSON.parse(storedTicker) : defaultTicker);
  }, []);

  // Viewer keys: Escape closes, arrows move between photos and videos.
  useEffect(() => {
    if (openMedia === null) return;
    const count = media.filter((m) => mediaFilter === "all" || m.kind === mediaFilter).length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMedia(null);
      if (e.key === "ArrowRight") setOpenMedia((i) => (i === null ? null : (i + 1) % count));
      if (e.key === "ArrowLeft") setOpenMedia((i) => (i === null ? null : (i - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [openMedia, media, mediaFilter]);

  // Topics the stories actually have, most used first.
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [articles]);

  const q = searchTerm.trim().toLowerCase();
  const filtering = q !== "" || selectedCategory !== "All";
  const filteredArticles = articles.filter((article) => {
    const matchesSearch = !q || article.title.toLowerCase().includes(q) || article.excerpt.toLowerCase().includes(q) || article.author.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unfiltered: featured story + latest updates on top, the rest below.
  const mainArticle = filtering ? null : filteredArticles[0] ?? null;
  const sideArticles = filtering ? [] : filteredArticles.slice(1, 5);
  // The grid lists every story except the featured one (the side list is a
  // quick look at the newest; with few stories the grid would look empty).
  const gridArticles = filtering ? filteredArticles : filteredArticles.slice(1);

  const shownMedia = media.filter((m) => mediaFilter === "all" || m.kind === mediaFilter);
  const current = openMedia !== null ? shownMedia[openMedia] : null;
  const stepMedia = (d: number) => setOpenMedia((i) => (i === null ? null : (i + d + shownMedia.length) % shownMedia.length));
  const today = new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const handleReadArticle = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const openLink = (url?: string) => { if (url) window.open(url, "_blank", "noopener"); };

  return (
    <div className="bg-[#f6f8fb] min-h-screen pt-[72px] text-slate-900">
      {/* Ticker */}
      {tickerItems.length > 0 && (
        <div className="bg-slate-900 text-white">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8 flex items-center h-11 gap-4">
            <span className="shrink-0 inline-flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
            <div className="ticker-wrapper flex-1 overflow-hidden relative">
              <div className="animate-ticker text-[13px] font-medium text-slate-200 whitespace-nowrap">
                {[...tickerItems, ...tickerItems].map((item, i) => (
                  <React.Fragment key={`${item.id}_${i}`}>
                    <span className="mx-5 text-sky-400">•</span>{item.text}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masthead */}
      <header className="relative overflow-hidden group">
        <Image src="/images/lake-fisherman-hero.jpg" alt="Fisherman casting a net on Lake Victoria" fill priority sizes="100vw" className="object-cover object-[center_40%] animate-netcast" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/30 group-hover:from-slate-950/95 transition-all duration-700" />
        {/* Caption slides up on hover — same effect as Our Story */}
        <div className="absolute bottom-6 left-0 right-0 px-8 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none hidden md:block">
          <p className="text-sky-300 text-[12px] font-bold uppercase tracking-[0.12em]">Lake Victoria Basin · Sango Information Hub</p>
          <p className="text-white text-[16px] font-semibold mt-1">A fisherman casts his net — the lake is the lifeblood of 40 million people.</p>
        </div>
        <div className="relative container mx-auto max-w-7xl px-4 lg:px-8 py-12 md:py-16">
          <p className="text-sky-300 text-[13px] font-semibold">{today}</p>
          <h1 className="font-heading text-white text-[32px] md:text-5xl font-bold leading-tight mt-2 max-w-3xl">
            News and stories from the Lake Victoria Basin
          </h1>
          <p className="text-slate-300 text-[16px] md:text-lg mt-3 max-w-2xl leading-relaxed">
            Community reporting on the environment, governance and development, from the Sango Information Hub.
          </p>
          <label className="mt-7 flex items-center gap-3 bg-white rounded-full pl-5 pr-2 py-2 max-w-xl shadow-xl focus-within:ring-4 focus-within:ring-sky-400/40">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="search"
              placeholder="Search stories, topics or writers"
              aria-label="Search stories"
              className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none py-2"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setVisible(9); }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} aria-label="Clear search" className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center"><X size={18} /></button>
            )}
          </label>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 text-[14px] font-semibold text-slate-200" aria-label="Sections">
            <a href="#latest-news" className="hover:text-white transition-colors">All stories</a>
            {media.length > 0 && <a href="#media" className="hover:text-white transition-colors">Photos &amp; videos</a>}
            <a href="#podcasts" className="hover:text-white transition-colors">Podcasts</a>
            {events.length > 0 && <a href="#events" className="hover:text-white transition-colors">Events</a>}
            <div className="ml-auto flex flex-wrap gap-2">
              <Link href="/portal/submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-[12px] font-semibold transition-colors">
                + Article
              </Link>
              <Link href="/portal/submit/podcast" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold border border-white/20 transition-colors">
                🎙 Podcast
              </Link>
              <Link href="/portal/submit/event" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-[12px] font-semibold border border-white/20 transition-colors">
                📅 Event
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl px-4 lg:px-8 py-10 md:py-14 space-y-16 md:space-y-20">
        {/* Featured + latest updates */}
        {!isMounted || !loaded ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse" aria-label="Loading stories">
            <div className="lg:col-span-8 h-[420px] lg:h-[540px] rounded-3xl bg-slate-200" />
            <div className="lg:col-span-4 space-y-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-slate-200" />)}</div>
          </div>
        ) : (
          mainArticle && <NewsHero mainArticle={mainArticle} sideArticles={sideArticles} />
        )}

        {/* Latest news */}
        <section>
          <SectionHead id="latest-news" title={filtering ? "Search results" : "All stories"} sub={filtering ? `${filteredArticles.length} ${filteredArticles.length === 1 ? "story" : "stories"}${selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}${q ? ` for "${searchTerm.trim()}"` : ""}` : "Reporting from correspondents across the basin"} />
          {categories.length > 1 && (
            <div className="mb-8">
              <NewsCategories categories={categories} selectedCategory={selectedCategory} onSelectCategory={(c) => { setSelectedCategory(c); setVisible(9); }} />
            </div>
          )}

          {loaded && gridArticles.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
              <p className="font-heading text-xl font-bold text-slate-900">{filtering ? "No stories match" : "More stories coming soon"}</p>
              {filtering && (
                <button onClick={() => { setSearchTerm(""); setSelectedCategory("All"); }} className="mt-4 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-sky-600">Show all stories</button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {gridArticles.slice(0, visible).map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05 }}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)] transition-all duration-300 flex flex-col"
              >
                <Link href={`/portal/article/${article.id}`} className="block aspect-[16/10] overflow-hidden relative bg-slate-900">
                  <SafeImage src={article.image} alt={article.title} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-60" />
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* category badge */}
                  <span className="absolute top-3 left-3 bg-white/95 text-slate-900 text-[12px] font-semibold px-2.5 py-1 rounded-full shadow-sm">{article.category}</span>
                  {/* title slides up on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <h3 className="text-white font-heading text-[16px] font-bold leading-snug line-clamp-3">{article.title}</h3>
                    <p className="text-sky-300 text-[12px] font-semibold mt-1">{article.author} · {article.time}</p>
                  </div>
                </Link>
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <Link href={`/portal/article/${article.id}`}>
                    <h3 className="font-heading text-[18px] font-bold text-slate-900 leading-snug line-clamp-3 group-hover:text-sky-700 transition-colors">{article.title}</h3>
                  </Link>
                  <p className="text-slate-600 text-[14.5px] leading-relaxed line-clamp-3 mt-2.5">{article.excerpt}</p>
                  <div className="mt-auto pt-5 flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-slate-500 min-w-0 truncate">
                      <span className="font-semibold text-slate-700">{article.author}</span> · {article.time}
                    </span>
                    <button
                      onClick={() => handleReadArticle(article.title + ". " + article.excerpt)}
                      aria-label={`Listen to ${article.title}`}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-600 hover:text-sky-700 hover:bg-sky-50 font-semibold transition-colors"
                    >
                      <Volume2 size={15} /> Listen
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {gridArticles.length > visible && (
            <div className="text-center mt-10">
              <button onClick={() => setVisible((v) => v + 9)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-300 text-slate-900 text-[14px] font-semibold hover:border-slate-900 transition-colors">
                Show more stories <ArrowRight size={16} />
              </button>
            </div>
          )}
        </section>

        {/* Photos & videos - published by the SIHU admin */}
        {media.length > 0 && (
          <section>
            <SectionHead id="media" title="Photos & videos" sub="From the field around the basin">
              <div className="flex gap-2" role="tablist" aria-label="Show">
                {(["all", "photo", "video"] as const).map((f) => (
                  <button key={f} role="tab" aria-selected={mediaFilter === f} onClick={() => setMediaFilter(f)}
                    className={`px-4 py-2 rounded-full text-[14px] font-semibold border transition-colors ${mediaFilter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"}`}>
                    {f === "all" ? "All" : f === "photo" ? "Photos" : "Videos"}
                  </button>
                ))}
              </div>
            </SectionHead>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {shownMedia.map((m, i) => (
                <button key={m.id} onClick={() => setOpenMedia(i)}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-200 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 ${i === 0 && shownMedia.length > 4 ? "col-span-2 row-span-2" : "aspect-[4/3]"}`}>
                  <SafeImage src={m.image} alt={m.title} sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-transparent" />
                  {m.kind === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><PlayCircle size={30} /></span>
                    </span>
                  )}
                  <span className="absolute left-0 right-0 bottom-0 p-3 md:p-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-200 mb-1">
                      {m.kind === "video" ? <PlayCircle size={12} /> : <Camera size={12} />} {m.kind === "video" ? "Video" : "Photo"}
                    </span>
                    <span className="block text-white text-[13px] md:text-[15px] font-semibold leading-snug line-clamp-2">{m.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Podcasts */}
        <section>
          <SectionHead id="podcasts" title="Podcasts" sub="Listen to conversations and reports from the basin" />
          {podcasts.length === 0 ? (
            <p className="text-slate-500">New episodes are coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {podcasts.map((podcast) => {
                const url = (podcast as Podcast & { url?: string }).url;
                return (
                  <button key={podcast.id} onClick={() => openLink(url)} disabled={!url}
                    className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 text-left hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.25)] transition-all disabled:cursor-default">
                    <span className="w-20 h-20 shrink-0 rounded-xl overflow-hidden relative bg-slate-100">
                      <SafeImage src={podcast.image} alt="" sizes="80px" className="object-cover" />
                      <span className="absolute inset-0 bg-slate-950/25 flex items-center justify-center">
                        <span className="w-9 h-9 rounded-full bg-white text-slate-900 flex items-center justify-center shadow"><Headphones size={17} /></span>
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-heading text-[16px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-sky-700">{podcast.title}</span>
                      <span className="block text-[13.5px] text-slate-500 line-clamp-1 mt-1">{podcast.episode}</span>
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-sky-700 mt-2">
                        <Clock size={13} /> {podcast.duration}{url ? " · Listen" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Events and activities */}
        {events.length > 0 && (
          <section className="pb-6">
            <SectionHead id="events" title="Events & activities" sub="What is happening around the lake" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.map((event) => {
                const url = (event as Event & { url?: string }).url;
                const d = new Date(event.date);
                const valid = !Number.isNaN(d.getTime());
                return (
                  <div key={event.id} onClick={() => openLink(url)}
                    className={`group bg-white rounded-2xl border border-slate-200/80 p-5 flex gap-4 hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.25)] transition-all ${url ? "cursor-pointer" : ""}`}>
                    <div className="w-16 shrink-0 rounded-xl bg-sky-50 border border-sky-100 text-center py-2.5 h-fit">
                      {valid ? (
                        <>
                          <span className="block text-[12px] font-bold uppercase text-sky-700">{d.toLocaleDateString("en-KE", { month: "short" })}</span>
                          <span className="block font-heading text-2xl font-bold text-slate-900 leading-none mt-0.5">{d.getDate()}</span>
                        </>
                      ) : <CalendarDays className="mx-auto text-sky-600" size={22} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-[16px] font-bold text-slate-900 leading-snug group-hover:text-sky-700">{event.title}</h3>
                      {event.description && <p className="text-[13.5px] text-slate-500 leading-relaxed line-clamp-2 mt-1">{event.description}</p>}
                      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-600 mt-2.5"><MapPin size={13} className="text-sky-600" /> {event.location}</p>
                      {url && <p className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-sky-700 mt-1.5">More details <ExternalLink size={12} /></p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Photo and video viewer */}
      {current && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4 md:p-10" role="dialog" aria-modal="true" aria-label={current.title}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenMedia(null); }}>
          <button onClick={() => setOpenMedia(null)} aria-label="Close" className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><X size={22} /></button>
          {shownMedia.length > 1 && <>
            <button onClick={() => stepMedia(-1)} aria-label="Previous" className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronLeft size={24} /></button>
            <button onClick={() => stepMedia(1)} aria-label="Next" className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><ChevronRight size={24} /></button>
          </>}
          <div className="w-full max-w-5xl">
            {current.kind === "video" && current.youtubeId ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
                <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${current.youtubeId}?autoplay=1&rel=0`} title={current.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : current.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt={current.title} className="max-h-[72vh] w-auto mx-auto rounded-2xl shadow-2xl" />
            ) : null}
            <div className="mt-5 text-center">
              <p className="text-white font-heading font-bold text-lg md:text-xl">{current.title}</p>
              {current.caption && <p className="text-slate-300 text-[15px] mt-2 max-w-2xl mx-auto leading-relaxed">{current.caption}</p>}
              <div className="flex items-center justify-center gap-4 mt-3 text-[13px] text-slate-400">
                <span>{current.date}</span>
                {shownMedia.length > 1 && <span>{(openMedia ?? 0) + 1} / {shownMedia.length}</span>}
                {current.kind === "video" && current.url && !current.youtubeId && (
                  <a href={current.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-300 hover:text-white"><ExternalLink size={13} /> Watch video</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
