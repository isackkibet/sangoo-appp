import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";
import type {
  Conversation,
  MediaMessage,
  MediaNotification,
} from "@/lib/media/types";
import { MAX_MESSAGE, sanitizeText } from "@/lib/media/validation";
import { mediaAvatar, mediaFullName, mediaUsername } from "@/lib/media/user";

type Row = Record<string, unknown>;

function toIso(value: unknown): string {
  return new Date(value as string | Date).toISOString();
}

async function assertParticipant(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT 1 FROM media_conversation_participants WHERE conversation_id = $1 AND user_id = $2 LIMIT 1",
    [conversationId, userId],
  )) as unknown[];
  return rows.length > 0;
}

async function participants(
  conversationId: string,
  exclude?: string,
): Promise<{ id: string; name: string | null; email: string; username: string | null }[]> {
  const sql = getSql();
  return (await sql.query(
    `SELECT u.id, u.name, u.email, u.username
     FROM media_conversation_participants p
     JOIN users u ON u.id = p.user_id
     WHERE p.conversation_id = $1 AND u.id <> $2`,
    [conversationId, exclude ?? ""],
  )) as { id: string; name: string | null; email: string; username: string | null }[];
}

function rowToMessage(row: Row, viewerId: string): MediaMessage {
  return {
    id: String(row.id),
    conversation_id: String(row.conversation_id),
    content: String(row.content ?? ""),
    sender_id: String(row.sender_id),
    created_at: toIso(row.created_at),
    is_own: String(row.sender_id) === viewerId,
    media_url: (row.media_url as string | null) ?? null,
    media_kind:
      row.media_kind === "image" || row.media_kind === "video"
        ? (row.media_kind as "image" | "video")
        : null,
  };
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT c.id, c.updated_at, p.last_read_at,
            other.id AS other_id, other.username AS other_username,
            other.name AS other_name, other.email AS other_email,
            other.avatar_url AS other_avatar,
            last.content AS last_content, last.media_url AS last_media_url,
            last.created_at AS last_created_at,
            (SELECT COUNT(*)::int FROM media_messages m
             WHERE m.conversation_id = c.id
               AND m.sender_id <> $1
               AND m.created_at > p.last_read_at) AS unread_count
     FROM media_conversation_participants p
     JOIN media_conversations c ON c.id = p.conversation_id
     JOIN media_conversation_participants op
       ON op.conversation_id = c.id AND op.user_id <> p.user_id
     JOIN users other ON other.id = op.user_id
     LEFT JOIN LATERAL (
       SELECT content, media_url, created_at FROM media_messages m
       WHERE m.conversation_id = c.id
       ORDER BY m.created_at DESC LIMIT 1
     ) last ON TRUE
     WHERE p.user_id = $1
     ORDER BY COALESCE(last.created_at, c.updated_at) DESC
     LIMIT 100`,
    [userId],
  )) as Row[];

  return rows.map((row) => {
    const unread = Number(row.unread_count) || 0;
    return {
      id: String(row.id),
      user_id: String(row.other_id),
      username:
        (row.other_username as string) ||
        mediaUsername(row.other_name as string, row.other_email as string),
      full_name: mediaFullName(row.other_name as string, row.other_email as string),
      avatar_url: mediaAvatar(
        row.other_name as string,
        row.other_email as string,
        row.other_avatar as string,
      ),
      last_message: row.last_content
        ? String(row.last_content)
        : row.last_media_url
          ? "Sent an attachment"
          : "Start the conversation",
      last_message_time: toIso(row.last_created_at ?? row.updated_at),
      unread_count: unread,
      unread: unread > 0,
      is_group: false,
      messages: [],
    } satisfies Conversation;
  });
}

export async function openConversation(
  userId: string,
  username: string,
): Promise<string> {
  const sql = getSql();
  const targetRows = (await sql.query(
    "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND is_suspended = FALSE LIMIT 1",
    [username],
  )) as { id: string }[];
  const target = targetRows[0];
  if (!target) throw new Error("Account not found.");
  if (target.id === userId) throw new Error("You cannot message yourself.");

  const existing = (await sql.query(
    `SELECT c.id FROM media_conversations c
     JOIN media_conversation_participants a ON a.conversation_id = c.id AND a.user_id = $1
     JOIN media_conversation_participants b ON b.conversation_id = c.id AND b.user_id = $2
     WHERE (SELECT COUNT(*) FROM media_conversation_participants x WHERE x.conversation_id = c.id) = 2
     LIMIT 1`,
    [userId, target.id],
  )) as { id: string }[];
  if (existing[0]) {
    await sql.query(
      `UPDATE media_conversation_participants SET last_read_at = NOW()
       WHERE conversation_id = $1 AND user_id = $2`,
      [existing[0].id, userId],
    );
    return existing[0].id;
  }

  const conversationId = randomUUID();
  await sql.query("INSERT INTO media_conversations (id) VALUES ($1)", [conversationId]);
  await sql.query(
    `INSERT INTO media_conversation_participants (conversation_id, user_id)
     VALUES ($1, $2), ($1, $3)`,
    [conversationId, userId, target.id],
  );
  return conversationId;
}

export async function listMessages(
  conversationId: string,
  userId: string,
  options: { before?: string | null; after?: string | null; limit?: number } = {},
): Promise<MediaMessage[]> {
  if (!(await assertParticipant(conversationId, userId))) {
    throw new Error("Conversation not found.");
  }
  const sql = getSql();
  const limit = Math.min(Math.max(options.limit ?? 60, 1), 100);
  const params: unknown[] = [conversationId];
  let where = "";
  if (options.after) {
    params.push(options.after);
    where = `AND created_at > $${params.length}`;
  } else if (options.before) {
    params.push(options.before);
    where = `AND created_at < $${params.length}`;
  }
  params.push(limit);

  const rows = (await sql.query(
    `SELECT * FROM media_messages
     WHERE conversation_id = $1 ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params,
  )) as Row[];

  return rows.reverse().map((row) => rowToMessage(row, userId));
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  contentInput: string,
  media?: { url: string; kind: "image" | "video" } | null,
): Promise<MediaMessage> {
  if (!(await assertParticipant(conversationId, userId))) {
    throw new Error("Conversation not found.");
  }
  const content = sanitizeText(contentInput, MAX_MESSAGE);
  if (!content && !media) throw new Error("Write a message first.");

  const sql = getSql();
  const id = randomUUID();
  const rows = (await sql.query(
    `INSERT INTO media_messages
       (id, conversation_id, sender_id, content, media_url, media_kind)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, conversationId, userId, content, media?.url ?? null, media?.kind ?? null],
  )) as Row[];
  await sql.query("UPDATE media_conversations SET updated_at = NOW() WHERE id = $1", [
    conversationId,
  ]);

  const others = await participants(conversationId, userId);
  for (const other of others) {
    await sql.query(
      `INSERT INTO media_notifications
         (id, user_id, actor_id, type, conversation_id, content)
       VALUES ($1, $2, $3, 'message', $4, $5)`,
      [
        randomUUID(),
        other.id,
        userId,
        conversationId,
        content ? content.slice(0, 90) : "Sent an attachment",
      ],
    );
  }

  return rowToMessage(rows[0], userId);
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const sql = getSql();
  await sql.query(
    `UPDATE media_conversation_participants SET last_read_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId],
  );
  await sql.query(
    `UPDATE media_notifications SET read = TRUE
     WHERE user_id = $1 AND conversation_id = $2 AND read = FALSE`,
    [userId, conversationId],
  );
}

