type CacheEntry = {
  value: string;
  expiresAt: number;
};

const MEMORY_LIMIT = 1000;
const memory = new Map<string, CacheEntry>();

const REDIS_URL = (
  process.env.UPSTASH_REDIS_REST_URL ??
  process.env.KV_REST_API_URL ??
  ""
)
  .trim()
  .replace(/\/+$/, "");
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";

export function cacheBackend(): "redis" | "memory" {
  return REDIS_URL && REDIS_TOKEN ? "redis" : "memory";
}

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cache request failed (${res.status})`);
  const json = (await res.json()) as { result?: unknown; error?: string };
  if (json.error) throw new Error(json.error);
  return json.result;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (cacheBackend() === "redis") {
    try {
      const result = await redisCommand(["GET", key]);
      return result == null ? null : (JSON.parse(String(result)) as T);
    } catch (error) {
      console.error("Redis GET failed:", error);
    }
  }

  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    memory.delete(key);
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const serialized = JSON.stringify(value);
  const ttl = Math.max(1, Math.floor(ttlSeconds));

  if (cacheBackend() === "redis") {
    try {
      await redisCommand(["SET", key, serialized, "EX", ttl]);
      return;
    } catch (error) {
      console.error("Redis SET failed:", error);
    }
  }

  if (memory.size >= MEMORY_LIMIT) {
    const now = Date.now();
    for (const [entryKey, entry] of memory) {
      if (entry.expiresAt <= now) memory.delete(entryKey);
    }
    if (memory.size >= MEMORY_LIMIT) {
      const oldest = memory.keys().next().value;
      if (oldest !== undefined) memory.delete(oldest);
    }
  }

  memory.set(key, { value: serialized, expiresAt: Date.now() + ttl * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  if (cacheBackend() === "redis") {
    try {
      await redisCommand(["DEL", key]);
    } catch (error) {
      console.error("Redis DEL failed:", error);
    }
  }
  memory.delete(key);
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await loader();
  await cacheSet(key, value, ttlSeconds);
  return value;
}
