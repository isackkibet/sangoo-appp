import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type { AdminReport, AdminStats, MediaUser } from "@/lib/media/types";
import { sanitizeText } from "@/lib/media/validation";
import { mediaAvatar, mediaFullName, mediaUsername } from "@/lib/media/user";
import { rowToUser } from "@/lib/media/service";

type Row = Record<string, unknown>;

const REPORT_TARGETS = new Set(["post", "comment", "user", "story"]);
const REPORT_STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

async function targetExists(targetType: string, targetId: string): Promise<boolean> {
  const sql = getSql();
  const table =
    targetType === "post"
      ? "media_posts"
      : targetType === "comment"
        ? "media_comments"
        : targetType === "user"
          ? "users"
          : "media_stories";
  const rows = (await sql.query(`SELECT 1 FROM ${table} WHERE id = $1 LIMIT 1`, [
    targetId,
  ])) as unknown[];
  return rows.length > 0;
}

export async function createReport(input: {
  reporterId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<string> {
  if (!REPORT_TARGETS.has(input.targetType)) throw new Error("Invalid report target.");
  if (!(await targetExists(input.targetType, input.targetId))) {
    throw new Error("The content you are reporting no longer exists.");
  }
  const sql = getSql();
  const id = randomUUID();
  await sql.query(
    `INSERT INTO media_reports (id, reporter_id, target_type, target_id, reason, details)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      input.reporterId,
      input.targetType,
      input.targetId,
      sanitizeText(input.reason, 80) || "Other",
      sanitizeText(input.details, 1000) || null,
    ],
  );
  return id;
}

export async function listReports(
  status?: string | null,
  limit = 50,
): Promise<AdminReport[]> {
  const sql = getSql();
  const useStatus = status && REPORT_STATUSES.has(status);
  const params: unknown[] = [];
  let where = "";
  if (useStatus) {
    params.push(status);
    where = `WHERE r.status = $1`;
  }
  params.push(Math.min(Math.max(limit, 1), 100));

  const rows = (await sql.query(
    `SELECT r.*,
            u.id AS reporter_user_id, u.username AS reporter_username,
            u.name AS reporter_name, u.email AS reporter_email,
            u.avatar_url AS reporter_avatar,
            COALESCE(
              NULLIF(tp.caption, ''),
              tc.content,
              tu.username,
              ts.caption
            ) AS target_preview
     FROM media_reports r
     LEFT JOIN users u ON u.id = r.reporter_id
     LEFT JOIN media_posts tp ON r.target_type = 'post' AND tp.id = r.target_id
     LEFT JOIN media_comments tc ON r.target_type = 'comment' AND tc.id = r.target_id
     LEFT JOIN users tu ON r.target_type = 'user' AND tu.id = r.target_id
     LEFT JOIN media_stories ts ON r.target_type = 'story' AND ts.id = r.target_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${params.length}`,
    params,
  )) as Row[];

  return rows.map((row) => ({
    id: String(row.id),
    target_type: row.target_type as AdminReport["target_type"],
    target_id: String(row.target_id),
    reason: String(row.reason ?? ""),
    details: (row.details as string | null) ?? null,
    status: row.status as AdminReport["status"],
    created_at: new Date(row.created_at as string | Date).toISOString(),
    reporter: row.reporter_user_id
      ? {
          id: String(row.reporter_user_id),
          username:
            (row.reporter_username as string) ||
            mediaUsername(row.reporter_name as string, row.reporter_email as string),
          avatar_url: mediaAvatar(
            row.reporter_name as string,
            row.reporter_email as string,
            row.reporter_avatar as string,
          ),
        }
      : null,
    target_preview: (row.target_preview as string | null) ?? null,
  }));
}

export async function updateReportStatus(
  reportId: string,
  reviewerId: string,
  status: string,
): Promise<boolean> {
  if (!REPORT_STATUSES.has(status)) throw new Error("Invalid report status.");
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE media_reports
     SET status = $1, reviewed_by = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING id`,
    [status, reviewerId, reportId],
  )) as { id: string }[];
  return rows.length > 0;
}

export async function adminStats(): Promise<AdminStats> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT
       (SELECT COUNT(*)::int FROM users) AS users,
       (SELECT COUNT(*)::int FROM media_posts) AS posts,
       (SELECT COUNT(*)::int FROM media_comments) AS comments,
       (SELECT COUNT(*)::int FROM media_stories WHERE expires_at > NOW()) AS stories,
       (SELECT COUNT(*)::int FROM media_messages) AS messages,
       (SELECT COUNT(*)::int FROM media_reports WHERE status = 'open') AS open_reports,
       (SELECT COUNT(*)::int FROM users WHERE is_suspended = TRUE) AS suspended_users`,
  )) as Row[];
  const row = rows[0] ?? {};
  return {
    users: Number(row.users) || 0,
    posts: Number(row.posts) || 0,
    comments: Number(row.comments) || 0,
    stories: Number(row.stories) || 0,
    messages: Number(row.messages) || 0,
    open_reports: Number(row.open_reports) || 0,
    suspended_users: Number(row.suspended_users) || 0,
  };
}

export async function listAdminUsers(
  query: string,
  limit = 40,
): Promise<(MediaUser & { email: string; role: string; is_suspended: boolean; created_at: string })[]> {
  const sql = getSql();
  const q = query.trim();
  const rows = (await sql.query(
    `SELECT u.*,
            (SELECT COUNT(*)::int FROM media_follows f WHERE f.following_id = u.id AND f.status = 'accepted') AS follower_count,
            (SELECT COUNT(*)::int FROM media_posts p WHERE p.user_id = u.id) AS post_count
     FROM users u
     WHERE ($1 = '' OR u.username ILIKE $2 OR u.name ILIKE $2 OR u.email ILIKE $2)
     ORDER BY u.created_at DESC
     LIMIT $3`,
    [q, `%${q}%`, Math.min(Math.max(limit, 1), 100)],
  )) as (Row & {
    email: string;
    role: string;
    is_suspended: boolean;
    created_at: string | Date;
    follower_count: number;
    post_count: number;
  })[];

  return rows.map((row) => {
    const user = rowToUser(
      {
        id: String(row.id),
        email: String(row.email),
        name: (row.name as string | null) ?? null,
        username: (row.username as string | null) ?? null,
        avatar_url: (row.avatar_url as string | null) ?? null,
        bio: (row.bio as string | null) ?? null,
        website: (row.website as string | null) ?? null,
        location: (row.location as string | null) ?? null,
        is_verified: Boolean(row.is_verified),
        is_private: Boolean(row.is_private),
        is_suspended: Boolean(row.is_suspended),
        reporter_verified: Boolean(row.reporter_verified),
        role: String(row.role),
        created_at: row.created_at as string | Date,
      },
      null,
    );
    user.follower_count = Number(row.follower_count) || 0;
    user.post_count = Number(row.post_count) || 0;
    return {
      ...user,
      email: String(row.email),
      role: String(row.role),
      is_suspended: Boolean(row.is_suspended),
      created_at: new Date(row.created_at as string | Date).toISOString(),
    };
  });
}

export async function moderateUser(
  userId: string,
  action: "suspend" | "unsuspend" | "verify" | "unverify" | "make-reporter",
  reason: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    `UPDATE users SET
       is_suspended = CASE WHEN $1 = 'suspend' THEN TRUE WHEN $1 = 'unsuspend' THEN FALSE ELSE is_suspended END,
       suspended_reason = CASE WHEN $1 = 'suspend' THEN $2 WHEN $1 = 'unsuspend' THEN NULL ELSE suspended_reason END,
       is_verified = CASE WHEN $1 = 'verify' THEN TRUE WHEN $1 = 'unverify' THEN FALSE ELSE is_verified END,
       reporter_verified = CASE WHEN $1 = 'make-reporter' THEN TRUE ELSE reporter_verified END,
       updated_at = NOW()
     WHERE id = $3
     RETURNING id`,
    [action, sanitizeText(reason, 300) || null, userId],
  )) as { id: string }[];
  if (rows.length > 0 && action === "suspend") {
    await sql.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  }
  return rows.length > 0;
}

export async function pendingFollowRequests(
  userId: string,
): Promise<{ id: string; username: string; full_name: string; avatar_url: string }[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT u.id, u.username, u.name, u.email, u.avatar_url
     FROM media_follows f JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1 AND f.status = 'pending'
     ORDER BY f.created_at DESC
     LIMIT 100`,
    [userId],
  )) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    username:
      (row.username as string) ||
      mediaUsername(row.name as string, row.email as string),
    full_name: mediaFullName(row.name as string, row.email as string),
    avatar_url: mediaAvatar(row.name as string, row.email as string, row.avatar_url as string),
  }));
}
