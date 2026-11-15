import { NextResponse } from "next/server";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { ensureSchema } from "@/lib/db";
import { ApiError, readJson } from "@/lib/media/api";
import { listAdminUsers, moderateUser } from "@/lib/media/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set([
  "suspend",
  "unsuspend",
  "verify",
  "unverify",
  "make-reporter",
]);

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const params = new URL(req.url).searchParams;
    const users = await listAdminUsers(
      params.get("q") ?? "",
      Number(params.get("limit")) || 60,
    );
    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const body = await readJson<{ id?: string; action?: string; reason?: string }>(req);
    const id = body.id?.trim();
    const action = body.action?.trim();
    if (!id || !action || !ACTIONS.has(action)) {
      throw new ApiError("Choose a valid user action.", 400);
    }
    const ok = await moderateUser(
      id,
      action as "suspend" | "unsuspend" | "verify" | "unverify" | "make-reporter",
      body.reason ?? "",
    );
    if (!ok) throw new ApiError("User not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
