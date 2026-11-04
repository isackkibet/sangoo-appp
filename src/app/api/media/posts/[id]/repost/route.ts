import { NextResponse } from "next/server";
import { handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { toggleRepost } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/repost">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "repost", 60, 60_000);
    const { id } = await ctx.params;
    const result = await toggleRepost(id, user.id);
    if (!result) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
