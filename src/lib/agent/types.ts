export type AgentIntent =
  | "knowledge_query"
  | "semantic_search"
  | "general_chat"
  | "greeting"
  | "farewell"
  | "story_request"
  | "follow_up"
  | "clarification"
  | "opinion"
  | "unknown";

export type AgentKnowledgeItem = {
  source: string;
  content: string;
  type: string;
  title?: string;
  score?: number;
  url?: string;
  publisher?: string;
  publishedAt?: string;
};

export type AgentChatResult = {
  reply: string;
  intent: AgentIntent;
  sources: string[];
  knowledge: AgentKnowledgeItem[];
};
