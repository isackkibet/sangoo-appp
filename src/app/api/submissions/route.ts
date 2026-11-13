import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSql, hasDatabase } from "@/lib/db";
import { clientIp, isAdmin, rateLimit } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Story, podcast and event submissions from the public forms on /portal/submit.
 * Saved to the SIHU database as "pending" for the editors to review.
 * Previously the forms only pretended to send, and nothing was kept.
 *
 *   POST /api/submissions               — anyone (rate-limited)
 *   GET  /api/submissions?status=pending — editors only (x-admin-key: SIHU_ADMIN_KEY)
 */

const KINDS = new Set(["article", "podcast", "event"]);
const MAX_FIELD = 200;
const MAX_TEXT = 20_000;

let tableReady: Promise<void> | null = null;
function ensureTable() {
  if (!tableReady) {
    const sql = getSql();
    tableReady = (async () => {
      await sql.query(`CREATE TABLE IF NOT EXISTS content_submissions (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await sql.query(`CREATE INDEX IF NOT EXISTS idx_content_submissions_status ON content_submissions (status, created_at DESC)`);
    })().catch((e) => { tableReady = null; throw e; });
  }
  return tableReady;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (!hasDatabase) return NextResponse.json({ error: "Submissions are unavailable right now. Please email sangoinformationhub@gmail.com." }, { status: 503 });
  const limit = rateLimit(`submit:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const kind = clean(body.kind, 20);
  const data = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;
  const title = clean(data.title, MAX_FIELD);
  const name = clean(data.author ?? data.host ?? data.organiser ?? data.name, MAX_FIELD);
  const email = clean(data.email, MAX_FIELD);
  if (!KINDS.has(kind)) return NextResponse.json({ error: "Unknown submission type." }, { status: 400 });
  if (!title || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Title, your name and a valid email are required." }, { status: 400 });
  }

  // Keep only short string / string-list fields; drop anything else.
  const payload: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(data).slice(0, 30)) {
    if (typeof v === "string") payload[k.slice(0, 40)] = clean(v, k === "content" || k === "description" ? MAX_TEXT : 2000);
    else if (Array.isArray(v)) payload[k.slice(0, 40)] = v.filter((x): x is string => typeof x === "string").slice(0, 20).map((x) => clean(x, 60));
  }

  try {
    await ensureTable();
    const id = randomUUID();
    await getSql().query(
      `INSERT INTO content_submissions (id, kind, title, name, email, payload) VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [id, kind, title, name, email, JSON.stringify(payload)],
    );
    return NextResponse.json({ id, status: "pending" }, { status: 201 });
  } catch (error) {
    console.error("[submissions] save failed", error);
    return NextResponse.json({ error: "We could not save your submission. Please try again, or email sangoinformationhub@gmail.com." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!hasDatabase) return NextResponse.json({ submissions: [] });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  await ensureTable();
  const rows = await getSql().query(
    `SELECT id, kind, title, name, email, payload, status, created_at FROM content_submissions WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
    [status],
  );
  return NextResponse.json({ submissions: rows }, { headers: { "Cache-Control": "no-store" } });
}
