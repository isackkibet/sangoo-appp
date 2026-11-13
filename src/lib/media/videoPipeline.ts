"use client";

/**
 * Browser-side video pipeline for SIHU Media uploads.
 *
 *  1. Detect the real container and codecs from the file's bytes.
 *  2. Decide: keep as-is (already plays everywhere), remux (copy the streams
 *     into MP4, no quality loss) or transcode (H.264 + AAC MP4).
 *  3. Run FFmpeg (WebAssembly) in a worker when needed, with progress.
 *  4. Capture a thumbnail from the processed video.
 *
 * Processing happens on the uploader's device, so large videos never hit
 * Vercel's serverless limits, and only the processed MP4/WebM is uploaded.
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { CONTAINER_LABEL, detectCodecs, detectContainer, type CodecInfo, type VideoContainer } from "./videoFormat";

/** Largest processed video the storage bucket accepts (Supabase limit). */
export const MAX_STORED_VIDEO_BYTES = 50 * 1024 * 1024;
/** Largest source file we try to process in the browser. */
export const MAX_SOURCE_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;
const TARGET_BYTES = 46 * 1024 * 1024; // leave headroom under the 50 MB limit
const MAX_LONG_SIDE = 1920;

export type VideoStage = "checking" | "loading-converter" | "converting" | "thumbnail" | "done";
export type VideoProgress = { stage: VideoStage; ratio?: number; message: string };

export type VideoProbe = {
  container: VideoContainer;
  containerLabel: string;
  codecs: CodecInfo;
  /** The browser can decode this file directly. */
  playable: boolean;
  width: number;
  height: number;
  durationMs: number | null;
};

export type ProcessedVideo = {
  file: File;
  mime: "video/mp4" | "video/webm";
  width: number;
  height: number;
  durationMs: number | null;
  poster: Blob | null;
  /** What happened to the original. */
  action: "kept" | "remuxed" | "transcoded";
  probe: VideoProbe;
};

async function readChunk(file: File, start: number, end: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}

