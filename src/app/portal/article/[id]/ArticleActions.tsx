"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Pause, Play, Volume2 } from "lucide-react";
import type { Language } from "@/components/ai/types";
import { dictionary } from "@/components/ai/i18n";
import AudioPlayer from "@/components/ai/AudioPlayer";
import { useSpeechPlayer } from "@/components/ai/useSpeechPlayer";

/**
 * Professional article audio controls.
 * Reads the article title + body aloud using the existing SIHU TTS API
 * (server-side) with browser speechSynthesis fallback.
 * Keeps playback controls clean and uncluttered.
 */
type Props = {
  title: string;
  text: string;
};

export default function ArticleAudio({ title, text }: Props) {
  const [language, setLanguage] = useState<Language>("en");
  const player = useSpeechPlayer(language);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const t = dictionary[language];

  useEffect(() => {
    if (typeof document !== "undefined") {
      const lang = document.documentElement.lang;
      if (lang === "sw" || lang === "en") {
        setTimeout(() => setLanguage(lang), 0);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  const requestAudio = useCallback(async () => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${title}. ${text}`, language }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setAudioUrl(data.url);
        }
        setAudioReady(true);
      } else {
        setAudioReady(true);
      }
    } catch {
      setAudioReady(true);
    }
  }, [title, text, language]);

  useEffect(() => {
    if (audioReady) return;
    const timer = setTimeout(() => {
      void requestAudio();
    }, 0);
    return () => clearTimeout(timer);
  }, [requestAudio, audioReady]);

  const speaking = player.activeId === `article-${title}` && player.status !== "idle";

  const listen = () => {
            player.toggle(`article-${title}`, `${title}. ${text}`, audioUrl === null ? undefined : audioUrl);
  };

  const copy = async () => {
    try {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(currentUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const langLabel = language === "sw" ? "Kiswahili" : "English";

  return (
    <section className="mt-12 border border-slate-200 rounded-2xl bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Volume2 size={17} className="text-slate-500" aria-hidden="true" />
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100">
            Listen to this article
          </h3>
        </div>
        <select
          value={language}
          onChange={(event) => setLanguage((event.target.value as Language) || "en")}
          aria-label="Read aloud language"
          className="rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-[11.5px] font-semibold text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:text-slate-400"
        >
          <option value="en">{langLabel}</option>
          <option value="sw">Kiswahili</option>
        </select>
      </div>

      {!audioReady && (
        <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30">
          <span className="text-sm text-slate-400">Preparing audio…</span>
        </div>
      )}

      {audioReady && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={listen}
            aria-label={speaking ? t.stop : t.listen}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              speaking
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {speaking ? <Pause size={17} strokeWidth={2.5} /> : <Play size={17} strokeWidth={2.5} />}
          </button>
          <AudioPlayer
            messageId={`article-${title}`}
            text={`${title}. ${text}`}
            language={language}
            player={player}
            audioUrl={audioUrl === null ? undefined : audioUrl}
            className="flex-1"
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          aria-label="Copy article link"
          className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200`}
        >
          {copyOk ? (
            <>
              <Check size={15} strokeWidth={2.5} className="text-emerald-600" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Link2 size={15} strokeWidth={2.5} aria-hidden="true" />
              Copy link
            </>
          )}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#128C4B] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 hover:bg-emerald-50 dark:border-slate-800 dark:text-[#128C4B] dark:hover:bg-emerald-50/30"
        >
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#128C4B]">WhatsApp</span>
        </a>
      </div>
    </section>
  );
}
