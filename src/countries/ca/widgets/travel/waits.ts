/**
 * Border wait summaries shared by the scripted answer (server) and the BorderWaits widget (client), so the
 * headline and the "Longest wait" tile always agree. Pure and isomorphic.
 */
import { stampMs } from './select';
import type { Crossing, Lang } from './types';

export type Lane = 'travellers' | 'commercial';

/**
 * CBSA keeps a crossing's last estimate in the feed until the port posts a new one, and some ports stop
 * posting for hours (overnight, a closed lane). An estimate older than this isn't treated as the wait now.
 */
export const STALE_MS = 2 * 3_600_000;
/** Estimates older than this are from another part of the day: their time is shown with its date. */
export const DATED_MS = 12 * 3_600_000;

/** True when the crossing's estimate is too old to count as current at `now` (epoch ms; 0 or omitted: unknown, nothing is stale). */
export const isStale = (c: Pick<Crossing, 'updated'>, now?: number) => !!now && now - stampMs(c.updated) > STALE_MS;

/** How a wait reads on the board: one ladder for a row's pill and bar and for the "Longest wait" tile. */
export type WaitTone = 'na' | 'clear' | 'short' | 'mid' | 'long';
/** No figure or a stale one: `na`. No wait: `clear`. Under 15 min: `short`. 15 to 44: `mid` (amber). 45 or more: `long` (red). */
export const waitTone = (minutes: number | null, stale = false): WaitTone =>
  minutes == null || stale ? 'na' : minutes === 0 ? 'clear' : minutes < 15 ? 'short' : minutes < 45 ? 'mid' : 'long';

/**
 * Longest current wait first, then crossings whose estimate is stale (at `now`), then those without a
 * figure; ties by name, so the order never flickers.
 */
export function byWait(lane: Lane, now?: number) {
  const rank = (c: Crossing) => (c[lane].minutes == null ? 2 : isStale(c, now) ? 1 : 0);
  return (a: Crossing, b: Crossing) => rank(a) - rank(b) || (b[lane].minutes ?? 0) - (a[lane].minutes ?? 0) || a.name.localeCompare(b.name);
}

export type WaitSummary = {
  /** Longest current wait in minutes (0 when every crossing is clear), or null when nothing current is reported. */
  max: number | null;
  /** Every crossing at that longest wait, in `byWait` order (several on a tie). */
  top: Crossing[];
  /** The next distinct, shorter wait (never equal to `max`). */
  next: { minutes: number; crossings: Crossing[] } | null;
  /** Crossings reporting no wait, and crossings with a current figure at all. */
  clear: number;
  total: number;
  /** Crossings whose last figure is too old to count (left out of everything above). */
  stale: number;
  /** Crossings that have this lane at all: the denominator for "reporting now". */
  lane: number;
  /** Crossings without this lane (CBSA's "Not applicable": no commercial processing at Rainbow Bridge or Douglas). */
  na: number;
};

/**
 * The longest wait and the clear count for one lane, from current estimates only: pass `now` (the tool's
 * read time, then the reader's clock) and rows older than STALE_MS are left out, so an estimate from
 * yesterday afternoon is never stated as the longest wait right now.
 *
 * Why `total` can be below CBSA's "30 busiest crossings": the CSV lists the offices CBSA is publishing that
 * day (29 rows on 2026-09-30, 30 on 2026-10-01), a few have no commercial lane (`na`), a port can be closed
 * or post nothing ("--"), and stale rows are left out. `lane` = `total` + `stale` + closed or unreported.
 */
export function summarizeWaits(crossings: Crossing[], lane: Lane = 'travellers', now?: number): WaitSummary {
  const reported = crossings.filter((c) => c[lane].minutes != null);
  const na = crossings.filter((c) => c[lane].label === 'na').length;
  const measured = reported.filter((c) => !isStale(c, now)).sort(byWait(lane, now));
  const max = measured[0]?.[lane].minutes ?? null;
  const top = max == null ? [] : measured.filter((c) => c[lane].minutes === max);
  const below = max ? measured.filter((c) => (c[lane].minutes ?? 0) > 0 && (c[lane].minutes ?? 0) < max) : [];
  const nextMin = below[0]?.[lane].minutes ?? null;
  return {
    max,
    top,
    next: nextMin ? { minutes: nextMin, crossings: below.filter((c) => c[lane].minutes === nextMin) } : null,
    clear: measured.filter((c) => c[lane].minutes === 0).length,
    total: measured.length,
    stale: reported.length - measured.length,
    lane: crossings.length - na,
    na,
  };
}

/** The newest estimate's stamp among these crossings (they carry their own time zones), or undefined. */
export const latestStamp = (crossings: Pick<Crossing, 'updated'>[]) =>
  crossings.reduce<string | undefined>((m, c) => (!m || stampMs(c.updated) > stampMs(m) ? c.updated : m), undefined);

/**
 * Crossing names for answer text: "A", "A and B", "A, B and C", then "A, B and 2 more crossings" /
 * « A, B et 2 autres postes » past three, so the conjunction appears once.
 */
export function crossingList(list: { name: string }[], lang: Lang): string {
  const fr = lang === 'fr';
  const and = fr ? 'et' : 'and';
  const n = list.map((c) => c.name);
  if (n.length <= 1) return n[0] ?? '';
  if (n.length <= 3) return `${n.slice(0, -1).join(', ')} ${and} ${n[n.length - 1]}`;
  const rest = n.length - 2;
  const more = fr ? `${rest === 1 ? '1 autre poste' : `${rest} autres postes`}` : `${rest} more ${rest === 1 ? 'crossing' : 'crossings'}`;
  return `${n[0]}, ${n[1]} ${and} ${more}`;
}
