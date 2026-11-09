/**
 * Controlled web search for SIHU AI.
 *
 * Real results only. No mock data. All fetching happens server-side so API
 * keys never reach the browser. External pages are treated as untrusted data:
 * we only use title/URL/snippet and never execute page instructions.
 */

const DEFAULT_TIMEOUT_MS = 12_000;
const MAX_SEARCH_QUERIES = 3;
const MAX_EXTERNAL_SOURCES = 5;
const MAX_SNIPPET_CHARS = 400;

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
  "unep.org",
  "unesco.org",
  "iucn.org",
  "wcs.org",
  "wwf.org",
  "birdlife.org",
  "nilebasin.org",
  "edu",
  "ac.ke",
  "ac.uk",
  "bbc.com",
  "reuters.com",
  "apnews.com",
  "theguardian.com",
  "aljazeera.com",
];

function isTrustedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some((domain) => host === domain || host.endsWith("." + domain));
  } catch {
    return false;
  }
}

function scoreResult(url: string, title: string, snippet: string): number {
  let score = 0;
  if (isTrustedDomain(url)) score += 10;
  if (/\b(kenya|uganda|tanzania|lake victoria|victoria basin|east africa)\b/i.test(title + " " + snippet)) score += 3;
  if (/\b(regulation|policy|act|law|gazette|ministry|authority|report|study)\b/i.test(title + " " + snippet)) score += 2;
  return score;
}

function deduplicate(results: Array<{ url: string; title: string; snippet: string }>) {
  const seen = new Set<string>();
  return results.filter((result) => {
    try {
      const host = new URL(result.url).hostname.toLowerCase();
      const path = new URL(result.url).pathname.toLowerCase();
      const key = host + path;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    } catch {
      if (seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    }
  });
}

function sanitizeSnippet(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .slice(0, MAX_SNIPPET_CHARS)
    .trim();
}

async function fetchWithTimeout(url: string, headers: Record<string, string>, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
}

/**
 * Search the web for real results. Enforces:
 *  - max 3 queries per call
 *  - max 5 external sources returned
 *  - per-request timeout
 *  - dedupe by URL
 *  - trusted-source ranking
 */
export async function webSearch(params: {
  query: string;
  maxQueries?: number;
  maxSources?: number;
  timeoutMs?: number;
}): Promise<{ results: SearchResult[]; queriesUsed: number }> {
  const maxQueries = Math.min(Math.max(params.maxQueries ?? 1, 1), MAX_SEARCH_QUERIES);
  const maxSources = Math.min(Math.max(params.maxSources ?? MAX_EXTERNAL_SOURCES, 1), MAX_EXTERNAL_SOURCES);
  const timeoutMs = Math.min(Math.max(params.timeoutMs ?? DEFAULT_TIMEOUT_MS, 2_000), 30_000);

  const queries = [params.query.trim()].filter(Boolean).slice(0, maxQueries);

  const searchApiUrl = process.env.SEARCH_API_URL;
  const searchApiKey = process.env.SEARCH_API_KEY;

  const allResults: SearchResult[] = [];

  if (searchApiUrl && searchApiKey) {
    // Configured JSON search provider (e.g. a private search gateway).
    for (const query of queries) {
      try {
        const body = JSON.stringify({ query, max_results: maxSources });
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(searchApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${searchApiKey}`,
          },
          body,
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) continue;
        const data = (await response.json()) as {
          results?: Array<{ url?: string; title?: string; snippet?: string; published_at?: string }>;
        };
        for (const item of (data.results ?? []).slice(0, maxSources)) {
          if (!item.url || !item.title) continue;
          allResults.push({
            url: item.url,
            title: item.title.trim(),
            snippet: sanitizeSnippet(item.snippet ?? ""),
            publishedAt: item.published_at,
          });
        }
      } catch {
        /* continue to next query / fallback */
      }
    }
  } else {
    // No configured key: use DuckDuckGo HTML (real results, no key required).
    for (const query of queries) {
      try {
        const encoded = encodeURIComponent(query);
        const html = await fetchWithTimeout(
          `https://html.duckduckgo.com/html/?q=${encoded}`,
          {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            Accept: "text/html",
          },
          timeoutMs
        );
        const links = Array.from(html.matchAll(/<a rel="nofollow" class="result__a" href="([^"]+)">(.*?)<\/a>/g));
        const snippets = Array.from(html.matchAll(/<a class="result__snippet"[^>]*>(.*?)<\/a>/g));
        for (let i = 0; i < links.length && allResults.length < maxSources; i += 1) {
          const url = links[i][1];
          const title = links[i][2].replace(/<[^>]*>/g, "").trim();
          const snippet = sanitizeSnippet(snippets[i]?.[1]?.replace(/<[^>]*>/g, "").trim() ?? "");
          if (!url || !title) continue;
          try {
            new URL(url);
          } catch {
            continue;
          }
          allResults.push({ url, title, snippet });
        }
      } catch {
        /* continue to next query / fallback */
      }
    }
  }

  const deduped = deduplicate(allResults)
    .sort((a, b) => scoreResult(b.url, b.title, b.snippet) - scoreResult(a.url, a.title, a.snippet))
    .slice(0, maxSources);

  return { results: deduped, queriesUsed: queries.length };
}
