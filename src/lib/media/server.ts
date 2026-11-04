import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { MediaPost } from "@/lib/media/mockData";
import { MEDIA_CATEGORIES, type MediaCategory } from "@/lib/media/categories";
import { mediaAvatar, mediaFullName, mediaUsername } from "@/lib/media/user";

const MAX_CAPTION = 2200;
const MAX_LOCATION = 120;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

const IMAGE_MIME_RE = /^image\/(?:jpeg|jpg|png|webp)$/i;
const VIDEO_MIME_RE = /^video\/(?:mp4|webm|quicktime)$/i;

type MediaKind = "image" | "video";

type PostRow = {
  id: string;
  type: string;
  caption: string;
  category: string;
  location_name: string | null;
  created_at: string | Date;
  author_id: string;
  author_name: string | null;
  author_email: string;
  author_avatar: string | null;
  image_id: string | null;
  media_kind: string | null;
  image_width: number | null;
  image_height: number | null;
  image_alt: string | null;
  like_count: number;
  repost_count: number;
  is_liked: boolean;
  is_reposted: boolean;
};

const POST_SELECT = `
  SELECT
    p.id, p.type, p.caption, p.category, p.location_name, p.created_at,
    u.id AS author_id, u.name AS author_name, u.email AS author_email,
    u.avatar_url AS author_avatar,
    i.id AS image_id, i.kind AS media_kind,
    i.width AS image_width, i.height AS image_height,
    i.alt_text AS image_alt,
    (SELECT COUNT(*)::int FROM media_likes ml WHERE ml.post_id = p.id) AS like_count,
    (SELECT COUNT(*)::int FROM media_reposts mr WHERE mr.post_id = p.id) AS repost_count,
    EXISTS(SELECT 1 FROM media_likes ml WHERE ml.post_id = p.id AND ml.user_id = $1) AS is_liked,
    EXISTS(SELECT 1 FROM media_reposts mr WHERE mr.post_id = p.id AND mr.user_id = $1) AS is_reposted
  FROM media_posts p
  JOIN users u ON u.id = p.user_id
  LEFT JOIN media_images i ON i.post_id = p.id
`;

function toIso(value: string | Date): string {
  return new Date(value).toISOString();
}

function rowToPost(row: PostRow): MediaPost {
  const kind: MediaKind = row.media_kind === "video" ? "video" : "image";
  const mediaUrl = row.image_id ? `/api/media/images/${row.image_id}` : "";
  const width = Number(row.image_width) || 1080;
  const height = Number(row.image_height) || 1080;

  return {
    id: row.id,
    type: kind === "video" || row.type === "reel" ? "reel" : "post",
    caption: row.caption,
    category: row.category,
    created_at: toIso(row.created_at),
    aspect_ratio: row.image_width && row.image_height ? width / height : 1,
    hide_likes: false,
    comments_off: false,
    location_name: row.location_name,
    like_count: Number(row.like_count) || 0,
    comment_count: 0,
    images:
      row.image_id && kind === "image"
        ? [
            {
              id: row.image_id,
              url: mediaUrl,
              width,
              height,
              alt_text: row.image_alt || row.caption,
            },
          ]
        : [],
    videos:
      row.image_id && kind === "video"
        ? [{ id: row.image_id, url: mediaUrl, width, height }]
        : [],
    user: {
      id: row.author_id,
      username: mediaUsername(row.author_name, row.author_email),
      full_name: mediaFullName(row.author_name, row.author_email),
      avatar_url: mediaAvatar(row.author_name, row.author_email, row.author_avatar),
      is_verified: false,
      is_private: false,
    },
    comments: [],
    is_liked: Boolean(row.is_liked),
    is_saved: false,
    is_reposted: Boolean(row.is_reposted),
    repost_count: Number(row.repost_count) || 0,
    is_real: true,
  };
}

export async function listMediaPosts(
  viewerId: string | null,
  limit = 50,
): Promise<MediaPost[]> {
  const sql = getSql();
  const capped = Math.min(Math.max(limit, 1), 100);
  const rows = (await sql.query(`${POST_SELECT} ORDER BY p.created_at DESC LIMIT $2`, [
    viewerId ?? "",
    capped,
  ])) as PostRow[];
  return rows.map(rowToPost);
}

export async function getMediaPost(
  postId: string,
  viewerId: string | null,
): Promise<MediaPost | null> {
  const sql = getSql();
  const rows = (await sql.query(`${POST_SELECT} WHERE p.id = $2 LIMIT 1`, [
    viewerId ?? "",
    postId,
  ])) as PostRow[];
  return rows[0] ? rowToPost(rows[0]) : null;
}

