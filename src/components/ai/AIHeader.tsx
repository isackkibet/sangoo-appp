"use client";

import { Menu, Moon, PanelRight, Plus, Sun, Trash2, Waves } from "lucide-react";
import type { Language, ThemeMode } from "./types";
import { dictionary } from "./i18n";
import LanguageToggle from "./LanguageToggle";

type Props = {
  language: Language;
  theme: ThemeMode;
  online: boolean;
  hasMessages: boolean;
  onLanguageChange: (language: Language) => void;
  onThemeToggle: () => void;
  onOpenSidebar: () => void;
  onOpenSources: () => void;
  onNewChat: () => void;
  onClear: () => void;
};

export default function AIHeader({
  language,
  theme,
  online,
  hasMessages,
  onLanguageChange,
  onThemeToggle,
  onOpenSidebar,
  onOpenSources,
  onNewChat,
  onClear,
}: Props) {
  const t = dictionary[language];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ai-border)] bg-[var(--ai-surface)] px-3 md:px-4">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label={t.menu}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] lg:hidden"
      >
        <Menu size={19} />
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ai-navy)] text-white">
          <Waves size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold leading-tight tracking-[-0.01em] text-[var(--ai-text)]">
            SIHU AI
          </p>
          <p className="hidden truncate text-[11px] leading-tight text-[var(--ai-muted)] sm:block">
            {t.brandSubtitle}
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <span
          className="mr-1 hidden items-center gap-1.5 rounded-full border border-[var(--ai-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--ai-muted)] md:inline-flex"
          title={online ? t.online : t.offline}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${online ? "bg-[var(--ai-success)]" : "bg-amber-500"}`}
            aria-hidden="true"
          />
          <span className="max-w-[140px] truncate">{online ? t.online : t.offline}</span>
        </span>

        <LanguageToggle language={language} onChange={onLanguageChange} compact className="hidden sm:inline-flex" />

        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? t.light : t.dark}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          onClick={onOpenSources}
          aria-label={t.panelSources}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] xl:hidden"
        >
          <PanelRight size={17} />
        </button>

        {hasMessages && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t.clear}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            <Trash2 size={17} />
          </button>
        )}

        <button
          type="button"
          onClick={onNewChat}
          aria-label={t.newChat}
          className="ml-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ai-primary)] text-[var(--ai-on-primary)] transition-colors hover:bg-[var(--ai-navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] lg:hidden"
        >
          <Plus size={18} />
        </button>
      </div>
    </header>
  );
}
