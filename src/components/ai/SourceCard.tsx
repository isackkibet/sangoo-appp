"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, FileText, Globe, Headphones, Sparkles, Users, Video } from "lucide-react";
import type { Language, SourceItem } from "./types";
import { dictionary } from "./i18n";

const KIND_ICON = {
  sihu: BookOpen,
  web: Globe,
  research: FileText,
  community: Users,
  ai: Sparkles,
} as const;

const CONTENT_ICON = {
  article: BookOpen,
  podcast: Headphones,
  video: Video,
  report: FileText,
  knowledge: Sparkles,
} as const;

const KIND_CLASS = {
  sihu: "bg-[var(--ai-lake)] text-[var(--ai-primary)]",
  web: "bg-sky-50 text-sky-700",
  research: "bg-violet-50 text-violet-700",
  community: "bg-emerald-50 text-emerald-700",
  ai: "bg-amber-50 text-amber-700",
} as const;

type Props = {
  source: SourceItem;
  index: number;
  language: Language;
  idPrefix?: string;
  compact?: boolean;
};

export default function SourceCard({ source, index, language, idPrefix = "source", compact = false }: Props) {
  const t = dictionary[language];
  const KindIcon = KIND_ICON[source.kind];
  const ContentIcon = CONTENT_ICON[source.contentType];
  const label =
    source.kind === "sihu"
      ? t.sourceSihu
      : source.kind === "web"
        ? t.sourceWeb
        : source.kind === "research"
          ? t.sourceResearch
          : source.kind === "community"
            ? t.sourceCommunity
            : t.sourceAi;
  const typeLabel =
    source.contentType === "article"
      ? t.typeArticle
      : source.contentType === "podcast"
        ? t.typePodcast
        : source.contentType === "video"
          ? t.typeVideo
          : source.contentType === "report"
            ? t.typeReport
            : t.typeKnowledge;

  const meta = [typeLabel, source.location, source.publishedAt].filter(Boolean).join(" · ");

  const body = (
    <>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${KIND_CLASS[source.kind]}`}>
        <KindIcon size={15} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ai-primary)]">{label}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--ai-muted)]">
            <ContentIcon size={11} aria-hidden="true" /> {typeLabel}
          </span>
        </span>
        <span className={`mt-0.5 block font-semibold leading-snug text-[var(--ai-text)] ${compact ? "line-clamp-1 text-[13px]" : "line-clamp-2 text-[13.5px]"}`}>
          {source.title}
        </span>
        {!compact && meta && <span className="mt-1 block text-[11.5px] text-[var(--ai-muted)]">{meta}</span>}
        {!compact && source.snippet && <span className="mt-1 block line-clamp-2 text-[12px] leading-relaxed text-[var(--ai-muted)]">{source.snippet}</span>}
      </span>
      {source.url && <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-[var(--ai-muted)]" aria-hidden="true" />}
    </>
  );

  const className =
    "group flex items-start gap-3 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-3 transition-colors hover:border-[var(--ai-primary)]/40 hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]";

  if (!source.url) {
    return (
      <div id={`${idPrefix}-${index}`} className={className}>
        {body}
      </div>
    );
  }

  if (source.url.startsWith("/")) {
    return (
      <Link id={`${idPrefix}-${index}`} href={source.url} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <a id={`${idPrefix}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  );
}
