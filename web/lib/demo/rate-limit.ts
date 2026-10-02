import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-IP limits for the public routes. With Upstash configured (directly or
 * through Vercel's KV integration) the counts are shared by every function
 * instance. Without it each instance keeps its own window in memory: weaker,
 * but it still stops a single tight loop until the store is set up.
 */

export type Bucket = "reply" | "debrief" | "waitlist";

const LIMITS: Record<Bucket, { tokens: number; window: Duration; seconds: number }> = {
  // A quick typist plus a few restarts.
  reply: { tokens: 30, window: "60 s", seconds: 60 },
  debrief: { tokens: 8, window: "600 s", seconds: 600 },
  waitlist: { tokens: 10, window: "600 s", seconds: 600 },
};

/** A second, daily window on model calls, so one visitor cannot spend all day on the demo. */
const DAILY: Partial<Record<Bucket, { tokens: number; window: Duration; seconds: number }>> = {
  reply: { tokens: 300, window: "1 d", seconds: 86_400 },
  debrief: { tokens: 40, window: "1 d", seconds: 86_400 },
};

export type LimitResult = { ok: true } | { ok: false; retryAfter: number };

function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

let shared: Map<string, Ratelimit> | null | undefined;

function upstash(): Map<string, Ratelimit> | null {
  if (shared !== undefined) return shared;
  const redis = redisFromEnv();
  if (!redis) return (shared = null);
  shared = new Map();
  for (const [bucket, l] of Object.entries(LIMITS)) {
    shared.set(bucket, new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(l.tokens, l.window), prefix: `unmute:rl:${bucket}` }));
  }
  for (const [bucket, l] of Object.entries(DAILY)) {
    shared.set(`${bucket}:day`, new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(l.tokens, l.window), prefix: `unmute:rl:${bucket}:day` }));
  }
  return shared;
}

/* In-memory fallback: timestamps per key, pruned as they age out. */
const memory = new Map<string, number[]>();

function memoryLimit(key: string, tokens: number, seconds: number, now: number): LimitResult {
  const since = now - seconds * 1000;
  const hits = (memory.get(key) ?? []).filter((t) => t > since);
  if (hits.length >= tokens) {
    memory.set(key, hits);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((hits[0] + seconds * 1000 - now) / 1000)) };
  }
  hits.push(now);
  memory.set(key, hits);
  // Keep the map from growing without bound on a long-lived instance.
  if (memory.size > 5_000) {
    for (const [k, v] of memory) if (!v.some((t) => t > since)) memory.delete(k);
  }
  return { ok: true };
}

/** The caller's IP as Vercel reports it. Vercel sets x-forwarded-for itself, so clients cannot choose it. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function limit(bucket: Bucket, req: Request, now = Date.now()): Promise<LimitResult> {
  const id = clientIp(req);
  const windows = [
    { name: bucket, ...LIMITS[bucket] },
    ...(DAILY[bucket] ? [{ name: `${bucket}:day`, ...DAILY[bucket] }] : []),
  ];

  const store = upstash();
  if (store) {
    try {
      for (const w of windows) {
        const res = await store.get(w.name)!.limit(id);
        if (!res.success) return { ok: false, retryAfter: Math.max(1, Math.ceil((res.reset - now) / 1000)) };
      }
      return { ok: true };
    } catch (err) {
      // A store outage should not take the demo down; fall through to the local window.
      console.error("[rate-limit] upstash", err instanceof Error ? err.constructor.name : "unknown");
    }
  }

  for (const w of windows) {
    const res = memoryLimit(`${w.name}:${id}`, w.tokens, w.seconds, now);
    if (!res.ok) return res;
  }
  return { ok: true };
}

/** Test hook: forget every in-memory window. */
export function resetMemoryLimits() {
  memory.clear();
}
