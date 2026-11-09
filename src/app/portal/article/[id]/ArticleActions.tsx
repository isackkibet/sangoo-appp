"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Link2, Pause, Play, Volume2 } from "lucide-react";
import type { Language } from "@/components/ai/types";
import { dictionary } from "@/components/ai/i18n";
import AudioPlayer from "@/components/ai/AudioPlayer";
import { useSpeechPlayer } from "@/components/ai/useSpeechPlayer";

type Props = {
  title: string;
  text: string;
};

export default function ArticleActions({ title, text }: Props) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    if (typeof document !== "undefined") {
      const lang = document.documentElement.lang;
      if (lang === "sw" || lang === "en") {
        setTimeout(() => setLanguage(lang), 0);
      }
    }
  }, []);

  const t = dictionary[language];
  const player = useSpeechPlayer(language);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [copyOk, setCopyOk] = useState(false);

  const speaking = player.activeId === `article-${title}` && player.status !== "idle";

  useEffect(() => {
    // Cancel any speech when the component unmounts or language changes.
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
          setAudioReady(true);
        } else {
          setAudioReady(true); // browser speechSynthesis fallback
        }
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

  const listen = () => {
    player.toggle(`article-${title}`, `${title}. ${text}`, audioUrl ?? undefined);
  };

  const copy = async () => {
    try {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(currentUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1800);
    } catch {
      /* no clipboard */
    }
  };

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${currentUrl}`)}`;

  const langLabel = language === "sw" ? "Kiswahili" : "English";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!audioReady && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ai-surface-2)] text-[var(--ai-muted)]">
          <Play size={15} />
        </span>
      )}
      <button
        type="button"
        onClick={listen}
        disabled={!audioReady && !player.supported && !audioUrl}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-[14px] font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={speaking ? t.stop : t.listen}
      >
        {speaking ? (
          <>
            <Pause size={16} aria-hidden="true" /> Stop
          </>
        ) : (
          <>
            <Volume2 size={16} aria-hidden="true" /> Listen
          </>
        )}
      </button>

      <select
          value={language}
          onChange={(event) => setLanguage((event.target.value as Language) || "en")}
          aria-label="Read aloud language"
          className="rounded-md bg-transparent py-1.5 pl-2 pr-8 text-[12px] font-semibold text-[var(--ai-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ai-primary)]"
        >
          <option value="en">{langLabel}</option>
          <option value="sw">Kiswahili</option>
        </select>

      {audioUrl && player.activeId === `article-${title}` && player.status !== "idle" && (
        <AudioPlayer
          messageId={`article-${title}`}
          text={`${title}. ${text}`}
          language={language}
          player={player}
          audioUrl={audioUrl}
          className="ml-2"
        />
      )}

      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366]/10 text-[#128C4B] text-[14px] font-semibold hover:bg-[#25D366]/20 transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Share
      </a>
      <button onClick={copy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-[14px] font-semibold hover:bg-slate-200 transition-colors">
        {copyOk ? <><Check size={16} aria-hidden="true" /> Copied</> : <><Link2 size={16} aria-hidden="true" /> Copy link</>}
      </button>
    </div>
  );
}
