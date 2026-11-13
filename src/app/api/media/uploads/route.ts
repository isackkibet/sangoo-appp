import { NextResponse } from "next/server";
import {
  ApiError,
  handleError,
  limitRequest,
  requireMediaUser,
} from "@/lib/media/api";
import { createUploadTarget, storageConfigured } from "@/lib/media/storage";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  mediaKindForMime,
} from "@/lib/media/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "upload-sign", 60, 60_000);

    if (!storageConfigured()) {
      throw new ApiError(
        "Photo and video storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET.",
        503,
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      mime?: unknown;
      size?: unknown;
      folder?: unknown;
    };
    const mime = typeof body.mime === "string" ? body.mime.toLowerCase() : "";
    const size = Number(body.size);
    const folder = body.folder === "stories" ? "stories" : "posts";
    const kind = mediaKindForMime(mime);

    if (!kind) {
      throw new ApiError("Upload a photo (JPEG, PNG, WebP, GIF) or a video.");
    }
    // Videos are converted to MP4 / WebM in the browser before upload; only
    // those browser-ready formats are stored.
    if (kind === "video" && mime !== "video/mp4" && mime !== "video/webm") {
      throw new ApiError("Videos are uploaded as MP4 or WebM after processing. Please choose the video again.");
    }
    if (!Number.isFinite(size) || size <= 0) {
      throw new ApiError("That file is empty.");
    }

    const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (size > maxBytes) {
      throw new ApiError(
        kind === "video"
          ? `That video is too large. Choose one under ${Math.round(maxBytes / (1024 * 1024))} MB.`
          : `That photo is too large. Choose one under ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      );
    }

    let target;
    try {
      target = await createUploadTarget(user.id, mime, folder);
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : "Could not prepare the upload.",
        502,
      );
    }

    return NextResponse.json(
      { ...target, kind, maxBytes, folder },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return handleError(error);
  }
}
