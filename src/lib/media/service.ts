import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type {
  FeedResponse,
  MediaComment,
  MediaImage,
  MediaPost,
  MediaUser,
  ProfileResponse,
  SearchResults,
  StoryGroup,
  StoryItem,
  SuggestedUser,
  TrendingHashtag,
} from "@/lib/media/types";
import {
  MEDIA_CATEGORIES,
  isMediaCategory,
  MEDIA_CATEGORY_LABELS,
} from "@/lib/media/categories";
import {
  MAX_ALT,
  MAX_CAPTION,
  MAX_COMMENT,
  MAX_LOCATION,
  extractHashtags,
  extractMentions,
  isValidHttpUrl,
  isValidUsername,
  normalizeUsername,
  sanitizeText,
} from "@/lib/media/validation";
import { mediaAvatar, mediaFullName, mediaUsername } from "@/lib/media/user";
import { removeMedia } from "@/lib/media/storage";
import { invalidateMediaCache } from "@/lib/media/cache";

type Row = Record<string, unknown>;

const POST_FIELDS = `
  p.id, p.type, p.caption, p.category, p.location_name, p.created_at,
  p.visibility, p.comments_off, p.hide_likes,
  u.id AS author_id, u.username AS author_username, u.name AS author_name,
  u.email AS author_email, u.avatar_url AS author_avatar, u.bio AS author_bio,
  u.website AS author_website, u.location AS author_location,
  u.is_verified AS author_verified, u.is_private AS author_private,
  u.reporter_verified AS author_reporter,
  (SELECT COUNT(*)::int FROM media_likes ml WHERE ml.post_id = p.id) AS like_count,
  (SELECT COUNT(*)::int FROM media_comments mc WHERE mc.post_id = p.id) AS comment_count,
  (SELECT COUNT(*)::int FROM media_reposts mr WHERE mr.post_id = p.id) AS repost_count,
  (SELECT COUNT(*)::int FROM media_post_shares msh WHERE msh.post_id = p.id) AS share_count,
  (SELECT COUNT(*)::int FROM media_post_views mpv WHERE mpv.post_id = p.id) AS view_count,
  EXISTS(SELECT 1 FROM media_likes ml WHERE ml.post_id = p.id AND ml.user_id = $1) AS is_liked,
  EXISTS(SELECT 1 FROM media_reposts mr WHERE mr.post_id = p.id AND mr.user_id = $1) AS is_reposted,
  EXISTS(SELECT 1 FROM media_saves ms WHERE ms.post_id = p.id AND ms.user_id = $1) AS is_saved,
  (SELECT COALESCE(json_agg(json_build_object(
      'id', m.id, 'kind', m.kind,
      'url', COALESCE(NULLIF(m.url, ''), '/api/media/images/' || m.id),
      'width', m.width, 'height', m.height, 'alt_text', m.alt_text,
      'duration_ms', m.duration_ms, 'position', m.position
    ) ORDER BY m.position, m.created_at), '[]'::json)
   FROM media_images m WHERE m.post_id = p.id) AS media,
  (SELECT COALESCE(json_agg(pt.tag ORDER BY pt.tag), '[]'::json)
   FROM media_post_hashtags pt WHERE pt.post_id = p.id) AS hashtags
`;

const VISIBILITY = `
  AND (u.is_private = FALSE OR u.id = $1 OR EXISTS (
    SELECT 1 FROM media_follows f
    WHERE f.follower_id = $1 AND f.following_id = u.id AND f.status = 'accepted'
  ))
  AND (p.visibility <> 'private' OR p.user_id = $1)
  AND (p.visibility <> 'followers' OR p.user_id = $1 OR EXISTS (
    SELECT 1 FROM media_follows f
    WHERE f.follower_id = $1 AND f.following_id = p.user_id AND f.status = 'accepted'
  ))
`;

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toIso(value: unknown): string {
  return new Date(value as string | Date).toISOString();
}

function rowToPost(row: Row, viewerId: string | null): MediaPost {
  const media = asArray<MediaImage & { position?: number }>(row.media).map((m) => ({
    id: String(m.id),
    url: String(m.url),
    width: Number(m.width) || 1080,
    height: Number(m.height) || 1080,
    alt_text: String(m.alt_text ?? ""),
    kind: m.kind === "video" ? ("video" as const) : ("image" as const),
    duration_ms: m.duration_ms == null ? null : Number(m.duration_ms),
  }));

  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind === "video");
  const first = media[0];

  return {
    id: String(row.id),
    type: row.type === "reel" || videos.length > 0 ? "reel" : "post",
    caption: String(row.caption ?? ""),
    category: String(row.category ?? "community"),
    created_at: toIso(row.created_at),
    aspect_ratio: first ? first.width / first.height : 1,
    hide_likes: Boolean(row.hide_likes),
    comments_off: Boolean(row.comments_off),
    visibility: (row.visibility as MediaPost["visibility"]) ?? "public",
    location_name: (row.location_name as string | null) ?? null,
    like_count: Number(row.like_count) || 0,
    comment_count: Number(row.comment_count) || 0,
    repost_count: Number(row.repost_count) || 0,
    share_count: Number(row.share_count) || 0,
    view_count: Number(row.view_count) || 0,
    images,
    videos,
    user: {
      id: String(row.author_id),
      username:
        (row.author_username as string) ||
        mediaUsername(row.author_name as string, row.author_email as string),
      full_name: mediaFullName(row.author_name as string, row.author_email as string),
      avatar_url: mediaAvatar(
        row.author_name as string,
        row.author_email as string,
        row.author_avatar as string,
      ),
      bio: (row.author_bio as string) ?? null,
      website: (row.author_website as string) ?? null,
      location: (row.author_location as string) ?? null,
      is_verified: Boolean(row.author_verified),
      is_private: Boolean(row.author_private),
      reporter_verified: Boolean(row.author_reporter),
    },
    comments: [],
    hashtags: asArray<string>(row.hashtags),
    is_liked: Boolean(row.is_liked),
    is_saved: Boolean(row.is_saved),
    is_reposted: Boolean(row.is_reposted),
    is_owner: viewerId != null && viewerId === String(row.author_id),
    is_real: true,
  };
}