export async function unreadMessageCount(userId: string): Promise<number> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT COUNT(*)::int AS count
     FROM media_messages m
     JOIN media_conversation_participants p
       ON p.conversation_id = m.conversation_id AND p.user_id = $1
     WHERE m.sender_id <> $1 AND m.created_at > p.last_read_at`,
    [userId],
  )) as { count: number }[];
  return Number(rows[0]?.count) || 0;
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function listNotifications(
  userId: string,
  limit = 50,
): Promise<MediaNotification[]> {
  const sql = getSql();
  const rows = (await sql.query(
    `SELECT n.*, a.username AS actor_username, a.name AS actor_name,
            a.email AS actor_email, a.avatar_url AS actor_avatar,
            (SELECT COALESCE(NULLIF(m.url, ''), '/api/media/images/' || m.id) FROM media_images m WHERE m.post_id = n.post_id AND m.kind = 'image' ORDER BY m.position LIMIT 1) AS post_image
     FROM media_notifications n
     LEFT JOIN users a ON a.id = n.actor_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  )) as Row[];

  return rows.map((row) => {
    const actorName = (row.actor_name as string | null) ?? null;
    const actorEmail = (row.actor_email as string | null) ?? null;
    return {
      id: String(row.id),
      type: (row.type as MediaNotification["type"]) ?? "like",
      actor: {
        id: (row.actor_id as string) ?? undefined,
        username:
          (row.actor_username as string) ||
          mediaUsername(actorName, actorEmail),
        avatar_url: mediaAvatar(actorName, actorEmail, row.actor_avatar as string),
      },
      text: String(row.content ?? ""),
      post_id: (row.post_id as string | null) ?? null,
      post_image: (row.post_image as string | null) ?? null,
      conversation_id: (row.conversation_id as string | null) ?? null,
      created_at: toIso(row.created_at),
      read: Boolean(row.read),
    } satisfies MediaNotification;
  });
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const sql = getSql();
  const rows = (await sql.query(
    "SELECT COUNT(*)::int AS count FROM media_notifications WHERE user_id = $1 AND read = FALSE",
    [userId],
  )) as { count: number }[];
  return Number(rows[0]?.count) || 0;
}

export async function markNotificationsRead(
  userId: string,
  ids?: string[],
): Promise<void> {
  const sql = getSql();
  if (ids && ids.length > 0) {
    await sql.query(
      "UPDATE media_notifications SET read = TRUE WHERE user_id = $1 AND id = ANY($2)",
      [userId, ids.slice(0, 100)],
    );
    return;
  }
  await sql.query("UPDATE media_notifications SET read = TRUE WHERE user_id = $1", [
    userId,
  ]);
}

export async function clearNotifications(userId: string): Promise<void> {
  const sql = getSql();
  await sql.query("DELETE FROM media_notifications WHERE user_id = $1", [userId]);
}
