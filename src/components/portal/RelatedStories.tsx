"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Article } from "@/constants/articles";

/**
 * Related article previews shown in the editorial sidebar.
 * Uses real SIHU articles from the database.
 */
type Props = {
  articles: Article[];
  currentId: string;
  language?: "en" | "sw";
};

export default function RelatedStories({ articles, currentId, language = "en" }: Props) {
  const related = articles.filter((a) => a.id !== currentId).slice(0, 3);
  const t = language === "sw" ? "Zingiria hivi" : "View all stories";

  if (related.length === 0) return null;

  return (
    <aside className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          Related stories
        </h2>
      </div>
      <div className="space-y-5">
        {related.map((article) => (
          <Link
            key={article.id}
            href={`/portal/article/${article.id}`}
            className="flex gap-4 rounded-xl border border-slate-100 p-4 hover:border-primary/30 hover:bg-slate-50 hover:shadow-sm transition-colors dark:border-slate-800 dark:hover:bg-slate-800/50"
          >
            <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={article.image}
                alt=""
                fill
                className="object-cover w-full h-full"
                sizes="(max-width: 768px) 100vw, 200px"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700 mb-1">
                {article.category}
              </p>
              <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1 line-clamp-2 dark:text-slate-100">
                {article.title}
              </h3>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                {article.author} · {article.time}
              </p>
            </div>
            <ArrowRight size={14} className="text-slate-400 shrink-0 transition-colors group-hover:text-primary" aria-hidden="true" />
          </Link>
        ))}
      </div>
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-sky-700 hover:text-primary transition-colors"
      >
        {t} <ArrowRight size={15} strokeWidth={1.5} />
      </Link>
    </aside>
  );
}
