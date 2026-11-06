import { NextResponse } from "next/server";
import {
  ApiError,
  handleError,
  limitRequest,
  optionalMediaUser,
  requireMediaUser,
} from "@/lib/media/api";
import { listPosts, createPost, type NewMediaInput } from "@/lib/media/service";
import {
  putMedia,
  publicUrlFor,
  removeMedia,
  storageConfigured,
} from "@/lib/media/storage";
import {
  MAX_ALT,
  MAX_MEDIA_PER_POST,
  asBool,
  clampInt,
  mediaKindForMime,
  sanitizeText,
  validateUpload,
} from "@/lib/media/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCOPES = new Set([
  "for-you",
  "following",
  "explore",
  "reels",
  "liked",
  "saved",
  "user",
  "hashtag",
  "location",
  "tagged",
]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scopeParam = url.searchParams.get("scope") ?? "for-you";
    const scope = SCOPES.has(scopeParam)
      ? (scopeParam as Parameters<typeof listPosts>[0]["scope"])
      : "for-you";

    const user = await optionalMediaUser();
    if (
      !user &&
      (scope === "following" || scope === "liked" || scope === "saved")
    ) {
      return NextResponse.json(
        { posts: [], nextCursor: null },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const feed = await listPosts({
      viewerId: user?.id ?? null,
      scope,
      category: url.searchParams.get("category") ?? undefined,
      username: url.searchParams.get("username") ?? undefined,
      hashtag: url.searchParams.get("hashtag") ?? undefined,
      location: url.searchParams.get("location") ?? undefined,
      limit: clampInt(url.searchParams.get("limit"), 1, 30, 12),
      offset: clampInt(
        url.searchParams.get("cursor") ?? url.searchParams.get("offset"),
        0,
        100000,
        0,
      ),
    });

    return NextResponse.json(feed, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const uploaded: string[] = [];
  try {
    const user = await requireMediaUser();
    limitRequest(req, "post-create", 20, 60_000);

    if (!storageConfigured()) {
      throw new ApiError(
        "Photo and video storage is not configured. Set the Supabase storage environment variables.",
        503,
      );
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const rawMedia = Array.isArray(body.media) ? body.media : [];
      if (rawMedia.length === 0) {
        throw new ApiError("Add at least one photo or video.");
      }
      if (rawMedia.length > MAX_MEDIA_PER_POST) {
        throw new ApiError(`You can share up to ${MAX_MEDIA_PER_POST} files at once.`);
      }

      const media: NewMediaInput[] = [];
      for (const item of rawMedia) {
        if (!item || typeof item !== "object") {
          throw new ApiError("Invalid upload.");
        }
        const record = item as Record<string, unknown>;
        const storagePath = typeof record.path === "string" ? record.path : "";
        const mime = typeof record.mime === "string" ? record.mime.toLowerCase() : "";
        const kind = mediaKindForMime(mime);
        if (!kind) {
          throw new ApiError("Upload a JPEG, PNG, WebP, GIF, MP4 or WebM file.");
        }
        if (
          !storagePath.startsWith(`posts/${user.id}/`) ||
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
        media.push({
          kind,
          url: publicUrlFor(storagePath),
          storagePath: `supabase:${storagePath}`,
          mime,
          width: clampInt(record.width, 1, 10000, 1080),
          height: clampInt(record.height, 1, 10000, 1080),
          durationMs:
            record.durationMs == null
              ? null
              : clampInt(record.durationMs, 0, 3_600_000, 0),
          altText: sanitizeText(record.altText, MAX_ALT),
        });
      }

      let taggedUsernames: string[] = [];
      if (Array.isArray(body.tagged)) {
        taggedUsernames = body.tagged
          .filter((name): name is string => typeof name === "string")
          .slice(0, 10);
      } else if (typeof body.tagged === "string" && body.tagged) {
        try {
          const parsed = JSON.parse(body.tagged);
          if (Array.isArray(parsed)) {
            taggedUsernames = parsed
              .filter((name): name is string => typeof name === "string")
              .slice(0, 10);
          }
        } catch {
          taggedUsernames = [];
        }
      }

      const visibilityRaw = String(body.visibility ?? "public");
      try {
        const post = await createPost(user.id, {
          caption: String(body.caption ?? ""),
          category: String(body.category ?? "community"),
          locationName: String(body.locationName ?? ""),
          visibility:
            visibilityRaw === "followers" || visibilityRaw === "private"
              ? visibilityRaw
              : "public",
          commentsOff: asBool(body.commentsOff),
          hideLikes: asBool(body.hideLikes),
          media,
          taggedUsernames,
        });
        return NextResponse.json(
          { post },
          { status: 201, headers: { "Cache-Control": "no-store" } },
        );
      } catch (error) {
        await Promise.all(media.map((item) => removeMedia(item.storagePath)));
        throw error;
      }
    }

    const form = await req.formData();
    const files = [
      ...form.getAll("media"),
      ...form.getAll("files"),
    ].filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) throw new ApiError("Add at least one photo or video.");
    if (files.length > MAX_MEDIA_PER_POST) {
      throw new ApiError(`You can share up to ${MAX_MEDIA_PER_POST} files at once.`);
    }

    const widths = form.getAll("width").map((value) => Number(value));
    const heights = form.getAll("height").map((value) => Number(value));
    const durations = form.getAll("duration").map((value) => Number(value));
    const altTexts = form.getAll("altText").map((value) => String(value));
    const taggedRaw = String(form.get("tagged") ?? "");
    let taggedUsernames: string[] = [];
    if (taggedRaw) {
      try {
        const parsed = JSON.parse(taggedRaw);
        if (Array.isArray(parsed)) {
          taggedUsernames = parsed
            .filter((name): name is string => typeof name === "string")
            .slice(0, 10);
        }
      } catch {
        taggedUsernames = [];
      }
    }

    const media: NewMediaInput[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const validated = await validateUpload(file, {
        allowVideo: true,
        width: widths[index],
        height: heights[index],
        durationMs: Number.isFinite(durations[index]) ? durations[index] : null,
        altText: altTexts[index] ?? "",
      });
      const stored = await putMedia(validated.buffer, validated.mime, `posts/${user.id}`);
      uploaded.push(stored.path);
      media.push({
        kind: validated.kind,
        url: stored.url,
        storagePath: stored.path,
        mime: validated.mime,
        width: validated.width,
        height: validated.height,
        durationMs: validated.durationMs,
        altText: validated.altText,
      });
    }

    const visibilityRaw = String(form.get("visibility") ?? "public");
    const post = await createPost(user.id, {
      caption: String(form.get("caption") ?? ""),
      category: String(form.get("category") ?? "community"),
      locationName: String(form.get("locationName") ?? ""),
      visibility:
        visibilityRaw === "followers" || visibilityRaw === "private"
          ? visibilityRaw
          : "public",
      commentsOff: asBool(form.get("commentsOff")),
      hideLikes: asBool(form.get("hideLikes")),
      media,
      taggedUsernames,
    });

    return NextResponse.json(
      { post },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (uploaded.length > 0) {
      await Promise.all(uploaded.map((path) => removeMedia(path)));
    }
    return handleError(error);
  }
}
