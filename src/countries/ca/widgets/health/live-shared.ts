/**
 * Shared by the live fetchers of the health tools (server only): an official page as text, and the short memo
 * that lets a scripted answer and its tool call share one fetch. Every fetch has a timeout and a cache window
 * (core `fetchText` / `fetchJson`).
 */
import 'server-only';
import { fetchText, type FetchOptions } from '@/lib/server/fetch-json';

/** An official page as text, or null when it can't be read (timeout, network, HTTP error). */
export async function page(url: string, o: FetchOptions): Promise<string | null> {
  const res = await fetchText(url, o);
  return res.ok ? res.data : null;
}

/** Share one fetch between the scripted answer (which words its heading on the result) and the tool call. */
const MEMO_MS = 90_000;
export type Memo<T> = Map<string, { at: number; p: Promise<T> }>;

/**
 * `run()` memoized under `key` for a short window, so identical requests a few seconds apart share one fetch.
 * The shared fetch isn't tied to one caller's abort signal (a second caller may still need it): an aborted
 * caller just stops waiting. A failure is kept for 30 s only (long enough for the answer and its widget to
 * agree), then tried again.
 */
export function shared<T extends { live: boolean }>(memo: Memo<T>, key: string, now: Date, signal: AbortSignal | undefined, run: () => Promise<T>): Promise<T> {
  const at = now.getTime();
  for (const [k, v] of memo) if (at - v.at > MEMO_MS) memo.delete(k);
  let p = memo.get(key)?.p;
  if (!p) {
    const fresh = run();
    p = fresh;
    memo.set(key, { at, p: fresh });
    void fresh.then((o) => {
      if (!o.live && memo.get(key)?.p === fresh) memo.set(key, { at: at - MEMO_MS + 30_000, p: fresh });
    });
  }
  if (!signal) return p;
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }),
  ]);
}
