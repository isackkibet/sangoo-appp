import { NextRequest } from "next/server";
import { getCachedAudio } from "@/lib/ai/tts";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const cached = getCachedAudio(key as string);
  if (!cached) {
    return new Response("Not found", { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Response(cached.buffer as any, {
    status: 200,
    headers: {
      "Content-Type": cached.contentType,
      "Content-Length": String(cached.buffer.length),
      "Cache-Control": "public, max-age=86400, immutable",
      "Accept-Ranges": "bytes",
    },
  });
}
