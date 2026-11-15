import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/admin/auth";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { removeManagedAdmin } from "@/lib/admin/accounts";
import { getActiveSessionUser } from "@/lib/auth";
import { ensureSchema } from "@/lib/db";

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
    const user = await getActiveSessionUser().catch(() => null);
    const selfEmail =
      user?.email ?? adminSessionFromRequest(req)?.email ?? null;
    const result = await removeManagedAdmin(id, selfEmail);
    return NextResponse.json({ ok: true, email: result.email });
  } catch (error) {
    return handleError(error);
  }
}
