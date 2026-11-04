import { NextResponse } from "next/server";
import { handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { toggleFollow } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/users/[username]/follow">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "follow", 80, 60_000);
    const { username } = await ctx.params;
    const result = await toggleFollow(user.id, username);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
