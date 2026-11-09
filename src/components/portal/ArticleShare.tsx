"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Send, Share2 } from "lucide-react";

/**
 * Share controls for an article: WhatsApp, Facebook, X (Twitter) and Copy Link.
 * Uses the real current article URL. Shows temporary "Copied" feedback.
 */
type ShareChannel = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  buildUrl: (url: string, title: string) => string;
};

const CHANNELS: ShareChannel[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: <Send size={16} strokeWidth={2} />,
    color: "#25D366",
    buildUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: <Share2 size={16} strokeWidth={2} />,
    color: "#1877F2",
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "x",
    label: "X",
    icon: <Send size={16} strokeWidth={2} />,
    color: "#000000",
    buildUrl: (url, title) => `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "copy",
    label: "Copy link",
    icon: <Link2 size={16} strokeWidth={2} />,
    color: "#64748b",
    buildUrl: (url) => url,
  },
];

type Props = {
  title: string;
  url: string;
  className?: string;
};

export default function ArticleShare({ title, url, className }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleShare = (channel: ShareChannel) => {
    if (channel.id === "copy") {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopied("copy");
          setTimeout(() => setCopied(null), 1600);
        })
        .catch(() => {
          /* clipboard unavailable */
        });
      return;
    }
    window.open(channel.buildUrl(url, title), "_blank", "noopener,noreferrer,width=600,height=400");
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {CHANNELS.map((channel) => {
        const active = copied === channel.id;
        return (
          <button
            key={channel.id}
            type="button"
            onClick={() => handleShare(channel)}
            aria-label={channel.label}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : channel.id === "copy"
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  : `text-[${channel.color}] hover:bg-[${channel.color}]/10 hover:text-[${channel.color}] dark:text-[${channel.color}]`
            }`}
          >
            {active ? (
              <Check size={15} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              channel.icon
            )}
            {!active && <span className="sr-only">{channel.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