export interface ListPostsOptions {
  viewerId: string | null;
  scope?:
    | "for-you"
    | "following"
    | "explore"
    | "reels"
    | "liked"
    | "saved"
    | "user"
    | "hashtag"
    | "location"
    | "tagged";
  category?: string;
  username?: string;
  hashtag?: string;
  location?: string;
  limit?: number;
  offset?: number;
}

export async function listPosts(options: ListPostsOptions): Promise<FeedResponse> {
  const viewerId = options.viewerId ?? "";
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 30);
  const offset = Math.max(options.offset ?? 0, 0);
  const params: unknown[] = [viewerId];
  const where: string[] = [];
  let joins = "";

  const add = (value: unknown): string => {
    params.push(value);
    return `$${params.length}`;
  };

  switch (options.scope) {
    case "following":
      where.push(
        options.viewerId
          ? `p.user_id IN (SELECT following_id FROM media_follows WHERE follower_id = $1 AND status = 'accepted')`
          : "FALSE",
      );
      break;
    case "liked":
      joins += ` JOIN media_likes liked ON liked.post_id = p.id AND liked.user_id = $1`;
      where.push("TRUE");
      break;
    case "saved":
      joins += ` JOIN media_saves saved ON saved.post_id = p.id AND saved.user_id = $1`;
      where.push("TRUE");
      break;
    case "hashtag":
      where.push(`EXISTS (SELECT 1 FROM media_post_hashtags ph WHERE ph.post_id = p.id AND ph.tag = ${add(options.hashtag ?? "")})`);
      break;
    case "location":
      where.push(`LOWER(p.location_name) = LOWER(${add(options.location ?? "")})`);
      break;
    case "tagged": {
      const username = options.username ?? "";
      where.push(
        `EXISTS (SELECT 1 FROM media_post_tags pt JOIN users tu ON tu.id = pt.user_id WHERE pt.post_id = p.id AND LOWER(tu.username) = LOWER(${add(username)}))`,
      );
      break;
    }
    case "user": {
      const username = options.username ?? "";
      where.push(`LOWER(u.username) = LOWER(${add(username)})`);
      break;
    }
    case "reels":
      where.push(
        `EXISTS (SELECT 1 FROM media_images mv WHERE mv.post_id = p.id AND mv.kind = 'video')`,
      );
      break;
    case "explore":
    case "for-you":
    default:
      break;
  }

  if (options.category && isMediaCategory(options.category)) {
    where.push(`p.category = ${add(options.category)}`);
  }

  if (options.scope !== "user") {
    where.push(VISIBILITY.replace(/^\s*AND\s+/i, ""));
  }

  const order =
    options.scope === "explore"
      ? // Postgres can't use SELECT aliases inside an ORDER BY expression
        // ("column like_count does not exist"), which broke Explore.
        `ORDER BY ((SELECT COUNT(*) FROM media_likes ml2 WHERE ml2.post_id = p.id) * 2
                 + (SELECT COUNT(*) FROM media_comments mc2 WHERE mc2.post_id = p.id) * 3) DESC, p.created_at DESC`
      : `ORDER BY p.created_at DESC`;

  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${POST_FIELDS}
     FROM media_posts p
     JOIN users u ON u.id = p.user_id
     ${joins}
     WHERE ${where.length ? where.join(" AND ") : "TRUE"}
     ${order}
     LIMIT ${add(limit)} OFFSET ${add(offset)}`,
    params,
  )) as Row[];

  const posts = rows.map((row) => rowToPost(row, options.viewerId));
  return { posts, nextCursor: posts.length === limit ? offset + limit : null };
}

export async function getPost(
  postId: string,
  viewerId: string | null,
): Promise<MediaPost | null> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT ${POST_FIELDS}
     FROM media_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $2 ${VISIBILITY}
     LIMIT 1`,
    [viewerId ?? "", postId],
  )) as Row[];
  return rows[0] ? rowToPost(rows[0], viewerId) : null;
}

export interface NewMediaInput {
  kind: "image" | "video";
  url: string;
  storagePath: string;
  mime: string;
  width: number;
  height: number;
  durationMs: number | null;
  altText: string;
}

export interface CreatePostInput {
  caption: string;
  category: string;
  locationName: string;
  visibility: "public" | "followers" | "private";
  commentsOff: boolean;
  hideLikes: boolean;
  media: NewMediaInput[];
  taggedUsernames?: string[];
}

async function notify(input: {
  userId: string;
  actorId: string;
  type: string;
  postId?: string | null;
  commentId?: string | null;
  conversationId?: string | null;
  content?: string;
}): Promise<void> {
  if (input.userId === input.actorId) return;
  const sql = getSql();
  await sql.query(
    `INSERT INTO media_notifications
       (id, user_id, actor_id, type, post_id, comment_id, conversation_id, content)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      randomUUID(),
      input.userId,
      input.actorId,
      input.type,
      input.postId ?? null,
      input.commentId ?? null,
      input.conversationId ?? null,
      input.content ?? "",
    ],
  );
}

async function syncHashtags(postId: string, caption: string, delta: 1 | -1): Promise<void> {
  const tags = extractHashtags(caption);
  if (tags.length === 0) return;
  const sql = getSql();
  for (const tag of tags) {
    if (delta === 1) {
      await sql.query(
        `INSERT INTO media_hashtags (tag, post_count) VALUES ($1, 1)
         ON CONFLICT (tag) DO UPDATE SET post_count = media_hashtags.post_count + 1`,
        [tag],
      );
      await sql.query(
        `INSERT INTO media_post_hashtags (post_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, tag],
      );
    } else {
      await sql.query(
        `UPDATE media_hashtags SET post_count = GREATEST(0, post_count - 1)
         WHERE tag IN (SELECT tag FROM media_post_hashtags WHERE post_id = $1)`,
        [postId],
      );
    }
  }
}

