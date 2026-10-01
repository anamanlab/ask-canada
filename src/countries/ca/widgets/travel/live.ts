/**
 * Live feeds for the travel tools (server-side only: called from tools/travel.ts and scenarios/travel.ts).
 * Every call goes through core `fetchJson` / `fetchText` (timeout, validation at the boundary) and returns
 * null on any failure, so the caller can fall back to the official page.
 *
 * Nothing here uses Next's data cache (`revalidate: 0`): it is stale-while-revalidate, so the first person
 * to ask after a quiet hour would get the previous visitor's copy under a "Live" badge. The only cache is
 * the short in-process memo below, which never serves an entry past its age: a miss always reads the feed
 * (with a second, parallel read when the first is slow).
 */
import 'server-only';
import { fetchJson, fetchText } from '@/lib/server/fetch-json';
import { FeedResponse } from './feed';
import { parseCountry } from './parse-advisory';
import { officeNames, parseWaitNotices, parseWaitsCsv, type WaitNotice } from './parse-waits';
import { FEEDS } from './sources';
import type { CountryAdvisory, Crossing, Lang } from './types';

/**
 * A scripted answer reads the feed for its headline, then the tool call reads it again for the widget:
 * sharing one in-process result keeps the two identical and spares the feed a second request. An entry
 * older than its `ttl` is never returned (the next caller fetches).
 *
 * A failed read is shared too, for FAIL_TTL after it failed: long enough for the tool calls of the same
 * answer (the text streams in between) to get the same "didn't load", so a headline that points to the
 * official page is never followed by a card with live data. The next question reads the feed again.
 */
type Entry = { at: number; ttl: number; value: Promise<unknown> };
const memo = new Map<string, Entry>();
/** How long one read is shared (ms): wait estimates a minute, an advisory five, CBSA's page notices fifteen. */
const TTL = { waits: 60_000, advisory: 5 * 60_000, notices: 15 * 60_000 };
const FAIL_TTL = 20_000;
const NO_CACHE = 0;

function shared<T>(key: string, ttl: number, load: () => Promise<T | null>): Promise<T | null> {
  const now = Date.now();
  const hit = memo.get(key);
  if (hit && now - hit.at < hit.ttl) return hit.value as Promise<T | null>;
  // Expired entries for other keys go too, so the map never outgrows the destinations asked about lately.
  for (const [k, v] of memo) if (now - v.at >= v.ttl) memo.delete(k);
  const entry: Entry = { at: now, ttl, value: Promise.resolve(null) };
  entry.value = load()
    .catch(() => null)
    .then((v) => {
      if (v == null) {
        entry.at = Date.now();
        entry.ttl = FAIL_TTL;
      }
      return v;
    });
  memo.set(key, entry);
  return entry.value as Promise<T | null>;
}

/**
 * A second, parallel read for a feed that's slow to answer (a cold first read often is, and a fresh
 * connection answers at once): the first read keeps going, and whichever succeeds first wins. Both run out
 * at `total` ms, so a feed that's down costs one timeout, not two. A reply that arrived but is wrong (HTTP
 * error, unexpected shape) is final: it isn't asked for again.
 */
function hedged<R extends { ok: boolean; reason?: string }>(read: (timeout: number) => Promise<R>, total: number, after: number): Promise<R> {
  return new Promise((resolve) => {
    let second = false;
    let failed = 0;
    // Resolves with the first success, or with the last failure once both reads have failed.
    const settle = (r: R) => {
      if (!r.ok) failed += 1;
      if (r.ok || failed === 2) resolve(r);
    };
    const startSecond = () => {
      second = true;
      void read(total - after).then(settle);
    };
    const timer = setTimeout(startSecond, after);
    void read(total).then((r) => {
      const final = r.ok || (r.reason !== 'timeout' && r.reason !== 'network');
      if (second && !final) return settle(r);
      clearTimeout(timer);
      // Answered (right or wrong): done. Dropped before the second read was due: start it now.
      if (final) resolve(r);
      else {
        failed += 1;
        startSecond();
      }
    });
  });
}

