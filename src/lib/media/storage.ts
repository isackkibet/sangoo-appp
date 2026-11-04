import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "media";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

export type StorageProvider = "supabase" | "local";

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY) || process.env.MEDIA_STORAGE === "local";
}

function resolveProvider(): StorageProvider {
  if (SUPABASE_URL && SUPABASE_KEY) return "supabase";
  if (process.env.NODE_ENV !== "production" || process.env.MEDIA_STORAGE === "local") {
    return "local";
  }
  throw new Error(
    "Media storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET.",
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