async function notifyMentions(postId: string, actorId: string, caption: string): Promise<void> {
  const mentions = extractMentions(caption);
  if (mentions.length === 0) return;
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT id, username FROM users WHERE LOWER(username) = ANY($1) AND id <> $2`,
    [mentions, actorId],
  )) as { id: string; username: string }[];
  for (const row of rows) {
    await notify({
      userId: row.id,
      actorId,
      type: "mention",
      postId,
      content: "mentioned you in a post",
    });
  }
}

export async function createPost(
  userId: string,
  input: CreatePostInput,
): Promise<MediaPost> {
  if (input.media.length === 0) throw new Error("Add at least one photo or video.");
  if (input.media.length > 10) throw new Error("You can share up to 10 photos or videos.");

  const caption = sanitizeText(input.caption, MAX_CAPTION);
  const location = sanitizeText(input.locationName, MAX_LOCATION) || null;
  const category = isMediaCategory(input.category) ? input.category : "community";
  const visibility =
    input.visibility === "followers" || input.visibility === "private"
      ? input.visibility
      : "public";
  const type = input.media.some((m) => m.kind === "video") ? "reel" : "post";

  const sql = getSql();
  const postId = randomUUID();

  await sql.query(
    `INSERT INTO media_posts
       (id, user_id, type, caption, category, location_name, visibility, comments_off, hide_likes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [postId, userId, type, caption, category, location, visibility, input.commentsOff, input.hideLikes],
  );

  let position = 0;
  for (const media of input.media) {
    await sql.query(
      `INSERT INTO media_images
         (id, post_id, kind, mime, data, width, height, alt_text, url, storage_path, position, duration_ms)
       VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11)`,
      [
        randomUUID(),
        postId,
        media.kind,
        media.mime,
        media.width,
        media.height,
        sanitizeText(media.altText, MAX_ALT) || caption.slice(0, MAX_ALT),
        media.url,
        media.storagePath,
        position,
        media.durationMs,
      ],
    );
    position += 1;
  }

  await syncHashtags(postId, caption, 1);
  await notifyMentions(postId, userId, caption);

  const tagged = input.taggedUsernames ?? [];
  if (tagged.length > 0) {
    const rows = (await sql.query(
      `SELECT id FROM users WHERE LOWER(username) = ANY($1) AND id <> $2`,
      [tagged.map((name) => name.toLowerCase()), userId],
    )) as { id: string }[];
    for (const row of rows) {
      await sql.query(
        `INSERT INTO media_post_tags (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, row.id],
      );
      await notify({
        userId: row.id,
        actorId: userId,
        type: "mention",
        postId,
        content: "tagged you in a post",
      });
    }
  }

  const post = await getPost(postId, userId);
  if (!post) throw new Error("Could not load the new post.");
  await invalidateMediaCache();
  return post;
}

export async function deletePost(
  postId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT user_id FROM media_posts WHERE id = $1 LIMIT 1",
    [postId],
  )) as { user_id: string }[];
  if (!rows[0]) return false;
  if (!isAdmin && rows[0].user_id !== userId) throw new Error("You cannot delete this post.");

  const media = (await sql.query(
    "SELECT storage_path FROM media_images WHERE post_id = $1",
    [postId],
  )) as { storage_path: string | null }[];

  const captionRows = (await sql.query(
    "SELECT caption FROM media_posts WHERE id = $1",
    [postId],
  )) as { caption: string }[];
  await syncHashtags(postId, captionRows[0]?.caption ?? "", -1);
  await sql.query("DELETE FROM media_posts WHERE id = $1", [postId]);
  await Promise.all(media.map((m) => removeMedia(m.storage_path)));
  await invalidateMediaCache();
  return true;
}

export async function toggleLike(
  postId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  const sql = getSql();
  // Only posts this member is allowed to see (privacy and follower rules).
  const postRows = await visiblePostOwner(postId, userId);
  if (!postRows[0]) return null;

  const existing = (await sql.query(
    "SELECT 1 FROM media_likes WHERE post_id = $1 AND user_id = $2 LIMIT 1",
    [postId, userId],
  )) as unknown[];

  if (existing.length > 0) {
    await sql.query("DELETE FROM media_likes WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  } else {
    await sql.query(
      "INSERT INTO media_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, userId],
    );
    await notify({
      userId: postRows[0].user_id,
      actorId: userId,
      type: "like",
      postId,
      content: "liked your post",
    });
  }

  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_likes WHERE post_id = $1",
    [postId],
  )) as { count: number }[];

  await invalidateMediaCache();
  return { liked: existing.length === 0, likeCount: Number(rows[0]?.count) || 0 };
}

export async function toggleSave(
  postId: string,
  userId: string,
): Promise<{ saved: boolean } | null> {
  const sql = getSql();
  if (!(await visiblePostOwner(postId, userId))[0]) return null;
  const existing = (await sql.query(
    "SELECT 1 FROM media_saves WHERE post_id = $1 AND user_id = $2 LIMIT 1",
    [postId, userId],
  )) as unknown[];
  if (existing.length > 0) {
    await sql.query("DELETE FROM media_saves WHERE post_id = $1 AND user_id = $2", [postId, userId]);
    await invalidateMediaCache();
    return { saved: false };
  }
  await sql.query(
    "INSERT INTO media_saves (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [postId, userId],
  );
  await invalidateMediaCache();
  return { saved: true };
}

export async function toggleRepost(
  postId: string,
  userId: string,
): Promise<{ reposted: boolean; repostCount: number } | null> {
  const sql = getSql();
  const postRows = await visiblePostOwner(postId, userId);
  if (!postRows[0]) return null;

  const existing = (await sql.query(
    "SELECT 1 FROM media_reposts WHERE post_id = $1 AND user_id = $2 LIMIT 1",
    [postId, userId],
  )) as unknown[];

  if (existing.length > 0) {
    await sql.query("DELETE FROM media_reposts WHERE post_id = $1 AND user_id = $2", [postId, userId]);
  } else {
    await sql.query(
      "INSERT INTO media_reposts (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [postId, userId],
    );
    await notify({
      userId: postRows[0].user_id,
      actorId: userId,
      type: "repost",
      postId,
      content: "reshared your post",
    });
  }

  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_reposts WHERE post_id = $1",
    [postId],
  )) as { count: number }[];
  await invalidateMediaCache();
  return { reposted: existing.length === 0, repostCount: Number(rows[0]?.count) || 0 };
}

// ── Engagement: visibility, shares, views, live counts ───────────────────────

/** The post's owner if `viewerId` may see the post (same rules as the feed); [] otherwise. */
async function visiblePostOwner(postId: string, viewerId: string | null): Promise<{ user_id: string }[]> {
  const sql = getSql();
  return (await sql.query(
    `SELECT p.user_id FROM media_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $2 AND u.is_suspended = FALSE ${VISIBILITY}
     LIMIT 1`,
    [viewerId ?? "", postId],
  )) as { user_id: string }[];
}

export const SHARE_CHANNELS = ["native", "link", "whatsapp", "x", "facebook", "telegram"] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

/**
 * Record a share. The same member sharing the same post on the same channel
 * again within an hour is not counted twice.
 */
export async function recordShare(
  postId: string,
  userId: string,
  channel: ShareChannel,
): Promise<{ recorded: boolean; shareCount: number } | null> {
  const sql = getSql();
  if (!(await visiblePostOwner(postId, userId))[0]) return null;

  const rows = (await sql.query(
    `INSERT INTO media_post_shares (id, post_id, user_id, channel)
     SELECT $1, $2, $3, $4
     WHERE NOT EXISTS (
       SELECT 1 FROM media_post_shares
       WHERE post_id = $2 AND user_id = $3 AND channel = $4
         AND created_at > NOW() - INTERVAL '1 hour'
     )
     RETURNING id`,
    [randomUUID(), postId, userId, channel],
  )) as unknown[];

  const count = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_post_shares WHERE post_id = $1",
    [postId],
  )) as { count: number }[];
  return { recorded: rows.length > 0, shareCount: Number(count[0]?.count) || 0 };
}

/**
 * Record a genuine view: one per viewer per post per day. The author's own
 * views are never counted. `viewerKey` is "u:<user id>" for members or a
 * salted hash for visitors who are not signed in.
 */
export async function recordView(
  postId: string,
  viewerKey: string,
  userId: string | null,
): Promise<{ counted: boolean; viewCount: number } | null> {
  const sql = getSql();
  const owner = (await visiblePostOwner(postId, userId))[0];
  if (!owner) return null;

  let counted = false;
  if (owner.user_id !== userId) {
    const rows = (await sql.query(
      `INSERT INTO media_post_views (post_id, viewer_key, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (post_id, viewer_key, view_date) DO NOTHING
       RETURNING post_id`,
      [postId, viewerKey, userId],
    )) as unknown[];
    counted = rows.length > 0;
  }

  const count = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_post_views WHERE post_id = $1",
    [postId],
  )) as { count: number }[];
  return { counted, viewCount: Number(count[0]?.count) || 0 };
}

export interface PostStats {
  id: string;
  like_count: number;
  comment_count: number;
  repost_count: number;
  share_count: number;
  view_count: number;
  is_liked: boolean;
  is_reposted: boolean;
  is_saved: boolean;
}

/** Current counts for several posts at once (only posts the viewer may see). */
export async function postStats(ids: string[], viewerId: string | null): Promise<PostStats[]> {
  const unique = [...new Set(ids)].slice(0, 50);
  if (unique.length === 0) return [];
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT p.id,
       (SELECT COUNT(*)::int FROM media_likes ml WHERE ml.post_id = p.id) AS like_count,
       (SELECT COUNT(*)::int FROM media_comments mc WHERE mc.post_id = p.id) AS comment_count,
       (SELECT COUNT(*)::int FROM media_reposts mr WHERE mr.post_id = p.id) AS repost_count,
       (SELECT COUNT(*)::int FROM media_post_shares msh WHERE msh.post_id = p.id) AS share_count,
       (SELECT COUNT(*)::int FROM media_post_views mpv WHERE mpv.post_id = p.id) AS view_count,
       EXISTS(SELECT 1 FROM media_likes ml WHERE ml.post_id = p.id AND ml.user_id = $1) AS is_liked,
       EXISTS(SELECT 1 FROM media_reposts mr WHERE mr.post_id = p.id AND mr.user_id = $1) AS is_reposted,
       EXISTS(SELECT 1 FROM media_saves ms WHERE ms.post_id = p.id AND ms.user_id = $1) AS is_saved
     FROM media_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = ANY($2) AND u.is_suspended = FALSE ${VISIBILITY}`,
    [viewerId ?? "", unique],
  )) as Row[];
  return rows.map((r) => ({
    id: String(r.id),
    like_count: Number(r.like_count) || 0,
    comment_count: Number(r.comment_count) || 0,
    repost_count: Number(r.repost_count) || 0,
    share_count: Number(r.share_count) || 0,
    view_count: Number(r.view_count) || 0,
    is_liked: Boolean(r.is_liked),
    is_reposted: Boolean(r.is_reposted),
    is_saved: Boolean(r.is_saved),
  }));
}

// ── Comments ────────────────────────────────────────────────────────────────

function rowToComment(row: Row, viewerId: string | null): MediaComment {
  return {
    id: String(row.id),
    content: String(row.content ?? ""),
    created_at: toIso(row.created_at),
    like_count: Number(row.like_count) || 0,
    is_liked: Boolean(row.is_liked),
    is_owner: viewerId != null && viewerId === String(row.author_id),
    parent_id: (row.parent_id as string | null) ?? null,
    user: {
      id: String(row.author_id),
      username:
        (row.author_username as string) ||
        mediaUsername(row.author_name as string, row.author_email as string),
      avatar_url: mediaAvatar(
        row.author_name as string,
        row.author_email as string,
        row.author_avatar as string,
      ),
    },
    replies: [],
  };
}

export async function listComments(
  postId: string,
  viewerId: string | null,
): Promise<MediaComment[]> {
  // Comments on posts the viewer can't see stay private.
  if (!(await visiblePostOwner(postId, viewerId))[0]) return [];
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT c.id, c.content, c.created_at, c.parent_id,
            u.id AS author_id, u.username AS author_username, u.name AS author_name,
            u.email AS author_email, u.avatar_url AS author_avatar,
            (SELECT COUNT(*)::int FROM media_comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
            EXISTS(SELECT 1 FROM media_comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $2) AS is_liked
     FROM media_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1
     ORDER BY c.created_at ASC
     LIMIT 300`,
    [postId, viewerId ?? ""],
  )) as Row[];

  const map = new Map<string, MediaComment>();
  const roots: MediaComment[] = [];
  for (const row of rows) {
    const comment = rowToComment(row, viewerId);
    map.set(comment.id, comment);
  }
  for (const comment of map.values()) {
    const parent = comment.parent_id ? map.get(comment.parent_id) : null;
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  }
  return roots;
}

export async function addComment(
  postId: string,
  userId: string,
  contentInput: string,
  parentId?: string | null,
): Promise<MediaComment> {
  const content = sanitizeText(contentInput, MAX_COMMENT);
  if (!content) throw new Error("Write a comment first.");

  const sql = getSql();
  // Members can only comment on posts they are allowed to see.
  const postRows = (await sql.query(
    `SELECT p.user_id, p.comments_off FROM media_posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.id = $2 AND u.is_suspended = FALSE ${VISIBILITY}
     LIMIT 1`,
    [userId, postId],
  )) as { user_id: string; comments_off: boolean }[];
  if (!postRows[0]) throw new Error("Post not found.");
  if (postRows[0].comments_off) throw new Error("Comments are turned off for this post.");

  let parentAuthor: string | null = null;
  if (parentId) {
    const parentRows = (await sql.query(
      "SELECT user_id FROM media_comments WHERE id = $1 AND post_id = $2 LIMIT 1",
      [parentId, postId],
    )) as { user_id: string }[];
    if (!parentRows[0]) throw new Error("The comment you replied to no longer exists.");
    parentAuthor = parentRows[0].user_id;
  }

  const commentId = randomUUID();
  await sql.query(
    `INSERT INTO media_comments (id, post_id, user_id, parent_id, content)
     VALUES ($1, $2, $3, $4, $5)`,
    [commentId, postId, userId, parentId ?? null, content],
  );

  if (parentAuthor) {
    await notify({
      userId: parentAuthor,
      actorId: userId,
      type: "reply",
      postId,
      commentId,
      content: "replied to your comment",
    });
  } else {
    await notify({
      userId: postRows[0].user_id,
      actorId: userId,
      type: "comment",
      postId,
      commentId,
      content: `commented: "${content.slice(0, 80)}"`,
    });
  }

  const mentions = extractMentions(content);
  if (mentions.length > 0) {
    const rows = (await sql.query(
      `SELECT id FROM users WHERE LOWER(username) = ANY($1) AND id <> $2`,
      [mentions, userId],
    )) as { id: string }[];
    for (const row of rows) {
      await notify({
        userId: row.id,
        actorId: userId,
        type: "mention",
        postId,
        commentId,
        content: "mentioned you in a comment",
      });
    }
  }

  const rows = (await sql.query(
    `SELECT c.id, c.content, c.created_at, c.parent_id,
            u.id AS author_id, u.username AS author_username, u.name AS author_name,
            u.email AS author_email, u.avatar_url AS author_avatar,
            0 AS like_count, FALSE AS is_liked
     FROM media_comments c JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [commentId],
  )) as Row[];
  await invalidateMediaCache();
  return rowToComment(rows[0], userId);
}

export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT c.user_id, p.user_id AS post_owner
     FROM media_comments c JOIN media_posts p ON p.id = c.post_id
     WHERE c.id = $1 LIMIT 1`,
    [commentId],
  )) as { user_id: string; post_owner: string }[];
  if (!rows[0]) return false;
  if (!isAdmin && rows[0].user_id !== userId && rows[0].post_owner !== userId) {
    throw new Error("You cannot delete this comment.");
  }
  await sql.query("DELETE FROM media_comments WHERE id = $1", [commentId]);
  await invalidateMediaCache();
  return true;
}

export async function toggleCommentLike(
  commentId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number } | null> {
  const sql = getSql();
  const exists = (await sql.query("SELECT 1 FROM media_comments WHERE id = $1", [commentId])) as unknown[];
  if (!exists[0]) return null;
  const existing = (await sql.query(
    "SELECT 1 FROM media_comment_likes WHERE comment_id = $1 AND user_id = $2",
    [commentId, userId],
  )) as unknown[];
  if (existing.length > 0) {
    await sql.query(
      "DELETE FROM media_comment_likes WHERE comment_id = $1 AND user_id = $2",
      [commentId, userId],
    );
  } else {
    await sql.query(
      "INSERT INTO media_comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [commentId, userId],
    );
  }
  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_comment_likes WHERE comment_id = $1",
    [commentId],
  )) as { count: number }[];
  await invalidateMediaCache();
  return { liked: existing.length === 0, likeCount: Number(rows[0]?.count) || 0 };
}

// ── Profiles & social graph ─────────────────────────────────────────────────

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  is_verified: boolean;
  is_private: boolean;
  is_suspended: boolean;
  reporter_verified: boolean;
  role: string;
  created_at: string | Date;
};

export function rowToUser(row: UserRow, viewerId: string | null): MediaUser {
  return {
    id: row.id,
    username: row.username || mediaUsername(row.name, row.email),
    full_name: mediaFullName(row.name, row.email),
    avatar_url: mediaAvatar(row.name, row.email, row.avatar_url),
    bio: row.bio ?? "",
    website: row.website,
    location: row.location,
    is_verified: row.is_verified,
    is_private: row.is_private,
    reporter_verified: row.reporter_verified,
    is_following: false,
    follows_you: false,
    follow_pending: false,
  };
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
    [username],
  )) as UserRow[];
  return rows[0] ?? null;
}

export async function getProfile(
  username: string,
  viewerId: string | null,
  offset = 0,
): Promise<ProfileResponse | null> {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const sql = getSql();
  const viewer = viewerId ?? "";
  const isSelf = viewerId === user.id;

  const followRows = viewerId
    ? ((await sql.query(
        `SELECT status FROM media_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1`,
        [viewerId, user.id],
      )) as { status: string }[])
    : [];
  const reverseRows = viewerId
    ? ((await sql.query(
        `SELECT 1 FROM media_follows WHERE follower_id = $1 AND following_id = $2 AND status = 'accepted' LIMIT 1`,
        [user.id, viewerId],
      )) as unknown[])
    : [];

  const status = followRows[0]?.status ?? null;
  const isFollowing = status === "accepted";
  const locked = user.is_private && !isSelf && !isFollowing;

  const counts = (await sql.query(
    `SELECT
       (SELECT COUNT(*)::int FROM media_follows WHERE following_id = $1 AND status = 'accepted') AS followers,
       (SELECT COUNT(*)::int FROM media_follows WHERE follower_id = $1 AND status = 'accepted') AS following,
       (SELECT COUNT(*)::int FROM media_posts p JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1
           AND (u.is_private = FALSE OR $2 = $1 OR EXISTS (
             SELECT 1 FROM media_follows f WHERE f.follower_id = $2 AND f.following_id = $1 AND f.status = 'accepted'
           ))) AS posts`,
    [user.id, viewer],
  )) as { followers: number; following: number; posts: number }[];

  const mediaUser = rowToUser(user, viewerId);
  mediaUser.is_following = isFollowing;
  mediaUser.follow_pending = status === "pending";
  mediaUser.follows_you = reverseRows.length > 0;
  mediaUser.follower_count = Number(counts[0]?.followers) || 0;
  mediaUser.following_count = Number(counts[0]?.following) || 0;
  mediaUser.post_count = Number(counts[0]?.posts) || 0;

  let posts: MediaPost[] = [];
  let nextCursor: number | null = null;
  if (!locked) {
    const feed = await listPosts({
      viewerId,
      scope: "user",
      username: user.username ?? "",
      offset,
      limit: 12,
    });
    posts = feed.posts;
    nextCursor = feed.nextCursor;
  }

  return { user: mediaUser, locked, is_self: isSelf, posts, nextCursor };
}

export async function toggleFollow(
  viewerId: string,
  username: string,
): Promise<{ following: boolean; pending: boolean; followerCount: number }> {
  const target = await findUserByUsername(username);
  if (!target) throw new Error("Account not found.");
  if (target.id === viewerId) throw new Error("You cannot follow yourself.");

  const sql = getSql();
  const existing = (await sql.query(
    "SELECT status FROM media_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1",
    [viewerId, target.id],
  )) as { status: string }[];

  if (existing[0]) {
    await sql.query(
      "DELETE FROM media_follows WHERE follower_id = $1 AND following_id = $2",
      [viewerId, target.id],
    );
  } else {
    const pending = target.is_private;
    await sql.query(
      `INSERT INTO media_follows (follower_id, following_id, status)
       VALUES ($1, $2, $3) ON CONFLICT (follower_id, following_id) DO UPDATE SET status = $3`,
      [viewerId, target.id, pending ? "pending" : "accepted"],
    );
    await notify({
      userId: target.id,
      actorId: viewerId,
      type: pending ? "follow_request" : "follow",
      content: pending ? "requested to follow you" : "started following you",
    });
  }

  const countRows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_follows WHERE following_id = $1 AND status = 'accepted'",
    [target.id],
  )) as { count: number }[];

  await invalidateMediaCache();
  return {
    following: !existing[0] && !target.is_private,
    pending: !existing[0] && target.is_private,
    followerCount: Number(countRows[0]?.count) || 0,
  };
}

export async function respondToFollowRequest(
  ownerId: string,
  requesterId: string,
  accept: boolean,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT 1 FROM users WHERE id = $1 AND username IS NOT NULL LIMIT 1`,
    [requesterId],
  )) as unknown[];
  if (!rows[0]) return false;
  if (accept) {
    await sql.query(
      `UPDATE media_follows SET status = 'accepted'
       WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'`,
      [requesterId, ownerId],
    );
    await notify({
      userId: requesterId,
      actorId: ownerId,
      type: "follow",
      content: "accepted your follow request",
    });
  } else {
    await sql.query(
      `DELETE FROM media_follows WHERE follower_id = $1 AND following_id = $2 AND status = 'pending'`,
      [requesterId, ownerId],
    );
  }
  await invalidateMediaCache();
  return true;
}

