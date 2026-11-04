import { NextResponse } from "next/server";
import { handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { toggleSave } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/save">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "save", 120, 60_000);
    const { id } = await ctx.params;
    const result = await toggleSave(id, user.id);
    if (!result) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}
