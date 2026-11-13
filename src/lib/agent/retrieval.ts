import { defaultArticles } from "@/constants/articles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSql, hasDatabase } from "@/lib/db";
import type { AgentKnowledgeItem } from "@/lib/agent/types";

/**
 * SIHU's own knowledge is always available, even when Supabase or Neon is
 * temporarily unavailable. The content below is taken from the SIHU public
 * site and published SIHU articles, so the assistant can answer "What is
 * SIHU?" and other internal questions without returning "None".
 */
const SIHU_KNOWLEDGE: AgentKnowledgeItem[] = [
  {
    source: "sihu:about",
    type: "home",
    title: "About Sango Information Hub (SIHU)",
    url: "/portal",
    publisher: "Sango Information Hub",
    content:
      "Sango Information Hub (SIHU) is a registered community media initiative that works on knowledge management and information sharing on natural resources, environmental protection and development around the Lake Victoria Basin in Kenya. SIHU works through community involvement in the production of radio content, digital information gathering and sharing, a community information and traditional knowledge restoration centre, and regular community newspapers in print and e-paper. Sango is the indigenous name for Lake Victoria. The office is at Fort Jesus Road in Busia Town, and membership is drawn from Kenyans living within the Lake Victoria Basin who are interested in human rights, development and environmental protection.",
  },
  {
    source: "sihu:coverage",
    type: "home",
    title: "What SIHU covers",
    url: "/portal",
    publisher: "Sango Information Hub",
    content:
      "SIHU produces content and information through community correspondents, with a focus on development news and environmental protection in the Lake Victoria Basin. Its coverage includes environmental governance, Lake Victoria Basin protection, climate resilience, the blue economy and fisheries, community development, human rights, local livelihoods, cross-border insecurity, natural resources, and the restoration of community and traditional knowledge.",
  },
  {
    source: "sihu:pillars",
    type: "home",
    title: "SIHU key pillars",
    url: "/#pillars",
    publisher: "Sango Information Hub",
    content:
      "SIHU works through four key pillars: public engagement on developmental issues and environmental protection through digital media, radio, newspapers and public forums; demanding accountability from government and the public on climate change and preservation of the Lake Victoria ecosystem; acting as a public watchdog that amplifies community concerns on human rights and development; and sensitizing communities on the dangers of cross-border insecurity and environmental protection issues.",
  },
  {
    source: "sihu:objectives",
    type: "home",
    title: "SIHU core objectives",
    url: "/#objectives",
    publisher: "Sango Information Hub",
    content:
      "SIHU's core objectives are content generation through a professional newsgathering and editorial network; community involvement through stakeholder engagement, outreaches and information gathering; resource mobilization for financial and human resources; institutional capacity with modern equipment and editorial skills; ICT integration across radio, print, e-paper and online channels; and acting as an eco-watchdog for the Lake Victoria ecosystem.",
  },
  {
    source: "sihu:basin",
    type: "knowledge",
    title: "Lake Victoria Basin context",
    url: "/#story",
    publisher: "Sango Information Hub",
    content:
      "The Lake Victoria Basin Region is made up of ten counties in Kenya, mostly in Western and Nyanza, covering nearly 10 percent of Kenya's territory. It is densely populated and the equator passes across the region. Average annual rainfall varies from 700mm along the Lake Victoria shores to 2,000mm in the highlands. Key livelihoods and ecosystems are linked to Rivers Yala, Nzoia and Suo and catchments including Mt. Elgon, Lugari, Butere-Mumias, Bungoma, Teso, Busia, Kakamega, Vihiga, Homa Bay, Kisumu, Siaya and Bondo. Despite rich natural resources, the basin is a poverty hotspot because of high population density, limited economic opportunities and rapid degradation of natural resources. It is also Kenya's most flood-prone region.",
  },
  {
    source: "sihu:environment",
    type: "knowledge",
    title: "Environment and conservation in the Lake Victoria Basin",
    url: "/portal",
    publisher: "Sango Information Hub",
    content:
      "SIHU reports on environmental protection and conservation around Lake Victoria. Major issues include pollution from agricultural and industrial runoff and sewage, declining water quality, invasive water hyacinth, overfishing, wetland loss, deforestation, siltation, climate change and rising lake water levels. SIHU also covers circular economy and water reuse, wastewater treatment, irrigation, biogas, hydropower, water purification, restoration of catchments and wetlands, community monitoring, climate resilience and accountability by government agencies and regional institutions such as NEMA, the Lake Victoria Basin Commission and the Nile Basin Initiative.",
  },
  {
    source: "sihu:blue-economy",
    type: "knowledge",
    title: "Blue economy and fisheries around Lake Victoria",
    url: "/portal/article/blue-economy-potential",
    publisher: "Sango Information Hub",
    content:
      "Lake Victoria is Africa's largest freshwater lake and supports over 40 million people in Kenya, Tanzania and Uganda. Its resources fuel fishing, agriculture, industry, transport and tourism. SIHU coverage of the blue economy includes sustainable fisheries, fishing communities and livelihoods, aquaculture, water transport, irrigation schemes such as West Kano, Ahero and Bunyala, water reuse and circular economy, and transboundary cooperation. Key challenges include pollution, overfishing, illegal fishing, water hyacinth, climate change and weak enforcement. Development experts argue that the region's future depends on sustainable, transboundary use of natural resources and joint investment.",
  },
  {
    source: "sihu:community",
    type: "knowledge",
    title: "Community development and local livelihoods",
    url: "/portal",
    publisher: "Sango Information Hub",
    content:
      "SIHU works with communities across the Kenyan Lake Victoria Basin on development news and local livelihoods. The basin faces high population density, poverty, limited economic opportunities and rapid natural-resource degradation. SIHU covers small-scale fishing, agriculture, irrigation, savings groups and chamas, small businesses, community media, stakeholder engagement, disaster preparedness, flood response, water and sanitation, and community-led restoration. The goal is to amplify local voices and connect community knowledge with practical development solutions.",
  },
  {
    source: "sihu:human-rights",
    type: "knowledge",
    title: "Human rights, governance and accountability",
    url: "/portal",
    publisher: "Sango Information Hub",
    content:
      "SIHU acts as a public watchdog and voice for communities around Lake Victoria on human rights and development issues. Its reporting covers access to information, transparency and accountability in public institutions, environmental justice, the rights of fishing and farming communities, cross-border insecurity, disaster preparedness, and public participation in decisions about natural resources and development. SIHU amplifies community concerns and demands accountability on climate change and preservation of the Lake Victoria ecosystem.",
  },
  {
    source: "sihu:contact",
    type: "home",
    title: "Contact Sango Information Hub",
    url: "/#contact",
    publisher: "Sango Information Hub",
    content:
      "Sango Information Hub is located at Fort Jesus Road, Busia Town, Kenya. Email: sangoinformationhub@gmail.com. Phone: 0722 318 820. You can also reach SIHU through WhatsApp and the SIHU Telegram updates bot. The SIHU AI assistant on this site answers questions using SIHU's published content and, when needed, live web sources.",
  },
  {
    source: "sihu:ai",
    type: "knowledge",
    title: "About SIHU AI (Agent SIHU)",
    url: "/ai",
    publisher: "Sango Information Hub",
    content:
      "SIHU AI, also called Agent SIHU, is the assistant inside the Sango Information Hub platform. It first searches SIHU's own articles, reports, knowledge base and community submissions, then uses live web search when the question needs current information. It cites its sources, does not invent news, and asks for a location or topic when a request such as 'latest news' is too broad.",
  },
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "what",
  "who",
  "how",
  "why",
  "when",
  "where",
  "which",
  "this",
  "that",
  "these",
  "those",
  "from",
  "about",
  "into",
  "over",
  "under",
  "after",
  "before",
  "latest",
  "recent",
  "recently",
  "news",
  "update",
  "updates",
  "current",
  "currently",
  "today",
  "please",
  "tell",
  "give",
  "show",
  "there",
  "their",
  "have",
  "has",
  "can",
  "could",
  "would",
  "should",
  "does",
  "did",
]);

