import { sangoNewsVideos, type SangoNewsVideo } from "@/constants/sangoNewsVideos";
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from "@/lib/youtube";

export type ResolvedSangoNewsVideo = SangoNewsVideo & {
  youtubeId: string;
  thumbnail: string;
  watchUrl: string;
};

export function resolveSangoNewsVideos(videos: SangoNewsVideo[]): ResolvedSangoNewsVideo[] {
  return videos.flatMap((video) => {
    const youtubeId = extractYouTubeId(video.url);
    if (!youtubeId) return [];

    return [
      {
        ...video,
        youtubeId,
        thumbnail: getYouTubeThumbnail(youtubeId, "maxres"),
        watchUrl: getYouTubeWatchUrl(youtubeId),
      },
    ];
  });
}

export function getSangoNewsVideos(): ResolvedSangoNewsVideo[] {
  return resolveSangoNewsVideos(sangoNewsVideos);
}

export async function fetchSangoNewsVideos(): Promise<ResolvedSangoNewsVideo[]> {
  try {
    const res = await fetch("/api/sango-news", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load videos.");
    const data = (await res.json()) as { videos?: SangoNewsVideo[] };
    if (Array.isArray(data.videos)) return resolveSangoNewsVideos(data.videos);
  } catch {
    // Fall back to the bundled links when the database is unavailable.
  }
  return getSangoNewsVideos();
}
