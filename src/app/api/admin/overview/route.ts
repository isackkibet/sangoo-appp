import { NextResponse } from "next/server";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { adminStats, listAdminPosts, listReports } from "@/lib/media/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const [stats, reports, posts] = await Promise.all([
      adminStats(),
      listReports("open", 6),
      listAdminPosts("", 5),
    ]);
    return NextResponse.json({ stats, reports, posts });
  } catch (error) {
    return handleError(error);
  }
}
