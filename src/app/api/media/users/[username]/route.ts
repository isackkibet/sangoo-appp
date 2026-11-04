import { NextResponse } from "next/server";
import {
  handleError,
  optionalMediaUser,
  searchParam,
} from "@/lib/media/api";
import { getProfile } from "@/lib/media/service";
import { clampInt } from "@/lib/media/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/media/users/[username]">,
) {
  try {
    const { username } = await ctx.params;
    const user = await optionalMediaUser();
    const profile = await getProfile(
      username,
      user?.id ?? null,
      clampInt(searchParam(req, "cursor"), 0, 100000, 0),
    );
    if (!profile) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleError(error);
  }
}
