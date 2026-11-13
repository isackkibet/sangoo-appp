import { neon } from "@neondatabase/serverless";

const connectionString = (
  process.env.DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  ""
).trim();

export const hasDatabase = connectionString.length > 0;

type NeonSql = ReturnType<typeof neon>;

let client: NeonSql | null = null;

export function getSql(): NeonSql {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!client) {
    client = neon(connectionString);
  }
  return client;
}

const SCHEMA_STATEMENTS = [
  // ── Accounts ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar_url TEXT,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'reader',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS reporter_verified BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ`,
  `UPDATE users
     SET username = COALESCE(
       NULLIF(LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9._]', '', 'g')), ''),
       'member'
     ) || '_' || LEFT(id, 4)
   WHERE username IS NULL OR username = ''`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users (LOWER(username))`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email))`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)`,

  // ── Posts + media ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'post',
    caption TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'community',
    location_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE media_posts ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'`,
  `ALTER TABLE media_posts ADD COLUMN IF NOT EXISTS comments_off BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE media_posts ADD COLUMN IF NOT EXISTS hide_likes BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE media_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,

  `CREATE TABLE IF NOT EXISTS media_images (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'image',
    mime TEXT NOT NULL,
    data TEXT,
    width INTEGER NOT NULL DEFAULT 1080,
    height INTEGER NOT NULL DEFAULT 1080,
    alt_text TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE media_images DROP CONSTRAINT IF EXISTS media_images_post_id_key`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'image'`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS url TEXT`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS storage_path TEXT`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS duration_ms INTEGER`,
  // Thumbnail image for videos (generated in the browser during upload).
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS poster_url TEXT`,
  `ALTER TABLE media_images ADD COLUMN IF NOT EXISTS poster_path TEXT`,
  `ALTER TABLE media_images ALTER COLUMN data DROP NOT NULL`,
  `CREATE INDEX IF NOT EXISTS idx_media_images_post ON media_images (post_id, position)`,

  `CREATE TABLE IF NOT EXISTS media_likes (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS media_reposts (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS media_saves (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS media_post_tags (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_posts_created_at ON media_posts (created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_media_posts_user_id ON media_posts (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_media_posts_category ON media_posts (category)`,
  `CREATE INDEX IF NOT EXISTS idx_media_likes_post_id ON media_likes (post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_media_reposts_post_id ON media_reposts (post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_media_saves_user_id ON media_saves (user_id)`,

  // ── Engagement: shares and views ───────────────────────────────────────
  // One row per recorded share (link copied, WhatsApp, X, ...). Repeated
  // shares by the same member on the same channel within an hour are not
  // recorded again (see recordShare).
  `CREATE TABLE IF NOT EXISTS media_post_shares (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    channel TEXT NOT NULL DEFAULT 'link',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_post_shares_post ON media_post_shares (post_id)`,
  `CREATE INDEX IF NOT EXISTS idx_media_post_shares_recent ON media_post_shares (post_id, user_id, channel, created_at DESC)`,
  // A view = one viewer (member, or a hashed anonymous visitor) per post per
  // day; the primary key makes repeat views on the same day impossible.
  `CREATE TABLE IF NOT EXISTS media_post_views (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    viewer_key TEXT NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    view_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, viewer_key, view_date)
  )`,

  // ── Comments ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES media_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS media_comment_likes (
    comment_id TEXT NOT NULL REFERENCES media_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_comments_post ON media_comments (post_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_media_comments_parent ON media_comments (parent_id)`,

  // ── Social graph ────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_follows (
    follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT media_follows_no_self CHECK (follower_id <> following_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_follows_following ON media_follows (following_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_media_follows_follower ON media_follows (follower_id, status)`,

  // ── Hashtags ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_hashtags (
    tag TEXT PRIMARY KEY,
    post_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS media_post_hashtags (
    post_id TEXT NOT NULL REFERENCES media_posts(id) ON DELETE CASCADE,
    tag TEXT NOT NULL REFERENCES media_hashtags(tag) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_post_hashtags_tag ON media_post_hashtags (tag)`,

  // ── Stories ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_stories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    storage_path TEXT,
    mime TEXT NOT NULL DEFAULT '',
    width INTEGER NOT NULL DEFAULT 1080,
    height INTEGER NOT NULL DEFAULT 1920,
    duration_ms INTEGER,
    caption TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media_story_views (
    story_id TEXT NOT NULL REFERENCES media_stories(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS media_story_reactions (
    story_id TEXT NOT NULL REFERENCES media_stories(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (story_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_stories_user ON media_stories (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_media_stories_expires ON media_stories (expires_at)`,

  // ── Messaging ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_conversations (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS media_conversation_participants (
    conversation_id TEXT NOT NULL REFERENCES media_conversations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS media_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES media_conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT,
    media_kind TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_messages_conversation ON media_messages (conversation_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_media_participants_user ON media_conversation_participants (user_id)`,

  // ── Notifications ───────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id TEXT REFERENCES media_posts(id) ON DELETE CASCADE,
    comment_id TEXT REFERENCES media_comments(id) ON DELETE CASCADE,
    conversation_id TEXT REFERENCES media_conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_notifications_user ON media_notifications (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_media_notifications_unread ON media_notifications (user_id, read)`,

  // ── Moderation ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS media_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_media_reports_status ON media_reports (status, created_at DESC)`,
];

let schemaReady: Promise<void> | null = null;

// Bump this when SCHEMA_STATEMENTS changes so the migration runs again.
const SCHEMA_VERSION = 20261114;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();

      // Fast path: the schema was already applied by an earlier process.
      try {
        const rows = (await sql.query(
          "SELECT 1 FROM schema_meta WHERE version = $1 LIMIT 1",
          [SCHEMA_VERSION],
        )) as unknown[];
        if (rows.length > 0) return;
      } catch {
        // schema_meta does not exist yet; run the full migration below.
      }

      for (const statement of SCHEMA_STATEMENTS) {
        await sql.query(statement);
      }

      await sql.query(
        `CREATE TABLE IF NOT EXISTS schema_meta (
           version INTEGER PRIMARY KEY,
           applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`,
      );
      await sql.query(
        "INSERT INTO schema_meta (version) VALUES ($1) ON CONFLICT DO NOTHING",
        [SCHEMA_VERSION],
      );
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
