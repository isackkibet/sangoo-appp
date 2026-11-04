import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  buildUsername,
  createSession,
  findUserByEmail,
  hashPassword,
  normalizeEmail,
  publicUser,
  type UserRow,
} from "@/lib/auth";
import { ensureSchema, getSql, hasDatabase } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!hasDatabase) {
    return NextResponse.json(
      { error: "Sign-up is not configured yet." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`signup:${clientIp(req)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  try {
    await ensureSchema();

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 },
      );
    }

    const id = randomUUID();
    const passwordHash = await hashPassword(password);
    const username = await buildUsername(
      name || email.split("@")[0],
      id,
    );
    const sql = getSql();
    const rows = (await sql.query(
      `INSERT INTO users (id, email, name, username, password_hash, email_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [id, email, name || email.split("@")[0], username, passwordHash],
    )) as UserRow[];

    await createSession(id);

    return NextResponse.json(
      { user: publicUser(rows[0]) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Sign-up failed:", error);
    return NextResponse.json(
      { error: "Could not create your account. Please try again." },
      { status: 500 },
    );
  }
}
