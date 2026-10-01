/**
 * Live official data for the transport tools (server only): Transport Canada's recalls open API, its service-fee API
 * (the one canada.ca pages use to show drone fees) and the EVAP pages. Every call has a timeout and a cache window,
 * and every function returns a renderable shape (live: false + official links) instead of throwing.
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson, fetchText, type FetchOptions, type FetchResult } from '@/lib/server/fetch-json';
import { feesOn } from './build';
import { DRONE_FEES, EVAP, URLS, feeOn, type DroneFeeKey, type Lang } from './data';
import type { DroneFees } from './drone';
import type { EvRow } from './ev';
import { evListPages, parseEvList, parseFunds } from './ev-parse';
import { EV_SNAPSHOT } from './ev-snapshot';
import type { RecallsInput, RecallsOutput, YearCount } from './recalls';
import { ApiResult, bareRecall, modelVariant, normalizeMake, normalizeModel, parseCount, parseList, parseSummary, recallsOutput, recentYears } from './recalls-parse';

/** The recalls API returns sporadic 500s: one quick retry on a 5xx, never after the caller gave up. */
async function retryOn5xx<T>(run: () => Promise<FetchResult<T>>, signal?: AbortSignal): Promise<FetchResult<T>> {
  const res = await run();
  if (res.ok || res.reason !== 'http' || (res.status ?? 0) < 500 || signal?.aborted) return res;
  return run();
}

/* ───────────────────────────── Vehicle recalls ───────────────────────────── */

const API = 'https://data.tc.gc.ca/v1.3/api/eng/vehicle-recall-database';
const seg = (s: string) => encodeURIComponent(s);
const basePath = (make: string, model: string, year: number) => `${API}/recall/make-name/${seg(make)}/model-name/${seg(model)}/year-range/${year}-${year}`;
/** Without `limit` the API stops at 25 rows (a 2021 F-150 has 27); 1,000 covers any single model year. */
const listUrl = (make: string, model: string, year: number) => `${basePath(make, model, year)}?limit=1000`;
const countUrl = (make: string, model: string, year: number) => `${basePath(make, model, year)}/count`;
/** Every listed recall gets its summary (cached 24 h); the cap only guards against a runaway list. */
const DETAILS = 80;
const POOL = 8;
const LIST = { timeout: 6000, revalidate: 21_600 };

/** One validated call to the recalls API (`null` when it doesn't answer, or answers with something else). */
async function recallsApi(url: string, opts: FetchOptions): Promise<ApiResult | null> {
  const res = await retryOn5xx(() => fetchJson(url, ApiResult, opts), opts.signal);
  return res.ok ? res.data : null;
}

/** Run `fn` over `items` with at most `size` requests in flight (the API rate-limits bursts). */
async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

export async function liveRecalls(input: RecallsInput, today: string, signal?: AbortSignal, now = new Date()): Promise<RecallsOutput> {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const make = normalizeMake(input.make);
  let model = normalizeModel(input.model);
  const year = typeof input.year === 'number' && input.year >= 1950 && input.year <= Number(today.slice(0, 4)) + 2 ? Math.floor(input.year) : null;
  const base = { ...input, lang, year };
  if (!make || !model) return recallsOutput({ ...base, make: input.make ?? null, model: input.model ?? null }, { status: 'need-vehicle', live: true }, now);

  const unavailable = () => recallsOutput({ ...base, make }, { status: 'unavailable', live: false, model }, now);

  if (year == null) {
    const years = recentYears(today);
    /** Unique recalls per year; `null` for a year the database didn't answer. */
    const countYears = (m: string) => Promise.all(years.map(async (y) => {
      const res = await recallsApi(listUrl(make, m, y), { signal, ...LIST });
      return res ? parseList(res).length : null;
    }));
    let res = await countYears(model);
    const variant = modelVariant(model);
    if (variant && res.every((n) => n === 0)) {
      const alt = await countYears(variant);
      if (alt.some((n) => n != null && n > 0)) {
        res = alt;
        model = variant;
      }
    }
    if (res.every((n) => n == null)) return unavailable();
    const counts: YearCount[] = years.map((y, i) => ({ year: y, count: res[i] ?? -1 }));
    const any = counts.some((c) => c.count > 0);
    return recallsOutput({ ...base, make }, { status: any ? 'need-year' : 'none', years: counts, model, live: true }, now);
  }

  const fetchModel = (m: string) =>
    Promise.all([
      recallsApi(listUrl(make, m, year), { signal, ...LIST }),
      // The database's own row count, to catch a list the API cut short. Optional: a failure never blocks the answer.
      recallsApi(countUrl(make, m, year), { signal, ...LIST }).then((r) => (r ? parseCount(r) : null)),
    ]);
  let [res, count] = await fetchModel(model);
  if (!res) return unavailable();
  let entries = parseList(res);
  const variant = modelVariant(model);
  if (!entries.length && variant) {
    const [altRes, altCount] = await fetchModel(variant);
    if (altRes && parseList(altRes).length) {
      [res, count] = [altRes, altCount];
      entries = parseList(res);
      model = variant;
    }
  }
  if (!entries.length) return recallsOutput({ ...base, make }, { status: 'none', total: 0, model, live: true }, now);

  // `count` counts rows (one per affected model), so compare it with rows, not unique recalls.
  const rows = res.ResultSet?.length ?? 0;
  const truncated = count != null && count > rows;
  const details = await pool(entries.slice(0, DETAILS), POOL, (e) =>
    recallsApi(`${API}/recall-summary/recall-number/${seg(e.id)}`, { signal, timeout: 5000, revalidate: 86_400 }),
  );
  const recalls = entries.map((e, i) => {
    const d = details[i];
    return d?.ResultSet?.length ? parseSummary(d, lang, e) : bareRecall(e, lang);
  });
  return recallsOutput({ ...base, make }, { status: 'found', total: entries.length, truncated, recalls, model, live: true }, now);
}