/** Load the file in a <video> element to see whether this browser can play it. */
function browserMetadata(file: File, timeoutMs = 8000): Promise<{ ok: boolean; width: number; height: number; durationMs: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const finish = (ok: boolean) => {
      clearTimeout(timer);
      const out = {
        ok: ok && video.videoWidth > 0,
        width: video.videoWidth,
        height: video.videoHeight,
        durationMs: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) : null,
      };
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(out);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    video.onloadedmetadata = () => finish(true);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

/** Identify the video from its bytes. Throws if the file is not a video. */
export async function probeVideo(file: File): Promise<VideoProbe> {
  const head = await readChunk(file, 0, Math.min(file.size, 1 << 20));
  const container = detectContainer(head);
  if (!container) {
    throw new Error("That file is not a supported video. Its contents don't match any known video format.");
  }
  const tail = file.size > head.length ? await readChunk(file, Math.max(head.length, file.size - (1 << 20)), file.size) : new Uint8Array();
  const codecs = detectCodecs(container, head, tail);
  const meta = await browserMetadata(file);
  return {
    container,
    containerLabel: CONTAINER_LABEL[container],
    codecs,
    playable: meta.ok,
    width: meta.width,
    height: meta.height,
    durationMs: meta.durationMs,
  };
}

const UNIVERSAL_VIDEO = new Set(["avc1", "avc3"]); // H.264
const UNIVERSAL_AUDIO = new Set(["mp4a"]); // AAC

function decide(probe: VideoProbe, size: number): "kept" | "remuxed" | "transcoded" {
  const { container, codecs, playable } = probe;
  const fits = size <= MAX_STORED_VIDEO_BYTES;
  // MP4 + H.264 (+ AAC) plays in every browser.
  if (container === "mp4" && playable && fits && codecs.videoId && UNIVERSAL_VIDEO.has(codecs.videoId) && (!codecs.audioId || UNIVERSAL_AUDIO.has(codecs.audioId))) {
    return "kept";
  }
  // WebM with VP8/VP9 plays in all current browsers.
  if (container === "webm" && playable && fits && (codecs.videoId === "VP8" || codecs.videoId === "VP9")) {
    return "kept";
  }
  // MOV / M4V / 3GP with H.264: copy the streams into MP4 (no re-encoding).
  if ((container === "mov" || container === "m4v" || container === "3gp" || container === "mp4") && fits && codecs.videoId && UNIVERSAL_VIDEO.has(codecs.videoId)) {
    return "remuxed";
  }
  return "transcoded";
}

// ── FFmpeg (WebAssembly), loaded once on demand ───────────────────────────────

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      // Served from this site (copied by scripts/copy-ffmpeg-core.mjs).
      await ffmpeg.load({
        coreURL: `${window.location.origin}/ffmpeg/ffmpeg-core.js`,
        wasmURL: `${window.location.origin}/ffmpeg/ffmpeg-core.wasm`,
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

/** Codecs as FFmpeg reports them, for formats whose codecs can't be read from the bytes. */
function parseFfmpegStreams(log: string): { video: string | null; audio: string | null; width: number; height: number; durationMs: number | null } {
  const v = log.match(/Stream #\d+:\d+[^:]*: Video: ([a-z0-9_]+)[^\n]*?(\d{2,5})x(\d{2,5})/i);
  const a = log.match(/Stream #\d+:\d+[^:]*: Audio: ([a-z0-9_]+)/i);
  const d = log.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  return {
    video: v ? v[1] : null,
    audio: a ? a[1] : null,
    width: v ? Number(v[2]) : 0,
    height: v ? Number(v[3]) : 0,
    durationMs: d ? Math.round((Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3])) * 1000) : null,
  };
}

const FFMPEG_CODEC_LABEL: Record<string, string> = {
  h264: "H.264", hevc: "H.265/HEVC", vp8: "VP8", vp9: "VP9", av1: "AV1", mpeg4: "MPEG-4 Part 2", msmpeg4v2: "MS MPEG-4 v2", msmpeg4v3: "MS MPEG-4 v3 (DivX 3)",
  mpeg1video: "MPEG-1", mpeg2video: "MPEG-2", wmv1: "WMV 7", wmv2: "WMV 8", wmv3: "WMV 9", vc1: "VC-1", flv1: "Sorenson Spark (FLV)", h263: "H.263",
  mjpeg: "Motion JPEG", prores: "Apple ProRes", theora: "Theora", rawvideo: "Uncompressed",
  aac: "AAC", mp3: "MP3", mp2: "MPEG Audio Layer II", ac3: "AC-3", eac3: "E-AC-3", opus: "Opus", vorbis: "Vorbis", wmav2: "WMA", amr_nb: "AMR", pcm_s16le: "PCM", flac: "FLAC",
};

export class VideoProcessingError extends Error {}

/**
 * Turn any supported video into a browser-compatible MP4/WebM ready for upload.
 * `onProgress` reports each stage; `signal` lets the user cancel.
 */
export async function processVideo(
  file: File,
  onProgress: (p: VideoProgress) => void,
  signal?: AbortSignal,
): Promise<ProcessedVideo> {
  if (file.size > MAX_SOURCE_VIDEO_BYTES) {
    throw new VideoProcessingError("That video is larger than 2 GB, which is too big to process on this device. Trim it or export a smaller copy first.");
  }
  onProgress({ stage: "checking", message: "Checking video…" });
  const probe = await probeVideo(file);
  const action = decide(probe, file.size);

  let output: File = file;
  let mime: "video/mp4" | "video/webm" = probe.container === "webm" ? "video/webm" : "video/mp4";
  let width = probe.width;
  let height = probe.height;
  let durationMs = probe.durationMs;

  if (action !== "kept") {
    onProgress({ stage: "loading-converter", message: "Loading the video converter (first time only)…" });
    let ffmpeg: FFmpeg;
    try {
      ffmpeg = await getFFmpeg();
    } catch {
      throw new VideoProcessingError("The video converter could not be loaded. Check your connection and try again, or upload an MP4 (H.264) video.");
    }
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");

    const { FFFSType } = await import("@ffmpeg/ffmpeg");
    const dir = `/in-${Date.now()}`;
    const input = `${dir}/${file.name.replace(/[^\w.\-]/g, "_") || "input"}`;
    const out = `/out-${Date.now()}.mp4`;
    let log = "";
    const onLog = ({ message }: { message: string }) => { if (log.length < 200_000) log += message + "\n"; };
    const onProg = ({ progress }: { progress: number }) => {
      if (progress >= 0 && progress <= 1) onProgress({ stage: "converting", ratio: progress, message: action === "remuxed" ? "Preparing MP4…" : "Converting to MP4…" });
    };
    const abort = () => ffmpeg.terminate();
    signal?.addEventListener("abort", abort);
    ffmpeg.on("log", onLog);
    ffmpeg.on("progress", onProg);

    try {
      await ffmpeg.createDir(dir);
      // WORKERFS reads the file in place, so large sources don't have to fit in memory twice.
      await ffmpeg.mount(FFFSType.WORKERFS, { files: [new File([file], input.split("/").pop()!, { type: file.type })] }, dir);

      // Probe with FFmpeg (fills in codecs for AVI, WMV, FLV, MPEG, TS, MKV…).
      await ffmpeg.exec(["-hide_banner", "-i", input]).catch(() => 0);
      const streams = parseFfmpegStreams(log);
      if (!streams.video) {
        throw new VideoProcessingError(`No video stream was found in this ${probe.containerLabel} file.`);
      }
      probe.codecs.video ??= FFMPEG_CODEC_LABEL[streams.video] ?? streams.video;
      probe.codecs.audio ??= streams.audio ? FFMPEG_CODEC_LABEL[streams.audio] ?? streams.audio : null;
      width = width || streams.width;
      height = height || streams.height;
      durationMs = durationMs ?? streams.durationMs;

      onProgress({ stage: "converting", ratio: 0, message: action === "remuxed" ? "Preparing MP4…" : "Converting to MP4…" });
      log = "";
      let args: string[];
      if (action === "remuxed") {
        // Same picture, new container: no quality loss. Audio copied when already AAC.
        const audio = streams.audio === "aac" ? ["-c:a", "copy"] : ["-c:a", "aac", "-b:a", "160k"];
        args = ["-i", input, "-map", "0:v:0", "-map", "0:a:0?", "-c:v", "copy", ...audio, "-movflags", "+faststart", "-y", out];
      } else {
        // High-quality H.264 (CRF 20). Long videos get a bitrate cap so the result fits storage.
        const seconds = (durationMs ?? 0) / 1000;
        const audioKbps = 128;
        const budgetKbps = seconds > 0 ? Math.floor((TARGET_BYTES * 8) / 1000 / seconds) - audioKbps : 0;
        if (seconds > 0 && budgetKbps < 250) {
          throw new VideoProcessingError(`This video is ${Math.round(seconds / 60)} minutes long — too long to fit the 50 MB storage limit at watchable quality. Trim it to a shorter clip and try again.`);
        }
        const cap = budgetKbps > 0 && budgetKbps < 12000 ? ["-maxrate", `${budgetKbps}k`, "-bufsize", `${budgetKbps * 2}k`] : [];
        const scale = `scale='if(gte(iw,ih),min(${MAX_LONG_SIDE},iw),-2)':'if(gte(iw,ih),-2,min(${MAX_LONG_SIDE},ih))'`;
        args = [
          "-i", input, "-map", "0:v:0", "-map", "0:a:0?",
          "-vf", `${scale},format=yuv420p`,
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", ...cap,
          "-c:a", "aac", "-b:a", `${audioKbps}k`, "-ac", "2",
          "-movflags", "+faststart", "-max_muxing_queue_size", "1024", "-y", out,
        ];
      }
      const code = await ffmpeg.exec(args);
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      if (code !== 0) {
        const reason = log.split("\n").reverse().find((l) => /error|invalid|not supported|unsupported|could not/i.test(l));
        throw new VideoProcessingError(`This ${probe.containerLabel} video could not be converted${reason ? ` (${reason.trim().slice(0, 140)})` : ""}.`);
      }
      const data = (await ffmpeg.readFile(out)) as Uint8Array;
      await ffmpeg.deleteFile(out).catch(() => {});
      if (data.byteLength > MAX_STORED_VIDEO_BYTES) {
        throw new VideoProcessingError(`The converted video is ${Math.round(data.byteLength / 1048576)} MB, above the 50 MB storage limit. Trim it to a shorter clip and try again.`);
      }
      output = new File([data.slice().buffer as ArrayBuffer], file.name.replace(/\.[^.]+$/, "") + ".mp4", { type: "video/mp4" });
      mime = "video/mp4";
    } catch (error) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      // A failed run can leave FFmpeg in a bad state; start fresh next time.
      ffmpeg.terminate();
      ffmpegPromise = null;
      throw error;
    } finally {
      signal?.removeEventListener("abort", abort);
      ffmpeg.off("log", onLog);
      ffmpeg.off("progress", onProg);
      await ffmpeg.unmount(dir).catch(() => {});
      await ffmpeg.deleteDir(dir).catch(() => {});
    }
  }

  // The processed file must play here before it is uploaded.
  const check = await browserMetadata(output, 15000);
  if (!check.ok) {
    throw new VideoProcessingError("The processed video can't be played in this browser. Please try another file.");
  }
  width = check.width || width;
  height = check.height || height;
  durationMs = check.durationMs ?? durationMs;

  onProgress({ stage: "thumbnail", message: "Creating thumbnail…" });
  const poster = await captureThumbnail(output).catch(() => null);
  onProgress({ stage: "done", ratio: 1, message: "Ready" });

  return { file: output, mime, width, height, durationMs, poster, action, probe };
}

/** A JPEG frame (about 1 second in, or a third of short clips) for the video's thumbnail. */
export function captureThumbnail(file: File, maxSide = 1080): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const cleanup = () => { URL.revokeObjectURL(url); video.removeAttribute("src"); video.load(); };
    const timer = setTimeout(() => { cleanup(); reject(new Error("thumbnail timeout")); }, 15000);
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = d > 3 ? 1 : d / 3;
    };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no canvas");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          clearTimeout(timer);
          cleanup();
          if (blob) resolve(blob); else reject(new Error("thumbnail failed"));
        }, "image/jpeg", 0.85);
      } catch (error) {
        clearTimeout(timer);
        cleanup();
        reject(error);
      }
    };
    video.onerror = () => { clearTimeout(timer); cleanup(); reject(new Error("thumbnail failed")); };
    video.src = url;
  });
}
