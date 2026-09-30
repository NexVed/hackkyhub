import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null = null;

/** REST credentials are only read on the server, never shipped to the browser. */
export function getRedis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token, retry: { retries: 0 }, signal: () => AbortSignal.timeout(1500) });
  return client;
}

/** Cache outages don't prevent a fresh read from the source of truth. */
export async function cached<T>(key: string, ttl: number, load: () => Promise<T>) {
  let redis: Redis | null = null;
  try {
    redis = getRedis();
    const value = redis ? await redis.get<T>(key) : null;
    if (value !== null) return { data: value, cache: "HIT" };
  } catch {
    // Keep database reads available when credentials or Redis are unavailable.
  }
  const data = await load();
  if (redis) {
    try { await redis.set(key, data, { ex: ttl }); } catch { /* Cache writes are best effort. */ }
  }
  return { data, cache: redis ? "MISS" : "BYPASS" };
}
