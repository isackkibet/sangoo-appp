import { NextResponse } from "next/server";
import { cleanupExpiredStories } from "@/lib/media/service";
import { isAdmin } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    return req.headers.get("authorization") === `Bearer ${secret}`;
  }
  if (req.headers.get("x-vercel-cron-schedule")) return true;
  if (req.headers.get("user-agent")?.startsWith("vercel-cron/")) return true;
  if (isAdmin(req)) return true;
  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await cleanupExpiredStories();
    return NextResponse.json(
      { ok: true, ranAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Story cleanup cron failed:", error);
    return NextResponse.json(
      { error: "Could not clean up expired stories." },
      { status: 500 },
    );
  }
}
