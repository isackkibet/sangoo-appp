import { NextResponse } from "next/server";
import { isEmailAdminRevoked } from "@/lib/admin/accounts";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionFromRequest,
} from "@/lib/admin/auth";
import { getActiveSessionUser, isPlatformAdmin } from "@/lib/auth";
import { ensureSchema } from "@/lib/db";
import { clientIp, isAdmin, rateLimit } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (isAdmin(req)) {
    return NextResponse.json({ authenticated: true, email: null, method: "key" });
  }
  const session = adminSessionFromRequest(req);
  if (session) {
    await ensureSchema().catch(() => {});
    const revoked = await isEmailAdminRevoked(session.email).catch(() => true);
    if (!revoked) {
      return NextResponse.json({
        authenticated: true,
        email: session.email,
        method: "password",
      });
    }
  }
  const user = await getActiveSessionUser().catch(() => null);
  if (isPlatformAdmin(user)) {
    return NextResponse.json({
      authenticated: true,
      email: user?.email ?? null,
      method: "account",
    });
  }
  return NextResponse.json(
    { authenticated: false },
    { status: 401 },
  );
}

export async function POST(req: Request) {
  const limited = rateLimit(`admin-session:${clientIp(req)}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Wait a minute." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Wrong admin key." }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
