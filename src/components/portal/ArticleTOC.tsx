"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen } from "lucide-react";

/**
 * Table of contents generated from the article's <h2> and <h3> headings.
 * Highlights the section currently in view as the user scrolls.
 * Only renders when there are headings to list.
 */
interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export default function ArticleTOC({
  headings,
  className = "",
}: {
  headings: TOCItem[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-10% 0% -75% 0%", threshold: 0.01 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className={className}>
      <div className="flex items-center gap-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        <BookOpen size={14} aria-hidden="true" />
        In this article
      </div>
      <nav className="space-y-1">
        {headings.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeId === item.id
                ? "bg-slate-100 text-primary font-semibold border-l-2 border-primary dark:bg-slate-800 dark:text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span className={`w-[2px] rounded-full ${
              activeId === item.id ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
            }`} aria-hidden="true" />
            <span className="min-w-0 truncate">{item.text}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
