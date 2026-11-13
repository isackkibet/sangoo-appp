/**
 * Controlled live web search for SIHU AI.
 *
 * Tavily is the primary provider when TAVILY_API_KEY is configured. A
 * key-free DuckDuckGo HTML fallback keeps the assistant usable in local
 * development, but production should always set TAVILY_API_KEY.
 *
 * All fetching happens server-side so API keys never reach the browser.
 * External pages are treated as untrusted data: we only use the title, URL,
 * publication date, image and a short snippet supplied by the search provider
 * or the article's Open Graph metadata. Retrieved content is never executed and
 * cannot override agent instructions.
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_SEARCH_QUERIES = 3;
const MAX_EXTERNAL_SOURCES = 6;
const MAX_SNIPPET_CHARS = 420;
const MAX_METADATA_CHARS = 300_000;
const METADATA_TIMEOUT_MS = 7_000;
const CACHE_TTL_MS = 10 * 60_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

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

const COUNTRY_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: "Kenya",
    pattern:
      /\b(kenya|kisumu|siaya|homa bay|migori|busia|bungoma|kakamega|vihiga|nairobi|mombasa|kisii|nyamira|kisii|kajiado|nakuru|eldoret|nyanza)\b/i,
  },
  { label: "Uganda", pattern: /\b(uganda|kampala|entebbe|jinja|gulu|mbale)\b/i },
  { label: "Tanzania", pattern: /\b(tanzania|mwanza|musoma|bukoba|dar es salaam|dodoma|arusha)\b/i },
  { label: "Rwanda", pattern: /\b(rwanda|kigali)\b/i },
  { label: "Burundi", pattern: /\b(burundi|bujumbura|gitega)\b/i },
  { label: "South Sudan", pattern: /\b(south sudan|juba)\b/i },
  { label: "Ethiopia", pattern: /\b(ethiopia|addis ababa)\b/i },
  { label: "DR Congo", pattern: /\b(drc|democratic republic of (?:the )?congo|kinshasa)\b/i },
];

const COUNTY_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Kisumu", pattern: /\bkisumu\b/i },
  { label: "Siaya", pattern: /\bsiaya\b/i },
  { label: "Homa Bay", pattern: /\bhoma bay\b/i },
  { label: "Migori", pattern: /\bmigori\b/i },
  { label: "Busia", pattern: /\bbusia\b/i },
  { label: "Bungoma", pattern: /\bbungoma\b/i },
  { label: "Kakamega", pattern: /\bkakamega\b/i },
  { label: "Vihiga", pattern: /\bvihiga\b/i },
  { label: "Nairobi", pattern: /\bnairobi\b/i },
  { label: "Mwanza", pattern: /\bmwanza\b/i },
  { label: "Mara", pattern: /\bmusoma\b|\bmara\b/i },
  { label: "Kagera", pattern: /\bbukoba\b|\bkagera\b/i },
];

const LOCATION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Lake Victoria", pattern: /\blake victoria|victoria basin|ziwa victoria\b/i },
  { label: "Nile Basin", pattern: /\bnile basin\b/i },
  { label: "East Africa", pattern: /\beast africa(?:n community)?\b|\beac\b/i },
];

const TOPIC_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  {
    label: "Fisheries",
    pattern: /\b(fish|fisher|fisheries|fishing|uvuvi|aquaculture|trawler|catch|fishing boat|fishing nets?)\b/i,
  },
  {
    label: "Environment",
    pattern:
      /\b(environment|environmental|conservation|climate|ecosystem|pollution|polluted|wetland|biodiversity|deforestation|sewage|waste|flood|drought|hyacinth|mazingira|uhifadhi)\b/i,
  },
  {
    label: "Community development",
    pattern: /\b(community|livelihood|livelihoods|development|poverty|chama|jamii|maisha|women|youth)\b/i,
  },
  {
    label: "Blue economy",
    pattern: /\b(blue economy|port|maritime|shipping|trade|investment|tourism|uchumi wa bluu)\b/i,
  },
  {
    label: "Governance",
    pattern: /\b(governance|rights|accountability|justice|court|corruption|policy|law|regulation|gazette)\b/i,
  },
  {
    label: "Water and sanitation",
    pattern: /\b(water|sanitation|maji|usafi|drinking water)\b/i,
  },
  {
    label: "Agriculture",
    pattern: /\b(agriculture|farming|farmer|crop|irrigation|kilimo)\b/i,
  },
  {
    label: "Health",
    pattern: /\b(health|hospital|disease|malaria|afya)\b/i,
  },
  {
    label: "Education",
    pattern: /\b(education|school|learning|elimu)\b/i,
  },
];

const PRIORITY_PATTERNS: Array<{ score: number; pattern: RegExp }> = [
  { score: 10, pattern: /\bkisumu\b/i },
  { score: 9, pattern: /\blake victoria|victoria basin|ziwa victoria\b/i },
  { score: 7, pattern: /\bkenya\b/i },
  { score: 6, pattern: /\bfish|fisher|fisheries|fishing|uvuvi\b/i },
  { score: 5, pattern: /\benvironment|environmental|conservation|climate|ecosystem\b/i },
  { score: 4, pattern: /\bcommunity|livelihood|livelihoods|development\b/i },
];

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
  publisher?: string;
  image?: string;
  country?: string;
  county?: string;
  locations?: string[];
  topics?: string[];
  verified?: boolean;
  viaGoogleNews?: boolean;
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
  image?: string;
  images?: Array<string | { url?: string; description?: string }>;
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
  const text = `${result.title} ${result.snippet}`;
  let score = 0;
  if (isTrustedDomain(result.url)) score += 10;
  for (const priority of PRIORITY_PATTERNS) {
    if (priority.pattern.test(text)) score += priority.score;
  }
  if (/\b(regulation|policy|act|law|gazette|ministry|authority|report|study|research)\b/i.test(text)) {
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

function normalizeImageUrl(raw: string | undefined, base?: string): string | undefined {
  if (!raw) return undefined;
  try {
    const url = base ? new URL(raw, base) : new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}

function firstImage(images: RawResult["images"]): string | undefined {
  if (!Array.isArray(images)) return undefined;
  for (const image of images) {
    const raw = typeof image === "string" ? image : image?.url;
    const normalized = normalizeImageUrl(raw);
    if (normalized) return normalized;
  }
  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function metaContent(html: string, key: string): string | undefined {
  const escaped = escapeRegExp(key);
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeXml(match[1]).trim();
  }
  return undefined;
}

function isGoogleNewsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "news.google.com" && /\/articles\//.test(parsed.pathname);
  } catch {
    return false;
  }
}

function parseGoogleNewsResolution(text: string): string | null {
  try {
    const cleaned = text.replace(/^\)\]\}'\s*/, "").trim();
    const rows = JSON.parse(cleaned) as unknown[];
    for (const row of rows) {
      if (!Array.isArray(row) || row[0] !== "wrb.fr" || row[1] !== "Fbv4je" || typeof row[2] !== "string") {
        continue;
      }
      const data = JSON.parse(row[2]) as unknown;
      if (Array.isArray(data) && data[0] === "garturlres" && typeof data[1] === "string") {
        return data[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

interface PageMetadata {
  url: string;
  verified: boolean;
  image?: string;
  summary?: string;
  publishedAt?: string;
}

const metadataCache = new Map<string, { expires: number; value: PageMetadata }>();
const googleNewsCache = new Map<string, { expires: number; value: string | null }>();

function readCache<T>(cache: Map<string, { expires: number; value: T }>, key: string): T | undefined {
  const cached = cache.get(key);
  if (!cached) return undefined;
  if (cached.expires <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return cached.value;
}

function writeCache<T>(cache: Map<string, { expires: number; value: T }>, key: string, value: T): void {
  if (cache.size > 200) {
    for (const [cacheKey, entry] of cache) {
      if (entry.expires <= Date.now()) cache.delete(cacheKey);
    }
  }
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
}

async function resolveGoogleNewsUrl(url: string, timeoutMs: number): Promise<string | null> {
  const cached = readCache(googleNewsCache, url);
  if (cached !== undefined) return cached;

  try {
    const articleId = /\/articles\/([^/?]+)/.exec(new URL(url).pathname)?.[1];
    if (!articleId) throw new Error("Google News article id not found");

    const page = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      },
      timeoutMs
    );
    if (!page.ok) throw new Error(`Google News article page failed: ${page.status}`);

    const html = await page.text();
    const signature = /data-n-a-sg="([^"]+)"/.exec(html)?.[1];
    const timestamp = /data-n-a-ts="([^"]+)"/.exec(html)?.[1];
    if (!signature || !timestamp) throw new Error("Google News article signature missing");

    const payload = [
      "garturlreq",
      [
        ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
        "X",
        "X",
        1,
        [1, 1, 1],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      Number(timestamp),
      signature,
    ];
    const body = new URLSearchParams();
    body.append("f.req", JSON.stringify([[[ "Fbv4je", JSON.stringify(payload), null, "generic" ]]]));

    const response = await fetchWithTimeout(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": BROWSER_USER_AGENT,
        },
        body,
      },
      timeoutMs
    );
    if (!response.ok) throw new Error(`Google News resolution failed: ${response.status}`);

    const resolved = parseGoogleNewsResolution(await response.text());
    const normalized = resolved ? normalizeUrl(resolved) : null;
    const output = normalized && !isGoogleNewsUrl(normalized) ? normalized : null;
    writeCache(googleNewsCache, url, output);
    return output;
  } catch {
    writeCache(googleNewsCache, url, null);
    return null;
  }
}

