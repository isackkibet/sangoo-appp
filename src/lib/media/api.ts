import { NextResponse } from "next/server";
import {
  getActiveSessionUser,
  isPlatformAdmin,
  type AuthUser,
} from "@/lib/auth";
import { ensureSchema, hasDatabase } from "@/lib/db";
import { clientIp, isAdmin, rateLimit } from "@/lib/security/guard";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function jsonError(message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }
  const message = error instanceof Error ? error.message : "Something went wrong.";
  if (
    /not found|no longer exists|cannot|not allowed|only the owner|suspended/i.test(
      message,
    )
  ) {
    return jsonError(message, 403);
  }
  if (/sign in/i.test(message)) {
    return jsonError(message, 401);
  }
  console.error("Media API error:", error);
  return jsonError("Something went wrong. Please try again.", 500);
}

export async function requireMediaUser(): Promise<AuthUser> {
  if (!hasDatabase) {
    throw new ApiError("The community database is not configured.", 503);
  }
  await ensureSchema();
  const user = await getActiveSessionUser();
  if (!user) throw new ApiError("Sign in to continue.", 401);
  return user;
}

export async function optionalMediaUser(): Promise<AuthUser | null> {
  if (!hasDatabase) return null;
  await ensureSchema();
  return getActiveSessionUser();
}

export async function requireMediaAdmin(req: Request): Promise<AuthUser> {
  const user = await requireMediaUser();
  if (!isPlatformAdmin(user) && !isAdmin(req)) {
    throw new ApiError("You do not have permission to do that.", 403);
  }
  return user;
}

export function limitRequest(
  req: Request,
  scope: string,
  limit: number,
  windowMs = 60_000,
): void {
  const result = rateLimit(`${scope}:${clientIp(req)}`, limit, windowMs);
  if (!result.ok) {
    throw new ApiError(
      `Too many requests. Try again in ${result.retryAfter}s.`,
      429,
    );
  }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError("Invalid request body.", 400);
  }
}

export function searchParam(req: Request, key: string): string | null {
  return new URL(req.url).searchParams.get(key);
}
