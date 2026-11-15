import { isEmailAdminRevoked } from "@/lib/admin/accounts";
import { adminSessionFromRequest } from "@/lib/admin/auth";
import { getActiveSessionUser, isPlatformAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/media/api";
import { isAdmin } from "@/lib/security/guard";

export { handleError } from "@/lib/media/api";

export async function requireAdminRequest(req: Request): Promise<void> {
  if (isAdmin(req)) return;
  const session = adminSessionFromRequest(req);
  if (session) {
    let revoked = true;
    try {
      revoked = await isEmailAdminRevoked(session.email);
    } catch {
      /* treat an unreadable revocation flag as revoked */
    }
    if (!revoked) return;
  }
  try {
    const user = await getActiveSessionUser();
    if (isPlatformAdmin(user)) return;
  } catch {
    /* fall through */
  }
  throw new ApiError("Admin access required.", 401);
}

export async function adminActorId(): Promise<string | null> {
  try {
    const user = await getActiveSessionUser();
    return isPlatformAdmin(user) ? user?.id ?? null : null;
  } catch {
    return null;
  }
}
