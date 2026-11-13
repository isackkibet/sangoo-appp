"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Circle, Loader2, Sparkles } from "lucide-react";
import SihuLogo from "@/components/brand/SihuLogo";
import type { ChatMessageData, ContentItem, Language } from "./types";
import { dictionary } from "./i18n";
import ChatMessage from "./ChatMessage";
import SuggestedPrompts from "./SuggestedPrompts";
import type { SpeechPlayer } from "./useSpeechPlayer";

type Props = {
  messages: ChatMessageData[];
  language: Language;
  thinking: boolean;
  related: ContentItem[];
  player: SpeechPlayer;
  onSuggestion: (prompt: string) => void;
  onFollowUp: () => void;
};

function ThinkingIndicator({ title, steps }: { title: string; steps: string[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, steps.length - 1));
    }, 1100);
    return () => window.clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="flex gap-2.5" aria-live="polite">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ai-navy)] text-white">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[12.5px] font-semibold text-[var(--ai-text)]">{title}</p>
        <div className="rounded-2xl rounded-tl-md border border-[var(--ai-border)] bg-[var(--ai-surface)] px-4 py-3">
          <ul className="space-y-2">
            {steps.map((label, index) => {
              const done = index < step;
              const current = index === step;
              return (
                <li
                  key={label}
                  className={`flex items-center gap-2 text-[13px] ${
                    current
                      ? "font-semibold text-[var(--ai-text)]"
                      : done
                        ? "text-[var(--ai-muted)]"
                        : "text-[var(--ai-muted)] opacity-70"
                  }`}
                >
                  {done ? (
                    <Check size={14} className="text-[var(--ai-success)]" aria-hidden="true" />
                  ) : current ? (
                    <Loader2 size={14} className="animate-spin text-[var(--ai-primary)]" aria-hidden="true" />
                  ) : (
                    <Circle size={12} className="text-[var(--ai-border)]" aria-hidden="true" />
                  )}
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AIChat({
  messages,
  language,
  thinking,
  related,
  player,
  onSuggestion,
  onFollowUp,
}: Props) {
  const t = dictionary[language];
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const isEmpty = messages.length === 0;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const onScroll = () => {
      stickToBottomRef.current =
        element.scrollHeight - element.scrollTop - element.clientHeight < 96;
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    const content = contentRef.current;
    if (!element || !content || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [isEmpty]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    stickToBottomRef.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  const steps = useMemo(() => [t.searchingSiHU, t.checkingWeb, t.comparingEvidence, t.preparingAnswer], [t]);
  const lastAssistantId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "assistant" && !message.error) return message.id;
    }
    return null;
  }, [messages]);

  if (isEmpty) {
    return (
      <div ref={scrollRef} className="ai-scroll relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10 md:px-6">
          <div className="ai-welcome-glow" aria-hidden="true" />
          <div className="relative flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--ai-border)] shadow-[0_14px_30px_-16px_rgba(16,43,85,0.8)]">
              <SihuLogo variant="mark" alt="Sango Information Hub" className="h-14" />
            </span>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--ai-lake)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ai-primary)]">
              <Sparkles size={12} aria-hidden="true" /> SIHU AI
            </span>
            <h1 className="mt-3 max-w-xl text-balance text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[var(--ai-text)] md:text-[32px]">
              {t.welcomeHeadline}
            </h1>
            <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--ai-muted)] md:text-[15px]">
              {t.welcomeLead}
            </p>
          </div>
          <div className="relative w-full max-w-xl">
            <SuggestedPrompts language={language} onSelect={onSuggestion} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="ai-scroll flex-1 overflow-y-auto overflow-x-hidden">
      <div ref={contentRef} className="mx-auto w-full max-w-3xl space-y-6 px-3 py-5 md:px-6 md:py-6">
        {messages.map((message) => {
          return (
            <ChatMessage
              key={message.id}
              message={message}
              language={language}
              player={player}
              sihuSources={message.sihuSources}
              webSources={message.webSources}
              related={message.id === lastAssistantId ? related : []}
              onFollowUp={onFollowUp}
              onSuggestion={onSuggestion}
            />
          );
        })}

        {thinking && <ThinkingIndicator title={t.thinking} steps={steps} />}
      </div>
    </div>
  );
}
