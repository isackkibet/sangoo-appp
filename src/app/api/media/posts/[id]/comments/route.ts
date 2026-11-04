import { NextResponse } from "next/server";
import {
  handleError,
  limitRequest,
  optionalMediaUser,
  readJson,
  requireMediaUser,
} from "@/lib/media/api";
import { addComment, listComments } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/comments">,
) {
  try {
    const { id } = await ctx.params;
    const user = await optionalMediaUser();
    const comments = await listComments(id, user?.id ?? null);
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/media/posts/[id]/comments">,
) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "comment", 40, 60_000);
    const { id } = await ctx.params;
    const body = await readJson<{ content?: unknown; parentId?: unknown }>(req);
    const comment = await addComment(
      id,
      user.id,
      typeof body.content === "string" ? body.content : "",
      typeof body.parentId === "string" && body.parentId ? body.parentId : null,
    );
    return NextResponse.json(
      { comment },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleError(error);
  }
}
