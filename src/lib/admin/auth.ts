import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "sihu_admin_session";
export const ADMIN_SESSION_MAX_AGE = 8 * 60 * 60;
const SESSION_TTL_MS = ADMIN_SESSION_MAX_AGE * 1000;

export type AdminSession = {
  email: string;
  exp: number;
};

function configuredAccounts(): Record<string, string> {
  const raw = process.env.SIHU_ADMIN_ACCOUNTS?.trim() ?? "";
  const accounts: Record<string, string> = {};

  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf(":");
    if (separator <= 0) continue;
    const email = trimmed.slice(0, separator).trim().toLowerCase();
    const password = trimmed.slice(separator + 1);
    if (email && password) accounts[email] = password;
  }

  // Local development defaults. Production must set SIHU_ADMIN_ACCOUNTS.
  if (Object.keys(accounts).length === 0 && process.env.NODE_ENV !== "production") {
    accounts["austinnamuye@gmail.com"] = "austin2026";
    accounts["isackkibet97@gmail.com"] = "isack2026";
  }

  return accounts;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyAdminCredentials(
  email: string,
  password: string,
): { email: string } | null {
  const normalized = email.trim().toLowerCase();
  const expected = configuredAccounts()[normalized];
  if (!expected) return null;
  if (!safeEqual(password, expected)) return null;
  return { email: normalized };
}

function sessionSecret(): string | null {
  const configured =
    process.env.SIHU_ADMIN_SESSION_SECRET?.trim() ||
    process.env.SIHU_ADMIN_KEY?.trim();
  if (configured && configured.length >= 16) return configured;
  if (process.env.NODE_ENV !== "production") return "sango-admin-dev-session-secret";
  return null;
}

export function createAdminSessionToken(email: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
): AdminSession | null {
  if (!token) return null;
  const secret = sessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;
    if (typeof data.email !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    if (!configuredAccounts()[data.email]) return null;
    return { email: data.email, exp: data.exp };
  } catch {
    return null;
  }
}

export function adminSessionFromRequest(req: Request): AdminSession | null {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_SESSION_COOKIE) {
      return verifyAdminSessionToken(decodeURIComponent(rest.join("=")));
    }
  }
  return null;
}
