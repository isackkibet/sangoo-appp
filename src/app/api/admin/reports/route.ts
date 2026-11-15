import { NextResponse } from "next/server";
import {
  adminActorId,
  handleError,
  requireAdminRequest,
} from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { ApiError, readJson, searchParam } from "@/lib/media/api";
import { listReports, updateReportStatus } from "@/lib/media/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const reports = await listReports(searchParam(req, "status"), 100);
    return NextResponse.json({ reports });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const body = await readJson<{ id?: string; status?: string }>(req);
    const id = body.id?.trim();
    const status = body.status?.trim();
    if (!id || !status || !STATUSES.has(status)) {
      throw new ApiError("Choose a valid report and status.", 400);
    }
    const ok = await updateReportStatus(id, await adminActorId(), status);
    if (!ok) throw new ApiError("Report not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
