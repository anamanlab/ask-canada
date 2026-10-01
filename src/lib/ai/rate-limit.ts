/**
 * Per-IP rate limiting for /api/chat, in two layers behind one store interface:
 *
 *   1. Memory (always on): a token bucket in process memory. Free and instant; right for one instance,
 *      a container, or dev. On serverless each instance has its own buckets, so on its own it only slows
 *      a caller down per instance.
 *   2. A shared store (optional), checked only when the local bucket lets the request through:
 *      - Redis: fixed one-minute window in any Redis with an Upstash-compatible REST API (Upstash, Vercel
 *        KV, a self-hosted proxy). Enabled by UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or
 *        KV_REST_API_URL / KV_REST_API_TOKEN). One counter for every instance and region.
 *      - Vercel Firewall (no extra vendor): the WAF's own counters through `@vercel/firewall`. Enabled on
 *        Vercel by RATE_LIMIT_FIREWALL_ID, the "Rate limit ID" of a `@vercel/firewall` rule created in the
 *        dashboard (docs/DEPLOY.md); the window and limit live in that rule. Counted per Vercel region.
 *
 * Why not the Vercel Runtime Cache as the shared store: it has no atomic increment (a burst of parallel
 * requests would all read the same count), it evicts entries, and it is regional too. The Firewall counts
 * atomically at the edge, which is what a limiter needs.
 *
 * A failing shared store lets the request through (availability beats strictness; layer 1 still applies).
 * Only a salted SHA-256 hash of the IP is used as the key, never logged, and entries expire.
 */
import 'server-only';
import { LIMITS } from './limits';
import { redisFromEnv, type RedisRest } from './redis-rest';

export type RateResult = { ok: true } | { ok: false; retryAfter: number };
export interface RateLimitStore {
  /** `key` is the hashed client address; `req` is there for stores that read the request themselves. */
  take(key: string, req: Request): Promise<RateResult>;
}

const OK: RateResult = { ok: true };

/** Token bucket per key: `capacity` requests at once, refilled at `refillPerMinute`. */
export function createMemoryStore({
  capacity = LIMITS.bucketCapacity,
  refillPerMinute = LIMITS.refillPerMinute,
  now = Date.now,
}: { capacity?: number; refillPerMinute?: number; now?: () => number } = {}): RateLimitStore {
  const buckets = new Map<string, { tokens: number; at: number }>();
  const perMs = refillPerMinute / 60_000;
  // An idle bucket is full again after this long, so forgetting it changes nothing.
  const idleMs = Math.max(600_000, capacity / perMs);
  let lastSweep = now();
  return {
    async take(key) {
      const t = now();
      if (t - lastSweep > 60_000) {
        for (const [k, b] of buckets) if (t - b.at > idleMs) buckets.delete(k);
        lastSweep = t;
      }
      const b = buckets.get(key) ?? { tokens: capacity, at: t };
      b.tokens = Math.min(capacity, b.tokens + (t - b.at) * perMs);
      b.at = t;
      buckets.set(key, b);
      if (b.tokens < 1) return { ok: false, retryAfter: Math.max(1, Math.ceil((1 - b.tokens) / perMs / 1000)) };
      b.tokens -= 1;
      return OK;
    },
  };
}

/** Fixed one-minute window shared by every instance. */
export function createRedisStore(redis: RedisRest, { limit = LIMITS.refillPerMinute + LIMITS.bucketCapacity / 2, now = Date.now } = {}): RateLimitStore {
  return {
    async take(key) {
      const t = now();
      const k = `rl:${key}:${Math.floor(t / 60_000)}`;
      try {
        const [count] = await redis.pipeline([
          ['INCR', k],
          ['EXPIRE', k, 70],
        ]);
        return Number(count) <= limit ? OK : { ok: false, retryAfter: 60 - (Math.floor(t / 1000) % 60) };
      } catch {
        return OK;
      }
    },
  };
}

