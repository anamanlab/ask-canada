/**
 * The optional shared store: any Redis with an Upstash-compatible REST API (Upstash, Vercel KV, or a
 * self-hosted proxy). Used by the rate limiter and the daily spend counter when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL / KV_REST_API_TOKEN) are set. Nothing else needs it.
 */
import 'server-only';

export type RedisCommand = (string | number)[];
export type RedisRest = { pipeline(commands: RedisCommand[]): Promise<unknown[]> };

export function redisFromEnv(env: NodeJS.ProcessEnv = process.env): RedisRest | undefined {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) return undefined;
  const endpoint = `${url.replace(/\/$/, '')}/pipeline`;
  return {
    /** Runs the commands in one round trip and returns each result. Throws on a network or Redis error. */
    async pipeline(commands) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify(commands),
        signal: AbortSignal.timeout(1500),
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`redis ${res.status}`);
      const rows = (await res.json()) as { result?: unknown; error?: string }[];
      return rows.map((row) => {
        if (row.error) throw new Error(row.error);
        return row.result;
      });
    },
  };
}
