"use client";

import { Compass, X } from "lucide-react";
import type { ContentItem, Language, SourceItem } from "./types";
import { dictionary } from "./i18n";
import SourceList from "./SourceList";
import ArticleCard from "./ArticleCard";
import MediaCard from "./MediaCard";

type Props = {
  sources?: SourceItem[];
  items: ContentItem[];
  language: Language;
  variant?: "sidebar" | "inline";
  onClose?: () => void;
  sourcePrefix?: string;
  loading?: boolean;
};

export default function RelatedContent({
  sources = [],
  items,
  language,
  variant = "sidebar",
  onClose,
  sourcePrefix,
  loading = false,
}: Props) {
  const t = dictionary[language];

  if (variant === "inline") {
    if (items.length === 0) return null;
    return (
      <div className="mt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ai-muted)]">{t.related}</p>
        <div className="scrollbar-hide -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
          {items.map((item) =>
            item.kind === "article" ? (
              <ArticleCard key={`${item.kind}:${item.id}`} article={item} language={language} variant="tile" />
            ) : (
              <MediaCard key={`${item.kind}:${item.id}`} item={item} language={language} variant="tile" />
            )
          )}
        </div>
      </div>
    );
  }

  const articles = items.filter((item) => item.kind === "article");
  const media = items.filter((item) => item.kind !== "article");

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-[var(--ai-surface)]">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ai-border)] px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ai-lake)] text-[var(--ai-primary)]">
          <Compass size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-[var(--ai-text)]">{t.discoverTitle}</p>
          <p className="truncate text-[11px] text-[var(--ai-muted)]">{t.discoverSub}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="ai-scroll min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {sources.length > 0 && (
          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ai-muted)]">
              {t.latestSources}
            </h2>
            <SourceList sources={sources} language={language} idPrefix={sourcePrefix} />
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ai-muted)]">
              {t.articles}
            </h2>
            <div className="space-y-2">
              {articles.map((item) => (
                <ArticleCard key={`${item.kind}:${item.id}`} article={item} language={language} />
              ))}
            </div>
          </section>
        )}

        {media.length > 0 && (
          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ai-muted)]">
              {t.podcasts} &amp; {t.videos}
            </h2>
            <div className="space-y-2">
              {media.map((item) => (
                <MediaCard key={`${item.kind}:${item.id}`} item={item} language={language} />
              ))}
            </div>
          </section>
        )}

        {loading && sources.length === 0 && items.length === 0 && (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-[68px] animate-pulse rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface-2)]"
              />
            ))}
          </div>
        )}

        {!loading && sources.length === 0 && items.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--ai-border)] p-4 text-[12.5px] leading-relaxed text-[var(--ai-muted)]">
            {t.emptySources}
          </p>
        )}
      </div>
    </aside>
  );
}
