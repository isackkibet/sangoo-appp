"use client";

import type { Language, SourceItem } from "./types";
import SourceCard from "./SourceCard";

type Props = {
  sources: SourceItem[];
  language: Language;
  idPrefix?: string;
  compact?: boolean;
  className?: string;
};

export default function SourceList({ sources, language, idPrefix, compact = false, className = "" }: Props) {
  if (sources.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {sources.map((source, index) => (
        <SourceCard
          key={source.id}
          source={source}
          index={index}
          language={language}
          idPrefix={idPrefix}
          compact={compact}
        />
      ))}
    </div>
  );
}
