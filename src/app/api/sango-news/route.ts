import { NextResponse } from "next/server";
import { listSangoNewsVideos } from "@/lib/admin/sangoNews";
import { hasDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasDatabase) {
    return NextResponse.json(
      { error: "The news database is not configured." },
      { status: 503 },
    );
  }
  try {
    const videos = await listSangoNewsVideos();
    return NextResponse.json(
      { videos },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load Sango News videos." },
      { status: 503 },
    );
  }
}
