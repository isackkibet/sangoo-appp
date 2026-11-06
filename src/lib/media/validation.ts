export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export const MAX_MEDIA_PER_POST = 10;
export const MAX_CAPTION = 2200;
export const MAX_COMMENT = 1000;
export const MAX_MESSAGE = 2000;
export const MAX_LOCATION = 120;
export const MAX_ALT = 500;
export const MAX_BIO = 160;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export type MediaKind = "image" | "video";

export function mediaKindForMime(mime: string): MediaKind | null {
  const value = mime.toLowerCase();
  if (IMAGE_TYPES.has(value)) return "image";
  if (VIDEO_TYPES.has(value)) return "video";
  return null;
}

export function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function asBool(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === "on";
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
}

export function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  for (const match of text.matchAll(/#([\p{L}\p{N}_]{1,50})/gu)) {
    const tag = match[1].toLowerCase();
    if (tag) tags.add(tag);
    if (tags.size >= 20) break;
  }
  return [...tags];
}

export function extractMentions(text: string): string[] {
  const names = new Set<string>();
  for (const match of text.matchAll(/@([a-z0-9._]{2,30})/gi)) {
    names.add(match[1].toLowerCase());
    if (names.size >= 20) break;
  }
  return [...names];
}

function sniff(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") {
    return "image/gif";
  }
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("ascii");
    if (brand.startsWith("qt")) return "video/quicktime";
    return "video/mp4";
  }
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "video/webm";
  }
  return null;
}

export interface ValidatedUpload {
  kind: MediaKind;
  mime: string;
  buffer: Buffer;
  width: number;
  height: number;
  durationMs: number | null;
  altText: string;
}

export interface UploadOptions {
  allowVideo?: boolean;
  maxBytes?: number;
  maxImageBytes?: number;
  maxVideoBytes?: number;
  altText?: string;
  width?: number;
  height?: number;
  durationMs?: number | null;
}

export function validateUpload(file: File, options: UploadOptions = {}): Promise<ValidatedUpload> {
  const maxImage = options.maxImageBytes ?? MAX_IMAGE_BYTES;
  const maxVideo = options.maxVideoBytes ?? MAX_VIDEO_BYTES;
  const maxTotal = options.maxBytes ?? MAX_VIDEO_BYTES;
  const declared = (file.type || "").toLowerCase();

  return file.arrayBuffer().then((array) => {
    const buffer = Buffer.from(array);
    const sniffed = sniff(buffer);
    const mime = sniffed ?? declared;

    const isImage = IMAGE_TYPES.has(mime);
    const isVideo = VIDEO_TYPES.has(mime);

    if (!isImage && !isVideo) {
      throw new Error("Upload a JPEG, PNG, WebP, GIF, MP4 or WebM file.");
    }
    if (isVideo && options.allowVideo === false) {
      throw new Error("This upload only accepts photos.");
    }
    if (sniffed && declared && sniffed !== declared && !(declared === "image/jpg" && sniffed === "image/jpeg")) {
      throw new Error("The file contents do not match its type.");
    }

    const limit = isVideo ? maxVideo : maxImage;
    if (buffer.length > Math.min(maxTotal, limit)) {
      throw new Error(
        isVideo
          ? `That video is too large. Choose one under ${Math.round(maxVideo / (1024 * 1024))} MB.`
          : `That photo is too large. Choose one under ${Math.round(maxImage / (1024 * 1024))} MB.`,
      );
    }
    if (buffer.length === 0) throw new Error("That file is empty.");

    return {
      kind: isVideo ? "video" : "image",
      mime,
      buffer,
      width: clampInt(options.width, 1, 10000, 1080),
      height: clampInt(options.height, 1, 10000, 1080),
      durationMs:
        options.durationMs == null ? null : clampInt(options.durationMs, 0, 3_600_000, 0),
      altText: sanitizeText(options.altText, MAX_ALT),
    } satisfies ValidatedUpload;
  });
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9._]{3,30}$/.test(value) && !value.startsWith(".") && !value.endsWith(".");
}

export function normalizeUsername(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
