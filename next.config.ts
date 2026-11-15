import type { NextConfig } from "next";

// SIHU Media uploads go straight from the browser to this Supabase project, and
// stored videos play from it. Videos are converted in the browser with FFmpeg
// (WebAssembly, served from /ffmpeg), which needs 'wasm-unsafe-eval'.
const SUPABASE_ORIGIN = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").origin; } catch { return ""; }
})();

const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com"
  : "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://js.stripe.com";

const CSP = [
  "default-src 'self'",
  scriptSrc,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `media-src 'self' blob: ${SUPABASE_ORIGIN}`.trim(),
  `connect-src 'self' ${SUPABASE_ORIGIN}`.trim(),
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ") + ";";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  output: "standalone",

  // Required to silence Turbopack conflict warning on Vercel (Next.js 16 default)
  turbopack: {},

  images: {
    // Serve images straight from their source (Supabase CDN, YouTube, etc.).
    // Vercel's Image Optimization cache was using 13+ GB of the free storage,
    // so we no longer generate/cached resized variants on Vercel.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  compress: true,

  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: CSP,
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/agent", destination: "/ai", permanent: true },
      { source: "/media", destination: "/media/feed", permanent: false },
    ];
  },
};

export default nextConfig;
