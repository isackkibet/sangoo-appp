import { NextResponse } from "next/server";
import { cached } from "@/lib/cache";
import { ensureSchema, getSql, hasDatabase } from "@/lib/db";
import { defaultArticles } from "@/constants/articles";
import { kaiItems } from "@/services/kaiHubService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, real numbers for the SIHU site. Every value is counted from a live
 * source (the SIHU Neon database, the KAI Information Hub, and the stories
 * published on this site). A source that can't be reached is reported as
 * unavailable (null) rather than replaced with an invented number.
 */
export type SihuStats = {
  stories: number;
  community: {
    members: number;
    posts: number;
    photos: number;
    videos: number;
    likes: number;
    comments: number;
    places: number;
    latestPostAt: string | null;
  } | null;
  hub: { news: number; podcasts: number; events: number; photos: number; videos: number } | null;
  updatedAt: string;
};

type Row = Record<string, unknown>;

async function communityStats(): Promise<SihuStats["community"]> {
  if (!hasDatabase) return null;
  try {
    await ensureSchema();
    const sql = getSql();
    // Public content only: the same privacy rules as the public feed.
    const rows = (await sql.query(
      `WITH pub AS (
         SELECT p.id, p.created_at, p.location_name FROM media_posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.visibility = 'public' AND u.is_private = FALSE AND u.is_suspended = FALSE
       )
       SELECT
         (SELECT COUNT(*)::int FROM users WHERE is_suspended = FALSE) AS members,
         (SELECT COUNT(*)::int FROM pub) AS posts,
         (SELECT COUNT(*)::int FROM media_images m WHERE m.post_id IN (SELECT id FROM pub) AND m.kind = 'image') AS photos,
         (SELECT COUNT(*)::int FROM media_images m WHERE m.post_id IN (SELECT id FROM pub) AND m.kind = 'video') AS videos,
         (SELECT COUNT(*)::int FROM media_likes l WHERE l.post_id IN (SELECT id FROM pub)) AS likes,
         (SELECT COUNT(*)::int FROM media_comments c WHERE c.post_id IN (SELECT id FROM pub)) AS comments,
         (SELECT COUNT(DISTINCT LOWER(TRIM(location_name)))::int FROM pub WHERE COALESCE(TRIM(location_name), '') <> '') AS places,
         (SELECT MAX(created_at) FROM pub) AS latest`,
    )) as Row[];
    const r = rows[0] ?? {};
    const n = (k: string) => Number(r[k]) || 0;
    return {
      members: n("members"),
      posts: n("posts"),
      photos: n("photos"),
      videos: n("videos"),
      likes: n("likes"),
      comments: n("comments"),
      places: n("places"),
      latestPostAt: r.latest ? new Date(String(r.latest)).toISOString() : null,
    };
  } catch (error) {
    console.error("[stats] community counts failed", error);
    return null;
  }
}

async function hubStats(): Promise<SihuStats["hub"]> {
  try {
    const items = await kaiItems();
    const count = (...kinds: string[]) => items.filter((i) => kinds.includes(i.kind)).length;
    return { news: count("news", "story"), podcasts: count("podcast"), events: count("activity"), photos: count("photo"), videos: count("video") };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const stats = await cached<SihuStats>("sihu:public-stats:v1", 120, async () => {
      const [community, hub] = await Promise.all([communityStats(), hubStats()]);
      return {
        stories: defaultArticles.length + (hub?.news ?? 0),
        community,
        hub,
        updatedAt: new Date().toISOString(),
      };
    });
    return NextResponse.json(stats, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("[stats]", error);
    return NextResponse.json({ error: "Statistics are unavailable right now." }, { status: 503 });
  }
}
