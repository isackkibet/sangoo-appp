"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Footer share controls rendered as a client component so copy-to-clipboard
 * interactivity works without breaking Server Component rendering.
 */
type Props = {
  title: string;
};

export default function ArticleFooter({ title }: Props) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const [copied, setCopied] = useState<boolean>(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <footer className="container mx-auto px-4 lg:px-8 max-w-7xl py-16 border-t border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          Sango Information Hub &bull; Community media for the Lake Victoria Basin
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Share:</span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#128C4B] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:bg-emerald-50 dark:border-slate-800 dark:text-[#128C4B] dark:hover:bg-emerald-50/30"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#128C4B]">WhatsApp</span>
          </a>
          <button
            onClick={copy}
            className={`flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${copied ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-slate-600"}`}
          >
            {copied ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Share2 size={14} aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
