export type Language = "en" | "sw";

export type ThemeMode = "light" | "dark";

export type SourceKind = "sihu" | "web" | "research" | "community" | "ai";

export type ContentKind = "article" | "podcast" | "video" | "report" | "knowledge";

export interface SourceItem {
  id: string;
  title: string;
  kind: SourceKind;
  contentType: ContentKind;
  url?: string;
  location?: string;
  publishedAt?: string;
  snippet?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  kind: "article" | "podcast" | "video";
  category?: string;
  location?: string;
  date?: string;
  image?: string | null;
  href: string;
  action: "Read" | "Listen" | "Watch";
  meta?: string;
  external?: boolean;
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  speechText?: string;
  sourceIds?: string[];
  error?: boolean;
  animate?: boolean;
}

export interface Conversation {
  id: string;
  sessionId: string;
  title: string;
  updatedAt: number;
  messages: ChatMessageData[];
}

export interface ProviderStatus {
  configured: Record<string, boolean>;
  models: Record<string, string>;
  activeProvider: string;
}
