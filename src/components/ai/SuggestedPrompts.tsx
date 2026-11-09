"use client";

import { Fish, Languages, Leaf, Newspaper, Ship, Waves } from "lucide-react";
import type { LucideIcon } from "@/types/icon";
import type { Language } from "./types";
import { dictionary, suggestions, type PromptSuggestion } from "./i18n";

const ICONS: Record<PromptSuggestion["icon"], LucideIcon> = {
  waves: Waves,
  fish: Fish,
  leaf: Leaf,
  ship: Ship,
  newspaper: Newspaper,
  languages: Languages,
};

type Props = {
  language: Language;
  onSelect: (prompt: string) => void;
};

export default function SuggestedPrompts({ language, onSelect }: Props) {
  const t = dictionary[language];
  const prompts = suggestions[language];

  return (
    <section className="mt-8 w-full">
      <h2 className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ai-muted)]">
        {t.suggestionsTitle}
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {prompts.map((suggestion) => {
          const Icon = ICONS[suggestion.icon];
          return (
            <button
              key={suggestion.title}
              type="button"
              onClick={() => onSelect(suggestion.prompt)}
              className="group flex items-start gap-3 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-3.5 text-left transition-colors hover:border-[var(--ai-primary)]/45 hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ai-lake)] text-[var(--ai-primary)] transition-colors group-hover:bg-[var(--ai-primary)] group-hover:text-[var(--ai-on-primary)]">
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold leading-snug text-[var(--ai-text)]">
                  {suggestion.title}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-[12px] leading-relaxed text-[var(--ai-muted)]">
                  {suggestion.prompt}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
