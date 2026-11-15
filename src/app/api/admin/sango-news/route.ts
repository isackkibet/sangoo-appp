import { NextResponse } from "next/server";
import { handleError, requireAdminRequest } from "@/lib/admin/api";
import {
  addSangoNewsVideo,
  deleteSangoNewsVideo,
  listSangoNewsVideos,
} from "@/lib/admin/sangoNews";
import { ApiError, readJson } from "@/lib/media/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdminRequest(req);
    const videos = await listSangoNewsVideos();
    return NextResponse.json({ videos });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminRequest(req);
    const body = await readJson<{
      url?: string;
      title?: string;
      description?: string;
      source?: string;
      publishedAt?: string;
    }>(req);
    if (!body.url?.trim() || !body.title?.trim()) {
      throw new ApiError("A YouTube link and title are required.", 400);
    }
    const video = await addSangoNewsVideo({
      url: body.url,
      title: body.title,
      description: body.description,
      source: body.source,
      publishedAt: body.publishedAt,
    });
    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminRequest(req);
    const id = new URL(req.url).searchParams.get("id")?.trim();
    if (!id) throw new ApiError("Choose a video to remove.", 400);
    const removed = await deleteSangoNewsVideo(id);
    if (!removed) throw new ApiError("Video not found.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
