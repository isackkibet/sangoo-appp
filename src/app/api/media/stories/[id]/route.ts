import { NextResponse } from "next/server";
import {
  handleError,
  requireMediaAdmin,
  requireMediaUser,
} from "@/lib/media/api";
import { deleteStory } from "@/lib/media/service";
import { isPlatformAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/media/stories/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const user = await requireMediaUser();
    const admin = isPlatformAdmin(user);
    if (admin) {
      await requireMediaAdmin(req);
    }
    const removed = await deleteStory(id, user.id, admin);
    if (!removed) {
      return NextResponse.json({ error: "Story not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
