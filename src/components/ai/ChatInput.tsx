"use client";

import { useEffect, useState, type RefObject } from "react";
import { Mic, MicOff, SendHorizontal } from "lucide-react";
import type { Language } from "./types";
import { dictionary } from "./i18n";
import VoiceRecorder from "./VoiceRecorder";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  language: Language;
  disabled?: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
};

export default function ChatInput({ value, onChange, onSubmit, language, disabled = false, inputRef }: Props) {
  const t = dictionary[language];
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    const element = inputRef.current;
    if (element && !value) element.style.height = "auto";
  }, [inputRef, value]);

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 pt-2 md:px-6 md:pb-4" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
      {voiceOpen && (
        <VoiceRecorder
          language={language}
          onCancel={() => setVoiceOpen(false)}
          onSubmit={(text) => {
            setVoiceOpen(false);
            onSubmit(text);
          }}
        />
      )}

      <div className="flex items-end gap-1.5 rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-1.5 shadow-[0_8px_30px_-18px_rgba(16,43,85,0.35)] transition-shadow focus-within:border-[var(--ai-primary)] focus-within:ring-4 focus-within:ring-[var(--ai-primary)]/12">
        <button
          type="button"
          onClick={() => setVoiceOpen((open) => !open)}
          aria-label={voiceOpen ? t.cancel : t.voiceInput}
          aria-pressed={voiceOpen}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)] ${
            voiceOpen
              ? "bg-[var(--ai-primary)] text-[var(--ai-on-primary)]"
              : "text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] hover:text-[var(--ai-text)]"
          }`}
        >
          {voiceOpen ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          onInput={(event) => {
            const element = event.currentTarget;
            element.style.height = "auto";
            element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
          }}
          rows={1}
          placeholder={t.inputPlaceholder}
          aria-label={t.inputPlaceholder}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-relaxed text-[var(--ai-text)] placeholder:text-[var(--ai-muted)] focus:outline-none"
          style={{ height: "auto" }}
        />

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label={t.send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ai-primary)] text-[var(--ai-on-primary)] transition-colors hover:bg-[var(--ai-navy)] disabled:cursor-not-allowed disabled:bg-[var(--ai-surface-2)] disabled:text-[var(--ai-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <SendHorizontal size={18} />
        </button>
      </div>

      <p className="mt-1.5 text-center text-[11px] text-[var(--ai-muted)]">{t.disclaimer}</p>
    </div>
  );
}
