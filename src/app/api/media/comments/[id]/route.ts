import { NextResponse } from "next/server";
import { handleError, requireMediaUser } from "@/lib/media/api";
import { deleteComment } from "@/lib/media/service";
import { isPlatformAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/media/comments/[id]">,
) {
  try {
    const user = await requireMediaUser();
    const { id } = await ctx.params;
    const removed = await deleteComment(id, user.id, isPlatformAdmin(user));
    if (!removed) {
      return NextResponse.json({ error: "Comment not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
