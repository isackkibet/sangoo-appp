"use client";

import { Pause, Play, Square, Volume2 } from "lucide-react";
import type { Language } from "./types";
import { dictionary } from "./i18n";
import type { SpeechPlayer } from "./useSpeechPlayer";

type Props = {
  messageId: string;
  text: string;
  language: Language;
  player: SpeechPlayer;
  audioUrl?: string;
  className?: string;
};

export default function AudioPlayer({ messageId, text, language, player, audioUrl, className = "" }: Props) {
  const t = dictionary[language];
  if (!player.supported || !text) return null;

  const active = player.activeId === messageId;

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => player.toggle(messageId, text, audioUrl)}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
        aria-label={t.listen}
      >
        <Volume2 size={14} aria-hidden="true" /> {t.listen}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 ${className}`}>
      <button
        type="button"
        onClick={() => player.toggle(messageId, text, audioUrl)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={player.status === "playing" ? t.pause : t.play}
      >
        {player.status === "playing" ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 sm:w-28 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(player.progress * 100)}
        aria-label={t.listen}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${Math.max(3, player.progress * 100)}%` }}
        />
      </div>
      <label className="sr-only" htmlFor={`rate-${messageId}`}>
        {t.listen}
      </label>
      <select
        id={`rate-${messageId}`}
        value={player.rate}
        onChange={(event) => player.setRate(Number(event.target.value))}
        className="rounded-md border border-slate-200 bg-transparent px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 focus:outline-none focus:border-primary dark:border-slate-700 dark:text-slate-400"
      >
        {[0.75, 1, 1.25, 1.5].map((rate) => (
          <option key={rate} value={rate}>
            {rate}x
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={player.stop}
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label={t.stop}
      >
        <Square size={12} />
      </button>
    </div>
  );
}
