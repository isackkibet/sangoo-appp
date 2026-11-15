import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import {
  adminEmails,
  buildUsername,
  hashPassword,
  normalizeEmail,
  type UserRow,
} from "@/lib/auth";
import { cacheClearMemory, cacheDel, cacheGet, cacheSet } from "@/lib/cache";
import { getSql } from "@/lib/db";
import { ApiError } from "@/lib/media/api";
import { sanitizeText } from "@/lib/media/validation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ManagedAdmin = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_suspended: boolean;
  created_at: string | null;
  is_owner: boolean;
  is_self: boolean;
  password: string | null;
};

type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_suspended: boolean;
  created_at: string | Date;
  admin_password_enc: string | null;
  admin_revoked: boolean;
};

function ownerEmailSet(): Set<string> {
  return new Set(adminEmails().map((email) => normalizeEmail(email)));
}

/* Emails and starter passwords from SIHU_ADMIN_ACCOUNTS. These are owner
   admins and their password can be revealed on the Admins page. */
function envAccounts(): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of (process.env.SIHU_ADMIN_ACCOUNTS ?? "").split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;
    const email = normalizeEmail(trimmed.slice(0, separator));
    const password = trimmed.slice(separator + 1);
    if (email && password) map.set(email, password);
  }
  return map;
}

/* Admin-issued passwords are kept so the team can re-share them. They are
   encrypted with AES-256-GCM using the server secret, never stored in plain
   text. Any signed-in admin can reveal them on the Admins page. */
function passwordKey(): Buffer | null {
  const secret =
    process.env.SIHU_ADMIN_PASSWORD_SECRET?.trim() ||
    process.env.SIHU_ADMIN_SESSION_SECRET?.trim() ||
    process.env.SIHU_ADMIN_KEY?.trim();
  if (secret) return createHash("sha256").update(secret).digest();
  if (process.env.NODE_ENV !== "production") {
    return createHash("sha256").update("sango-admin-dev-password-secret").digest();
  }
  return null;
}

