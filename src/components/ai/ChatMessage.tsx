"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, User } from "lucide-react";
import type { ChatMessageData, ContentItem, Language, SourceItem } from "./types";
import { dictionary } from "./i18n";
import Markdown from "./Markdown";
import AIResponseActions from "./AIResponseActions";
import type { SpeechPlayer } from "./useSpeechPlayer";

type Props = {
  message: ChatMessageData;
  language: Language;
  player: SpeechPlayer;
  sihuSources?: SourceItem[];
  webSources?: SourceItem[];
  related: ContentItem[];
  onFollowUp: () => void;
  onSuggestion?: (prompt: string) => void;
};

export default function ChatMessage({ message, language, player, related, onFollowUp, onSuggestion }: Props) {
  const t = dictionary[language];
  const mine = message.role === "user";
  const [reduceMotion] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const shouldAnimate = !mine && !!message.animate && !reduceMotion;
  const [visibleLength, setVisibleLength] = useState(shouldAnimate ? 0 : message.content.length);

  useEffect(() => {
    if (!shouldAnimate) return;

    let current = 0;
    const total = message.content.length;
    const step = Math.max(2, Math.ceil(total / 90));
    const timer = window.setInterval(() => {
      current = Math.min(total, current + step);
      setVisibleLength(current);
      if (current >= total) window.clearInterval(timer);
    }, 18);

    return () => window.clearInterval(timer);
  }, [message.content, shouldAnimate]);

  const shown = message.content.slice(0, visibleLength);
  const streaming = shouldAnimate && visibleLength < message.content.length;
  const time = useMemo(
    () => new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [message.createdAt]
  );

  const combinedSources = useMemo(
    () => [...(message.sihuSources ?? []), ...(message.webSources ?? [])],
    [message.sihuSources, message.webSources]
  );

  const handleCitation = (index: number) => {
    const source = combinedSources[index];
    if (!source?.url) return;
    if (source.url.startsWith("/")) {
      window.location.href = source.url;
    } else {
      window.open(source.url, "_blank", "noopener,noreferrer");
    }
  };

  if (mine) {
    return (
      <div className="flex justify-end gap-2.5">
        <div className="flex max-w-[86%] flex-col items-end gap-1 md:max-w-[76%]">
          <div className="rounded-2xl rounded-tr-md bg-[var(--ai-primary)] px-4 py-2.5 text-[15px] leading-relaxed text-[var(--ai-on-primary)] shadow-[0_6px_18px_-10px_rgba(18,100,232,0.7)]">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <span className="pr-1 text-[11px] text-[var(--ai-muted)]">{time}</span>
        </div>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ai-lake)] text-[var(--ai-primary)]">
          <User size={15} aria-hidden="true" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ai-navy)] text-white">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[12.5px] font-semibold text-[var(--ai-text)]">SIHU AI</span>
          <span className="text-[11px] text-[var(--ai-muted)]">{time}</span>
        </div>
        <div
          className={`rounded-2xl rounded-tl-md border px-4 py-3 ${
            message.error
              ? "border-[var(--ai-warning-border)] bg-[var(--ai-warning-bg)] text-[var(--ai-warning-text)]"
              : "border-[var(--ai-border)] bg-[var(--ai-surface)]"
          }`}
        >
          <div className="break-words">
            <Markdown text={shown} sources={combinedSources} onCitation={handleCitation} />
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-[var(--ai-primary)]" aria-hidden="true" />
            )}
          </div>
        </div>

        {!streaming && !message.error && message.searchError && !message.webSources?.length && (
          <p className="mt-1.5 px-1 text-[11.5px] leading-relaxed text-[var(--ai-warning-strong)]">
            {language === "sw"
              ? "Utafutaji wa wavuti haukupatikana, kwa hivyo jibu hili linaweza lisije na habari za hivi karibuni."
              : "Live web search was unavailable, so this answer may not include the latest news."}
          </p>
        )}

        {!streaming && !message.error && (
          <AIResponseActions
            messageId={message.id}
            text={message.speechText || message.content}
            language={language}
            player={player}
            sihuSources={message.sihuSources}
            webSources={message.webSources}
            related={related}
            onFollowUp={onFollowUp}
          />
        )}

        {!streaming && !message.error && !!message.suggestions?.length && onSuggestion && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion)}
                className="rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] px-3 py-1.5 text-left text-[12px] font-medium text-[var(--ai-text)] transition-colors hover:border-[var(--ai-primary)]/40 hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {message.error && (
          <button
            type="button"
            onClick={onFollowUp}
            className="mt-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-[var(--ai-warning-strong)] hover:bg-[var(--ai-warning-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-warning-strong)]"
          >
            {t.retry}
          </button>
        )}
      </div>
    </div>
  );
}
