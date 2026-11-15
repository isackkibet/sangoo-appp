import { NextResponse } from "next/server";
import { adminSessionFromRequest } from "@/lib/admin/auth";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import { addManagedAdmin, listManagedAdmins } from "@/lib/admin/accounts";
import { getActiveSessionUser } from "@/lib/auth";
import { ensureSchema } from "@/lib/db";
import { ApiError, readJson } from "@/lib/media/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function actorEmail(req: Request): Promise<string | null> {
  const user = await getActiveSessionUser().catch(() => null);
  return user?.email ?? adminSessionFromRequest(req)?.email ?? null;
}

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const selfEmail = await actorEmail(req);
    const admins = await listManagedAdmins(selfEmail);
    return NextResponse.json({ admins, selfEmail });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);
    await ensureSchema();
    const body = await readJson<{
      email?: unknown;
      name?: unknown;
      password?: unknown;
    }>(req);

    if (typeof body.email !== "string" || typeof body.password !== "string") {
      throw new ApiError("Email and password are required.", 400);
    }

    const result = await addManagedAdmin({
      email: body.email,
      name: typeof body.name === "string" ? body.name : "",
      password: body.password,
    });

    return NextResponse.json({
      ok: true,
      id: result.id,
      email: result.email,
      created: result.created,
    });
  } catch (error) {
    return handleError(error);
  }
}