const TOKEN_ALIASES: Record<string, string> = {
  environmental: "environment",
  environments: "environment",
  conservation: "conserv",
  conserve: "conserv",
  conserving: "conserv",
  fisheries: "fishery",
  fisher: "fishery",
  fishers: "fishery",
  fishing: "fishery",
  communities: "community",
  livelihoods: "livelihood",
  developments: "development",
  regulations: "regulation",
  rights: "right",
  counties: "county",
  kenyan: "kenya",
  ugandan: "uganda",
  tanzanian: "tanzania",
};

function normalizeToken(token: string): string {
  return TOKEN_ALIASES[token] ?? token;
}

function tokenize(text: string) {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
      .map(normalizeToken)
  );
}

function scoreMatch(query: string, text: string) {
  const queryTokens = tokenize(query);
  const textTokens = tokenize(text);
  let score = 0;

  for (const token of queryTokens) {
    if (textTokens.has(token)) score += 1;
  }

  return score;
}

function withScore(item: AgentKnowledgeItem, query: string): AgentKnowledgeItem {
  const combined = [item.title, item.content, item.type, item.source].filter(Boolean).join(" ");
  return { ...item, score: scoreMatch(query, combined) };
}

function dedupe(items: AgentKnowledgeItem[]): AgentKnowledgeItem[] {
  const bySource = new Map<string, AgentKnowledgeItem>();
  for (const item of items) {
    if (!item?.source) continue;
    const existing = bySource.get(item.source);
    if (!existing || (item.score || 0) > (existing.score || 0)) {
      bySource.set(item.source, item);
    }
  }
  return [...bySource.values()];
}

