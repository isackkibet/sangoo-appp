import { NextResponse } from "next/server";
import { handleError, optionalMediaUser } from "@/lib/media/api";
import { listFollows } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/media/users/[username]/followers">,
) {
  try {
    const { username } = await ctx.params;
    const user = await optionalMediaUser();
    const followers = await listFollows(username, "followers", user?.id ?? null);
    return NextResponse.json({ users: followers }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleError(error);
  }
}
