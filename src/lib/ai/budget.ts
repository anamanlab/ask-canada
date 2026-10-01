/**
 * Daily spend circuit breaker. When AI_DAILY_BUDGET_USD is set and today's estimated model spend reaches
 * it, `/api/chat` stops calling the model and answers from the scripted engine (the same fallback as a model
 * outage) until the day rolls over at 00:00 UTC. Unset or 0: no breaker, nothing is counted.
 *
 * Spend is estimated per model call from the token usage the AI SDK reports (`pricing.ts`) and added to a
 * counter behind a small store interface:
 *   - Redis (UPSTASH_REDIS_REST_* / KV_REST_API_*): one atomic counter (INCRBYFLOAT) shared by every
 *     instance and region. Exact.
 *   - Vercel Runtime Cache (on Vercel, no setup, no extra vendor): shared by the instances of one region.
 *     It has no atomic increment, so two instances adding at the same moment can lose one of the two
 *     amounts (the counter then reads low), entries can be evicted, and each function region keeps its own
 *     total. Close enough for a cut-off; not a ledger.
 *   - Memory (self-hosted, dev): per process. With N replicas, each one allows the full budget.
 *
 * In every case this is a soft cap: answers already streaming when the limit is reached finish, and a call
 * the client aborts mid-step is not counted (the provider still bills what it generated). Put a hard limit
 * at the provider as well (AI Gateway budget, Anthropic workspace limit): see docs/DEPLOY.md.
 */
import 'server-only';
import { priceFor } from './pricing';
import { redisFromEnv, type RedisRest } from './redis-rest';

export interface SpendStore {
  readonly kind: 'memory' | 'redis' | 'runtime-cache';
  /** Adds to the day's total and returns the new total. */
  add(day: string, usd: number): Promise<number>;
  get(day: string): Promise<number>;
}

/** Counters are kept a little past their day, then expire on their own. */
const TTL_SECONDS = 2 * 24 * 60 * 60;
const key = (day: string) => `ai-spend:${day}`;
const toUsd = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function createMemorySpendStore(): SpendStore {
  const totals = new Map<string, number>();
  return {
    kind: 'memory',
    async add(day, usd) {
      for (const d of totals.keys()) if (d !== day) totals.delete(d);
      const total = (totals.get(day) ?? 0) + usd;
      totals.set(day, total);
      return total;
    },
    get: async (day) => totals.get(day) ?? 0,
  };
}

export function createRedisSpendStore(redis: RedisRest): SpendStore {
  return {
    kind: 'redis',
    async add(day, usd) {
      const [total] = await redis.pipeline([
        ['INCRBYFLOAT', key(day), usd.toFixed(6)],
        ['EXPIRE', key(day), TTL_SECONDS],
      ]);
      return toUsd(total);
    },
    get: async (day) => toUsd((await redis.pipeline([['GET', key(day)]]))[0]),
  };
}

/** The part of `@vercel/functions`' RuntimeCache this needs (so tests can pass a fake). */
export type CacheLike = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, options?: { ttl?: number; name?: string }): Promise<void>;
};

/**
 * Read-modify-write on a cache without atomic increments. Writes from this instance are queued one after
 * another, and the total never goes below what this instance has already seen, which removes the races
 * inside an instance (most of them, since one instance serves many concurrent requests on Vercel).
 */
export function createCacheSpendStore(getCache: () => CacheLike | Promise<CacheLike>): SpendStore {
  const seen = new Map<string, number>();
  let queue: Promise<unknown> = Promise.resolve();
  const read = async (day: string) => {
    const cache = await getCache();
    const total = Math.max(toUsd(await cache.get(key(day))), seen.get(day) ?? 0);
    for (const d of seen.keys()) if (d !== day) seen.delete(d);
    seen.set(day, total);
    return total;
  };
  return {
    kind: 'runtime-cache',
    add(day, usd) {
      const next = queue.then(async () => {
        const total = (await read(day)) + usd;
        seen.set(day, total);
        await (await getCache()).set(key(day), total, { ttl: TTL_SECONDS, name: 'ai-spend' });
        return total;
      });
      queue = next.catch(() => {});
      return next;
    },
    get: read,
  };
}

