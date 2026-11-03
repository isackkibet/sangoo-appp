import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  OAUTH_NEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  googleOAuthConfigured,
  googleRedirectUri,
  safeNextPath,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!googleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", request.url),
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const origin = new URL(request.url).origin;
  const next = safeNextPath(new URL(request.url).searchParams.get("next")) ?? "/portal";
  const state = randomBytes(24).toString("base64url");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(request.url),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  response.cookies.set(OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
