"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, ExternalLink, PlayCircle } from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/youtube";
import { getSangoNewsVideos, type ResolvedSangoNewsVideo } from "@/services/sangoNewsVideoService";

function formatPublishedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function VideoThumbnail({ video }: { video: ResolvedSangoNewsVideo }) {
  const [attempt, setAttempt] = useState(0);

  if (attempt > 1) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl">
          <PlayCircle size={30} />
        </span>
      </div>
    );
  }

  const src = attempt === 0 ? video.thumbnail : getYouTubeThumbnail(video.youtubeId, "hq");

  return (
    <>
      <Image
        src={src}
        alt={video.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        onError={() => setAttempt((current) => current + 1)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-14 h-14 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <PlayCircle size={30} />
        </span>
      </span>
    </>
  );
}

export default function SangoNewsVideos() {
  const videos = useMemo(() => getSangoNewsVideos(), []);

  if (videos.length === 0) return null;

  return (
    <section>
      <div id="sango-news" className="scroll-mt-28 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 mb-8 border-b border-slate-200">
        <div>
          <h2 className="font-heading text-[26px] md:text-[30px] font-bold text-slate-900 leading-tight">Sango News</h2>
          <p className="text-[15px] text-slate-500 mt-1">Video reports from across the Lake Victoria Basin</p>
        </div>
        <Link
          href="/portal#latest-news"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-300 text-slate-900 text-[14px] font-semibold hover:border-slate-900 transition-colors"
        >
          View All News <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {videos.map((video, index) => (
          <motion.article
            key={video.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
            className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.25)] transition-all duration-300 flex flex-col"
          >
            <a
              href={video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${video.title} on YouTube`}
              className="flex flex-col flex-1"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <VideoThumbnail video={video} />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                  <PlayCircle size={13} /> YouTube
                </span>
              </div>
              <div className="p-5 md:p-6 flex flex-col flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-sky-700">{video.source}</p>
                <h3 className="font-heading text-[18px] font-bold text-slate-900 leading-snug line-clamp-2 mt-1.5 group-hover:text-sky-700 transition-colors">
                  {video.title}
                </h3>
                <p className="text-slate-600 text-[14.5px] leading-relaxed line-clamp-3 mt-2.5">{video.description}</p>
                <div className="mt-auto pt-5 flex items-center justify-between gap-3 text-[13px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <CalendarDays size={14} /> {formatPublishedDate(video.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-sky-700 group-hover:text-sky-800">
                    Watch on YouTube <ExternalLink size={14} />
                  </span>
                </div>
              </div>
            </a>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