async function retrieveKnowledgeBase(query: string, topK: number): Promise<AgentKnowledgeItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("content,type,source,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data
      .map((item) =>
        withScore(
          {
            source: item.source || "knowledge_base",
            type: item.type || "knowledge",
            content: item.content || "",
            title: item.source || "SIHU knowledge base",
            publishedAt: item.created_at ? String(item.created_at).slice(0, 10) : undefined,
            publisher: "Sango Information Hub",
          },
          query
        )
      )
      .filter((item) => (item.score || 0) >= 2)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  } catch {
    return [];
  }
}

async function retrieveArticles(query: string, topK: number): Promise<AgentKnowledgeItem[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const rows = error || !data || data.length === 0 ? defaultArticles : data;

    return rows
      .map((article) => {
        return withScore(
          {
            source: `article:${article.id}`,
            type: "article",
            title: article.title,
            content: `${article.title}: ${article.excerpt || ""}\n${String(article.content || "").slice(0, 1600)}`.trim(),
            url: `/portal/article/${article.id}`,
            publisher: article.author ? `SIHU · ${article.author}` : "Sango Information Hub",
            publishedAt: article.created_at ? String(article.created_at).slice(0, 10) : undefined,
          },
          query
        );
      })
      .filter((item) => (item.score || 0) >= 2)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  } catch {
    return defaultArticles
      .map((article) =>
        withScore(
          {
            source: `article:${article.id}`,
            type: "article",
            title: article.title,
            content: `${article.title}: ${article.excerpt}\n${String(article.content || "").slice(0, 1600)}`.trim(),
            url: `/portal/article/${article.id}`,
            publisher: article.author ? `SIHU · ${article.author}` : "Sango Information Hub",
          },
          query
        )
      )
      .filter((item) => (item.score || 0) >= 2)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  }
}

/**
 * Community submissions live in the Neon media tables used by the SIHU
 * community feed. They are public posts, so they can be retrieved for the
 * assistant in the same way as articles and knowledge-base entries.
 */