async function fetchPageMetadata(url: string, timeoutMs: number): Promise<PageMetadata> {
  const cached = readCache(metadataCache, url);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      },
      timeoutMs
    );
    const finalUrl = response.url || url;
    if (!response.ok) {
      const value = { url: finalUrl, verified: false };
      writeCache(metadataCache, url, value);
      return value;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!/html/i.test(contentType)) {
      const value = { url: finalUrl, verified: true };
      writeCache(metadataCache, url, value);
      return value;
    }

    const html = (await response.text()).slice(0, MAX_METADATA_CHARS);
    const image =
      normalizeImageUrl(
        metaContent(html, "og:image") ??
          metaContent(html, "og:image:url") ??
          metaContent(html, "twitter:image") ??
          metaContent(html, "twitter:image:src") ??
          /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i.exec(html)?.[1],
        finalUrl
      ) ?? undefined;
    const summary = sanitizeSnippet(
      metaContent(html, "og:description") ??
        metaContent(html, "twitter:description") ??
        metaContent(html, "description") ??
        ""
    );
    const publishedAt = normalizeDate(
      metaContent(html, "article:published_time") ??
        metaContent(html, "datePublished") ??
        metaContent(html, "date") ??
        /"datePublished"\s*:\s*"([^"]+)"/i.exec(html)?.[1]
    );

    const value: PageMetadata = {
      url: finalUrl,
      verified: true,
      image,
      summary: summary.length >= 40 ? summary : undefined,
      publishedAt,
    };
    writeCache(metadataCache, url, value);
    return value;
  } catch {
    const value = { url, verified: false };
    writeCache(metadataCache, url, value);
    return value;
  }
}

