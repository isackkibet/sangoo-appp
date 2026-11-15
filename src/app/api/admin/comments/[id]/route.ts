import { NextResponse } from "next/server";
import { adminActorId, handleError, requireAdminRequest } from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { ApiError } from "@/lib/media/api";
import { deleteComment } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const { id } = await ctx.params;
    const removed = await deleteComment(id, (await adminActorId()) ?? "admin", true);
    if (!removed) throw new ApiError("Comment not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
