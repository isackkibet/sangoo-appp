import { NextResponse } from "next/server";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { listAdminStories } from "@/lib/media/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const params = new URL(req.url).searchParams;
    const stories = await listAdminStories(
      params.get("q") ?? "",
      Number(params.get("limit")) || 60,
    );
    return NextResponse.json({ stories });
  } catch (error) {
    return handleError(error);
  }
}
