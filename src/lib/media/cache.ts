import { cacheGet, cacheSet } from "@/lib/cache";

const VERSION_KEY = "sihu:media:cache-version";

export async function mediaCacheVersion(): Promise<string> {
  const version = await cacheGet<string>(VERSION_KEY);
  return version ?? "0";
}

export async function invalidateMediaCache(): Promise<void> {
  await cacheSet(
    VERSION_KEY,
    `${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    86_400,
  );
}
