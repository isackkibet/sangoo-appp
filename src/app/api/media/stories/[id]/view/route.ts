import { NextResponse } from "next/server";
import { handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { viewStory } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/stories/[id]/view">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "story-view", 240, 60_000);
    const { id } = await ctx.params;
    await viewStory(id, user.id);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
