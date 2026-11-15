import { NextResponse } from "next/server";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { listAdminPosts } from "@/lib/media/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const params = new URL(req.url).searchParams;
    const posts = await listAdminPosts(params.get("q") ?? "", Number(params.get("limit")) || 60);
    return NextResponse.json({ posts });
  } catch (error) {
    return handleError(error);
  }
}
