import { sangoNewsVideos, type SangoNewsVideo } from "@/constants/sangoNewsVideos";
import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from "@/lib/youtube";

export type ResolvedSangoNewsVideo = SangoNewsVideo & {
  youtubeId: string;
  thumbnail: string;
  watchUrl: string;
};

export function getSangoNewsVideos(): ResolvedSangoNewsVideo[] {
  return sangoNewsVideos.flatMap((video) => {
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
