import type { Article, Podcast } from "@/constants/articles";
import type { MediaItem } from "@/services/kaiHubService";
import type { ContentItem, SourceItem } from "./types";

const HOME_TITLES: Record<string, string> = {
  "home:about": "About Sango Information Hub",
  "home:mission": "SIHU mission and approach",
  "home:coverage": "What SIHU covers",
};

/**
 * Turn the source ids returned by the real agent into display objects.
 * We only attach a URL when we can resolve a real SIHU article.
 * Unknown ids stay generic; no title or link is invented.
 */
export function resolveSources(sourceIds: string[] | undefined, articles: Article[]): SourceItem[] {
  if (!sourceIds?.length) return [];
  const seen = new Set<string>();
  const out: SourceItem[] = [];

  for (const raw of sourceIds) {
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    if (raw.startsWith("article:")) {
      const articleId = raw.slice("article:".length);
      const article = articles.find((item) => item.id === articleId);
      out.push({
        id: raw,
        title: article?.title || "SIHU article",
        kind: "sihu",
        contentType: "article",
        url: article ? `/portal/article/${article.id}` : undefined,
        snippet: article?.excerpt,
        location: undefined,
        publishedAt: undefined,
      });
      continue;
    }

    if (raw.startsWith("home:")) {
      out.push({
        id: raw,
        title: HOME_TITLES[raw] || "Sango Information Hub",
        kind: "sihu",
        contentType: "knowledge",
        url: "/portal",
      });
      continue;
    }

    out.push({
      id: raw,
      title: "SIHU knowledge base",
      kind: "sihu",
      contentType: "knowledge",
    });
  }

  return out;
}

export function articlesToContent(articles: Article[]): ContentItem[] {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    kind: "article",
    category: article.category,
    image: article.image,
    href: `/portal/article/${article.id}`,
    action: "Read",
    meta: article.time,
  }));
}

export function podcastsToContent(podcasts: Array<Podcast & { url?: string }>): ContentItem[] {
  return podcasts.map((podcast) => ({
    id: podcast.id,
    title: podcast.title,
    kind: "podcast",
    image: podcast.image,
    href: podcast.url || "/portal#podcasts",
    action: "Listen",
    meta: podcast.duration,
    external: !!podcast.url,
  }));
}

export function mediaToContent(media: MediaItem[]): ContentItem[] {
  return media
    .filter((item) => item.kind === "video")
    .map((item) => ({
      id: item.id,
      title: item.title,
      kind: "video",
      image: item.image,
      href: item.youtubeId
        ? `https://www.youtube.com/watch?v=${item.youtubeId}`
        : item.url || "/portal#media",
      action: "Watch",
      meta: item.date,
      external: !!(item.youtubeId || item.url),
    }));
}

export function buildRelatedContent(params: {
  articles: Article[];
  podcasts: Array<Podcast & { url?: string }>;
  media: MediaItem[];
  excludeArticleIds?: Set<string>;
  limit?: number;
}): ContentItem[] {
  const { articles, podcasts, media, excludeArticleIds, limit = 6 } = params;
  const articleItems = articlesToContent(articles.filter((article) => !excludeArticleIds?.has(article.id)));
  const podcastItems = podcastsToContent(podcasts);
  const videoItems = mediaToContent(media);

  const ordered = [
    ...articleItems.slice(0, 4),
    ...podcastItems.slice(0, 2),
    ...videoItems.slice(0, 2),
    ...articleItems.slice(4),
    ...podcastItems.slice(2),
    ...videoItems.slice(2),
  ];

  const seen = new Set<string>();
  return ordered
    .filter((item) => {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function sourceArticleIds(sources: SourceItem[]): Set<string> {
  return new Set(
    sources
      .filter((source) => source.contentType === "article" && source.id.startsWith("article:"))
      .map((source) => source.id.slice("article:".length))
  );
}
