"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ContentItem, Language } from "./types";
import { dictionary } from "./i18n";

const FALLBACK = "/images/lake-victoria-bg.png";

type Props = {
  article: ContentItem;
  language: Language;
  variant?: "row" | "tile";
};

export default function ArticleCard({ article, language, variant = "row" }: Props) {
  const [failed, setFailed] = useState(false);
  const t = dictionary[language];

  if (variant === "tile") {
    return (
      <Link
        href={article.href}
        className="group flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] transition-colors hover:border-[var(--ai-primary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
      >
        <span className="relative block h-20 w-full overflow-hidden bg-[var(--ai-surface-2)]">
          <Image
            src={failed || !article.image ? FALLBACK : article.image}
            alt=""
            fill
            sizes="200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            onError={() => setFailed(true)}
          />
        </span>
        <span className="flex flex-1 flex-col p-2">
          {article.category && (
            <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--ai-primary)]">
              {article.category}
            </span>
          )}
          <span className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-[var(--ai-text)]">
            {article.title}
          </span>
          <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-[var(--ai-primary)]">
            {t.read} <ArrowRight size={12} aria-hidden="true" />
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={article.href}
      className="group flex items-start gap-3 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-2.5 transition-colors hover:border-[var(--ai-primary)]/40 hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
    >
      <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--ai-surface-2)]">
        <Image
          src={failed || !article.image ? FALLBACK : article.image}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      </span>
      <span className="min-w-0 flex-1">
        {article.category && (
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ai-primary)]">
            {article.category}
          </span>
        )}
        <span className="mt-0.5 block line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--ai-text)]">
          {article.title}
        </span>
        {article.meta && <span className="mt-1 block text-[11.5px] text-[var(--ai-muted)]">{article.meta}</span>}
      </span>
      <ArrowRight size={14} className="mt-1 shrink-0 text-[var(--ai-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
