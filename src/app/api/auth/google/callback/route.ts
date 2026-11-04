import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  buildUsername,
  createSession,
  findUserByEmail,
  googleRedirectUri,
  normalizeEmail,
  safeNextPath,
  type UserRow,
} from "@/lib/auth";
import { ensureSchema, getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

function failure(requestUrl: string, reason: string) {
  const response = NextResponse.redirect(
    new URL(`/login?error=${reason}`, requestUrl),
  );
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const store = await cookies();
  const expectedState = store.get(OAUTH_STATE_COOKIE)?.value;
  const next = safeNextPath(store.get(OAUTH_NEXT_COOKIE)?.value) ?? "/portal";

  if (!code || !state || !expectedState || state !== expectedState) {
    return failure(request.url, "oauth_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return failure(request.url, "google_not_configured");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: googleRedirectUri(request.url),
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokenResponse.ok || !tokens.id_token) {
      console.error("Google token exchange failed:", tokens.error, tokens.error_description);
      return failure(request.url, "oauth_failed");
    }

    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
    });

    const googleId = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : email.split("@")[0];
    const picture = typeof payload.picture === "string" ? payload.picture : null;

    if (!googleId || !email) {
      return failure(request.url, "oauth_failed");
    }

    await ensureSchema();
    const sql = getSql();

    const existing = await findUserByEmail(email);
    let userId: string;

    if (existing) {
      if (existing.is_suspended) {
        return failure(request.url, "suspended");
      }
      userId = existing.id;
      const username =
        existing.username || (await buildUsername(name, existing.id));
      await sql.query(
        `UPDATE users
         SET google_id = COALESCE(google_id, $1),
             email_verified = TRUE,
             name = COALESCE(NULLIF(name, ''), $2),
             avatar_url = COALESCE(avatar_url, $3),
             username = COALESCE(NULLIF(username, ''), $4),
             updated_at = NOW()
         WHERE id = $5`,
        [googleId, name, picture, username, userId],
      );
    } else {
      userId = randomUUID();
      const username = await buildUsername(name, userId);
      const rows = (await sql.query(
        `INSERT INTO users (id, email, name, username, avatar_url, google_id, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         RETURNING id`,
        [userId, email, name, username, picture, googleId],
      )) as Pick<UserRow, "id">[];
      userId = rows[0].id;
    }

    await createSession(userId);

    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_NEXT_COOKIE);
    return response;
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return failure(request.url, "oauth_failed");
  }
}
