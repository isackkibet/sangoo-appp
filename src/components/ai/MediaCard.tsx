"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Headphones, Play } from "lucide-react";
import type { ContentItem, Language } from "./types";
import { dictionary } from "./i18n";

const FALLBACK = "/images/lake-victoria-bg.png";

type Props = {
  item: ContentItem;
  language: Language;
  variant?: "row" | "tile";
};

export default function MediaCard({ item, language, variant = "row" }: Props) {
  const [failed, setFailed] = useState(false);
  const t = dictionary[language];
  const Icon = item.kind === "podcast" ? Headphones : Play;
  const action = item.kind === "podcast" ? t.listen : t.watch;

  const inner = (isTile: boolean) => (
    <>
      <span className={`relative block overflow-hidden rounded-lg bg-[var(--ai-surface-2)] ${isTile ? "h-28 w-full" : "h-14 w-14 shrink-0"}`}>
        <Image
          src={failed || !item.image ? FALLBACK : item.image}
          alt=""
          fill
          sizes={isTile ? "240px" : "56px"}
          className="object-cover"
          onError={() => setFailed(true)}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-[var(--ai-navy)]/25">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--ai-primary)] shadow-sm">
            <Icon size={13} aria-hidden="true" />
          </span>
        </span>
      </span>
      <span className={`min-w-0 ${isTile ? "flex flex-1 flex-col p-3" : "flex-1"}`}>
        <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ai-primary)]">
          {item.kind === "podcast" ? t.typePodcast : t.typeVideo}
        </span>
        <span className={`mt-0.5 block font-semibold leading-snug text-[var(--ai-text)] ${isTile ? "line-clamp-2 text-[13.5px]" : "line-clamp-2 text-[13px]"}`}>
          {item.title}
        </span>
        {item.meta && <span className="mt-1 block text-[11.5px] text-[var(--ai-muted)]">{item.meta}</span>}
        <span className="mt-auto inline-flex items-center gap-1 pt-1.5 text-[12px] font-semibold text-[var(--ai-primary)]">
          {action}
        </span>
      </span>
    </>
  );

  const className = `group flex rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] transition-colors hover:border-[var(--ai-primary)]/40 hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] ${
    variant === "tile" ? "w-[240px] shrink-0 flex-col overflow-hidden" : "items-start gap-3 p-2.5"
  }`;

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner(variant === "tile")}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {inner(variant === "tile")}
    </Link>
  );
}