export type CreateMediaPostInput = {
  caption?: string;
  category?: string;
  locationName?: string;
  mediaDataUrl?: string;
  imageDataUrl?: string;
  width?: number;
  height?: number;
};

function parseDataUrl(dataUrl: string): {
  kind: MediaKind;
  mime: string;
  buffer: Buffer;
} {
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!match) throw new Error("Upload a photo or video.");

  const mime = match[1].toLowerCase();
  const isImage = IMAGE_MIME_RE.test(mime);
  const isVideo = VIDEO_MIME_RE.test(mime);
  if (!isImage && !isVideo) {
    throw new Error("Upload a JPEG, PNG, WebP photo or an MP4/WebM video.");
  }

  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (buffer.length === 0) throw new Error("That file could not be read.");

  if (isImage && buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("That photo is too large. Choose one under 8 MB.");
  }
  if (isVideo && buffer.length > MAX_VIDEO_BYTES) {
    throw new Error("That video is too large. Choose one under 30 MB.");
  }

  return {
    kind: isVideo ? "video" : "image",
    mime: mime === "image/jpg" ? "image/jpeg" : mime,
    buffer,
  };
}

export async function createMediaPost(
  userId: string,
  input: CreateMediaPostInput,
): Promise<MediaPost> {
  const source = input.mediaDataUrl ?? input.imageDataUrl ?? "";
  const { kind, mime, buffer } = parseDataUrl(source);

  const caption = (input.caption ?? "").trim().slice(0, MAX_CAPTION);
  const location = (input.locationName ?? "").trim().slice(0, MAX_LOCATION) || null;
  const category = MEDIA_CATEGORIES.includes(input.category as MediaCategory)
    ? (input.category as MediaCategory)
    : "community";

  const width = Math.min(Math.max(Math.round(input.width ?? 1080), 1), 10000);
  const height = Math.min(Math.max(Math.round(input.height ?? 1080), 1), 10000);

  const sql = getSql();
  const postId = randomUUID();
  const imageId = randomUUID();

  await sql.query(
    `INSERT INTO media_posts (id, user_id, type, caption, category, location_name)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [postId, userId, kind === "video" ? "reel" : "post", caption, category, location],
  );

  await sql.query(
    `INSERT INTO media_images (id, post_id, kind, mime, data, width, height, alt_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      imageId,
      postId,
      kind,
      mime,
      buffer.toString("base64"),
      width,
      height,
      caption,
    ],
  );

  const post = await getMediaPost(postId, userId);
  if (!post) throw new Error("Could not load the new post.");
  return post;
}

async function postExists(postId: string): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query("SELECT 1 FROM media_posts WHERE id = $1 LIMIT 1", [
    postId,
  ])) as unknown[];
  return rows.length > 0;
}

export async function toggleMediaLike(
  postId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  if (!(await postExists(postId))) return null;

  const sql = getSql();
  const existing = (await sql.query(
    "SELECT 1 FROM media_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1",
    [postId, userId],
  )) as unknown[];

  if (existing.length > 0) {
    await sql.query("DELETE FROM media_likes WHERE post_id = $1 AND user_id = $2", [
      postId,
      userId,
    ]);
  } else {
    await sql.query(
      "INSERT INTO media_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, userId],
    );
  }

  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_likes WHERE post_id = $1",
    [postId],
  )) as { count: number }[];

  return { liked: existing.length === 0, likeCount: Number(rows[0]?.count) || 0 };
}

export async function toggleMediaRepost(
  postId: string,
  userId: string,
): Promise<{ reposted: boolean; repostCount: number } | null> {
  if (!(await postExists(postId))) return null;

  const sql = getSql();
  const existing = (await sql.query(
    "SELECT 1 FROM media_reposts WHERE post_id = $1 AND user_id = $2 LIMIT 1",
    [postId, userId],
  )) as unknown[];

  if (existing.length > 0) {
    await sql.query(
      "DELETE FROM media_reposts WHERE post_id = $1 AND user_id = $2",
      [postId, userId],
    );
  } else {
    await sql.query(
      "INSERT INTO media_reposts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, userId],
    );
  }

  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_reposts WHERE post_id = $1",
    [postId],
  )) as { count: number }[];

  return {
    reposted: existing.length === 0,
    repostCount: Number(rows[0]?.count) || 0,
  };
}

export async function getMediaImage(
  imageId: string,
): Promise<{ mime: string; buffer: Buffer } | null> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT mime, data FROM media_images WHERE id = $1 LIMIT 1",
    [imageId],
  )) as { mime: string; data: string }[];
  const row = rows[0];
  if (!row) return null;
  return { mime: row.mime, buffer: Buffer.from(row.data, "base64") };
}
