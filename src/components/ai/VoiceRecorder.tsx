"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Mic, Square, X } from "lucide-react";
import type { Language } from "./types";
import { dictionary } from "./i18n";

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionResultList = { length: number; [index: number]: RecognitionResult };
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

type Props = {
  language: Language;
  onCancel: () => void;
  onSubmit: (text: string) => void;
};

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceRecorder({ language, onCancel, onSubmit }: Props) {
  const t = dictionary[language];
  const [Ctor] = useState<RecognitionCtor | null>(() => getRecognitionCtor());
  const [status, setStatus] = useState<"listening" | "review" | "error">(Ctor ? "listening" : "error");
  const [interim, setInterim] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState(Ctor ? "" : dictionary[language].voiceUnsupported);
  const recognitionRef = useRef<Recognition | null>(null);

  useEffect(() => {
    if (!Ctor) return;

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = language === "sw" ? "sw-KE" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let live = "";
      let final = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) final += result[0].transcript;
        else live += result[0].transcript;
      }
      if (final) setText((current) => `${current} ${final}`.trim());
      setInterim(live);
      if (final) {
        setStatus("review");
        setInterim("");
      }
    };

    recognition.onerror = () => {
      setStatus("error");
      setError(t.voiceUnsupported);
    };

    recognition.onend = () => {
      setStatus((current) => (current === "listening" ? "review" : current));
      setInterim("");
    };

    try {
      recognition.start();
    } catch {
      queueMicrotask(() => {
        setStatus("error");
        setError(t.voiceUnsupported);
      });
    }

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
      recognitionRef.current = null;
    };
  }, [Ctor, language, t.voiceUnsupported]);

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setStatus("review");
    setInterim("");
  };

  const cancel = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
    }
    onCancel();
  };

  const submit = () => {
    const value = (text || interim).trim();
    if (!value) return;
    onCancel();
    onSubmit(value);
  };

  return (
    <div className="mb-2 rounded-xl border border-[var(--ai-border)] bg-[var(--ai-surface)] p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ai-lake)] text-[var(--ai-primary)]">
          <Mic size={15} aria-hidden="true" />
          {status === "listening" && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--ai-primary)]/20" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-[var(--ai-text)]">
            {status === "listening" ? t.listening : t.transcript}
          </p>
          <p className="text-[11px] text-[var(--ai-muted)]">
            {status === "review" ? t.editTranscript : language === "sw" ? "Kiswahili" : "English"}
          </p>
        </div>
        {status === "listening" && (
          <span className="flex items-end gap-0.5" aria-hidden="true">
            {[0, 1, 2, 3].map((bar) => (
              <span
                key={bar}
                className="w-1 animate-pulse rounded-full bg-[var(--ai-primary)]"
                style={{ height: `${8 + bar * 3}px`, animationDelay: `${bar * 0.12}s` }}
              />
            ))}
          </span>
        )}
        <button
          type="button"
          onClick={cancel}
          aria-label={t.cancel}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <X size={16} />
        </button>
      </div>

      {status === "listening" && (
        <div className="mt-2">
          <p className="min-h-6 rounded-lg bg-[var(--ai-surface-2)] px-3 py-1.5 text-[13px] text-[var(--ai-muted)]">
            {interim || t.listening}
          </p>
          <button
            type="button"
            onClick={stopListening}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--ai-primary)] px-3 py-1.5 text-[12px] font-semibold text-[var(--ai-on-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
          >
            <Square size={12} aria-hidden="true" /> {t.stop}
          </button>
        </div>
      )}

      {status === "review" && (
        <div className="mt-2">
          <textarea
            value={text || interim}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--ai-border)] bg-[var(--ai-surface)] px-3 py-2 text-[14px] leading-relaxed text-[var(--ai-text)] focus:border-[var(--ai-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
            placeholder={t.editTranscript}
            aria-label={t.editTranscript}
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!(text || interim).trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ai-primary)] px-3.5 py-1.5 text-[12px] font-semibold text-[var(--ai-on-primary)] transition-colors hover:bg-[var(--ai-navy)] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
            >
              <Check size={13} aria-hidden="true" /> {t.send}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-[var(--ai-muted)] hover:bg-[var(--ai-surface-2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="mt-2 rounded-lg bg-[var(--ai-warning-bg)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--ai-warning-text)]">
          {error}
        </p>
      )}
    </div>
  );
}
