"use client";

import { useState } from "react";
import { Check, Copy, ListTree, MessageSquarePlus } from "lucide-react";
import type { ContentItem, Language, SourceItem } from "./types";
import { dictionary } from "./i18n";
import AudioPlayer from "./AudioPlayer";
import SourceList from "./SourceList";
import RelatedContent from "./RelatedContent";
import type { SpeechPlayer } from "./useSpeechPlayer";

type Props = {
  messageId: string;
  text: string;
  language: Language;
  player: SpeechPlayer;
  sources: SourceItem[];
  related: ContentItem[];
  onFollowUp: () => void;
};

export default function AIResponseActions({
  messageId,
  text,
  language,
  player,
  sources,
  related,
  onFollowUp,
}: Props) {
  const t = dictionary[language];
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1">
        <AudioPlayer messageId={messageId} text={text} language={language} player={player} />

        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-[var(--ai-muted)] transition-colors hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? t.copied : t.copy}
        </button>

        {sources.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSources((value) => !value)}
            aria-expanded={showSources}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-[var(--ai-muted)] transition-colors hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            <ListTree size={14} aria-hidden="true" />
            {showSources ? t.hideSources : `${t.viewSources} (${sources.length})`}
          </button>
        )}

        <button
          type="button"
          onClick={onFollowUp}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-[var(--ai-muted)] transition-colors hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <MessageSquarePlus size={14} aria-hidden="true" /> {t.followUp}
        </button>
      </div>

      {showSources && sources.length > 0 && (
        <div className="mt-2 rounded-xl bg-[var(--ai-surface-2)] p-2">
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ai-muted)]">
            {t.sources}
          </p>
          <SourceList sources={sources} language={language} idPrefix={`src-${messageId}`} compact />
        </div>
      )}

      <RelatedContent items={related} language={language} variant="inline" />
    </div>
  );
}