export async function listFollows(
  username: string,
  kind: "followers" | "following",
  viewerId: string | null,
  limit = 50,
): Promise<MediaUser[]> {
  const target = await findUserByUsername(username);
  if (!target) return [];
  const sql = getSql();
  const viewer = viewerId ?? "";
  const rows = (await sql.query(
    kind === "followers"
      ? `SELECT u.* FROM media_follows f JOIN users u ON u.id = f.follower_id
         WHERE f.following_id = $1 AND f.status = 'accepted'
         ORDER BY f.created_at DESC LIMIT $3`
      : `SELECT u.* FROM media_follows f JOIN users u ON u.id = f.following_id
         WHERE f.follower_id = $1 AND f.status = 'accepted'
         ORDER BY f.created_at DESC LIMIT $3`,
    [target.id, viewer, Math.min(Math.max(limit, 1), 100)],
  )) as UserRow[];

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const viewerRows = viewerId
    ? ((await sql.query(
        `SELECT following_id, status FROM media_follows
         WHERE follower_id = $1 AND following_id = ANY($2)`,
        [viewerId, ids],
      )) as { following_id: string; status: string }[])
    : [];
  const map = new Map(viewerRows.map((r) => [r.following_id, r.status]));

  return rows.map((row) => {
    const user = rowToUser(row, viewerId);
    const status = map.get(row.id);
    user.is_following = status === "accepted";
    user.follow_pending = status === "pending";
    return user;
  });
}

