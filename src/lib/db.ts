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
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email))`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)`,
];

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      for (const statement of SCHEMA_STATEMENTS) {
        await sql.query(statement);
      }
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
