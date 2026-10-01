/**
 * Opening hours, holiday closures and "open now" for Service Canada offices (pure, isomorphic).
 * Every office's hours are local to its own time zone (`office.tz`); `now` is a real instant (a Date or
 * epoch milliseconds, which is what the widget's clock hands out).
 */
import { addDays } from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { SC_CLOSURES, SC_CLOSURES_THROUGH, type Closure } from './data';
import type { LiveStatus, Office } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** A real instant: a Date, or epoch milliseconds. */
export type Instant = Date | number;

/** ISO date + minutes since midnight + ISO weekday (Mon=1) of `now` in `tz`. */
export function localNow(now: Instant, tz: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  }
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const date = `${g('year')}-${g('month')}-${g('day')}`;
  return { date, minutes: (Number(g('hour')) % 24) * 60 + Number(g('minute')), weekday: weekdayOf(date) };
}

/** ISO weekday (Mon=1 … Sun=7) of an ISO date. */
function weekdayOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

/** Service Canada holiday closure for a date in a province, if any. */
export function holidayOn(date: string, prov: string): Closure | null {
  if (date <= SC_CLOSURES_THROUGH) {
    const c = SC_CLOSURES.find((h) => h.date === date);
    if (!c) return null;
    if (c.only && !c.only.includes(prov)) return null;
    if (c.except && c.except.includes(prov)) return null;
    return c;
  }
  const f = FEDERAL_HOLIDAYS.find((h) => h.date === date);
  if (!f) return null;
  if (f.name.en === 'Civic Holiday' && prov === 'QC') return null;
  return { date: f.date, name: f.name };
}

/** Is the office under a posted temporary closure on this date? */
function tempClosedOn(o: Office, date: string) {
  if (o.closedOn?.includes(date)) return true;
  if (!o.closure) return false;
  return date >= o.closure.from && (!o.closure.to || date < o.closure.to);
}

/** nth weekday-of-month test for outreach rules ("the 1st and 3rd Wednesday"). */
function nthOfMonth(date: string) {
  return Math.floor((Number(date.slice(8, 10)) - 1) / 7) + 1;
}

/** Posted opening windows on a date (minutes), ignoring holidays and closures. */
function postedWindows(o: Office, date: string): [number, number][] {
  const wd = weekdayOf(date);
  const out: [number, number][] = [];
  for (const [d, a, b] of o.weekly ?? []) if (d === wd) out.push([toMin(a), toMin(b)]);
  for (const [nths, d, a, b] of o.monthly ?? []) if (d === wd && nths.includes(nthOfMonth(date))) out.push([toMin(a), toMin(b)]);
  for (const [d, a, b] of o.dated ?? []) if (d === date) out.push([toMin(a), toMin(b)]);
  return out.sort((x, y) => x[0] - y[0]);
}

/** Opening windows actually open on a date: holidays and closures removed, lunch split out. */
function windowsOn(o: Office, date: string): [number, number][] {
  if (holidayOn(date, o.prov) || tempClosedOn(o, date)) return [];
  const w = postedWindows(o, date);
  if (!o.lunch) return w;
  const [l0, l1] = [toMin(o.lunch[0]), toMin(o.lunch[1])];
  return w.flatMap(([a, b]): [number, number][] =>
    l0 > a && l1 < b ? [[a, l0], [l1, b]] : [[a, b]],
  );
}

export const hasSchedule = (o: Office) => Boolean(o.weekly?.length || o.monthly?.length || o.dated?.length);

type OfficeState = 'open' | 'closing-soon' | 'lunch' | 'closed' | 'holiday' | 'temp-closed' | 'no-schedule';

export type OfficeStatus = {
  state: OfficeState;
  /** Local date "today" is for this office. */
  today: string;
  /** When open: closes at (local HH:MM). When at lunch: reopens at. */
  until?: string;
  /** Next opening (local), when closed. */
  next?: { date: string; time: string; inDays: number };
  holiday?: Closure;
  /** From the live feed rather than the posted hours. */
  live?: boolean;
  /** Estimated wait (minutes) and when it was measured (local HH:MM), from the live feed. */
  wait?: { min: number; at?: string };
};

/** Can someone be served there on its posted days? (Not under a posted closure, and visits are scheduled.) */
export const isOperating = (s: OfficeStatus) => s.state !== 'temp-closed' && s.state !== 'no-schedule';

const SOON = 45;
/** A live snapshot is trusted for 15 minutes after it was read from the feed; after that the posted hours rule. */
const LIVE_FRESH_MS = 15 * 60_000;