export async function listSuggestions(
  viewerId: string,
  limit = 6,
): Promise<SuggestedUser[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT u.*,
       (SELECT COUNT(*)::int FROM media_follows f WHERE f.following_id = u.id AND f.status = 'accepted') AS follower_count,
       (SELECT COUNT(*)::int FROM media_follows mf
         WHERE mf.follower_id = u.id AND mf.status = 'accepted'
           AND mf.following_id IN (
             SELECT following_id FROM media_follows WHERE follower_id = $1 AND status = 'accepted'
           )) AS mutual_count
     FROM users u
     WHERE u.id <> $1 AND u.is_suspended = FALSE
       AND NOT EXISTS (
         SELECT 1 FROM media_follows f WHERE f.follower_id = $1 AND f.following_id = u.id
       )
     ORDER BY mutual_count DESC, follower_count DESC, u.created_at DESC
     LIMIT $2`,
    [viewerId, Math.min(Math.max(limit, 1), 12)],
  )) as (UserRow & { mutual_count: number })[];

  return rows.map((row) => {
    const user = rowToUser(row, viewerId);
    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      mutual_count: Number(row.mutual_count) || 0,
      is_following: false,
      follow_pending: false,
    };
  });
}

function storageRefFromPublicUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/";
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    const rest = parsed.pathname.slice(index + marker.length);
    const slash = rest.indexOf("/");
    if (slash < 0) return null;
    return `supabase:${rest.slice(slash + 1)}`;
  } catch {
    return null;
  }
}

export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  bio?: string;
  website?: string;
  location?: string;
  isPrivate?: boolean;
  avatar?: { url: string; storagePath: string } | null;
  removeAvatar?: boolean;
}

export async function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<{ user: MediaUser; oldAvatar: string | null }> {
  const sql = getSql();
  const currentRows = (await sql.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [
    userId,
  ])) as (UserRow & { avatar_storage_path?: string | null })[];
  const current = currentRows[0];
  if (!current) throw new Error("Account not found.");

  let username = current.username ?? mediaUsername(current.name, current.email);
  if (input.username !== undefined) {
    const cleaned = normalizeUsername(input.username);
    if (!isValidUsername(cleaned)) {
      throw new Error("Usernames must be 3-30 characters using letters, numbers, dots or underscores.");
    }
    const clash = (await sql.query(
      "SELECT 1 FROM users WHERE LOWER(username) = $1 AND id <> $2 LIMIT 1",
      [cleaned, userId],
    )) as unknown[];
    if (clash[0]) throw new Error("That username is already taken.");
    username = cleaned;
  }

  const name = input.name === undefined ? current.name : sanitizeText(input.name, 120);
  const bio = input.bio === undefined ? current.bio : sanitizeText(input.bio, 160);
  const website =
    input.website === undefined ? current.website : sanitizeText(input.website, 200) || null;
  if (website && !isValidHttpUrl(website)) {
    throw new Error("Enter a valid website URL (including https://).");
  }
  const location =
    input.location === undefined ? current.location : sanitizeText(input.location, MAX_LOCATION) || null;
  const isPrivate = input.isPrivate === undefined ? current.is_private : input.isPrivate;

  const avatarUrl = input.avatar ? input.avatar.url : input.removeAvatar ? null : current.avatar_url;

  await sql.query(
    `UPDATE users SET
       name = $1, username = $2, bio = $3, website = $4, location = $5,
       is_private = $6, avatar_url = $7, updated_at = NOW()
     WHERE id = $8`,
    [name || current.name, username, bio ?? "", website, location, isPrivate, avatarUrl, userId],
  );

  const replaceAvatar =
    (input.avatar && current.avatar_url !== input.avatar.url) ||
    (input.removeAvatar && current.avatar_url);
  if (replaceAvatar) {
    await removeMedia(storageRefFromPublicUrl(current.avatar_url));
  }

  const rows = (await sql.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId])) as UserRow[];
  const user = rowToUser(rows[0], userId);
  await invalidateMediaCache();
  return { user, oldAvatar: current.avatar_url };
}

// ── Search & discovery ──────────────────────────────────────────────────────

export async function searchMedia(
  query: string,
  viewerId: string | null,
): Promise<SearchResults> {
  const q = query.trim().replace(/^#/, "").slice(0, 80);
  if (!q) return { users: [], posts: [], hashtags: [], locations: [] };
  const like = `%${q}%`;
  const prefix = `${q}%`;
  const sql = getSql();

  const users = (await sql.query(
    `SELECT * FROM users
     WHERE (username ILIKE $1 OR name ILIKE $1 OR bio ILIKE $1) AND is_suspended = FALSE
     ORDER BY is_verified DESC, created_at DESC
     LIMIT 8`,
    [like],
  )) as UserRow[];

  const postRows = (await sql.query(
    `SELECT ${POST_FIELDS}
     FROM media_posts p JOIN users u ON u.id = p.user_id
     WHERE (p.caption ILIKE $2 OR p.category ILIKE $2 OR p.location_name ILIKE $2
            OR EXISTS (SELECT 1 FROM media_post_hashtags ph WHERE ph.post_id = p.id AND ph.tag ILIKE $2))
       ${VISIBILITY}
     ORDER BY p.created_at DESC
     LIMIT 12`,
    [viewerId ?? "", like],
  )) as Row[];

  const hashtags = (await sql.query(
    `SELECT tag, post_count FROM media_hashtags WHERE tag ILIKE $1 ORDER BY post_count DESC LIMIT 8`,
    [prefix],
  )) as { tag: string; post_count: number }[];

  const locations = (await sql.query(
    `SELECT location_name AS name, COUNT(*)::int AS post_count
     FROM media_posts
     WHERE location_name IS NOT NULL AND location_name ILIKE $1
     GROUP BY location_name
     ORDER BY post_count DESC
     LIMIT 8`,
    [like],
  )) as { name: string; post_count: number }[];

  return {
    users: users.map((u) => rowToUser(u, viewerId)),
    posts: postRows.map((r) => rowToPost(r, viewerId)),
    hashtags: hashtags.map((h) => ({ tag: h.tag, post_count: Number(h.post_count) || 0 })),
    locations: locations.map((l) => ({ name: l.name, post_count: Number(l.post_count) || 0 })),
  };
}

export async function listTrendingHashtags(limit = 8): Promise<TrendingHashtag[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT tag, post_count FROM media_hashtags ORDER BY post_count DESC, tag ASC LIMIT $1`,
    [Math.min(Math.max(limit, 1), 20)],
  )) as { tag: string; post_count: number }[];
  return rows.map((r) => ({ tag: r.tag, post_count: Number(r.post_count) || 0 }));
}

