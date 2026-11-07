import { NextResponse } from "next/server";
import {
  ApiError,
  handleError,
  limitRequest,
  optionalMediaUser,
  requireMediaUser,
} from "@/lib/media/api";
import {
  cleanupExpiredStories,
  createStory,
  listStoryGroups,
} from "@/lib/media/service";
import { putMedia, publicUrlFor, removeMedia, storageConfigured } from "@/lib/media/storage";
import {
  MAX_CAPTION,
  clampInt,
  mediaKindForMime,
  sanitizeText,
  validateUpload,
} from "@/lib/media/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await optionalMediaUser();
    await cleanupExpiredStories({ throttleMs: 60_000 }).catch((error) => {
      console.error("Story cleanup failed:", error);
    });
    const groups = await listStoryGroups(user?.id ?? null);
    return NextResponse.json({ groups }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireMediaUser();
    limitRequest(req, "story-create", 20, 60_000);

    if (!storageConfigured()) {
      throw new ApiError(
        "Story storage is not configured. Set the Supabase storage environment variables.",
        503,
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const rawMedia = Array.isArray(body.media) ? body.media[0] : body.media;
      const record =
        rawMedia && typeof rawMedia === "object"
          ? (rawMedia as Record<string, unknown>)
          : body;

      const storagePath = typeof record.path === "string" ? record.path : "";
      const mime = typeof record.mime === "string" ? record.mime.toLowerCase() : "";
      const kind = mediaKindForMime(mime);
      if (!kind) {
        throw new ApiError("Upload a JPEG, PNG, WebP, GIF, MP4 or WebM file.");
      }
      if (
        !storagePath.startsWith(`stories/${user.id}/`) ||
        storagePath.includes("..") ||
        !/^[A-Za-z0-9/_.-]+$/.test(storagePath)
      ) {
        throw new ApiError("Invalid upload path.");
      }
      const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
      const allowedExt =
        kind === "video"
          ? ["mp4", "webm", "mov"]
          : ["jpg", "jpeg", "png", "webp", "gif"];
      if (!allowedExt.includes(ext)) {
        throw new ApiError("Invalid upload path.");
      }

      const caption = sanitizeText(
        record.caption ?? body.caption ?? "",
        MAX_CAPTION,
      );

      try {
        const story = await createStory(user.id, {
          kind,
          url: publicUrlFor(storagePath),
          storagePath: `supabase:${storagePath}`,
          mime,
          width: clampInt(record.width, 1, 10000, 1080),
          height: clampInt(record.height, 1, 10000, 1920),
          durationMs:
            record.durationMs == null
              ? null
              : clampInt(record.durationMs, 0, 3_600_000, 0),
          caption,
        });

        return NextResponse.json(
          { story },
          { status: 201, headers: { "Cache-Control": "no-store" } },
        );
      } catch (error) {
        await removeMedia(`supabase:${storagePath}`);
        throw error;
      }
    }

    const form = await req.formData();
    const file = [...form.getAll("media"), ...form.getAll("file")].find(
      (value): value is File => value instanceof File && value.size > 0,
    );
    if (!file) throw new ApiError("Choose a photo or video for your story.");

    const validated = await validateUpload(file, {
      allowVideo: true,
      width: Number(form.get("width")),
      height: Number(form.get("height")),
      durationMs: Number.isFinite(Number(form.get("duration")))
        ? Number(form.get("duration"))
        : null,
      altText: String(form.get("caption") ?? ""),
    });

    let stored;
    try {
      stored = await putMedia(validated.buffer, validated.mime, `stories/${user.id}`);
    } catch (error) {
      throw new ApiError(
        error instanceof Error ? error.message : "Could not upload your story.",
        502,
      );
    }

    try {
      const story = await createStory(user.id, {
        kind: validated.kind,
        url: stored.url,
        storagePath: stored.path,
        mime: validated.mime,
        width: validated.width,
        height: validated.height,
        durationMs: validated.durationMs,
        caption: String(form.get("caption") ?? ""),
      });
      return NextResponse.json(
        { story },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      await removeMedia(stored.path);
      throw error;
    }
  } catch (error) {
    return handleError(error);
  }
}