/**
 * A shared load must not die with the first caller's request, so the fetch itself never takes the caller's
 * signal: only the caller's own wait is aborted.
 */
function abortable<T>(p: Promise<T | null>, signal?: AbortSignal): Promise<T | null> {
  if (!signal) return p;
  if (signal.aborted) return Promise.resolve(null);
  return Promise.race([p, new Promise<null>((resolve) => signal.addEventListener('abort', () => resolve(null), { once: true }))]);
}

type LiveAdvisory = { country: CountryAdvisory; fetchedAt: string };

/** One destination's advisory, parsed for `lang`, read from the feed at most five minutes ago. */
export function fetchCountryAdvisory(iso: string, lang: Lang, signal?: AbortSignal): Promise<LiveAdvisory | null> {
  return abortable(shared(`advisory:${iso}:${lang}`, TTL.advisory, () => loadCountryAdvisory(iso, lang)), signal);
}

async function loadCountryAdvisory(iso: string, lang: Lang): Promise<LiveAdvisory | null> {
  const res = await hedged((timeout) => fetchJson(FEEDS.country(iso), FeedResponse, { revalidate: NO_CACHE, timeout }), 8000, 3000);
  if (!res.ok) return null;
  try {
    const country = parseCountry(res.data.data, lang);
    if (!country.levelText) return null;
    const generated = res.data.metadata?.generated?.date;
    return { country, fetchedAt: generated ? generated.replace(' ', 'T') : res.at };
  } catch {
    // The HTML fragments inside the feed didn't parse: treat it as a feed that's down.
    return null;
  }
}

/**
 * CBSA estimated wait times (Canada-bound), read from the CSV at most a minute ago. Values are always read
 * from the English CSV; the French one (row for row) gives each office its French name, so every crossing
 * carries both (`names`) and `name` is the one for `lang`.
 */
export function fetchBorderWaits(lang: Lang, signal?: AbortSignal): Promise<Crossing[] | null> {
  const rows = shared('waits', TTL.waits, loadBorderWaits).then((list) => list?.map((c) => ({ ...c, name: c.names?.[lang] ?? c.name })) ?? null);
  return abortable(rows, signal);
}

const CSV = { revalidate: NO_CACHE, headers: { accept: 'text/csv, text/plain;q=0.9, */*;q=0.5' } };

async function loadBorderWaits(): Promise<Crossing[] | null> {
  const [en, fr] = await Promise.all([hedged((timeout) => fetchText(FEEDS.waits.en, { ...CSV, timeout }), 6000, 2500), fetchText(FEEDS.waits.fr, { ...CSV, timeout: 4500 })]);
  if (!en.ok) return null;
  // The French file only counts when it lists the same offices, row for row.
  const frNames = fr.ok ? officeNames(fr.data) : undefined;
  const rows = parseWaitsCsv(en.data, frNames && frNames.length === officeNames(en.data).length ? frNames : undefined);
  return rows.length ? rows : null;
}

/** Today in Ottawa (YYYY-MM-DD): CBSA notice dates are local dates. */
export const ottawaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Notices on the CBSA wait-times page, in `lang`, read at most fifteen minutes ago. Null when the page can't be read. */
export function fetchWaitNotices(lang: Lang, signal?: AbortSignal): Promise<WaitNotice[] | null> {
  return abortable(shared(`wait-notices:${lang}`, TTL.notices, () => loadWaitNotices(lang)), signal);
}

async function loadWaitNotices(lang: Lang): Promise<WaitNotice[] | null> {
  const res = await fetchText(FEEDS.waitsPage[lang], { revalidate: NO_CACHE, timeout: 4000 });
  // A page without its title isn't the wait-times page (an error or maintenance page): don't trust it.
  if (!res.ok || !/bwt|wait times|temps d.attente/i.test(res.data)) return null;
  return parseWaitNotices(res.data, ottawaToday());
}
