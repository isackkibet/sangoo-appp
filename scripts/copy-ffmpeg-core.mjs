// Copies the FFmpeg WebAssembly core into public/ffmpeg so the browser can load it
// from this site (same origin) when a video needs converting. Runs on npm install.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", "@ffmpeg", "core", "dist", "esm");
const dest = join("public", "ffmpeg");
if (!existsSync(src)) {
  console.warn("[ffmpeg] @ffmpeg/core not installed; video conversion will be unavailable.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) copyFileSync(join(src, file), join(dest, file));
console.log("[ffmpeg] core copied to public/ffmpeg");