/** Was this snapshot read from the feed within the last few minutes of `now`? (A missing or odd time is not.) */
export function liveIsFresh(live: LiveStatus, now: Instant): boolean {
  const age = Number(now) - Date.parse(live.at);
  return Number.isFinite(age) && Math.abs(age) < LIVE_FRESH_MS;
}

/**
 * Open-now status at an instant, optionally overlaid with a live snapshot. The snapshot is used only while it
 * is provably recent (`liveIsFresh`). "Closed" during posted opening hours and the wait time also need the
 * feed's own date to be the office's today: yesterday's evening or holiday reading never closes an open office.
 */
export function officeStatus(o: Office, now: Instant, snapshot?: LiveStatus): OfficeStatus {
  const { date, minutes } = localNow(now, o.tz);
  const live = snapshot && liveIsFresh(snapshot, now) ? snapshot : undefined;
  const today = live?.updated === date ? live : undefined;
  const nextOpen = (fromDate: string, afterMin: number): OfficeStatus['next'] => {
    for (let i = 0; i <= 62; i++) {
      const d = addDays(fromDate, i);
      const w = windowsOn(o, d).find(([a]) => i > 0 || a > afterMin);
      if (w) return { date: d, time: fromMin(w[0]), inDays: i };
    }
    return undefined;
  };
  if (!hasSchedule(o)) return { state: 'no-schedule', today: date };
  const holiday = holidayOn(date, o.prov) ?? undefined;
  if (live?.unexpected) return { state: 'temp-closed', today: date, next: nextOpen(date, minutes), live: true };
  if (tempClosedOn(o, date) && o.closure && date >= o.closure.from) return { state: 'temp-closed', today: date, next: o.closure.to ? nextOpen(date, minutes) : undefined };
  if (holiday) return { state: 'holiday', today: date, holiday, next: nextOpen(date, minutes) };

  const wins = windowsOn(o, date);
  const cur = wins.find(([a, b]) => minutes >= a && minutes < b);
  if (cur) {
    if (today?.closed) return { state: 'closed', today: date, next: nextOpen(date, minutes), live: true };
    const closes = cur[1];
    // A lunch break right after this window isn't "closing" for the day.
    const lunchNext = wins.find(([a]) => a > closes && a - closes <= 90);
    const state: OfficeState = !lunchNext && closes - minutes <= SOON ? 'closing-soon' : 'open';
    return { state, today: date, until: fromMin(lunchNext ? wins[wins.length - 1][1] : closes), wait: today?.waitMin ? { min: today.waitMin, at: today.waitAt } : undefined, live: live ? true : undefined };
  }
  const lunch = wins.find(([a], i) => i > 0 && minutes < a && minutes >= wins[i - 1][1]);
  if (lunch && o.lunch && minutes >= toMin(o.lunch[0]) && minutes < toMin(o.lunch[1])) {
    return { state: 'lunch', today: date, until: fromMin(lunch[0]) };
  }
  return { state: 'closed', today: date, next: nextOpen(date, minutes) };
}

/** `windows`: when it is really open that day (lunch split out); `posted`: the posted hours, lunch included. */
export type DayRow = { date: string; windows: [string, string][]; posted: [string, string][]; holiday?: Closure; closed?: boolean };

/** The next `days` days (from the office's today), for the hours table. */
export function upcomingDays(o: Office, now: Instant, days = 7): DayRow[] {
  const { date } = localNow(now, o.tz);
  const hhmm = (w: [number, number][]) => w.map(([a, b]) => [fromMin(a), fromMin(b)] as [string, string]);
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(date, i);
    const posted = hhmm(postedWindows(o, d));
    const holiday = posted.length ? (holidayOn(d, o.prov) ?? undefined) : undefined;
    const closed = posted.length > 0 && !holiday && tempClosedOn(o, d);
    return { date: d, posted, windows: hhmm(windowsOn(o, d)), holiday, closed };
  });
}

/** Next outreach visit days (for sites that open a few days a month). */
export function nextVisits(o: Office, now: Instant, count = 3): { date: string; open: string; close: string }[] {
  const { date } = localNow(now, o.tz);
  const out: { date: string; open: string; close: string }[] = [];
  for (let i = 0; i < 120 && out.length < count; i++) {
    const d = addDays(date, i);
    const w = windowsOn(o, d);
    if (w.length) out.push({ date: d, open: fromMin(w[0][0]), close: fromMin(w[w.length - 1][1]) });
  }
  return out;
}
