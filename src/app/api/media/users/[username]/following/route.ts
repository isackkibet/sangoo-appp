import { NextResponse } from "next/server";
import { handleError, optionalMediaUser } from "@/lib/media/api";
import { listFollows } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/media/users/[username]/following">,
) {
  try {
    const { username } = await ctx.params;
    const user = await optionalMediaUser();
    const following = await listFollows(username, "following", user?.id ?? null);
    return NextResponse.json({ users: following }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleError(error);
  }
}
