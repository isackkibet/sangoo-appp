/**
 * Server-side text-to-speech for SIHU.
 *
 * All API keys stay on the server. The browser never sees them.
 *
 * Behaviour:
 *  - If TTS_API_URL and TTS_API_KEY are configured, call a real TTS provider
 *    and cache the resulting audio in memory by (text, language) so the same
 *    text is never synthesized twice.
 *  - Otherwise return null and let the client fall back to the browser's
 *    built-in speechSynthesis (no API key, no network).
 *
 * Audio is cached in memory only (not persisted to disk), keyed by a hash of
 * the text + language. A route handler serves cached audio by key.
 */

import crypto from "crypto";

interface CachedAudio {
  buffer: Buffer;
  contentType: string;
}

const CACHE = new Map<string, CachedAudio>();

function cacheKey(text: string, language: string): string {
  return crypto.createHash("sha256").update(`${language}\0${text}`).digest("hex");
}

export interface TtsResult {
  url: string;
  contentType: string;
  size: number;
}

export function getCachedAudio(key: string): CachedAudio | undefined {
  return CACHE.get(key);
}

export async function synthesizeText(params: {
  text: string;
  language: "en" | "sw";
}): Promise<TtsResult | null> {
  const { text, language } = params;
  if (!text || !text.trim()) return null;

  const key = cacheKey(text, language);
  const cached = CACHE.get(key);
  if (cached) {
    return { url: `/api/tts/cache/${key}`, contentType: cached.contentType, size: cached.buffer.length };
  }

  const apiUrl = process.env.TTS_API_URL;
  const apiKey = process.env.TTS_API_KEY;

  if (apiUrl && apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60_000);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text,
          language: language === "sw" ? "sw-KE" : "en-US",
          format: "mp3",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`TTS provider failed: ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("content-type") ?? "audio/mpeg";
      const buffer = Buffer.from(arrayBuffer);

      CACHE.set(key, { buffer, contentType });

      return { url: `/api/tts/cache/${key}`, contentType, size: buffer.length };
    } catch (error) {
      console.error("TTS request failed:", error);
      return null;
    }
  }

  // No server TTS provider configured: client uses browser speechSynthesis.
  return null;
}
