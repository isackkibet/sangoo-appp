const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export type YouTubeThumbnailQuality = "maxres" | "sd" | "hq" | "mq" | "default";

const THUMBNAIL_FILES: Record<YouTubeThumbnailQuality, string> = {
  maxres: "maxresdefault",
  sd: "sddefault",
  hq: "hqdefault",
  mq: "mqdefault",
  default: "default",
};

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
    let candidate: string | null = null;

    if (host === "youtu.be") {
      candidate = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") {
        candidate = parsed.searchParams.get("v");
      } else {
        const segments = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) {
          candidate = segments[1] ?? null;
        }
      }
    }

    return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(id: string, quality: YouTubeThumbnailQuality = "hq"): string {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/${THUMBNAIL_FILES[quality]}.jpg`;
}

export function getYouTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}
