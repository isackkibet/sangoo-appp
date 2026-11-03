import { NextResponse } from "next/server";
import { getSessionUser, googleOAuthConfigured } from "@/lib/auth";
import { hasDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    {
      user,
      available: hasDatabase,
      googleEnabled: googleOAuthConfigured(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