function encryptPassword(plain: string): string | null {
  const key = passwordKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

function decryptPassword(value: string | null): string | null {
  if (!value || !value.startsWith("v1.")) return null;
  const key = passwordKey();
  if (!key) return null;
  try {
    const [, ivB64, tagB64, dataB64] = value.split(".");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivB64, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

/* Owner admins come from SIHU_ADMIN_ACCOUNTS / SIHU_ADMIN_EMAILS and can
   never be removed from the dashboard, so there is always a way back in. */
export async function listManagedAdmins(selfEmail: string | null): Promise<ManagedAdmin[]> {
  const sql = getSql();
  const owners = ownerEmailSet();
  const ownerList = Array.from(owners);
  const envPasswords = envAccounts();
  const self = selfEmail ? normalizeEmail(selfEmail) : null;

  const rows = (await sql.query(
    `SELECT id, email, name, role, is_suspended, created_at, admin_password_enc, admin_revoked
     FROM users
     WHERE admin_revoked = FALSE
       AND (role IN ('admin', 'moderator') OR LOWER(email) = ANY($1))
     ORDER BY created_at ASC`,
    [ownerList],
  )) as AdminRow[];

  const seen = new Set<string>();
  const admins: ManagedAdmin[] = rows.map((row) => {
    const email = normalizeEmail(row.email);
    seen.add(email);
    return {
      id: row.id,
      email,
      name: row.name,
      role: owners.has(email) && row.role === "reader" ? "owner" : row.role,
      is_suspended: Boolean(row.is_suspended),
      created_at: new Date(row.created_at).toISOString(),
      is_owner: owners.has(email),
      is_self: self !== null && email === self,
      password: decryptPassword(row.admin_password_enc) ?? envPasswords.get(email) ?? null,
    };
  });

  for (const email of ownerList) {
    if (seen.has(email)) continue;
    admins.push({
      id: `owner:${email}`,
      email,
      name: null,
      role: "owner",
      is_suspended: false,
      created_at: null,
      is_owner: true,
      is_self: self !== null && email === self,
      password: envPasswords.get(email) ?? null,
    });
  }

  return admins.sort((a, b) => {
    if (a.is_owner !== b.is_owner) return a.is_owner ? -1 : 1;
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

export async function addManagedAdmin(input: {
  email: string;
  name?: string;
  password: string;
}): Promise<{ id: string; email: string; created: boolean }> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new ApiError("Enter a valid email address.", 400);
  }
  if (input.password.length < 8 || input.password.length > 200) {
    throw new ApiError("Password must be at least 8 characters.", 400);
  }

  const name = sanitizeText(input.name ?? "", 120);
  const passwordHash = await hashPassword(input.password);
  const passwordEnc = encryptPassword(input.password);
  const sql = getSql();

  const existing = (await sql.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [email],
  )) as UserRow[];
  const user = existing[0];

  if (user) {
    const displayName = name || user.name || email.split("@")[0];
    await sql.query(
      `UPDATE users
       SET role = 'admin', password_hash = $1, admin_password_enc = $2,
           name = $3, is_suspended = FALSE, admin_revoked = FALSE, updated_at = NOW()
       WHERE id = $4`,
      [passwordHash, passwordEnc, displayName, user.id],
    );
    await sql.query("DELETE FROM sessions WHERE user_id = $1", [user.id]);
    await cacheDel(`sihu:admin-revoked:${email}`);
    cacheClearMemory();
    return { id: user.id, email, created: false };
  }

  const id = randomUUID();
  const username = await buildUsername(name || email.split("@")[0], id);
  await sql.query(
    `INSERT INTO users (id, email, name, username, password_hash, admin_password_enc, email_verified, role, admin_revoked)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'admin', FALSE)`,
    [id, email, name || email.split("@")[0], username, passwordHash, passwordEnc],
  );
  await cacheDel(`sihu:admin-revoked:${email}`);
  return { id, email, created: true };
}

export async function removeManagedAdmin(
  id: string,
  actorEmail: string | null,
): Promise<{ email: string }> {
  const sql = getSql();

  let targetId = id;
  let emailFilter = "";
  if (id.startsWith("owner:")) {
    emailFilter = normalizeEmail(id.slice("owner:".length));
  }

  const rows = (await sql.query(
    `SELECT id, email, role, admin_revoked FROM users
     WHERE ($1 <> '' AND LOWER(email) = $1) OR ($1 = '' AND id = $2)
     LIMIT 1`,
    [emailFilter, targetId],
  )) as Pick<AdminRow, "id" | "email" | "role" | "admin_revoked">[];
  const target = rows[0];
  if (!target) {
    throw new ApiError(
      "This admin has no local account yet. Use Reset password first, then remove.",
      404,
    );
  }
  targetId = target.id;

  const email = normalizeEmail(target.email);
  if (actorEmail && normalizeEmail(actorEmail) === email) {
    throw new ApiError("You cannot remove your own admin access.", 403);
  }

  const isEnvOwner = ownerEmailSet().has(email);
  if (!isEnvOwner && !["admin", "moderator"].includes(target.role)) {
    throw new ApiError("Admin not found.", 404);
  }

  await sql.query(
    `UPDATE users
     SET role = 'reader', admin_revoked = TRUE, admin_password_enc = NULL, updated_at = NOW()
     WHERE id = $1`,
    [targetId],
  );
  await sql.query("DELETE FROM sessions WHERE user_id = $1", [targetId]);
  await cacheDel(`sihu:admin-revoked:${email}`);
  cacheClearMemory();
  return { email };
}

/* Called for the legacy admin-password session so removed owners cannot
   keep using an old admin cookie. */
export async function isEmailAdminRevoked(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const cacheKey = `sihu:admin-revoked:${normalized}`;
  const cached = await cacheGet<boolean>(cacheKey);
  if (cached !== null) return cached;

  const sql = getSql();
  const rows = (await sql.query(
    `SELECT admin_revoked FROM users WHERE LOWER(email) = $1 LIMIT 1`,
    [normalized],
  )) as { admin_revoked: boolean }[];
  const revoked = Boolean(rows[0]?.admin_revoked);
  await cacheSet(cacheKey, revoked, 60);
  return revoked;
}
