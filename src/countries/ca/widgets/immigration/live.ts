/**
 * Server-side readers for IRCC's own JSON feeds (feeds.ts). Each read has a timeout, a revalidate window and
 * validation at the boundary, and falls back to the last-known snapshot (fallback.ts), so a slow, missing or
 * malformed feed never breaks an answer. Only the tools and the scripted scenarios import this file.
 */
import 'server-only';
import type { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import { FEES, type Fees, type Lang } from './data';
import { cleanDrawName, drawKind, isoFromLongDate, type Draw, type DrawsData } from './draws';
import { ROW_KEYS, rowExtras, snapshotDraws } from './fallback';
import { FEE_KEYS, FEEDS, FeesFeed, FlptFeed, FlptWeekFeed, POOL_FIELDS, POOL_TOTAL_FIELD, PtimeFeed, RoundNamesFeed, RoundsFeed } from './feeds';
import { COUNTRY_TIMES_SNAPSHOT, QUEBEC_SNAPSHOT, TIMES_SNAPSHOT, TIMES_UPDATED_SNAPSHOT, WAITING_SNAPSHOT } from './snapshot';
import { encodeDuration, parseDuration, parseWaiting, type CountryTimes, type TimeFeed, type TimeKey, type TimesData } from './times';

const TIMEOUT = 4500;
const HOUR = 3600;

/**
 * How long one read of a feed is shared after it settles. An answer reads the same feed twice within moments:
 * once for its text (scenario-copy) and once in the tool behind the widget. Both get the very same result, so
 * the sentence above a widget can never show one number while the widget shows another (one read timing out
 * and falling back to the snapshot while the other succeeds).
 */
const SHARE_MS = 30_000;
const shared = new Map<string, { until: number; result: Promise<unknown> }>();

/**
 * One feed, validated; `null` when it is down or not in the expected shape (the reason goes to the server log).
 * A read belongs to no single caller (see SHARE_MS), so it is bounded by its timeout, not by a caller's signal.
 */
function read<S extends z.ZodType>(url: string, schema: S, revalidate: number): Promise<z.output<S> | null> {
  const hit = shared.get(url);
  if (hit && Date.now() < hit.until) return hit.result as Promise<z.output<S> | null>;
  const entry = { until: Infinity, result: Promise.resolve<unknown>(null) };
  entry.result = fetchJson(url, schema, { revalidate, timeout: TIMEOUT })
    .then((res) => {
      if (res.ok) return res.data;
      console.warn(`[immigration] feed unavailable: ${res.detail}`);
      return null;
    })
    .catch(() => null)
    .finally(() => {
      entry.until = Date.now() + SHARE_MS;
    });
  shared.set(url, entry);
  return entry.result as Promise<z.output<S> | null>;
}

/** "2,000" → 2000; anything without digits → 0. */
const num = (v: unknown) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;

/* ─────────────── Express Entry rounds ─────────────── */

export async function getDraws(lang: Lang, count = 10): Promise<DrawsData> {
  // The English file names the round types we classify on; the French one gives official French names.
  const [en, fr] = await Promise.all([read(FEEDS.rounds('en'), RoundsFeed, HOUR), read(FEEDS.rounds('fr'), RoundNamesFeed, HOUR)]);
  const rounds = en?.rounds.filter((r) => num(r.drawCRS) > 0);
  if (!rounds?.length) return snapshotDraws(lang, count);
  rounds.sort((a, b) => b.drawDate.localeCompare(a.drawDate) || num(b.drawNumber) - num(a.drawNumber));
  const frBy = new Map((fr?.rounds ?? []).map((r) => [r.drawNumber, r.drawName]));
  const draws: Draw[] = rounds.slice(0, count).map((r) => ({
    number: num(r.drawNumber),
    date: r.drawDate,
    name: cleanDrawName((lang === 'fr' ? frBy.get(r.drawNumber) : r.drawName) ?? r.drawName),
    names: { en: cleanDrawName(r.drawName), fr: cleanDrawName(frBy.get(r.drawNumber) ?? r.drawName) },
    kind: drawKind(r.drawName),
    size: num(r.drawSize),
    crs: num(r.drawCRS),
  }));
  const latest = rounds[0];
  const bands = POOL_FIELDS.map((field) => num(latest[field]));
  const total = num(latest[POOL_TOTAL_FIELD]);
  // The bands must add up to the published total, or the distribution is not shown at all.
  const pool = total > 0 && bands.reduce((a, b) => a + b, 0) === total ? { asOf: isoFromLongDate(latest.drawDistributionAsOn) ?? latest.drawDate, bands, total } : null;
  return { draws, pool, live: true };
}

/* ─────────────── Processing times ─────────────── */

/** Which field of which feed holds each processing time (outside Quebec where the feed splits by province). */
const FLPT_KEY: Partial<Record<TimeKey, string>> = {
  cec: 'cec',
  fsw: 'fsw',
  'pnp-ee': 'pnp-ee',
  pnp: 'pnp-base',
  'spouse-inside': 'spousal-canada-roc',
  'spouse-outside': 'spousal-abroad-roc',
  parents: 'pgp-roc',
  citizenship: 'citizen-grants',
  'citizenship-proof': 'citizen-proofs',
};
/** The same applications in Quebec (shown as a second line; Quebec also selects these immigrants itself). */
const FLPT_QC_KEY: Partial<Record<TimeKey, string>> = {
  'spouse-inside': 'spousal-canada-quebec',
  'spouse-outside': 'spousal-abroad-quebec',
  parents: 'pgp-quebec',
};
/** data-ptime-non-country-en.json: [section, field]. */
const OTHER_KEY: Partial<Record<TimeKey, [string, string]>> = {
  eta: ['eta', 'eta'],
  'visitor-extension': ['visitor_extension', 'visitor_extension'],
  iec: ['iec', 'iec'],
  'pr-card': ['pr_card', 'new_pr'],
};
const WEEK_KEY: Partial<Record<TimeKey, string>> = { 'study-extension': 'SP-EXT', 'work-extension': 'WP-EXT' };
/** data-ptime-en.json section for each by-country table. */
const COUNTRY_KEY = { visitor: 'visitor-outside-canada', supervisa: 'supervisa', study: 'study', work: 'work' } as const;

/** One section of the by-country feed as ISO code → compact duration; `null` when it is too thin to trust. */
function compactCountries(section: Record<string, string> | undefined): CountryTimes | null {
  if (!section) return null;
  const out: CountryTimes = {};
  for (const [code, text] of Object.entries(section)) {
    if (!/^[A-Z]{2}$/.test(code)) continue;
    const encoded = encodeDuration(parseDuration(text));
    if (encoded) out[code] = encoded;
  }
  return Object.keys(out).length > 20 ? out : null;
}

export async function getTimes(): Promise<TimesData> {
  const [flpt, week, other, country] = await Promise.all([
    read(FEEDS.flpt, FlptFeed, 6 * HOUR),
    read(FEEDS.flptWeek, FlptWeekFeed, 6 * HOUR),
    read(FEEDS.ptimeOther, PtimeFeed, 6 * HOUR),
    read(FEEDS.ptimeCountry, PtimeFeed, 6 * HOUR),
  ]);
  const rows = ROW_KEYS.map((key) => {
    const f = FLPT_KEY[key];
    const o = OTHER_KEY[key];
    const w = WEEK_KEY[key];
    const qc = FLPT_QC_KEY[key];
    let raw: string | undefined;
    let waiting: number | undefined;
    if (f) {
      raw = flpt?.['current-flpt'][f];
      waiting = parseWaiting(flpt?.['total-people']?.[f]);
    } else if (o) raw = other?.[o[0]]?.[o[1]];
    else if (w) raw = week?.['current-flpt'][w];
    // A feed that answered but has no value means "no estimate right now": keep that honest (null).
    const answered = f ? !!flpt : o ? !!other : w ? !!week : false;
    const value = answered ? parseDuration(raw) : parseDuration(TIMES_SNAPSHOT[key]);
    const people = answered ? waiting : WAITING_SNAPSHOT[key];
    return { key, value, ...(people ? { waiting: people } : {}), ...rowExtras(key, flpt ? (qc ? flpt['current-flpt'][qc] : undefined) : QUEBEC_SNAPSHOT[key]) };
  });
  const countries: TimesData['countries'] = {};
  for (const [k, section] of Object.entries(COUNTRY_KEY) as [keyof typeof COUNTRY_KEY, string][]) {
    countries[k] = compactCountries(country?.[section]) ?? COUNTRY_TIMES_SNAPSHOT[k];
  }
  const otherUpdated = other ? isoFromLongDate(other['default-update']?.lastupdated) : null;
  const down: TimeFeed[] = [...(flpt ? [] : ['pr' as const]), ...(week ? [] : ['ext' as const]), ...(country ? [] : ['country' as const]), ...(other ? [] : ['other' as const])];
  return {
    rows,
    countries,
    updated: {
      pr: isoFromLongDate(flpt?.['default-update']?.flpt_lastupdated) ?? TIMES_UPDATED_SNAPSHOT.pr,
      // A date always belongs to the values next to it: a feed that is down keeps its snapshot's date.
      tr: (country ? (isoFromLongDate(country[COUNTRY_KEY.visitor]?.lastupdated) ?? otherUpdated) : null) ?? TIMES_UPDATED_SNAPSHOT.tr,
      other: otherUpdated ?? TIMES_UPDATED_SNAPSHOT.other,
      ext: isoFromLongDate(week?.['tr-last-updated']) ?? TIMES_UPDATED_SNAPSHOT.ext,
    },
    live: down.length < 4,
    ...(down.length ? { down } : {}),
  };
}

/* ─────────────── Fees ─────────────── */

/** Current fees from fees.json (the list canada.ca displays). Falls back to the verified values in data.ts. */
export async function getFees(): Promise<{ fees: Fees; live: boolean }> {
  const json = await read(FEEDS.fees, FeesFeed, 24 * HOUR);
  if (!json) return { fees: FEES, live: false };
  const fees = { ...FEES };
  let found = 0;
  for (const [k, key] of Object.entries(FEE_KEYS) as [keyof Fees, string][]) {
    const raw = json[key]?.en?.match(/\$([\d,]+(?:\.\d+)?)/)?.[1];
    const n = raw ? Number(raw.replace(/,/g, '')) : NaN;
    if (!Number.isFinite(n) || n < 0) continue;
    fees[k] = n;
    found++;
  }
  // A file with none of our fees in it is not "live": the verified values stand.
  return { fees, live: found > 0 };
}
