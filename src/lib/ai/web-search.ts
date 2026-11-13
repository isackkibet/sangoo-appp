/**
 * Controlled live web search for SIHU AI.
 *
 * Tavily is the primary provider when TAVILY_API_KEY is configured. A
 * key-free DuckDuckGo HTML fallback keeps the assistant usable in local
 * development, but production should always set TAVILY_API_KEY.
 *
 * All fetching happens server-side so API keys never reach the browser.
 * External pages are treated as untrusted data: we only use the title, URL,
 * publication date and a short snippet supplied by the search provider.
 * Retrieved content is never executed and cannot override agent instructions.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_SEARCH_QUERIES = 3;
const MAX_EXTERNAL_SOURCES = 6;
const MAX_SNIPPET_CHARS = 420;

// Trusted-source hints (government, academic, environmental, recognized news,
// official regional institutions). These raise a result's rank but never grant
// automatic trust; content still must be retrieved before it can be cited.
const TRUSTED_DOMAINS = [
  "gov.go",
  "go.ke",
  "kenya.go.ke",
  "nea.go.ke",
  "lvbc.go.ke",
  "lvfob.go.ke",
  "nilebasin.org",
  "unep.org",
  "unesco.org",
  "iucn.org",
  "wcs.org",
  "wwf.org",
  "birdlife.org",
  "fao.org",
  "worldbank.org",
  "un.org",
  "edu",
  "ac.ke",
  "ac.uk",
  "bbc.com",
  "reuters.com",
  "apnews.com",
  "theguardian.com",
  "aljazeera.com",
  "nation.africa",
  "standardmedia.co.ke",
  "the-star.co.ke",
  "citizen.digital",
];

const PUBLISHER_NAMES: Record<string, string> = {
  "bbc.com": "BBC",
  "bbc.co.uk": "BBC",
  "reuters.com": "Reuters",
  "apnews.com": "AP News",
  "theguardian.com": "The Guardian",
  "aljazeera.com": "Al Jazeera",
  "nation.africa": "Daily Nation",
  "standardmedia.co.ke": "The Standard",
  "the-star.co.ke": "The Star",
  "citizen.digital": "Citizen Digital",
  "kenyans.co.ke": "Kenyans.co.ke",
  "capitalfm.co.ke": "Capital FM",
  "theeastafrican.co.ke": "The East African",
  "monitor.co.ug": "Daily Monitor",
  "newvision.co.ug": "New Vision",
  "thecitizen.co.tz": "The Citizen",
  "ippmedia.com": "IPP Media",
  "lvbc.go.ke": "Lake Victoria Basin Commission",
  "nilebasin.org": "Nile Basin Initiative",
  "unep.org": "UN Environment Programme",
  "fao.org": "FAO",
  "worldbank.org": "World Bank",
  "un.org": "United Nations",
  "kenya.go.ke": "Government of Kenya",
  "environment.go.ke": "Kenya Ministry of Environment",
  "nea.go.ke": "NEMA Kenya",
  "kefri.org": "KEFRI",
  "kws.go.ke": "Kenya Wildlife Service",
  "icpac.net": "ICPAC",
  "au.int": "African Union",
  "eac.int": "East African Community",
};

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
  publisher?: string;
}

export type SearchProvider = "tavily" | "custom" | "google-news" | "bing" | "duckduckgo" | "none";

export interface WebSearchResponse {
  results: SearchResult[];
  queriesUsed: number;
  provider: SearchProvider;
  error?: string;
}

interface RawResult {
  url?: string;
  title?: string;
  snippet?: string;
  content?: string;
  publishedAt?: string;
  published_date?: string;
}

function isTrustedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith("." + domain));
  } catch {
    return false;
  }
}

function publisherFromUrl(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    for (const [domain, name] of Object.entries(PUBLISHER_NAMES)) {
      if (host === domain || host.endsWith("." + domain)) return name;
    }
    return host;
  } catch {
    return undefined;
  }
}

function publishedTime(result: SearchResult): number {
  const time = result.publishedAt ? Date.parse(result.publishedAt) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function recencyScore(publishedAt?: string): number {
  if (!publishedAt) return 0;
  const time = Date.parse(publishedAt);
  if (!Number.isFinite(time)) return 0;
  const ageDays = (Date.now() - time) / 86_400_000;
  if (ageDays <= 3) return 12;
  if (ageDays <= 7) return 9;
  if (ageDays <= 14) return 6;
  if (ageDays <= 30) return 3;
  return 0;
}

function scoreResult(result: SearchResult, topic: "news" | "general"): number {
  let score = 0;
  if (isTrustedDomain(result.url)) score += 10;
  if (/\b(kenya|uganda|tanzania|rwanda|burundi|lake victoria|victoria basin|east africa|nile basin)\b/i.test(`${result.title} ${result.snippet}`)) {
    score += 4;
  }
  if (/\b(regulation|policy|act|law|gazette|ministry|authority|report|study|research)\b/i.test(`${result.title} ${result.snippet}`)) {
    score += 2;
  }
  if (topic === "news") score += recencyScore(result.publishedAt);
  return score;
}

const BLOCKED_PUBLISHER_PATTERN =
  /\b(facebook|instagram|twitter|x\.com|tiktok|threads|linkedin|reddit|pinterest)\b/i;

function isBlockedPublisher(publisher?: string): boolean {
  return !!publisher && BLOCKED_PUBLISHER_PATTERN.test(publisher);
}

const QUERY_STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "about", "into", "over", "after", "before",
  "this", "that", "these", "those", "latest", "news", "update", "updates", "current",
  "new", "today", "breaking", "live", "in", "on", "at", "of", "to", "is", "are",
]);

const TOPIC_FILTERS: Array<{ query: RegExp; result: RegExp }> = [
  {
    query: /\b(environment|environmental|climate|conservation|ecosystem)\b/i,
    result: /\b(environment|environmental|climate|conservation|ecosystem|pollution|polluted|water quality|flood|drought|wetland|biodiversity|deforestation|sewage|waste|weather|rain|el ni|la ni|silt|invasive|hyacinth)\b/i,
  },
  {
    query: /\b(fish|fisher|fisheries|fishing|uvuvi)\b/i,
    result: /\b(fish|fisher|fisheries|fishing|uvuvi|aquaculture|catch|trawler|boat|nets?)\b/i,
  },
  {
    query: /\b(blue economy)\b/i,
    result: /\b(blue economy|economy|fisher|port|trade|investment|maritime|shipping|tourism)\b/i,
  },
  {
    query: /\b(human rights|rights|governance|accountability|justice)\b/i,
    result: /\b(rights|governance|accountability|justice|court|corruption|protest|abuse|policy|law)\b/i,
  },
];

function isRelevantToQuery(query: string, result: SearchResult): boolean {
  const text = `${result.title} ${result.snippet} ${result.publisher ?? ""}`;
  const topicFilters = TOPIC_FILTERS.filter((filter) => filter.query.test(query));
  if (topicFilters.length > 0) {
    return topicFilters.some((filter) => filter.result.test(text));
  }

  const tokens = (query.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (token) => token.length > 2 && !QUERY_STOP_WORDS.has(token)
  );
  if (tokens.length === 0) return true;
  const haystack = text.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

function normalizeUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|mc_|ref$|source$)/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function deduplicate(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const output: SearchResult[] = [];
  for (const result of results) {
    const normalized = normalizeUrl(result.url);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push({ ...result, url: normalized });
  }
  return output;
}

function sanitizeSnippet(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .slice(0, MAX_SNIPPET_CHARS)
    .trim();
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return trimmed.slice(0, 40);
}

function toResult(item: RawResult): SearchResult | null {
  const url = typeof item.url === "string" ? normalizeUrl(item.url) : null;
  const title = typeof item.title === "string" ? item.title.trim() : "";
  if (!url || !title) return null;
  return {
    url,
    title,
    snippet: sanitizeSnippet(item.content ?? item.snippet ?? ""),
    publishedAt: normalizeDate(item.publishedAt ?? item.published_date),
    publisher: publisherFromUrl(url),
  };
}

function normalizeQueries(input: string[] | string): string[] {
  const list = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  const queries: string[] = [];
  for (const query of list) {
    const trimmed = typeof query === "string" ? query.replace(/\s+/g, " ").trim() : "";
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    queries.push(trimmed.slice(0, 380));
    if (queries.length >= MAX_SEARCH_QUERIES) break;
  }
  return queries;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function searchTavily(params: {
  query: string;
  apiKey: string;
  maxResults: number;
  topic: "news" | "general";
  days?: number;
  timeoutMs: number;
}): Promise<SearchResult[]> {
  const body: Record<string, unknown> = {
    query: params.query,
    search_depth: "advanced",
    include_answer: false,
    include_raw_content: false,
    max_results: Math.min(Math.max(params.maxResults, 1), 10),
    topic: params.topic,
  };
  if (params.topic === "news") {
    body.days = Math.min(Math.max(params.days ?? 30, 1), 365);
  }

  const response = await fetchWithTimeout(
    "https://api.tavily.com/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    params.timeoutMs
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Tavily request failed: ${response.status}${detail ? ` - ${detail.slice(0, 200)}` : ""}`);
  }

  const data = (await response.json()) as { results?: RawResult[] };
  return (data.results ?? [])
    .map(toResult)
    .filter((result): result is SearchResult => !!result);
}

async function searchCustom(params: {
  query: string;
  apiUrl: string;
  apiKey: string;
  maxResults: number;
  timeoutMs: number;
}): Promise<SearchResult[]> {
  const response = await fetchWithTimeout(
    params.apiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify({ query: params.query, max_results: params.maxResults }),
    },
    params.timeoutMs
  );
  if (!response.ok) throw new Error(`Search gateway failed: ${response.status}`);
  const data = (await response.json()) as { results?: RawResult[] };
  return (data.results ?? [])
    .map(toResult)
    .filter((result): result is SearchResult => !!result);
}

async function searchDuckDuckGo(query: string, timeoutMs: number): Promise<SearchResult[]> {
  const response = await fetchWithTimeout(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
    },
    timeoutMs
  );
  if (!response.ok) throw new Error(`DuckDuckGo request failed: ${response.status}`);
  const html = await response.text();
  const links = Array.from(html.matchAll(/<a rel="nofollow" class="result__a" href="([^"]+)">(.*?)<\/a>/g));
  const snippets = Array.from(html.matchAll(/<a class="result__snippet"[^>]*>(.*?)<\/a>/g));
  const results: SearchResult[] = [];

  for (let index = 0; index < links.length; index += 1) {
    const rawUrl = links[index][1];
    const title = links[index][2].replace(/<[^>]*>/g, "").trim();
    const url = normalizeUrl(rawUrl);
    if (!url || !title) continue;
    results.push({
      url,
      title,
      snippet: sanitizeSnippet(snippets[index]?.[1]?.replace(/<[^>]*>/g, "").trim() ?? ""),
      publisher: publisherFromUrl(url),
    });
  }

  return results;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function rssTag(item: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(item);
  return match ? decodeXml(match[1]).trim() : undefined;
}

function parseRssItems(xml: string): Array<{
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: string;
}> {
  const items = Array.from(xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi));
  return items.map((match) => {
    const item = match[1];
    const sourceMatch = /<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/i.exec(item);
    return {
      title: rssTag(item, "title"),
      link: rssTag(item, "link"),
      description: rssTag(item, "description"),
      pubDate: rssTag(item, "pubDate"),
      source: sourceMatch ? decodeXml(sourceMatch[2]).trim() : undefined,
    };
  });
}

async function searchGoogleNews(
  query: string,
  maxResults: number,
  days: number,
  timeoutMs: number
): Promise<SearchResult[]> {
  const searchQuery = /\bwhen:/i.test(query) ? query : `${query} when:${Math.min(Math.max(days, 1), 30)}d`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-KE&gl=KE&ceid=KE:en`;
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SIHU-AI/1.0; +https://sihuinformationhub.co.ke)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    },
    timeoutMs
  );
  if (!response.ok) throw new Error(`Google News request failed: ${response.status}`);
  const xml = await response.text();

  return parseRssItems(xml)
    .map((item): SearchResult | null => {
      const urlValue = item.link ? normalizeUrl(item.link) : null;
      const source = item.source || (urlValue ? publisherFromUrl(urlValue) : undefined);
      let title = item.title?.trim() || "";
      if (source && title.toLowerCase().endsWith(` - ${source.toLowerCase()}`)) {
        title = title.slice(0, -(source.length + 3)).trim();
      }
      if (!urlValue || !title) return null;
      return {
        url: urlValue,
        title,
        snippet: sanitizeSnippet(item.description || ""),
        publishedAt: normalizeDate(item.pubDate),
        publisher: source,
      };
    })
    .filter((result): result is SearchResult => !!result)
    .slice(0, maxResults);
}

async function searchBingRss(
  query: string,
  maxResults: number,
  timeoutMs: number
): Promise<SearchResult[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss`;
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SIHU-AI/1.0; +https://sihuinformationhub.co.ke)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    },
    timeoutMs
  );
  if (!response.ok) throw new Error(`Bing request failed: ${response.status}`);
  const xml = await response.text();

  return parseRssItems(xml)
    .map((item): SearchResult | null => {
      const urlValue = item.link ? normalizeUrl(item.link) : null;
      const title = item.title?.trim() || "";
      if (!urlValue || !title) return null;
      return {
        url: urlValue,
        title,
        snippet: sanitizeSnippet(item.description || ""),
        publishedAt: normalizeDate(item.pubDate),
        publisher: publisherFromUrl(urlValue),
      };
    })
    .filter((result): result is SearchResult => !!result)
    .slice(0, maxResults);
}

/**
 * Search the live web for real results. Enforces:
 *  - max 3 queries per request
 *  - max 6 external sources returned
 *  - per-request timeout
 *  - de-duplication and trusted-source ranking
 *
 * Tavily is used when TAVILY_API_KEY is present. If it fails, or no key is
 * configured, the function falls back to a configured search gateway and then
 * to DuckDuckGo so the assistant never silently returns invented sources.
 */
