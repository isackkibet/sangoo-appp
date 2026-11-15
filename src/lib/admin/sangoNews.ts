import { randomUUID } from "node:crypto";
import { ensureSchema, getSql } from "@/lib/db";
import { extractYouTubeId } from "@/lib/youtube";

export type SangoNewsVideoRecord = {
  id: string;
  url: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  createdAt: string;
};

type Row = Record<string, unknown>;

function rowToVideo(row: Row): SangoNewsVideoRecord {
  return {
    id: String(row.id),
    url: String(row.url ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    source: String(row.source ?? ""),
    publishedAt: new Date(row.published_at as string | Date).toISOString(),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export async function listSangoNewsVideos(limit = 100): Promise<SangoNewsVideoRecord[]> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT id, url, title, description, source, published_at, created_at
     FROM sango_news_videos
     ORDER BY published_at DESC, created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)],
  )) as Row[];
  return rows.map(rowToVideo);
}

export async function addSangoNewsVideo(input: {
  url: string;
  title: string;
  description?: string;
  source?: string;
  publishedAt?: string;
}): Promise<SangoNewsVideoRecord> {
  const url = input.url.trim();
  if (!extractYouTubeId(url)) {
    throw new Error("Enter a valid YouTube video link.");
  }
  const title = input.title.trim().slice(0, 240);
  if (title.length < 3) throw new Error("Add a title for the video.");

  await ensureSchema();
  const sql = getSql();
  const id = randomUUID();
  const publishedAt = input.publishedAt?.trim() || new Date().toISOString();
  const rows = (await sql.query(
    `INSERT INTO sango_news_videos (id, url, title, description, source, published_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, url, title, description, source, published_at, created_at`,
    [
      id,
      url,
      title,
      input.description?.trim().slice(0, 2000) ?? "",
      input.source?.trim().slice(0, 120) ?? "",
      publishedAt,
    ],
  )) as Row[];
  return rowToVideo(rows[0]);
}

export async function deleteSangoNewsVideo(id: string): Promise<boolean> {
  await ensureSchema();
  const sql = getSql();
  const rows = (await sql.query(
    "DELETE FROM sango_news_videos WHERE id = $1 RETURNING id",
    [id],
  )) as { id: string }[];
  return rows.length > 0;
}
