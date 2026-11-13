import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { ApiError, handleError, limitRequest, requireMediaUser } from "@/lib/media/api";
import { getProfile, updateProfile, type ProfileUpdateInput } from "@/lib/media/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in member's username (assigned automatically at sign-up). */
async function ownUsername(userId: string): Promise<string> {
  const rows = (await getSql().query("SELECT username FROM users WHERE id = $1 LIMIT 1", [userId])) as { username: string | null }[];
  const username = rows[0]?.username;
  if (!username) throw new ApiError("Account not found.", 404);
  return username;
}

/** GET: your own profile with real post / follower / following counts. */
export async function GET() {
  try {
    const user = await requireMediaUser();
    const profile = await getProfile(await ownUsername(user.id), user.id);
    if (!profile) throw new ApiError("Account not found.", 404);
    return NextResponse.json(profile, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH: edit your own profile. Only the fields sent are changed.
 * { name?, username?, bio?, location?, website?, isPrivate? }
 * Validation (length, allowed characters, unique username, valid URL) is in updateProfile.
 */
export async function PATCH(req: Request) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "profile-edit", 20, 60_000);
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") throw new ApiError("Invalid request.", 400);

    const input: ProfileUpdateInput = {};
    const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string) : undefined);
    if (str("name") !== undefined) {
      const name = str("name")!.trim();
      if (name.length < 2) throw new ApiError("Your name must be at least 2 characters.", 400);
      input.name = name;
    }
    if (str("username") !== undefined) input.username = str("username");
    if (str("bio") !== undefined) input.bio = str("bio");
    if (str("location") !== undefined) input.location = str("location");
    if (str("website") !== undefined) input.website = str("website");
    if (typeof body.isPrivate === "boolean") input.isPrivate = body.isPrivate;

    try {
      const { user: updated } = await updateProfile(user.id, input);
      return NextResponse.json({ user: updated }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      // updateProfile reports validation problems (taken username, bad URL…) as plain errors.
      if (error instanceof ApiError) throw error;
      throw new ApiError(error instanceof Error ? error.message : "Could not update your profile.", 400);
    }
  } catch (error) {
    return handleError(error);
  }
}
