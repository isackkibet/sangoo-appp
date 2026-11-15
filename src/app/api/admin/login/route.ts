import { NextResponse } from "next/server";
import { isEmailAdminRevoked } from "@/lib/admin/accounts";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin/auth";
import { ensureSchema, hasDatabase } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const limited = rateLimit(`admin-login:${clientIp(req)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Wait a minute." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { ok: false, error: "Email and password are required." },
      { status: 400 },
    );
  }

  const account = verifyAdminCredentials(body.email, body.password);
  if (!account) {
    return NextResponse.json(
      { ok: false, error: "Wrong email or password." },
      { status: 401 },
    );
  }

  if (hasDatabase) {
    await ensureSchema().catch(() => {});
    const revoked = await isEmailAdminRevoked(account.email).catch(() => true);
    if (revoked) {
      return NextResponse.json(
        { ok: false, error: "This admin access has been removed." },
        { status: 401 },
      );
    }
  }

  const token = createAdminSessionToken(account.email);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured." },
      { status: 500 },
    );
  }

  const res = NextResponse.json({ ok: true, email: account.email });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}
