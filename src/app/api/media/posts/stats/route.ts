import { NextResponse } from "next/server";
import { ApiError, handleError, limitRequest, optionalMediaUser } from "@/lib/media/api";
import { postStats } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live engagement counts for posts on screen, so every member sees the same
 * numbers without reloading: GET /api/media/posts/stats?ids=a,b,c (max 50).
 * Only posts the viewer may see are returned. Always read fresh from the database.
 */
export async function GET(req: Request) {
  try {
    limitRequest(req, "post-stats", 120, 60_000);
    const raw = new URL(req.url).searchParams.get("ids") ?? "";
    const ids = raw.split(",").map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_-]{1,64}$/.test(s));
    if (ids.length > 50) throw new ApiError("Too many posts requested (max 50).", 400);
    const user = await optionalMediaUser();
    const stats = await postStats(ids, user?.id ?? null);
    return NextResponse.json({ stats }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
