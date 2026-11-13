import { NextResponse } from "next/server";
import { ApiError, handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { recordShare, SHARE_CHANNELS, type ShareChannel } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Record that the signed-in member shared a post.
 * Body: { channel: "native" | "link" | "whatsapp" | "x" | "facebook" | "telegram" }
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/share">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "share", 60, 60_000);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { channel?: unknown };
    const channel = typeof body.channel === "string" ? body.channel : "link";
    if (!(SHARE_CHANNELS as readonly string[]).includes(channel)) {
      throw new ApiError("Unknown share channel.", 400);
    }
    const result = await recordShare(id, user.id, channel as ShareChannel);
    if (!result) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
