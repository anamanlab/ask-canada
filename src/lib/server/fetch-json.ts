/**
 * Upstream fetches for tools (server only): a timeout, the Next data cache, and validation at the boundary.
 * Never throws, so a tool can always fall back to its static data (`live: false`).
 *
 *   const Feed = z.object({ items: z.array(z.object({ title: z.string(), date: z.string() })) });
 *   const res = await fetchJson(URL, Feed, { revalidate: 3600, timeout: 4000, signal });
 *   if (!res.ok) return fallback(res.reason);          // 'timeout' | 'aborted' | 'network' | 'http' | 'invalid'
 *   res.data.items                                     // typed from the schema
 *
 *   const html = await fetchText(URL, { revalidate: 86_400 });   // HTML pages for scrapers, same contract
 *
 * Options: `revalidate` (seconds in the Next data cache, `false` = forever, 0 = never cache), `timeout`
 * (ms, default 5000, never more than 20 000), `signal` (the tool call's abort signal), `headers`, `tags`
 * (for `revalidateTag`).
 *
 * Time: a request without `timeout` gets 5 s. Always pass the tool call's `signal` (`execute(input, { abortSignal })`):
 * every tool call has an overall budget (`AI_TOOL_TIMEOUT_MS`, 12 s), and that signal is what stops requests
 * still running when it runs out. A tool that makes several requests should also keep its own total short,
 * with one shared deadline: `const signal = withTimeout(abortSignal, 4000)` passed to each of them.
 * Results carry `at`, the ISO time the response was read (use it for "checked on" footers).
 */
import 'server-only';
import type { z } from 'zod';

export type FetchOptions = {
  revalidate: number | false;
  timeout?: number;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  tags?: string[];
};

export type FetchFailure = {
  ok: false;
  reason: 'timeout' | 'aborted' | 'network' | 'http' | 'invalid';
  /** HTTP status for `http`. */
  status?: number;
  /** What went wrong, for server logs (never shown to people). */
  detail: string;
};

export type FetchResult<T> = { ok: true; data: T; at: string } | FetchFailure;

const DEFAULT_TIMEOUT = 5000;
/** No single upstream request may wait longer than this, whatever the caller asks for. */
const MAX_TIMEOUT = 20_000;

/** The caller's signal (if any) combined with a timeout. */
export const withTimeout = (signal: AbortSignal | undefined, ms: number) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);

async function request(url: string, accept: string, o: FetchOptions): Promise<{ ok: true; res: Response } | FetchFailure> {
  try {
    const res = await fetch(url, {
      headers: { accept, ...o.headers },
      signal: withTimeout(o.signal, Math.min(o.timeout && o.timeout > 0 ? o.timeout : DEFAULT_TIMEOUT, MAX_TIMEOUT)),
      next: { revalidate: o.revalidate, ...(o.tags ? { tags: o.tags } : {}) },
    });
    if (!res.ok) return { ok: false, reason: 'http', status: res.status, detail: `${res.status} ${url}` };
    return { ok: true, res };
  } catch (e) {
    const name = e instanceof Error ? e.name : '';
    const reason = name === 'TimeoutError' ? 'timeout' : name === 'AbortError' ? 'aborted' : 'network';
    return { ok: false, reason, detail: `${reason} ${url}: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function fetchJson<S extends z.ZodType>(url: string, schema: S, o: FetchOptions): Promise<FetchResult<z.output<S>>> {
  const r = await request(url, 'application/json', o);
  if (!r.ok) return r;
  let body: unknown;
  try {
    body = await r.res.json();
  } catch (e) {
    return { ok: false, reason: 'invalid', detail: `not JSON ${url}: ${e instanceof Error ? e.message : String(e)}` };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    return { ok: false, reason: 'invalid', detail: `unexpected shape ${url}: ${issues.join('; ')}` };
  }
  return { ok: true, data: parsed.data, at: new Date().toISOString() };
}

export async function fetchText(url: string, o: FetchOptions): Promise<FetchResult<string>> {
  const r = await request(url, 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8', o);
  if (!r.ok) return r;
  try {
    return { ok: true, data: await r.res.text(), at: new Date().toISOString() };
  } catch (e) {
    return { ok: false, reason: 'network', detail: `body ${url}: ${e instanceof Error ? e.message : String(e)}` };
  }
}
