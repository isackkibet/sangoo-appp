export const MEDIA_CATEGORIES = [
  "environment",
  "fisheries",
  "blue-economy",
  "community",
  "human-rights",
  "youth",
  "news",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  environment: "Environment & Conservation",
  fisheries: "Lake Victoria & Fisheries",
  "blue-economy": "Blue Economy",
  community: "Community Development",
  "human-rights": "Human Rights",
  youth: "Youth Empowerment",
  news: "Local News",
};

export const MEDIA_CATEGORY_SHORT: Record<MediaCategory, string> = {
  environment: "Environment",
  fisheries: "Fisheries",
  "blue-economy": "Blue Economy",
  community: "Community",
  "human-rights": "Human Rights",
  youth: "Youth",
  news: "Local News",
};

export function isMediaCategory(value: unknown): value is MediaCategory {
  return typeof value === "string" && (MEDIA_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(value: string | null | undefined): string {
  if (value && isMediaCategory(value)) return MEDIA_CATEGORY_LABELS[value];
  return value ? value.replace(/-/g, " ") : "Community";
}
