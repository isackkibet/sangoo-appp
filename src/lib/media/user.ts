import type { MediaUser } from "@/lib/media/types";

export function mediaFullName(
  name?: string | null,
  email?: string | null,
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email?.split("@")[0]?.trim();
  return local || "SIHU member";
}

export function mediaUsername(
  name?: string | null,
  email?: string | null,
): string {
  const base = (name?.trim() || email?.split("@")[0] || "member")
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, "")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);
  return base || "member";
}

export function mediaAvatar(
  name?: string | null,/
): string {
  if (avatarUrl && avatarUrl.trim()) return avatarUrl.trim();
  return avatarFallback(name, email);
}

export function avatarFallback(
  name?: string | null,
  email?: string | null,
): string {
  const label = name?.trim() || email?.split("@")[0]?.trim() || "SIHU";
  const parts = label.split(/[\s._-]+/).filter(Boolean);
  const initials = (
    parts.length > 1
      ? `${Array.from(parts[0])[0]}${Array.from(parts[1])[0]}`
      : Array.from(parts[0] || "S").slice(0, 2).join("")
  )
    .toUpperCase()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#0e7490"/>
        <stop offset="1" stop-color="#2563eb"/>
      </linearGradient>
      <radialGradient id="shine" cx="0" cy="0" r="1" gradientTransform="translate(24 18) rotate(48) scale(82)">
        <stop stop-color="#fff" stop-opacity=".24"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#bg)"/>
    <circle cx="50" cy="50" r="49" fill="url(#shine)"/>
    <text x="50" y="52" fill="#fff" font-family="Arial,sans-serif" font-size="36" font-weight="600" letter-spacing="1" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function mediaUserFromAuth(input: {
  id: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: string;
  username?: string | null;
  bio?: string | null;
  website?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isPrivate?: boolean;
  reporterVerified?: boolean;
}): MediaUser {
  return {
    id: input.id,
    username: input.username || mediaUsername(input.name, input.email),
    full_name: mediaFullName(input.name, input.email),
    avatar_url: mediaAvatar(input.name, input.email, input.avatarUrl),
    bio: input.bio ?? null,
    website: input.website ?? null,
    location: input.location ?? null,
    is_verified: Boolean(input.isVerified),
    is_private: Boolean(input.isPrivate),
    reporter_verified: Boolean(input.reporterVerified),
  };
}
