"use client";

import { Languages } from "lucide-react";
import type { Language } from "./types";

type Props = {
  language: Language;
  onChange: (language: Language) => void;
  compact?: boolean;
  className?: string;
};

export default function LanguageToggle({ language, onChange, compact = false, className = "" }: Props) {
  return (
    <div
      className={`inline-flex items-center rounded-full border border-[var(--ai-border)] bg-[var(--ai-surface)] p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {!compact && <Languages size={14} className="ml-2 mr-1 text-[var(--ai-muted)]" aria-hidden="true" />}
      {(["en", "sw"] as const).map((value) => {
        const active = language === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] ${
              active
                ? "bg-[var(--ai-primary)] text-[var(--ai-on-primary)]"
                : "text-[var(--ai-muted)] hover:text-[var(--ai-text)]"
            }`}
          >
            {value === "en" ? "EN" : "SW"}
          </button>
        );
      })}
    </div>
  );
}