// ── Stories ─────────────────────────────────────────────────────────────────

export interface CreateStoryInput {
  kind: "image" | "video";
  url: string;
  storagePath: string;
  mime: string;
  width: number;
  height: number;
  durationMs: number | null;
  caption: string;
}

export async function createStory(userId: string, input: CreateStoryInput): Promise<StoryItem> {
  const sql = getSql();
  const id = randomUUID();
  const caption = sanitizeText(input.caption, MAX_CAPTION);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await sql.query(
    `INSERT INTO media_stories
       (id, user_id, kind, url, storage_path, mime, width, height, duration_ms, caption, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      id,
      userId,
      input.kind,
      input.url,
      input.storagePath,
      input.mime,
      input.width,
      input.height,
      input.durationMs,
      caption,
      expiresAt,
    ],
  );
  return {
    id,
    kind: input.kind,
    url: input.url,
    width: input.width,
    height: input.height,
    duration_ms: input.durationMs,
    caption,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    view_count: 0,
    is_viewed: false,
    reaction: null,
    is_owner: true,
  };
}

export async function listStoryGroups(viewerId: string | null): Promise<StoryGroup[]> {
  const sql = getSql();
  const viewer = viewerId ?? "";
  const rows = (await sql.query(
    `SELECT s.*, u.username AS author_username, u.name AS author_name,
            u.email AS author_email, u.avatar_url AS author_avatar,
            EXISTS(SELECT 1 FROM media_story_views sv WHERE sv.story_id = s.id AND sv.user_id = $1) AS is_viewed,
            (SELECT COUNT(*)::int FROM media_story_views sv WHERE sv.story_id = s.id) AS view_count,
            (SELECT emoji FROM media_story_reactions sr WHERE sr.story_id = s.id AND sr.user_id = $1 LIMIT 1) AS reaction
     FROM media_stories s
     JOIN users u ON u.id = s.user_id
     WHERE s.expires_at > NOW() AND u.is_suspended = FALSE
     ORDER BY s.created_at ASC
     LIMIT 300`,
    [viewer],
  )) as Row[];

  const groups = new Map<string, StoryGroup>();
  for (const row of rows) {
    const userId = String(row.user_id);
    const item: StoryItem = {
      id: String(row.id),
      kind: row.kind === "video" ? "video" : "image",
      url: String(row.url),
      width: Number(row.width) || 1080,
      height: Number(row.height) || 1920,
      duration_ms: row.duration_ms == null ? null : Number(row.duration_ms),
      caption: String(row.caption ?? ""),
      created_at: toIso(row.created_at),
      expires_at: toIso(row.expires_at),
      view_count: Number(row.view_count) || 0,
      is_viewed: Boolean(row.is_viewed),
      reaction: (row.reaction as string | null) ?? null,
      is_owner: viewerId === userId,
    };
    const group = groups.get(userId);
    if (group) {
      group.items.push(item);
      if (!item.is_viewed && !item.is_owner) group.hasUnseen = true;
    } else {
      groups.set(userId, {
        userId,
        username:
          (row.author_username as string) ||
          mediaUsername(row.author_name as string, row.author_email as string),
        avatarUrl: mediaAvatar(
          row.author_name as string,
          row.author_email as string,
          row.author_avatar as string,
        ),
        hasUnseen: !item.is_viewed && !item.is_owner,
        items: [item],
      });
    }
  }

  const list = [...groups.values()];
  list.sort((a, b) => {
    const aOwn = a.items[0]?.is_owner ? 1 : 0;
    const bOwn = b.items[0]?.is_owner ? 1 : 0;
    if (aOwn !== bOwn) return bOwn - aOwn;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    const aTime = new Date(a.items[a.items.length - 1].created_at).getTime();
    const bTime = new Date(b.items[b.items.length - 1].created_at).getTime();
    return bTime - aTime;
  });
  return list;
}

export async function viewStory(storyId: string, viewerId: string): Promise<void> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT user_id FROM media_stories WHERE id = $1 AND expires_at > NOW() LIMIT 1",
    [storyId],
  )) as { user_id: string }[];
  if (!rows[0]) return;
  if (rows[0].user_id === viewerId) return;
  await sql.query(
    `INSERT INTO media_story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [storyId, viewerId],
  );
}

