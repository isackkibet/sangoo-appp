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
  toggle: (id: string, text: string) => void;
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

  const reset = useCallback(() => {
    utteranceRef.current = null;
    activeIdRef.current = null;
    setActiveId(null);
    setStatus("idle");
    setProgress(0);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    reset();
  }, [reset]);

  const speak = useCallback(
    (id: string, text: string, nextRate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

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
    [language, reset]
  );

  const toggle = useCallback(
    (id: string, text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      if (activeIdRef.current === id) {
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

      speak(id, text, rateRef.current);
    },
    [speak, status]
  );

  const setRate = useCallback(
    (nextRate: number) => {
      rateRef.current = nextRate;
      setRateState(nextRate);
      if (activeIdRef.current && textRef.current) {
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
    };
  }, []);

  return { supported, activeId, status, progress, rate, toggle, stop, setRate };
}
