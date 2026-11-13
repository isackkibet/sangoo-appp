import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MAX_VIDEO_BYTES, sniffStoredMime } from "@/lib/media/validation";

function normalizeBucketName(value: string | undefined): string {
  // Accept values like `media # comment` and avoid using a comment as the bucket name.
  return (value ?? "").trim().split(/[\s#]/)[0] || "media";
}

const BUCKET = normalizeBucketName(process.env.SUPABASE_STORAGE_BUCKET);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export type StorageProvider = "supabase" | "local";

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY) || process.env.MEDIA_STORAGE === "local";
}

export function storageBucket(): string {
  return BUCKET;
}

let bucketReady: Promise<string> | null = null;

async function verifyMediaBucket(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.getBucket(BUCKET);

  if (error || !data) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: MAX_VIDEO_BYTES,
    });
    if (createError && !/already exists|duplicate/i.test(createError.message)) {
      throw new Error(`Could not create storage bucket "${BUCKET}": ${createError.message}`);
    }
  } else if (!data.public) {
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: MAX_VIDEO_BYTES,
    });
    if (updateError) {
      throw new Error(`Could not make storage bucket "${BUCKET}" public: ${updateError.message}`);
    }
  }

  return BUCKET;
}

export function ensureMediaBucket(): Promise<string> {
  if (!bucketReady) {
    bucketReady = verifyMediaBucket().catch((error) => {
      bucketReady = null;
      throw error;
    });
  }
  return bucketReady;
}

export interface UploadTarget {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
}

export async function createUploadTarget(
  userId: string,
  mime: string,
  folder: "posts" | "stories" = "posts",
): Promise<UploadTarget> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Media storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.",
    );
  }

  const bucket = await ensureMediaBucket();
  const supabase = createSupabaseAdminClient();
  const ext = extensionFor(mime);
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const prefix = folder === "stories" ? "stories" : "posts";
  const objectPath = `${prefix}/${userId}/${year}/${month}/${randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(objectPath);
  if (error || !data) {
    throw new Error(`Could not prepare upload: ${error?.message ?? "unknown error"}`);
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return {
    path: objectPath,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicData.publicUrl,
  };
}

export function publicUrlFor(storagePath: string): string {
  const supabase = createSupabaseAdminClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function resolveProvider(): StorageProvider {
  if (SUPABASE_URL && SUPABASE_KEY) return "supabase";
  if (process.env.NODE_ENV !== "production" || process.env.MEDIA_STORAGE === "local") {
    return "local";
  }
  throw new Error(
    "Media storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and SUPABASE_STORAGE_BUCKET.",
  );
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export function extensionFor(mime: string): string {
  return EXTENSIONS[mime.toLowerCase()] ?? "bin";
}

function localRoot(): string {
  return path.join(process.cwd(), "public", "uploads");
}

export function localPathFor(relativePath: string): string | null {
  const root = localRoot();
  const resolved = path.resolve(root, relativePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export interface UploadResult {
  url: string;
  path: string;
}

export async function putMedia(
  buffer: Buffer,
  mime: string,
  prefix: string,
): Promise<UploadResult> {
  const provider = resolveProvider();
  const ext = extensionFor(mime);
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "").slice(0, 80) || "misc";
  const objectPath = `${safePrefix}/${year}/${month}/${randomUUID()}.${ext}`;

  if (provider === "supabase") {
    await ensureMediaBucket();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, { contentType: mime, upsert: false, cacheControl: "31536000" });
    if (error) {
      throw new Error(`Could not upload media: ${error.message}`);
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return { url: data.publicUrl, path: `supabase:${objectPath}` };
  }

  const filePath = localPathFor(objectPath);
  if (!filePath) throw new Error("Invalid upload path.");
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return { url: `/api/media/files/${objectPath}`, path: `local:${objectPath}` };
}

export async function removeMedia(storagePath: string | null | undefined): Promise<void> {
  if (!storagePath) return;
  try {
    if (storagePath.startsWith("supabase:")) {
      const objectPath = storagePath.slice("supabase:".length);
      const supabase = createSupabaseAdminClient();
      await supabase.storage.from(BUCKET).remove([objectPath]);
      return;
    }
    if (storagePath.startsWith("local:")) {
      const relative = storagePath.slice("local:".length);
      const filePath = localPathFor(relative);
      if (filePath) await unlink(filePath);
    }
  } catch (error) {
    console.error("Could not remove stored media:", error);
  }
}

/**
 * Check what was actually uploaded to `objectPath` (a direct, signed upload)
 * by reading its first bytes. Returns the real MIME type, or deletes the
 * object and throws when it is not an accepted image/video of `kind`.
 */
export async function verifyDirectUpload(
  objectPath: string,
  kind: "image" | "video",
): Promise<string> {
  let head: Uint8Array | null = null;
  try {
    const res = await fetch(publicUrlFor(objectPath), {
      headers: { Range: "bytes=0-4095" },
      cache: "no-store",
    });
    if (res.ok) head = new Uint8Array(await res.arrayBuffer()).subarray(0, 4096);
  } catch {
    head = null;
  }
  if (!head) {
    throw new Error("The uploaded file could not be found. Please upload it again.");
  }
  const mime = sniffStoredMime(head);
  const actualKind = mime?.startsWith("video/") ? "video" : mime?.startsWith("image/") ? "image" : null;
  if (!mime || actualKind !== kind) {
    await removeMedia(`supabase:${objectPath}`);
    throw new Error(
      kind === "video"
        ? "That upload is not a valid MP4 or WebM video. Please choose the video again."
        : "That upload is not a valid photo. Please choose it again.",
    );
  }
  return mime;
}
