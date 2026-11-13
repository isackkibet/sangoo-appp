import type { NextConfig } from "next";

/** Origin of a configured URL, or null when unset/invalid. */
const originOf = (url: string | undefined) => {
  try { return url ? new URL(url).origin : null; } catch { return null; }
};

// Services the browser talks to directly. Without these the CSP silently blocked
// the KAI hub feed (podcasts, events, photos, videos), direct video uploads to
// Supabase Storage, YouTube players, the map tiles and the icon font.
const KAI_ORIGIN = originOf(process.env.NEXT_PUBLIC_KAI_URL) ?? "https://avax-frontend-seven.vercel.app";
const SUPABASE_ORIGIN = originOf(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // Avalanche RPC: the DApp reads the connected wallet's real AVAX balance.
  ["connect-src 'self'", KAI_ORIGIN, SUPABASE_ORIGIN, SUPABASE_ORIGIN?.replace(/^https:/, "wss:"), "https://api.avax.network", "https://api.avax-test.network"].filter(Boolean).join(" "),
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://open.spotify.com",
  "worker-src 'self' blob:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ") + ";";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  output: "standalone",

  // Required to silence Turbopack conflict warning on Vercel (Next.js 16 default)
  turbopack: {},

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 85, 90],
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