export async function webSearch(params: {
  queries: string[] | string;
  maxSources?: number;
  timeoutMs?: number;
  topic?: "news" | "general";
  days?: number;
}): Promise<WebSearchResponse> {
  const queries = normalizeQueries(params.queries);
  if (queries.length === 0) {
    return { results: [], queriesUsed: 0, provider: "none" };
  }

  const maxSources = Math.min(Math.max(params.maxSources ?? MAX_EXTERNAL_SOURCES, 1), MAX_EXTERNAL_SOURCES);
  const timeoutMs = Math.min(Math.max(params.timeoutMs ?? DEFAULT_TIMEOUT_MS, 2_000), 30_000);
  const topic = params.topic ?? "general";

  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  const customUrl = process.env.SEARCH_API_URL?.trim();
  const customKey = process.env.SEARCH_API_KEY?.trim();

  const collected: SearchResult[] = [];
  let provider: SearchProvider = "none";
  let error: string | undefined;

  const runQueries = async (
    search: (query: string) => Promise<SearchResult[]>
  ): Promise<boolean> => {
    const batches = await Promise.all(
      queries.map(async (query) => {
        try {
          const results = await search(query);
          return results.filter(
            (result) => !isBlockedPublisher(result.publisher) && isRelevantToQuery(query, result)
          );
        } catch (err) {
          if (!error) error = err instanceof Error ? err.message : String(err);
          return [] as SearchResult[];
        }
      })
    );
    const results = batches.flat();
    collected.push(...results);
    return results.length > 0;
  };

  if (tavilyKey) {
    const usedTavily = await runQueries((query) =>
      searchTavily({
        query,
        apiKey: tavilyKey,
        maxResults: Math.min(maxSources, 8),
        topic,
        days: params.days,
        timeoutMs,
      })
    );
    if (usedTavily) provider = "tavily";
  }

  if (collected.length === 0 && customUrl && customKey) {
    const usedCustom = await runQueries((query) =>
      searchCustom({ query, apiUrl: customUrl, apiKey: customKey, maxResults: maxSources, timeoutMs })
    );
    if (usedCustom) provider = "custom";
  }

  if (collected.length === 0 && topic === "news") {
    const usedGoogleNews = await runQueries((query) =>
      searchGoogleNews(query, maxSources, params.days ?? 14, timeoutMs)
    );
    if (usedGoogleNews) provider = "google-news";
  }

  if (collected.length === 0) {
    const usedBing = await runQueries((query) => searchBingRss(query, maxSources, timeoutMs));
    if (usedBing) provider = "bing";
  }

  if (collected.length === 0) {
    const usedDuckDuckGo = await runQueries((query) => searchDuckDuckGo(query, timeoutMs));
    if (usedDuckDuckGo) provider = "duckduckgo";
  }

  const deduped = deduplicate(collected)
    .map((result) => ({ result, score: scoreResult(result, topic) }))
    .sort((a, b) => b.score - a.score || publishedTime(b.result) - publishedTime(a.result))
    .map((entry) => entry.result)
    .slice(0, maxSources);

  if (deduped.length === 0 && !error) {
    error = "Live search returned no results. Set TAVILY_API_KEY for reliable news search.";
  }

  return {
    results: deduped,
    queriesUsed: queries.length,
    provider: deduped.length > 0 ? provider : "none",
    error,
  };
}
