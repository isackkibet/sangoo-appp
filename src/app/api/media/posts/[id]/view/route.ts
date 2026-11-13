import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { handleError, limitRequest, optionalMediaUser } from "@/lib/media/api";
import { recordView } from "@/lib/media/service";
import { clientIp } from "@/lib/security/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record a genuine view of a post. The client only calls this after the post
 * has been on screen for a moment; the database then counts each viewer at
 * most once per post per day and never counts the author.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/view">,
) {
  try {
    limitRequest(req, "post-view", 300, 60_000);
    const user = await optionalMediaUser();
    const { id } = await ctx.params;

    // Members are identified by account; visitors by a salted, daily-rotating
    // hash of network + browser (no raw IP is stored).
    const viewerKey = user
      ? `u:${user.id}`
      : `a:${createHash("sha256")
          .update(`${clientIp(req)}|${req.headers.get("user-agent") ?? ""}|${new Date().toISOString().slice(0, 10)}|${process.env.AI_SETTINGS_SECRET ?? process.env.DATABASE_URL ?? "sihu"}`)
          .digest("hex")
          .slice(0, 40)}`;

    const result = await recordView(id, viewerKey, user?.id ?? null);
    if (!result) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
