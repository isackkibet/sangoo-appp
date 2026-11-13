"use client";

/**
 * Upload a processed file straight to Supabase Storage through a short-lived
 * signed URL (bypasses Vercel's request-size limit), reporting progress.
 * The server checks the stored bytes again before the file can be used.
 */
export async function uploadDirect(
  file: Blob,
  mime: string,
  folder: "posts" | "stories",
  onProgress?: (ratio: number) => void,
  signal?: AbortSignal,
): Promise<{ path: string }> {
  const signRes = await fetch("/api/media/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mime, size: file.size, folder }),
    signal,
  });
  const signed = (await signRes.json().catch(() => ({}))) as { path?: string; signedUrl?: string; error?: string };
  if (!signRes.ok || !signed.signedUrl || !signed.path) {
    throw new Error(signed.error || "Could not prepare the upload.");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signed.signedUrl!);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}). ${xhr.responseText.slice(0, 160)}`.trim()));
    };
    xhr.onerror = () => reject(new Error("The upload was interrupted. Check your connection and try again."));
    xhr.onabort = () => reject(new DOMException("Cancelled", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    const form = new FormData();
    form.append("cacheControl", "31536000");
    form.append("", file);
    xhr.send(form);
  });

  return { path: signed.path };
}
