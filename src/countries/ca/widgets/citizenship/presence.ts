/**
 * Physical presence for Canadian citizenship: pure, isomorphic computation used by the
 * `citizenshipPresence` tool and recomputed live in the widget as people add trips.
 *
 * Rules (see data.ts for sources):
 * - Eligibility period = the 5 years before the application (signature) date, up to the day before it.
 * - Each day in Canada as a permanent resident counts 1 day.
 * - Each day in Canada as a temporary resident or protected person (before PR) counts 0.5 day, up to 365.
 * - The day you leave and the day you come back count as days in Canada; only full days away are absences.
 * - You need 1,095 days in total.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { RULES, URLS, presenceSources, type Lang } from './data';

/** `id` is the widget's own handle for a row in the editable list (stable across edits); the tool never sets it. */
export type Trip = { left: string; returned: string; place?: string; id?: string };

export type PresenceInput = {
  /** Date you became a permanent resident (YYYY-MM-DD). */
  prDate?: string;
  /** True when only a month was given, so `prDate` is the 1st of that month (the widget says so). */
  prDateMonthOnly?: boolean;
  /** Date you plan to sign your application (defaults to today). */
  applyDate?: string;
  /** Date you first held temporary resident or protected person status in Canada, if before PR. */
  tempStart?: string;
  trips?: Trip[];
  lang?: Lang;
};

export type TripResult = Trip & {
  /** Full days outside Canada (the day you left and the day you came back don't count). */
  daysAway: number;
  /** Full days away that fall inside the eligibility period. */
  daysInWindow: number;
  valid: boolean;
  future: boolean;
  /** For future trips: how many days later the earliest date becomes because of this trip. */
  delays?: number;
};

export type PresenceResult = {
  applyDate: string;
  window: { start: string; end: string };
  pr: { calendar: number; absent: number; present: number };
  temp: { calendar: number; absent: number; present: number; credit: number; capped: boolean };
  total: number;
  required: number;
  shortfall: number;
  surplus: number;
  eligible: boolean;
  /** First date on/after `applyDate` you could sign with at least 1,095 days (trips as listed), or null. */
  earliest: string | null;
  /** Days between applyDate and earliest (0 if eligible now). */
  wait: number | null;
  trips: TripResult[];
  prAfterApply: boolean;
};

export type PresenceOutput = {
  version: 1;
  today: string;
  lang: Lang;
  input: { prDate: string | null; prDateMonthOnly: boolean; applyDate: string; tempStart: string | null; trips: Trip[] };
  result: PresenceResult | null;
  officialCalculator: string;
  sources: ToolSource[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
export const dayNum = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
};
export const isoOf = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
/** A real calendar day: a date that would roll over (Feb 31, month 13) does not survive the round trip. */
export const isISO = (s: unknown): s is string => typeof s === 'string' && ISO.test(s) && isoOf(dayNum(s)) === s;
/** Same calendar day `years` earlier (Feb 29 rolls to Mar 1). */
const yearsBefore = (n: number, years: number) => {
  const d = new Date(n * DAY);
  return Math.round(Date.UTC(d.getUTCFullYear() - years, d.getUTCMonth(), d.getUTCDate()) / DAY);
};

/** Full days away for a trip: the departure and return days count as days in Canada. */
export const fullDaysAway = (t: Trip) => Math.max(0, dayNum(t.returned) - dayNum(t.left) - 1);

type Grid = {
  lo: number;
  pr: Int32Array; // prefix sums of PR days present
  tmp: Int32Array; // prefix sums of temp-status days present
  prCal: Int32Array; // prefix sums of PR calendar days
  tmpCal: Int32Array;
};

function buildGrid(prDate: string, tempStart: string | null, trips: Trip[], lo: number, hi: number): Grid {
  const n = hi - lo + 1;
  const away = new Uint8Array(n);
  for (const t of trips) {
    const a = Math.max(dayNum(t.left) + 1, lo);
    const b = Math.min(dayNum(t.returned) - 1, hi);
    for (let d = a; d <= b; d++) away[d - lo] = 1;
  }
  const pr0 = dayNum(prDate);
  const t0 = tempStart ? dayNum(tempStart) : Number.POSITIVE_INFINITY;
  const pr = new Int32Array(n + 1);
  const tmp = new Int32Array(n + 1);
  const prCal = new Int32Array(n + 1);
  const tmpCal = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const d = lo + i;
    const isPr = d >= pr0;
    const isTmp = !isPr && d >= t0;
    pr[i + 1] = pr[i] + (isPr && !away[i] ? 1 : 0);
    tmp[i + 1] = tmp[i] + (isTmp && !away[i] ? 1 : 0);
    prCal[i + 1] = prCal[i] + (isPr ? 1 : 0);
    tmpCal[i + 1] = tmpCal[i] + (isTmp ? 1 : 0);
  }
  return { lo, pr, tmp, prCal, tmpCal };
}