async function retrieveCommunitySubmissions(query: string, topK: number): Promise<AgentKnowledgeItem[]> {
  if (!hasDatabase) return [];
  try {
    const sql = getSql();
    const rows = (await sql.query(
      `SELECT p.id, p.caption, p.category, p.location_name, p.created_at,
              u.name AS author_name, u.username AS author_username
         FROM media_posts p
         LEFT JOIN users u ON u.id = p.user_id
        WHERE p.visibility = 'public'
          AND p.caption <> ''
        ORDER BY p.created_at DESC
        LIMIT 80`
    )) as Array<Record<string, unknown>>;

    return rows
      .map((row) => {
        const caption = String(row.caption ?? "");
        const category = String(row.category ?? "community");
        const location = row.location_name ? String(row.location_name) : "";
        const author = row.author_name || row.author_username ? String(row.author_name || row.author_username) : "SIHU community member";
        return withScore(
          {
            source: `community:${String(row.id)}`,
            type: "community",
            title: caption.length > 90 ? `${caption.slice(0, 90)}…` : caption || "Community submission",
            content: `${caption}\nCategory: ${category}${location ? `\nLocation: ${location}` : ""}\nSubmitted by: ${author}`,
            url: "/media/feed",
            publisher: "SIHU community submission",
            publishedAt: row.created_at ? String(row.created_at).slice(0, 10) : undefined,
          },
          query
        );
      })
      .filter((item) => (item.score || 0) >= 2)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);
  } catch {
    return [];
  }
}

const GENERIC_SIHU_SOURCES = new Set([
  "sihu:about",
  "sihu:coverage",
  "sihu:pillars",
  "sihu:objectives",
  "sihu:ai",
  "sihu:contact",
]);

function retrieveSiHU(query: string, topK: number): AgentKnowledgeItem[] {
  const isDirectSiHUQuestion = /\b(sihu|sango information hub|agent sihu|this platform|this site|your platform)\b/i.test(query);
  const scored = SIHU_KNOWLEDGE.map((item) => withScore(item, query)).filter(
    (item) => (item.score || 0) >= 2
  );

  if (isDirectSiHUQuestion) {
    const direct = ["sihu:about", "sihu:coverage", "sihu:ai", "sihu:contact"]
      .map((source) => SIHU_KNOWLEDGE.find((item) => item.source === source))
      .filter((item): item is AgentKnowledgeItem => !!item)
      .map((item) => withScore(item, query));
    return dedupe([...direct, ...scored])
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, Math.max(topK, 3));
  }

  return scored
    .filter((item) => !GENERIC_SIHU_SOURCES.has(item.source))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);
}

function domainFallback(query: string): AgentKnowledgeItem[] {
  const lower = query.toLowerCase();
  const domainSignals: Array<{ pattern: RegExp; sources: string[] }> = [
    { pattern: /\b(environment|environmental|conservation|pollution|climate|wetland|water quality|ecosystem|forest|biodiversity)\b/, sources: ["sihu:environment", "sihu:basin"] },
    { pattern: /\b(blue economy|fisher|fisheries|fish|aquaculture|lake victoria|uvuvi)\b/, sources: ["sihu:blue-economy", "sihu:basin"] },
    { pattern: /\b(community|communities|livelihood|livelihoods|poverty|development|developments|chama|agriculture|farmer)\b/, sources: ["sihu:community", "sihu:basin"] },
    { pattern: /\b(human rights|rights|governance|accountability|transparency|justice|insecurity)\b/, sources: ["sihu:human-rights"] },
  ];

  for (const signal of domainSignals) {
    if (!signal.pattern.test(lower)) continue;
    return signal.sources
      .map((source) => SIHU_KNOWLEDGE.find((item) => item.source === source))
      .filter((item): item is AgentKnowledgeItem => !!item)
      .map((item) => {
        const scored = withScore(item, query);
        return { ...scored, score: (scored.score || 0) + 1 };
      });
  }

  return [];
}

export async function retrieveKnowledge(query: string, topK = 4): Promise<AgentKnowledgeItem[]> {
  const [knowledgeBase, articles, community] = await Promise.all([
    retrieveKnowledgeBase(query, topK),
    retrieveArticles(query, topK),
    retrieveCommunitySubmissions(query, topK),
  ]);

  const merged = dedupe([
    ...domainFallback(query),
    ...retrieveSiHU(query, topK),
    ...knowledgeBase,
    ...articles,
    ...community,
  ])
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, topK);

  return merged;
}