type FirewallCheck = (id: string, options: { request: Request; rateLimitKey?: string }) => Promise<{ rateLimited: boolean; error?: 'not-found' | 'blocked' }>;

/**
 * The Vercel Firewall's rate limit, asked from inside the function. The rule (window, limit, action) is
 * defined in the dashboard under the same ID. Until that rule exists the Firewall answers "not found": the
 * check is then skipped for a while instead of being repeated on every request.
 */
export function createFirewallStore(
  id: string,
  {
    check,
    now = Date.now,
    timeoutMs = 1500,
    retryAfter = 60,
  }: { check?: FirewallCheck; now?: () => number; timeoutMs?: number; retryAfter?: number } = {},
): RateLimitStore {
  let pausedUntil = 0;
  return {
    async take(_key, req) {
      if (now() < pausedUntil) return OK;
      try {
        const run = check ?? (await import('@vercel/firewall')).checkRateLimit;
        // The Firewall keys on the client IP (x-real-ip, set by Vercel) unless told otherwise.
        let timer: ReturnType<typeof setTimeout> | undefined;
        const verdict = await Promise.race([
          run(id, { request: req }),
          new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error('timeout')), timeoutMs))),
        ]).finally(() => clearTimeout(timer));
        if (verdict.error === 'not-found') {
          pausedUntil = now() + 300_000;
          console.warn(`[chat] RATE_LIMIT_FIREWALL_ID="${id}" has no matching @vercel/firewall rule; shared rate limit skipped for 5 minutes`);
          return OK;
        }
        return verdict.rateLimited ? { ok: false, retryAfter } : OK;
      } catch {
        return OK;
      }
    },
  };
}

/** Checks each store in order and stops at the first refusal, so a throttled caller never reaches the shared one. */
export function layered(...stores: (RateLimitStore | undefined)[]): RateLimitStore {
  const active = stores.filter((s): s is RateLimitStore => Boolean(s));
  return {
    async take(key, req) {
      for (const store of active) {
        const result = await store.take(key, req);
        if (!result.ok) return result;
      }
      return OK;
    },
  };
}

function sharedStore(): RateLimitStore | undefined {
  const redis = redisFromEnv();
  if (redis) return createRedisStore(redis);
  const firewallId = process.env.RATE_LIMIT_FIREWALL_ID?.trim();
  // Off Vercel there is no Firewall to ask (the SDK would call this app's own host and get a 404).
  if (firewallId && process.env.VERCEL === '1') return createFirewallStore(firewallId);
  return undefined;
}

let store: RateLimitStore | undefined;

async function hashKey(ip: string) {
  const data = new TextEncoder().encode(`${process.env.RATE_LIMIT_SALT ?? 'ask-canada'}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * How many proxies we control sit in front of the app (load balancer, CDN). Each appends the address it saw
 * to X-Forwarded-For, so only the last `TRUSTED_PROXY_HOPS` entries are trustworthy; anything before them is
 * whatever the client chose to send. Default 1 (Vercel, or one ALB / Front Door / nginx).
 */
const TRUSTED_HOPS = Math.max(1, Math.trunc(Number(process.env.TRUSTED_PROXY_HOPS ?? 1)) || 1);

/** The client address as recorded by the outermost proxy we trust. */
export function clientIp(req: Request) {
  const h = req.headers;
  const hops = (h.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // With fewer entries than trusted proxies, the first one was still written by a proxy we control.
  return hops[Math.max(0, hops.length - TRUSTED_HOPS)] ?? h.get('x-real-ip')?.trim() ?? 'local';
}

export async function takeToken(req: Request): Promise<RateResult> {
  // Local development and screenshot runs are not throttled unless explicitly requested.
  if (process.env.NODE_ENV !== 'production' && process.env.RATE_LIMIT_DEV !== '1') return OK;
  store ??= layered(createMemoryStore(), sharedStore());
  return store.take(await hashKey(clientIp(req)), req);
}