/**
 * Unique recalls on file for one make/model/year (for the answer's heading), or null when the database doesn't answer
 * quickly. Uses the same cached list request as liveRecalls, so the widget's own call right after is instant.
 */
export async function liveRecallCount(make?: string | null, model?: string | null, year?: number | null, signal?: AbortSignal): Promise<number | null> {
  const mk = normalizeMake(make);
  const md = normalizeModel(model);
  if (!mk || !md || !year) return null;
  const count = async (m: string) => {
    const res = await recallsApi(listUrl(mk, m, year), { signal, ...LIST });
    return res ? parseList(res).length : null;
  };
  const n = await count(md);
  const variant = modelVariant(md);
  return n || !variant ? n : count(variant);
}

/* ───────────────────────────── Drone fees ───────────────────────────── */

/** The service-fee API's answer for one fee: its amounts over time ("10.17" from 2026-04-01 to 2027-03-31). */
const FeeApi = z.object({
  Amounts: z.array(z.object({ Amount: z.union([z.string(), z.number()]), Start: z.string(), End: z.string().nullish() })).min(1),
});

/** Transport Canada's fees in force today, from the same API the canada.ca pages use; schedule fallback per fee. */
export async function liveDroneFees(today: string, signal?: AbortSignal): Promise<{ fees: DroneFees; live: boolean }> {
  const keys = Object.keys(DRONE_FEES) as DroneFeeKey[];
  const fees = feesOn(today);
  const read = await Promise.all(
    keys.map(async (k) => {
      const res = await fetchJson(`https://api.tc.canada.ca/siapi/api/v2/fees/id=${DRONE_FEES[k].id}`, FeeApi, { signal, timeout: 3500, revalidate: 86_400 });
      if (!res.ok) return false;
      const amounts = res.data.Amounts.map((a) => ({ amount: Number(a.Amount), start: a.Start.slice(0, 10), end: a.End ? a.End.slice(0, 10) : undefined })).filter((a) =>
        Number.isFinite(a.amount),
      );
      if (!amounts.length) return false;
      fees[k] = feeOn({ id: DRONE_FEES[k].id, amounts }, today);
      return true;
    }),
  );
  return { fees, live: read.every(Boolean) };
}

/* ───────────────────────────── EVAP ───────────────────────────── */

const PAGE = { timeout: 6000, revalidate: 43_200 };

export async function liveEv(signal?: AbortSignal): Promise<{ vehicles: EvRow[]; listLive: boolean; funds: { remaining: number; asOf: string }; fundsLive: boolean }> {
  const page = (url: string) => retryOn5xx(() => fetchText(url, { signal, ...PAGE }), signal);
  const listP = (async (): Promise<EvRow[] | null> => {
    const first = await page(URLS.evList.en);
    if (!first.ok) return null;
    const pages = Math.min(12, evListPages(first.data));
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => page(`${URLS.evList.en}?page=${i + 1}`)));
    const html = [first, ...rest].flatMap((r) => (r.ok ? [r.data] : []));
    if (html.length < pages) return null;
    const rows = html.flatMap(parseEvList);
    // Guard against a redesigned page silently returning a partial list.
    return rows.length < Math.min(40, EV_SNAPSHOT.length) ? null : rows;
  })();
  const fundsP = page(URLS.ev.en).then((r) => (r.ok ? parseFunds(r.data) : null));
  const [list, funds] = await Promise.all([listP, fundsP]);
  return {
    vehicles: list ?? EV_SNAPSHOT,
    listLive: !!list,
    funds: funds ?? { remaining: EVAP.remaining.amount, asOf: EVAP.remaining.asOf },
    fundsLive: !!funds,
  };
}