function classifyResult(result: SearchResult): SearchResult {
  const text = `${result.title} ${result.snippet} ${result.publisher ?? ""}`;
  const country = COUNTRY_PATTERNS.find((entry) => entry.pattern.test(text))?.label;
  const county = COUNTY_PATTERNS.find((entry) => entry.pattern.test(text))?.label;
  const locations = LOCATION_PATTERNS.filter((entry) => entry.pattern.test(text)).map((entry) => entry.label);
  const topics = TOPIC_PATTERNS.filter((entry) => entry.pattern.test(text))
    .map((entry) => entry.label)
    .slice(0, 3);

  return {
    ...result,
    country,
    county,
    locations: locations.length > 0 ? locations : undefined,
    topics: topics.length > 0 ? topics : undefined,
  };
}

async function enrichResult(result: SearchResult, timeoutMs: number): Promise<SearchResult> {
  let finalUrl = result.url;
  let viaGoogleNews = false;

  if (isGoogleNewsUrl(result.url)) {
    const resolved = await resolveGoogleNewsUrl(result.url, Math.min(timeoutMs, METADATA_TIMEOUT_MS));
    if (resolved) {
      finalUrl = resolved;
    } else {
      viaGoogleNews = true;
    }
  }

  if (isGoogleNewsUrl(finalUrl)) {
    return classifyResult({
      ...result,
      url: finalUrl,
      verified: true,
      viaGoogleNews: true,
    });
  }

  const metadata = await fetchPageMetadata(finalUrl, Math.min(timeoutMs, METADATA_TIMEOUT_MS));
  const redirectedUrl = metadata.url && !isGoogleNewsUrl(metadata.url) ? metadata.url : finalUrl;
  const summary =
    metadata.summary && metadata.summary.length >= 40 ? metadata.summary : result.snippet;

  return classifyResult({
    ...result,
    url: redirectedUrl,
    snippet: summary,
    image: result.image ?? metadata.image,
    publishedAt: result.publishedAt ?? metadata.publishedAt,
    verified: metadata.verified,
    viaGoogleNews: viaGoogleNews || isGoogleNewsUrl(redirectedUrl),
  });
}

async function enrichResults(results: SearchResult[], timeoutMs: number): Promise<SearchResult[]> {
  return Promise.all(results.map((result) => enrichResult(result, timeoutMs)));
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
    image: normalizeImageUrl(item.image) ?? firstImage(item.images),
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
    include_images: true,
    include_image_descriptions: false,
    include_favicon: true,
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

function rssImage(item: string): string | undefined {
  const patterns = [
    /<media:content[^>]+url="([^"]+)"/i,
    /<media:thumbnail[^>]+url="([^"]+)"/i,
    /<enclosure[^>]+url="([^"]+)"[^>]*type="image\//i,
    /<enclosure[^>]+type="image\/[^"]+"[^>]*url="([^"]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(item);
    const image = normalizeImageUrl(match?.[1]);
    if (image) return image;
  }
  return undefined;
}

function parseRssItems(xml: string): Array<{
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  source?: string;
  image?: string;
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
      image: rssImage(item),
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
        image: item.image,
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
        image: item.image,
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

  const enriched = await enrichResults(deduped, timeoutMs);

  if (enriched.length === 0 && !error) {
    error = "Live search returned no results. Set TAVILY_API_KEY for reliable news search.";
  }

  return {
    results: enriched,
    queriesUsed: queries.length,
    provider: enriched.length > 0 ? provider : "none",
    error,
  };
}
