import { NextResponse } from "next/server";
import {
  createSession,
  findUserByEmail,
  normalizeEmail,
  publicUser,
  verifyPassword,
} from "@/lib/auth";
import { ensureSchema, hasDatabase } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasDatabase) {
    return NextResponse.json(
      { error: "Sign-in is not configured yet." },
      { status: 503 },
    );
  }

  const limit = rateLimit(`login:${clientIp(req)}`, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }

  try {
    await ensureSchema();

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }
    if (user.is_suspended) {
      return NextResponse.json(
        { error: "This account is suspended. Contact the SIHU team for help." },
        { status: 403 },
      );
    }

    await createSession(user.id);

    return NextResponse.json(
      { user: publicUser(user) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Sign-in failed:", error);
    return NextResponse.json(
      { error: "Could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}
