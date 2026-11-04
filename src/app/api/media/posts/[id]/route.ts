import { NextResponse } from "next/server";
import {
  handleError,
  optionalMediaUser,
  requireMediaUser,
  requireMediaAdmin,
} from "@/lib/media/api";
import { deletePost, getPost } from "@/lib/media/service";
import { isPlatformAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/media/posts/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const user = await optionalMediaUser();
    const post = await getPost(id, user?.id ?? null);
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ post }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]">,
) {
  try {
    const { id } = await ctx.params;
    const user = await requireMediaUser();
    const admin = isPlatformAdmin(user);
    if (admin) {
      await requireMediaAdmin(req);
    }
    const removed = await deletePost(id, user.id, admin);
    if (!removed) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