function defaultStore(): SpendStore {
  const redis = redisFromEnv();
  if (redis) return createRedisSpendStore(redis);
  // Only on Vercel: elsewhere `getCache()` is a per-process map with a warning, which MemoryStore already is.
  if (process.env.VERCEL === '1') return createCacheSpendStore(async () => (await import('@vercel/functions')).getCache({ namespace: 'ask' }));
  return createMemorySpendStore();
}

/** The budget in US dollars per UTC day, or 0 when the breaker is off. */
export function dailyBudgetUsd(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.AI_DAILY_BUDGET_USD);
  return env.AI_DAILY_BUDGET_USD?.trim() && Number.isFinite(n) && n > 0 ? n : 0;
}

export const utcDay = (now = Date.now()) => new Date(now).toISOString().slice(0, 10);

export type SpendGuard = {
  /** True when today's budget is used up: answer from the scripted engine instead of the model. */
  exhausted(): Promise<boolean>;
  /** Adds the estimated cost of one model call to today's total. Never throws. */
  record(usd: number): Promise<void>;
  /** Today's total as this instance last saw it (for logs and tests). */
  spent(): number;
};

/**
 * @param refreshMs how long this instance trusts its last reading before asking the shared store again
 *   (what other instances spent in between is not seen until then).
 */
export function createSpendGuard({
  budget = dailyBudgetUsd,
  store = defaultStore(),
  now = Date.now,
  refreshMs = 5_000,
  log = console.warn,
}: {
  budget?: () => number;
  store?: SpendStore;
  now?: () => number;
  refreshMs?: number;
  log?: (message: string) => void;
} = {}): SpendGuard {
  let day = '';
  let total = 0;
  let readAt = 0;
  let tripped = false;

  const roll = () => {
    const today = utcDay(now());
    if (today !== day) {
      day = today;
      total = 0;
      readAt = 0;
      tripped = false;
    }
    return today;
  };
  const see = (value: number, limit: number) => {
    total = Math.max(total, value);
    if (!tripped && total >= limit) {
      tripped = true;
      log(`[chat] daily AI budget reached (about $${total.toFixed(2)} of $${limit.toFixed(2)}, ${store.kind} counter): scripted answers until 00:00 UTC`);
    }
  };

  return {
    async exhausted() {
      const limit = budget();
      if (!limit) return false;
      const today = roll();
      // Once over, stay over for the day without asking the store again.
      if (tripped) return true;
      if (now() - readAt >= refreshMs) {
        readAt = now();
        try {
          see(await store.get(today), limit);
        } catch (err) {
          // Fail open on a store outage: the per-instance total still counts, and the provider's own limit backs it.
          log(`[chat] spend counter unavailable (${(err as Error).message}); using this instance's total`);
        }
      }
      return total >= limit;
    },
    async record(usd) {
      const limit = budget();
      if (!limit || !(usd > 0)) return;
      const today = roll();
      try {
        see(await store.add(today, usd), limit);
      } catch (err) {
        see(total + usd, limit);
        log(`[chat] spend counter unavailable (${(err as Error).message}); counting on this instance only`);
      }
    },
    spent: () => total,
  };
}

let guard: SpendGuard | undefined;
/** The process-wide guard used by /api/chat. */
export const spendGuard = (): SpendGuard => (guard ??= createSpendGuard());

const warned = new Set<string>();
/** Says once per model that its price is a guess, so the budget is read with that in mind. */
export function warnIfUnpriced(modelId: string) {
  if (!dailyBudgetUsd() || warned.has(modelId) || priceFor(modelId).known) return;
  warned.add(modelId);
  console.warn(`[chat] no price for model "${modelId}": the daily budget counts it at the highest listed price. Add it to src/lib/ai/pricing.ts or set AI_PRICE_INPUT / AI_PRICE_OUTPUT.`);
}
