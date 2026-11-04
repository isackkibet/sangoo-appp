import { ensureSchema, hasDatabase } from "@/lib/db";
import { getMediaImage } from "@/lib/media/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/media/images/[id]">,
) {
  if (!hasDatabase) {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await ctx.params;

  try {
    await ensureSchema();
    const image = await getMediaImage(id);
    if (!image) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(new Uint8Array(image.buffer), {
      headers: {
        "Content-Type": image.mime,
        "Content-Length": String(image.buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Could not load media image:", error);
    return new Response("Could not load image", { status: 500 });
  }
}
