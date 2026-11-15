import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Small server-side guards for SIHU's API routes.
 *
 * isAdmin: the x-admin-key header must equal SIHU_ADMIN_KEY (set in
 * Vercel) or ADMIN_PASSWORD. Fails closed: with no key configured, nobody
 * is an admin. Local development falls back to a dev-only key.
 *
 * rateLimit: a per-IP counter per server instance. Vercel runs a few
 * instances, so this is a brake on abuse, not an exact quota.
 */

const DEV_ADMIN_KEY = "sango-admin-dev-key";

function adminKeys(): string[] {
  const keys = [process.env.SIHU_ADMIN_KEY, process.env.ADMIN_PASSWORD]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value.length >= 8));
  // Local development has no configured key by default. Production fails
  // closed unless SIHU_ADMIN_KEY (or ADMIN_PASSWORD) is set.
  if (process.env.NODE_ENV !== "production") keys.push(DEV_ADMIN_KEY);
  return keys;
}

export function isAdmin(req: Request): boolean {
  const provided = req.headers.get("x-admin-key")?.trim();
  if (!provided) return false;
  const a = createHash("sha256").update(provided).digest();
  return adminKeys().some((key) =>
    timingSafeEqual(a, createHash("sha256").update(key).digest()),
  );
}

export function clientIp(req: Request): string {
  return req.headers.get("x-real-ip")?.trim()
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
}

const buckets = new Map<string, { count: number; resetAt: number }>();

/** true when the caller is still under `limit` requests per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  const b = buckets.get(key);
  if (!b || b.resetAt < now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { ok: true, retryAfter: 0 }; }
  b.count += 1;
  return b.count <= limit ? { ok: true, retryAfter: 0 } : { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
}
