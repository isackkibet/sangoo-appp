export type PreparedKind = "image" | "video";

export type PreparedMedia = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  kind: PreparedKind;
  durationMs: number | null;
};

export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const HIGH_QUALITY_IMAGE_MAX_SIDE = 2560;
const DIRECT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Your browser could not process that photo."));
      },
      type,
      quality,
    );
  });
}

async function prepareImage(file: File): Promise<PreparedMedia> {
  const bitmap = await createImageBitmap(file);
  const rawWidth = bitmap.width;
  const rawHeight = bitmap.height;

  // Keep the original upload when it is already an accepted format and size.
  // This avoids re-compressing photos and keeps full detail/quality.
  if (DIRECT_IMAGE_TYPES.has(file.type) && file.size <= SERVER_UPLOAD_MAX_BYTES) {
    bitmap.close();
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      width: rawWidth,
      height: rawHeight,
      kind: "image",
      durationMs: null,
    };
  }

  if (file.type === "image/gif") {
    bitmap.close();
    return {
      file,
      previewUrl: URL.createObjectURL(file),
      width: rawWidth,
      height: rawHeight,
      kind: "image",
      durationMs: null,
    };
  }

  const maxSide = HIGH_QUALITY_IMAGE_MAX_SIDE;
  const maxDimensionScale = Math.min(1, maxSide / Math.max(rawWidth, rawHeight));
  const width = Math.max(1, Math.round(rawWidth * maxDimensionScale));
  const height = Math.max(1, Math.round(rawHeight * maxDimensionScale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process that photo.");

  let blob: Blob | null = null;
  let outputWidth = width;
  let outputHeight = height;
  let scale = 1;
  try {
    for (const quality of [0.92, 0.84, 0.76, 0.68, 0.6]) {
      outputWidth = Math.max(1, Math.round(width * scale));
      outputHeight = Math.max(1, Math.round(height * scale));
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
      blob = await canvasToBlob(canvas, "image/webp", quality);
      if (blob.type !== "image/webp") {
        blob = await canvasToBlob(canvas, "image/jpeg", quality);
      }
      if (blob.size <= SERVER_UPLOAD_MAX_BYTES) break;
      scale *= 0.82;
    }
  } finally {
    bitmap.close();
  }

  if (!blob || blob.size > SERVER_UPLOAD_MAX_BYTES) {
    throw new Error("Could not reduce that photo enough to upload. Choose a smaller image.");
  }

  const type = blob.type === "image/webp" ? "image/webp" : "image/jpeg";
  const extension = type === "image/webp" ? ".webp" : ".jpg";

  const uploadFile = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, "") + extension,
    { type },
  );

  return {
    file: uploadFile,
    previewUrl: URL.createObjectURL(blob),
    width: outputWidth,
    height: outputHeight,
    kind: "image",
    durationMs: null,
  };
}

function prepareVideo(file: File): Promise<PreparedMedia> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 720;
      const height = video.videoHeight || 1280;
      const durationMs = Number.isFinite(video.duration)
        ? Math.round(video.duration * 1000)
        : null;
      resolve({ file, previewUrl: objectUrl, width, height, kind: "video", durationMs });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That video format is not supported. Use MP4 or WebM."));
    };

    video.src = objectUrl;
  });
}

export async function prepareMedia(file: File): Promise<PreparedMedia> {
  if (file.type.startsWith("video/")) {
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error("That video is too large. Choose one under 50 MB.");
    }
    return prepareVideo(file);
  }

  if (file.type.startsWith("image/")) {
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("That photo is too large. Choose one under 20 MB.");
    }
    return prepareImage(file);
  }

  throw new Error("Choose a photo or video.");
}