export async function reactToStory(
  storyId: string,
  viewerId: string,
  emoji: string,
  remove = false,
): Promise<void> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT user_id FROM media_stories WHERE id = $1 AND expires_at > NOW() LIMIT 1",
    [storyId],
  )) as { user_id: string }[];
  if (!rows[0]) return;
  if (remove) {
    await sql.query(
      "DELETE FROM media_story_reactions WHERE story_id = $1 AND user_id = $2",
      [storyId, viewerId],
    );
    return;
  }
  const safeEmoji = emoji.slice(0, 8);
  await sql.query(
    `INSERT INTO media_story_reactions (story_id, user_id, emoji)
     VALUES ($1, $2, $3)
     ON CONFLICT (story_id, user_id) DO UPDATE SET emoji = $3, created_at = NOW()`,
    [storyId, viewerId, safeEmoji],
  );
  await sql.query(
    `INSERT INTO media_story_views (story_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [storyId, viewerId],
  );
  await notify({
    userId: rows[0].user_id,
    actorId: viewerId,
    type: "like",
    content: `reacted ${safeEmoji} to your story`,
  });
}

export async function listStoryViewers(
  storyId: string,
  ownerId: string,
  isAdmin: boolean,
): Promise<{ username: string; avatar_url: string; reaction: string | null }[]> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT user_id FROM media_stories WHERE id = $1 LIMIT 1",
    [storyId],
  )) as { user_id: string }[];
  if (!rows[0]) return [];
  if (!isAdmin && rows[0].user_id !== ownerId) throw new Error("Only the owner can see viewers.");
  const viewers = (await sql.query(
    `SELECT u.username, u.name, u.email, u.avatar_url,
            (SELECT emoji FROM media_story_reactions sr WHERE sr.story_id = $1 AND sr.user_id = u.id) AS reaction,
            sv.created_at
     FROM media_story_views sv
     JOIN users u ON u.id = sv.user_id
     WHERE sv.story_id = $1
     ORDER BY sv.created_at DESC
     LIMIT 200`,
    [storyId],
  )) as Row[];
  return viewers.map((v) => ({
    username:
      (v.username as string) ||
      mediaUsername(v.name as string, v.email as string),
    avatar_url: mediaAvatar(v.name as string, v.email as string, v.avatar_url as string),
    reaction: (v.reaction as string | null) ?? null,
  }));
}

export async function deleteStory(
  storyId: string,
  userId: string,
  isAdmin: boolean,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT user_id, storage_path FROM media_stories WHERE id = $1 LIMIT 1",
    [storyId],
  )) as { user_id: string; storage_path: string | null }[];
  if (!rows[0]) return false;
  if (!isAdmin && rows[0].user_id !== userId) throw new Error("You cannot delete this story.");
  await sql.query("DELETE FROM media_stories WHERE id = $1", [storyId]);
  await removeMedia(rows[0].storage_path);
  return true;
}

let lastStoryCleanup = 0;

export async function cleanupExpiredStories(options?: { throttleMs?: number }): Promise<void> {
  const throttleMs = options?.throttleMs ?? 0;
  if (throttleMs > 0 && Date.now() - lastStoryCleanup < throttleMs) return;
  lastStoryCleanup = Date.now();

  const sql = getSql();
  const rows = (await sql.query(
    `DELETE FROM media_stories
     WHERE id IN (
       SELECT id FROM media_stories WHERE expires_at < NOW() LIMIT 200
     )
     RETURNING storage_path`,
  )) as { storage_path: string | null }[];
  if (rows.length === 0) return;
  await Promise.all(rows.map((r) => removeMedia(r.storage_path)));
}

export function categoryOptions() {
  return MEDIA_CATEGORIES.map((value) => ({
    value,
    label: MEDIA_CATEGORY_LABELS[value],
  }));
}
