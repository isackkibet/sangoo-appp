/**
 * Identify a video by its actual bytes (not its file name or claimed type).
 * Used in the browser before upload and on the server after upload.
 */

export type VideoContainer =
  | "mp4" | "m4v" | "mov" | "3gp" | "webm" | "mkv" | "avi" | "wmv" | "flv" | "mpeg-ps" | "mpeg-es" | "mpeg-ts";

export const CONTAINER_LABEL: Record<VideoContainer, string> = {
  mp4: "MP4", m4v: "M4V", mov: "MOV (QuickTime)", "3gp": "3GP", webm: "WebM", mkv: "MKV (Matroska)",
  avi: "AVI", wmv: "WMV (ASF)", flv: "FLV", "mpeg-ps": "MPEG (MPG)", "mpeg-es": "MPEG video", "mpeg-ts": "MPEG-TS (TS)",
};

/** Extensions shown in the file picker. Detection itself never relies on them. */
export const VIDEO_ACCEPT =
  "video/*,.mp4,.m4v,.mov,.webm,.mkv,.avi,.3gp,.3g2,.mpeg,.mpg,.wmv,.asf,.flv,.ts,.mts,.m2ts";

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...b.subarray(start, Math.min(b.length, start + len)));

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);

const ASF_GUID = [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce, 0x6c];
const QT_ATOMS = new Set(["moov", "mdat", "wide", "free", "skip", "pnot"]);

/** The container format from the first bytes of a file (≥ 400 bytes recommended). */
export function detectContainer(head: Uint8Array): VideoContainer | null {
  if (head.length < 12) return null;

  // ISO base media (MP4 family): [size]['ftyp'][brand]
  if (ascii(head, 4, 4) === "ftyp") {
    const brand = ascii(head, 8, 4);
    if (brand === "qt  ") return "mov";
    if (brand.startsWith("3gp") || brand.startsWith("3g2")) return "3gp";
    if (brand.startsWith("M4V")) return "m4v";
    if (brand.startsWith("M4A") || brand.startsWith("M4B") || brand === "mif1" || brand === "heic" || brand === "avif") return null; // audio / images
    return "mp4";
  }
  // Older QuickTime files start with another atom.
  if (QT_ATOMS.has(ascii(head, 4, 4))) return "mov";

  // EBML (Matroska / WebM): DocType says which.
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) {
    const text = ascii(head, 0, Math.min(head.length, 64));
    if (text.includes("webm")) return "webm";
    if (text.includes("matroska")) return "mkv";
    return "mkv";
  }
  if (ascii(head, 0, 4) === "RIFF" && ascii(head, 8, 4) === "AVI ") return "avi";
  if (startsWith(head, ASF_GUID)) return "wmv";
  if (ascii(head, 0, 3) === "FLV" && head[3] === 0x01) return "flv";
  if (startsWith(head, [0x00, 0x00, 0x01, 0xba])) return "mpeg-ps";
  if (startsWith(head, [0x00, 0x00, 0x01, 0xb3])) return "mpeg-es";
  // MPEG transport stream: sync byte every 188 bytes (or 192 for M2TS).
  if (head.length >= 377 && head[0] === 0x47 && head[188] === 0x47 && head[376] === 0x47) return "mpeg-ts";
  if (head.length >= 389 && head[4] === 0x47 && head[196] === 0x47 && head[388] === 0x47) return "mpeg-ts";
  return null;
}

const VIDEO_FOURCC: Record<string, string> = {
  avc1: "H.264", avc3: "H.264", hvc1: "H.265/HEVC", hev1: "H.265/HEVC", av01: "AV1", vp09: "VP9", vp08: "VP8",
  mp4v: "MPEG-4 Part 2", s263: "H.263", h263: "H.263", jpeg: "Motion JPEG", mjpa: "Motion JPEG",
  apcn: "Apple ProRes", apch: "Apple ProRes", apcs: "Apple ProRes", apco: "Apple ProRes", ap4h: "Apple ProRes", dvh1: "Dolby Vision", dvhe: "Dolby Vision",
};
const AUDIO_FOURCC: Record<string, string> = {
  mp4a: "AAC", "ac-3": "AC-3", "ec-3": "E-AC-3", opus: "Opus", samr: "AMR", sawb: "AMR-WB", ".mp3": "MP3", lpcm: "PCM", sowt: "PCM", twos: "PCM", alac: "ALAC", fLaC: "FLAC",
};

export type CodecInfo = { video: string | null; audio: string | null; videoId: string | null; audioId: string | null };

/**
 * Codecs readable straight from the container (MP4 family and Matroska/WebM).
 * Pass the start and the end of the file: MP4 metadata is often at the end.
 */
export function detectCodecs(container: VideoContainer, ...chunks: Uint8Array[]): CodecInfo {
  const info: CodecInfo = { video: null, audio: null, videoId: null, audioId: null };
  for (const b of chunks) {
    if (container === "webm" || container === "mkv") {
      const text = ascii(b, 0, Math.min(b.length, 1 << 20));
      const v = text.match(/V_(VP8|VP9|AV1|MPEG4\/ISO\/AVC|MPEGH\/ISO\/HEVC|MPEG4\/ISO\/[A-Z]+|MPEG[12]|MS\/VFW\/FOURCC|THEORA)/);
      const a = text.match(/A_(OPUS|VORBIS|AAC|MPEG\/L3|AC3|EAC3|FLAC|PCM\/INT\/LIT|DTS)/);
      if (v && !info.videoId) {
        info.videoId = v[1];
        info.video = { VP8: "VP8", VP9: "VP9", AV1: "AV1", "MPEG4/ISO/AVC": "H.264", "MPEGH/ISO/HEVC": "H.265/HEVC", THEORA: "Theora" }[v[1]] ?? v[1];
      }
      if (a && !info.audioId) {
        info.audioId = a[1];
        info.audio = { OPUS: "Opus", VORBIS: "Vorbis", AAC: "AAC", "MPEG/L3": "MP3", AC3: "AC-3", EAC3: "E-AC-3", FLAC: "FLAC", "PCM/INT/LIT": "PCM", DTS: "DTS" }[a[1]] ?? a[1];
      }
    } else if (["mp4", "m4v", "mov", "3gp"].includes(container)) {
      // 'stsd' box → first sample entry's format code sits 16 bytes after the box type.
      for (let i = 0; i + 20 < b.length; i++) {
        if (b[i] === 0x73 && b[i + 1] === 0x74 && b[i + 2] === 0x73 && b[i + 3] === 0x64) {
          const code = ascii(b, i + 16, 4);
          if (VIDEO_FOURCC[code] && !info.videoId) { info.videoId = code; info.video = VIDEO_FOURCC[code]; }
          else if (AUDIO_FOURCC[code] && !info.audioId) { info.audioId = code; info.audio = AUDIO_FOURCC[code]; }
        }
      }
    }
  }
  return info;
}

/** Video formats stored on SIHU: every upload ends up as one of these. */
export function storedVideoMime(head: Uint8Array): "video/mp4" | "video/webm" | null {
  const c = detectContainer(head);
  if (c === "mp4" || c === "m4v") return "video/mp4";
  if (c === "webm") return "video/webm";
  return null;
}
