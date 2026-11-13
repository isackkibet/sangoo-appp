"use client";

import Link from "next/link";
import {
  Compass,
  Headphones,
  MessageSquare,
  Moon,
  Newspaper,
  Plus,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  Video,
  X,
} from "lucide-react";
import SihuLogo from "@/components/brand/SihuLogo";
import type { Conversation, Language, ThemeMode } from "./types";
import { dictionary, timeAgo } from "./i18n";
import LanguageToggle from "./LanguageToggle";

type Props = {
  language: Language;
  theme: ThemeMode;
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  onClearAll: () => void;
  onLanguageChange: (language: Language) => void;
  onThemeToggle: () => void;
  onClose?: () => void;
};

const NAV = [
  { key: "aiAssistant", href: "/ai", icon: Sparkles, active: true },
  { key: "discover", href: "/portal", icon: Compass, active: false },
  { key: "articles", href: "/portal#latest-news", icon: Newspaper, active: false },
  { key: "podcasts", href: "/portal#podcasts", icon: Headphones, active: false },
  { key: "videos", href: "/portal#media", icon: Video, active: false },
  { key: "topics", href: "/portal#latest-news", icon: Tags, active: false },
] as const;

export default function AISidebar({
  language,
  theme,
  conversations,
  activeId,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onClearAll,
  onLanguageChange,
  onThemeToggle,
  onClose,
}: Props) {
  const t = dictionary[language];

  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-[var(--ai-surface)]">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--ai-border)] px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--ai-border)]">
          <SihuLogo variant="mark" alt="" className="h-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-[var(--ai-text)]">SIHU AI</p>
          <p className="truncate text-[11px] leading-tight text-[var(--ai-muted)]">{t.brandSubtitle}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ai-primary)] px-3 py-2.5 text-[13.5px] font-semibold text-[var(--ai-on-primary)] transition-colors hover:bg-[var(--ai-navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <Plus size={16} aria-hidden="true" /> {t.newChat}
        </button>
      </div>

      <nav className="space-y-0.5 px-2" aria-label="SIHU">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              aria-current={item.active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] ${
                item.active
                  ? "bg-[var(--ai-lake)] text-[var(--ai-primary)]"
                  : "text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)]"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {t[item.key]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center justify-between px-4 pb-1">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ai-muted)]">{t.recent}</h2>
        {conversations.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            {t.clearAll}
          </button>
        )}
      </div>

      <div className="ai-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 ? (
          <p className="px-2.5 py-3 text-[12px] leading-relaxed text-[var(--ai-muted)]">{t.noRecent}</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conversation) => {
              const active = conversation.id === activeId;
              return (
                <div
                  key={conversation.id}
                  className={`group flex items-center rounded-lg transition-colors ${
                    active ? "bg-[var(--ai-lake)]" : "hover:bg-[var(--ai-surface-2)]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
                  >
                    <MessageSquare
                      size={14}
                      className={active ? "shrink-0 text-[var(--ai-primary)]" : "shrink-0 text-[var(--ai-muted)]"}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[12.5px] ${
                          active ? "font-semibold text-[var(--ai-primary)]" : "text-[var(--ai-text)]"
                        }`}
                      >
                        {conversation.title}
                      </span>
                      <span className="block text-[10.5px] text-[var(--ai-muted)]">
                        {timeAgo(conversation.updatedAt, language)}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    aria-label={`${t.delete}: ${conversation.title}`}
                    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ai-muted)] opacity-60 transition-opacity hover:bg-[var(--ai-surface)] hover:text-red-600 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-[var(--ai-border)] p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[var(--ai-surface-2)] px-2.5 py-2">
          <span className="text-[11.5px] font-semibold text-[var(--ai-muted)]">{t.language}</span>
          <LanguageToggle language={language} onChange={onLanguageChange} compact />
        </div>
        <button
          type="button"
          onClick={onThemeToggle}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-[11.5px] font-semibold text-[var(--ai-muted)] transition-colors hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
            {theme === "dark" ? t.light : t.dark}
          </span>
          <span className="text-[10.5px] font-medium">{t.appearance}</span>
        </button>
      </div>
    </aside>
  );
}
