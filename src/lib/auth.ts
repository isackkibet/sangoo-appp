import { cookies } from "next/headers";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { getSql, hasDatabase } from "@/lib/db";
import { mediaUsername } from "@/lib/media/user";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = "sihu_session";
export const OAUTH_STATE_COOKIE = "sihu_oauth_state";
export const OAUTH_NEXT_COOKIE = "sihu_oauth_next";

const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
  username: string;
  bio: string;
  website: string | null;
  location: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  isSuspended: boolean;
  reporterVerified: boolean;
};

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  password_hash: string | null;
  google_id: string | null;
  email_verified: boolean;
  role: string;
  created_at: string | Date;
  username?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  is_verified?: boolean;
  is_private?: boolean;
  is_suspended?: boolean;
  reporter_verified?: boolean;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function publicUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
    username: row.username || mediaUsername(row.name, row.email),
    bio: row.bio ?? "",
    website: row.website ?? null,
    location: row.location ?? null,
    isVerified: Boolean(row.is_verified),
    isPrivate: Boolean(row.is_private),
    isSuspended: Boolean(row.is_suspended),
    reporterVerified: Boolean(row.reporter_verified),
  };
}

export function adminEmails(): string[] {
  return (process.env.SIHU_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function isPlatformAdmin(
  user: Pick<AuthUser, "role" | "email"> | null,
): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "moderator") return true;
  return adminEmails().includes(normalizeEmail(user.email));
}

export async function getActiveSessionUser(): Promise<AuthUser | null> {
  const user = await getSessionUser();
  if (!user || user.isSuspended) return null;
  return user;
}

export async function buildUsername(
  preferred: string,
  id: string,
): Promise<string> {
  const base =
    preferred
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .replace(/^[._]+|[._]+$/g, "")
      .slice(0, 20) || "member";
  const candidates = [
    base.length >= 3 ? base : `${base}_sihu`,
    `${base}_${id.slice(0, 4)}`.slice(0, 30),
    `${base}_${id.slice(0, 8)}`.slice(0, 30),
  ];
  const sql = getSql();
  for (const candidate of candidates) {
    const rows = (await sql.query(
      "SELECT 1 FROM users WHERE LOWER(username) = $1 LIMIT 1",
      [candidate],
    )) as unknown[];
    if (rows.length === 0) return candidate;
  }
  return `${base}_${Date.now().toString(36)}`.slice(0, 30);
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [normalizeEmail(email)],
  )) as UserRow[];
  return rows[0] ?? null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  if (!hasDatabase) throw new Error("Database is not configured.");

  const sql = getSql();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await sql.query("DELETE FROM sessions WHERE expires_at < NOW()");
  await sql.query(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [randomUUID(), userId, tokenHash, expiresAt.toISOString()],
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  if (!hasDatabase) return null;

  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const sql = getSql();
    const rows = (await sql.query(
      `SELECT u.*
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)],
    )) as UserRow[];

    const row = rows[0];
    return row ? publicUser(row) : null;
  } catch (error) {
    console.error("Failed to read session:", error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token && hasDatabase) {
    try {
      const sql = getSql();
      await sql.query("DELETE FROM sessions WHERE token_hash = $1", [
        hashToken(token),
      ]);
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  }

  store.delete(SESSION_COOKIE);
}

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/^\/(?![/\\])/.test(value)) return null;
  if (value.startsWith("/login")) return null;
  return value;
}

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function googleRedirectUri(requestUrl: string): string {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured;
  return `${new URL(requestUrl).origin}/api/auth/google/callback`;
}
