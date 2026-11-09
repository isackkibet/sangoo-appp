"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Article, Podcast } from "@/constants/articles";
import { articleService } from "@/services/articleService";
import { podcastService } from "@/services/podcastService";
import { kaiMedia, kaiPodcasts, type MediaItem } from "@/services/kaiHubService";
import type { ChatMessageData, Conversation, Language, ProviderStatus, ThemeMode } from "@/components/ai/types";
import { dictionary } from "@/components/ai/i18n";
import { buildRelatedContent, resolveSources, sourceArticleIds } from "@/components/ai/resolve";
import { useSpeechPlayer } from "@/components/ai/useSpeechPlayer";
import AIHeader from "@/components/ai/AIHeader";
import AISidebar from "@/components/ai/AISidebar";
import AIChat from "@/components/ai/AIChat";
import ChatInput from "@/components/ai/ChatInput";
import RelatedContent from "@/components/ai/RelatedContent";

const CONVERSATIONS_KEY = "sihu_ai_conversations_v1";
const LANGUAGE_KEY = "sihu_ai_language";
const THEME_KEY = "sihu_ai_theme";
const MAX_CONVERSATIONS = 30;

type ChatResponse = {
  reply?: string;
  provider?: string;
  model?: string;
  mode?: string;
  error?: string;
  speechText?: string;
  isStory?: boolean;
  sources?: string[];
};

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readConversations(): Conversation[] {
  try {
    const raw = window.localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Conversation[])
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.sessionId === "string" &&
          typeof item.title === "string" &&
          Array.isArray(item.messages)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

function dedupePodcasts(items: Array<Podcast & { url?: string }>): Array<Podcast & { url?: string }> {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function AIAssistantPage() {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [confirm, setConfirm] = useState<"active" | "all" | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [podcasts, setPodcasts] = useState<Array<Podcast & { url?: string }>>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const player = useSpeechPlayer(language);
  const t = dictionary[language];

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? null,
    [conversations, activeId]
  );
  const messages = useMemo(() => activeConversation?.messages ?? [], [activeConversation]);

  useEffect(() => {
    setMounted(true);
    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === "en" || savedLanguage === "sw") setLanguage(savedLanguage);
      const savedTheme = window.localStorage.getItem(THEME_KEY);
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      /* storage can be unavailable */
    }
    setConversations(readConversations());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = conversations.slice(0, MAX_CONVERSATIONS).map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.animate ? { ...message, animate: false } : message
        ),
      }));
      window.localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(stored));
    } catch {
      /* storage can be full or unavailable */
    }
  }, [conversations, mounted]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = "en";
    };
  }, [language, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
    document.documentElement.style.colorScheme = theme;
    return () => {
      document.documentElement.style.colorScheme = "";
    };
  }, [theme, mounted]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [articleList, podcastList, hubPodcasts, hubMedia] = await Promise.all([
        articleService.getArticles().catch(() => [] as Article[]),
        podcastService.getPodcasts().catch(() => [] as Podcast[]),
        kaiPodcasts().catch(() => [] as Array<Podcast & { url?: string }>),
        kaiMedia().catch(() => [] as MediaItem[]),
      ]);
      if (!alive) return;
      setArticles(articleList);
      setPodcasts(dedupePodcasts([...hubPodcasts, ...podcastList]));
      setMedia(hubMedia);
      setContentLoading(false);
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const loadProviderStatus = async () => {
      try {
        const response = await fetch("/api/keys");
        if (!response.ok) return;
        setProviderStatus((await response.json()) as ProviderStatus);
      } catch {
        /* status is optional */
      }
    };
    void loadProviderStatus();
  }, []);

  useEffect(() => {
    if (!leftOpen && !rightOpen && !confirm) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (confirm) {
        setConfirm(null);
      } else {
        setLeftOpen(false);
        setRightOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirm, leftOpen, rightOpen]);

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant" && !message.error) ?? null,
    [messages]
  );

  const latestSources = useMemo(
    () => resolveSources(latestAssistant?.sourceIds, articles),
    [latestAssistant, articles]
  );

  const related = useMemo(
    () =>
      buildRelatedContent({
        articles,
        podcasts,
        media,
        excludeArticleIds: sourceArticleIds(latestSources),
        limit: 6,
      }),
    [articles, podcasts, media, latestSources]
  );

  const online = providerStatus
    ? !!providerStatus.configured[providerStatus.activeProvider]
    : true;

  const closeDrawers = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  const newChat = useCallback(() => {
    player.stop();
    setActiveId(null);
    setInput("");
    closeDrawers();
  }, [closeDrawers, player]);

  const selectConversation = useCallback(
    (id: string) => {
      player.stop();
      setActiveId(id);
      setInput("");
      closeDrawers();
    },
    [closeDrawers, player]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((current) => current.filter((conversation) => conversation.id !== id));
      setActiveId((current) => (current === id ? null : current));
    },
    []
  );

  const confirmClear = useCallback(() => {
    player.stop();
    if (confirm === "all") {
      setConversations([]);
      setActiveId(null);
    } else if (confirm === "active" && activeId) {
      setConversations((current) => current.filter((conversation) => conversation.id !== activeId));
      setActiveId(null);
    }
    setConfirm(null);
  }, [activeId, confirm, player]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || thinking) return;

      setInput("");
      setThinking(true);
      setLeftOpen(false);
      setRightOpen(false);

      const now = Date.now();
      const userMessage: ChatMessageData = {
        id: `u-${makeId()}`,
        role: "user",
        content: text,
        createdAt: now,
      };

      let conversationId = activeId;
      let sessionId = activeConversation?.sessionId;
      const history = (activeConversation?.messages ?? [])
        .slice(-8)
        .map((message) => ({ role: message.role, content: message.content }));

      if (!conversationId || !sessionId) {
        conversationId = makeId();
        sessionId = `sihu-${makeId()}`;
        const conversation: Conversation = {
          id: conversationId,
          sessionId,
          title: text.length > 64 ? `${text.slice(0, 64)}…` : text,
          updatedAt: now,
          messages: [userMessage],
        };
        setConversations((current) => [conversation, ...current].slice(0, MAX_CONVERSATIONS));
        setActiveId(conversationId);
      } else {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  messages: [...conversation.messages, userMessage],
                  updatedAt: now,
                }
              : conversation
          )
        );
      }

      const targetId = conversationId;

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId,
            language,
            history,
          }),
        });
        const data = (await response.json()) as ChatResponse;

        if (!response.ok) {
          throw new Error(data.error || "Chat request failed");
        }

        const reply = typeof data.reply === "string" && data.reply.trim() ? data.reply : t.errorReply;
        const assistantMessage: ChatMessageData = {
          id: `a-${makeId()}`,
          role: "assistant",
          content: reply,
          createdAt: Date.now(),
          speechText: typeof data.speechText === "string" ? data.speechText : undefined,
          sourceIds: Array.isArray(data.sources)
            ? data.sources.filter((source): source is string => typeof source === "string")
            : [],
          animate: true,
        };

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === targetId
              ? {
                  ...conversation,
                  messages: [...conversation.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : conversation
          )
        );
      } catch {
        const errorMessage: ChatMessageData = {
          id: `a-${makeId()}`,
          role: "assistant",
          content: t.errorReply,
          createdAt: Date.now(),
          error: true,
        };
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === targetId
              ? {
                  ...conversation,
                  messages: [...conversation.messages, errorMessage],
                  updatedAt: Date.now(),
                }
              : conversation
          )
        );
      } finally {
        setThinking(false);
      }
    },
    [activeConversation, activeId, language, t.errorReply, thinking]
  );

  const handleFollowUp = useCallback(() => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  const sidebar = (
    <AISidebar
      language={language}
      theme={theme}
      conversations={conversations}
      activeId={activeId}
      onSelectConversation={selectConversation}
      onDeleteConversation={deleteConversation}
      onNewChat={newChat}
      onClearAll={() => setConfirm("all")}
      onLanguageChange={setLanguage}
      onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
    />
  );

  return (
    <div className={`ai-shell ${theme === "dark" ? "ai-dark" : ""} fixed inset-0 z-40 flex flex-col overflow-hidden`}>
      <style>{`.site-footer{display:none}`}</style>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[280px] shrink-0 border-r border-[var(--ai-border)] lg:block">
          {sidebar}
        </div>

        <main className="flex min-w-0 flex-1 flex-col bg-[var(--ai-bg)]">
          <AIHeader
            language={language}
            theme={theme}
            online={online}
            hasMessages={messages.length > 0}
            onLanguageChange={setLanguage}
            onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            onOpenSidebar={() => setLeftOpen(true)}
            onOpenSources={() => setRightOpen(true)}
            onNewChat={newChat}
            onClear={() => setConfirm("active")}
          />

          <AIChat
            messages={messages}
            language={language}
            thinking={thinking}
            articles={articles}
            related={related}
            player={player}
            onSuggestion={sendMessage}
            onFollowUp={handleFollowUp}
          />

          <div className="shrink-0 border-t border-[var(--ai-border)] bg-[var(--ai-bg)]">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              language={language}
              disabled={thinking}
              inputRef={textareaRef}
            />
          </div>
        </main>

        <div className="hidden w-[320px] shrink-0 border-l border-[var(--ai-border)] xl:block">
          <RelatedContent
            sources={latestSources}
            items={related}
            language={language}
            loading={contentLoading}
          />
        </div>
      </div>

      {leftOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setLeftOpen(false)}
            className="absolute inset-0 bg-[var(--ai-navy)]/45"
          />
          <div className="absolute inset-y-0 left-0 w-[86%] max-w-[320px] shadow-2xl">
            <AISidebar
              language={language}
              theme={theme}
              conversations={conversations}
              activeId={activeId}
              onSelectConversation={selectConversation}
              onDeleteConversation={deleteConversation}
              onNewChat={newChat}
              onClearAll={() => setConfirm("all")}
              onLanguageChange={setLanguage}
              onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              onClose={() => setLeftOpen(false)}
            />
          </div>
        </div>
      )}

      {rightOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden" role="presentation">
          <button
            type="button"
            aria-label={t.close}
            onClick={() => setRightOpen(false)}
            className="absolute inset-0 bg-[var(--ai-navy)]/45"
          />
          <div className="absolute inset-y-0 right-0 w-[92%] max-w-[380px] shadow-2xl">
            <RelatedContent
              sources={latestSources}
              items={related}
              language={language}
              loading={contentLoading}
              onClose={() => setRightOpen(false)}
            />
          </div>
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--ai-navy)]/50 p-4"
          role="presentation"
          onClick={() => setConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-confirm-title"
            className="w-full max-w-sm rounded-2xl bg-[var(--ai-surface)] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="ai-confirm-title" className="text-[16px] font-semibold text-[var(--ai-text)]">
                {confirm === "all" ? `${t.clearAll}?` : t.clearConfirmTitle}
              </h2>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                aria-label={t.close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--ai-muted)]">{t.clearConfirmBody}</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmClear}
                className="rounded-full bg-red-600 px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {confirm === "all" ? t.clearAll : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