/** Sum of a prefix array over [a, b] (day numbers, inclusive). */
const sum = (g: Grid, arr: Int32Array, a: number, b: number) => {
  if (b < a) return 0;
  const i = Math.max(0, a - g.lo);
  const j = Math.min(arr.length - 1, b - g.lo + 1);
  return j > i ? arr[j] - arr[i] : 0;
};

function totalFor(g: Grid, apply: number) {
  const start = yearsBefore(apply, RULES.windowYears);
  const end = apply - 1;
  const prPresent = sum(g, g.pr, start, end);
  const tmpPresent = sum(g, g.tmp, start, end);
  const credit = Math.min(RULES.tempCap, tmpPresent * RULES.tempFactor);
  return { start, end, prPresent, tmpPresent, credit, total: prPresent + credit };
}

function earliestFrom(g: Grid, from: number, hi: number) {
  for (let d = from; d <= hi; d++) if (totalFor(g, d).total >= RULES.requiredDays) return d;
  return null;
}

export function normalizeTrips(trips: Trip[] | undefined): Trip[] {
  return (trips ?? [])
    .filter((t) => t && isISO(t.left) && isISO(t.returned))
    .slice(0, 120)
    .map((t) => ({
      left: t.left,
      returned: t.returned,
      ...(t.place ? { place: String(t.place).slice(0, 60) } : {}),
      ...(typeof t.id === 'string' ? { id: t.id.slice(0, 24) } : {}),
    }));
}

export function calcPresence(input: PresenceInput, today: string): PresenceResult | null {
  if (!isISO(input.prDate)) return null;
  const prDate = input.prDate;
  const applyDate = isISO(input.applyDate) ? input.applyDate : today;
  const tempStart = isISO(input.tempStart) && input.tempStart < prDate ? input.tempStart : null;
  const trips = normalizeTrips(input.trips);
  const valid = trips.filter((t) => t.returned >= t.left);

  const A = dayNum(applyDate);
  const lo = yearsBefore(A, RULES.windowYears) - 2;
  const hi = A + 5 * 366 + 2;
  const grid = buildGrid(prDate, tempStart, valid, lo, hi);
  const now = totalFor(grid, A);

  const prCalendar = sum(grid, grid.prCal, now.start, now.end);
  const tmpCalendar = sum(grid, grid.tmpCal, now.start, now.end);
  const total = now.total;
  const eligible = total >= RULES.requiredDays;
  const earliestN = eligible ? A : earliestFrom(grid, A, hi);
  const t0 = dayNum(today);

  const tripResults: TripResult[] = trips.map((t) => {
    const ok = t.returned >= t.left;
    const daysAway = ok ? fullDaysAway(t) : 0;
    const a = Math.max(dayNum(t.left) + 1, now.start);
    const b = Math.min(dayNum(t.returned) - 1, now.end);
    return { ...t, daysAway, daysInWindow: ok ? Math.max(0, b - a + 1) : 0, valid: ok, future: dayNum(t.left) >= t0 };
  });

  // How much each planned trip moves the earliest date (only when there is one to move).
  if (earliestN != null && !eligible) {
    tripResults.forEach((tr, i) => {
      if (!tr.future || !tr.valid || tr.daysAway === 0) return;
      const without = valid.filter((v) => v !== trips[i]);
      const g2 = buildGrid(prDate, tempStart, without, lo, hi);
      const e2 = earliestFrom(g2, A, hi);
      if (e2 != null) tr.delays = Math.max(0, earliestN - e2);
    });
  }

  return {
    applyDate,
    window: { start: isoOf(now.start), end: isoOf(now.end) },
    pr: { calendar: prCalendar, absent: prCalendar - now.prPresent, present: now.prPresent },
    temp: {
      calendar: tmpCalendar,
      absent: tmpCalendar - now.tmpPresent,
      present: now.tmpPresent,
      credit: now.credit,
      capped: now.tmpPresent * RULES.tempFactor > RULES.tempCap,
    },
    total,
    required: RULES.requiredDays,
    shortfall: Math.max(0, RULES.requiredDays - total),
    surplus: Math.max(0, total - RULES.requiredDays),
    eligible,
    earliest: earliestN != null ? isoOf(earliestN) : null,
    wait: earliestN != null ? earliestN - A : null,
    trips: tripResults,
    prAfterApply: prDate >= applyDate,
  };
}

export function presenceOutput(input: PresenceInput, today: string): PresenceOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const trips = normalizeTrips(input.trips);
  const applyDate = isISO(input.applyDate) ? input.applyDate : today;
  return {
    version: 1,
    today,
    lang,
    input: {
      prDate: isISO(input.prDate) ? input.prDate : null,
      prDateMonthOnly: Boolean(input.prDateMonthOnly && isISO(input.prDate) && input.prDate.endsWith('-01')),
      applyDate,
      tempStart: isISO(input.tempStart) ? input.tempStart : null,
      trips,
    },
    result: calcPresence({ ...input, applyDate, trips }, today),
    officialCalculator: URLS.calculator[lang],
    sources: presenceSources(lang),
  };
}
