"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reading progress indicator shown above the article.
 * Tracks scroll within the article content area and fills a thin bar.
 * No backend dependency; purely presentational.
 */
export default function ArticleProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (!container) return;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const value = maxScroll <= 0 ? 0 : scrollTop / maxScroll;
      setProgress(Math.min(Math.max(value, 0), 1));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
      <div
        className="h-full bg-primary rounded-full transition-all duration-100 ease-out"
        style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }}
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      />
    </div>
  );
}
