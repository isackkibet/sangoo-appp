"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Language } from "./types";

const subscribeNoop = () => () => {};
const getSpeechSupport = () => typeof window !== "undefined" && "speechSynthesis" in window;
const getSpeechSupportOnServer = () => false;

export type SpeechStatus = "idle" | "playing" | "paused";

export interface SpeechPlayer {
  supported: boolean;
  activeId: string | null;
  status: SpeechStatus;
  progress: number;
  rate: number;
  toggle: (id: string, text: string, audioUrl?: string) => void;
  stop: () => void;
  setRate: (rate: number) => void;
}

export function useSpeechPlayer(language: Language): SpeechPlayer {
  const supported = useSyncExternalStore(subscribeNoop, getSpeechSupport, getSpeechSupportOnServer);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [rate, setRateState] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef("");
  const activeIdRef = useRef<string | null>(null);
  const rateRef = useRef(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioProgressRef = useRef(0);
  const audioProgressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    utteranceRef.current = null;
    activeIdRef.current = null;
    setActiveId(null);
    setStatus("idle");
    setProgress(0);
    audioProgressRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }
    if (audioProgressTimerRef.current) {
      clearInterval(audioProgressTimerRef.current);
      audioProgressTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    reset();
  }, [reset]);

  const clearAudioProgress = useCallback(() => {
    if (audioProgressTimerRef.current) {
      clearInterval(audioProgressTimerRef.current);
      audioProgressTimerRef.current = null;
    }
  }, []);

  const speak = useCallback(
    (id: string, text: string, nextRate: number, audioUrl?: string) => {
      if (typeof window === "undefined") return;

      // Prefer server audio when a URL is provided.
      if (audioUrl) {
        reset();
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.playbackRate = nextRate;
        audio.volume = 1;

        const updateProgress = () => {
          const dur = audio.duration || 0;
          const cur = audio.currentTime || 0;
          const p = dur > 0 ? Math.max(0, Math.min(1, cur / dur)) : 0;
          audioProgressRef.current = p;
          setProgress(p);
        };

        audio.onplay = () => {
          setActiveId(id);
          activeIdRef.current = id;
          setStatus("playing");
          setProgress(0);
          audioProgressTimerRef.current = setInterval(updateProgress, 200);
        };
        audio.onpause = () => {
          clearAudioProgress();
          setStatus("paused");
        };
        audio.onended = () => {
          clearAudioProgress();
          reset();
        };
        audio.onerror = () => {
          clearAudioProgress();
          reset();
        };

        const promise = audio.play();
        if (promise) {
          promise.catch(() => {
            clearAudioProgress();
            reset();
          });
        }
        return;
      }

      // Fallback: browser speechSynthesis.
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "sw" ? "sw-KE" : "en-US";
      utterance.rate = nextRate;
      utterance.pitch = 1;

      utterance.onboundary = (event) => {
        if (typeof event.charIndex === "number" && text.length > 0) {
          setProgress(Math.max(0, Math.min(1, event.charIndex / text.length)));
        }
      };
      utterance.onend = () => reset();
      utterance.onerror = () => reset();

      utteranceRef.current = utterance;
      textRef.current = text;
      activeIdRef.current = id;
      setActiveId(id);
      setStatus("playing");
      setProgress(0);
      window.speechSynthesis.speak(utterance);
    },
    [language, reset, clearAudioProgress]
  );

  const toggle = useCallback(
    (id: string, text: string, audioUrl?: string) => {
      if (typeof window === "undefined") return;

      // If same item is already active, pause/resume.
      if (activeIdRef.current === id) {
        if (audioRef.current) {
          if (status === "playing") {
            audioRef.current.pause();
            return;
          }
          if (status === "paused") {
            audioRef.current.play();
            setStatus("playing");
            return;
          }
        }
        if ("speechSynthesis" in window) {
          if (status === "playing") {
            window.speechSynthesis.pause();
            setStatus("paused");
            return;
          }
          if (status === "paused") {
            window.speechSynthesis.resume();
            setStatus("playing");
            return;
          }
        }
      }

      speak(id, text, rateRef.current, audioUrl);
    },
    [speak, status]
  );

  const setRate = useCallback(
    (nextRate: number) => {
      rateRef.current = nextRate;
      setRateState(nextRate);
      if (audioRef.current) {
        audioRef.current.playbackRate = nextRate;
        return;
      }
      if (activeIdRef.current && textRef.current && "speechSynthesis" in window) {
        speak(activeIdRef.current, textRef.current, nextRate);
      }
    },
    [speak]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }
      clearAudioProgress();
    };
  }, [clearAudioProgress]);

  return { supported, activeId, status, progress, rate, toggle, stop, setRate };
}
