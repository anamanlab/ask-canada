/**
 * Pure opening-hours maths for the contact widget (isomorphic: the tool computes the first answer on the
 * server, the card keeps it live in the browser).
 *
 * Lines publish hours either in Ottawa time ("8 am to 8 pm ET", CRA) or in "your local time" (Service
 * Canada, for callers in Canada and the United States). We turn each rule into real time windows, then show them in the viewer's own time zone:
 * "Open now · closes 5 p.m." for someone in Vancouver calling the CRA.
 */
import { addDays, type Holiday } from '@/lib/dates/business-days';
import type { Hours, Weekday } from './data';

export const OTTAWA = 'America/Toronto';

/** IANA zones used in Canada (current and legacy aliases). */
const CANADIAN_ZONES = new Set([
  'America/St_Johns', 'America/Halifax', 'America/Glace_Bay', 'America/Moncton', 'America/Goose_Bay',
  'America/Blanc-Sablon', 'America/Toronto', 'America/Montreal', 'America/Nipigon', 'America/Thunder_Bay',
  'America/Iqaluit', 'America/Pangnirtung', 'America/Atikokan', 'America/Winnipeg', 'America/Rainy_River',
  'America/Resolute', 'America/Rankin_Inlet', 'America/Regina', 'America/Swift_Current', 'America/Edmonton',
  'America/Cambridge_Bay', 'America/Yellowknife', 'America/Inuvik', 'America/Creston', 'America/Dawson_Creek',
  'America/Fort_Nelson', 'America/Whitehorse', 'America/Dawson', 'America/Vancouver',
  'Canada/Newfoundland', 'Canada/Atlantic', 'Canada/Eastern', 'Canada/Central', 'Canada/Saskatchewan',
  'Canada/Mountain', 'Canada/Pacific', 'Canada/Yukon',
]);
/** Zones in Yukon, the Northwest Territories and Nunavut (CRA has separate toll-free lines for the North). */
const NORTH_ZONES = new Set([
  'America/Whitehorse', 'America/Dawson', 'Canada/Yukon', 'America/Yellowknife', 'America/Inuvik',
  'America/Iqaluit', 'America/Pangnirtung', 'America/Rankin_Inlet', 'America/Cambridge_Bay', 'America/Resolute',
]);

/**
 * IANA zones of the 50 U.S. states (current names and legacy aliases). The departments' toll-free numbers are
 * listed for "Canada and the United States"; their collect / international numbers are for everywhere else.
 * U.S. territories are left out: the official pages don't say the toll-free lines reach them.
 */
const US_ZONES = new Set([
  'America/New_York', 'America/Detroit', 'America/Chicago', 'America/Menominee', 'America/Denver', 'America/Boise',
  'America/Phoenix', 'America/Los_Angeles', 'America/Anchorage', 'America/Juneau', 'America/Sitka', 'America/Metlakatla',
  'America/Yakutat', 'America/Nome', 'America/Adak', 'Pacific/Honolulu',
  'America/Kentucky/Louisville', 'America/Kentucky/Monticello', 'America/North_Dakota/Center', 'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah', 'America/Indiana/Indianapolis', 'America/Indiana/Vincennes', 'America/Indiana/Winamac',
  'America/Indiana/Marengo', 'America/Indiana/Petersburg', 'America/Indiana/Vevay', 'America/Indiana/Tell_City', 'America/Indiana/Knox',
  'America/Indianapolis', 'America/Fort_Wayne', 'America/Louisville', 'America/Knox_IN', 'America/Shiprock', 'America/Atka',
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'US/Alaska', 'US/Aleutian', 'US/Hawaii', 'US/Arizona',
  'US/Michigan', 'US/East-Indiana', 'US/Indiana-Starke', 'Pacific/Johnston',
]);

export const isCanadianZone = (tz: string) => CANADIAN_ZONES.has(tz);
/** Where the viewer is calling from, as the official pages split it: Canada, the United States, or anywhere else. */
export type Region = 'ca' | 'us' | 'intl';
export const regionOf = (tz: string): Region => (CANADIAN_ZONES.has(tz) ? 'ca' : US_ZONES.has(tz) ? 'us' : 'intl');
export const isNorthZone = (tz: string) => NORTH_ZONES.has(tz);

/** A usable IANA zone name, or Ottawa. */
export function safeZone(tz?: string | null): string {
  if (!tz) return OTTAWA;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return tz;
  } catch {
    return OTTAWA;
  }
}

const partsCache = new Map<string, Intl.DateTimeFormat>();
function partsFmt(tz: string) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });
    partsCache.set(tz, f);
  }
  return f;
}

const WD: Record<string, Weekday> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

type Wall = { date: string; weekday: Weekday; minutes: number };

/** The wall-clock date, weekday and minutes-after-midnight of an instant in a zone. */
export function wallClock(ms: number, tz: string): Wall {
  const p: Record<string, string> = {};
  for (const x of partsFmt(tz).formatToParts(new Date(ms))) p[x.type] = x.value;
  return { date: `${p.year}-${p.month}-${p.day}`, weekday: WD[p.weekday] ?? 1, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Offset of `tz` from UTC at an instant, in ms. */
function offsetAt(ms: number, tz: string) {
  const p: Record<string, string> = {};
  for (const x of partsFmt(tz).formatToParts(new Date(ms))) p[x.type] = x.value;
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return asUtc - (ms - (ms % 1000));
}

/** The instant when the wall clock in `tz` reads `date` + `minutes` (minutes may exceed a day). */
export function zonedToInstant(date: string, minutes: number, tz: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d) + minutes * 60_000;
  const first = guess - offsetAt(guess, tz);
  const second = guess - offsetAt(first, tz);
  return second;
}

const weekdayOf = (date: string): Weekday => {
  const [y, m, d] = date.split('-').map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (w === 0 ? 7 : w) as Weekday;
};

/**
 * The zone a rule's clock runs in, for a given viewer. "Local time" lines are listed for "Canada and the United
 * States" (CPP/OAS: "operates in local time"), so they follow the caller's own clock in both countries. Anywhere
 * else nobody answers on the caller's clock: those lines follow Ottawa, and the card says so.
 */
export function ruleZone(rule: Hours, viewerTz: string) {
  if (rule.zone === 'ET') return OTTAWA;
  return regionOf(viewerTz) === 'intl' ? OTTAWA : viewerTz;
}

type Window = { start: number; end: number; date: string };

/** Real open windows of a rule around `now` (from the day before to `days` days after). */
export function windowsAround(rule: Hours, nowMs: number, viewerTz: string, holidays: Holiday[], days = 9): Window[] {
  const tz = ruleZone(rule, viewerTz);
  const today = wallClock(nowMs, tz).date;
  const closed = new Set(rule.closedOnHolidays ? holidays.map((x) => x.date) : []);
  const out: Window[] = [];
  for (let i = -1; i <= days; i++) {
    const date = addDays(today, i);
    if (!rule.days.includes(weekdayOf(date)) || closed.has(date)) continue;
    out.push({ date, start: zonedToInstant(date, rule.open, tz), end: zonedToInstant(date, rule.close, tz) });
  }
  return out;
}

export type Status =
  | { state: 'always' }
  | { state: 'open'; closesAt: number; minutesLeft: number }
  | { state: 'closing'; closesAt: number; minutesLeft: number }
  | { state: 'closed'; opensAt?: number; holiday?: Holiday };

const CLOSING_SOON_MIN = 30;

/** Is a line (rule) open at `now` for this viewer, and when does that change? */
export function statusOf(rule: Hours | undefined, nowMs: number, viewerTz: string, holidays: Holiday[]): Status | null {
  if (!rule) return null;
  if (rule.open === 0 && rule.close >= 1440 && rule.days.length === 7 && !rule.closedOnHolidays) return { state: 'always' };
  const wins = windowsAround(rule, nowMs, viewerTz, holidays);
  const cur = wins.find((w) => w.start <= nowMs && nowMs < w.end);
  if (cur) {
    const minutesLeft = Math.ceil((cur.end - nowMs) / 60_000);
    return { state: minutesLeft <= CLOSING_SOON_MIN ? 'closing' : 'open', closesAt: cur.end, minutesLeft };
  }
  const next = wins.find((w) => w.start > nowMs);
  const tz = ruleZone(rule, viewerTz);
  const todayInRule = wallClock(nowMs, tz).date;
  const holiday = rule.closedOnHolidays && rule.days.includes(weekdayOf(todayInRule)) ? holidays.find((x) => x.date === todayInRule) : undefined;
  return { state: 'closed', opensAt: next?.start, holiday };
}

export const isOpen = (s: Status | null) => !!s && (s.state === 'open' || s.state === 'closing' || s.state === 'always');

/** A typical open window (the next qualifying day, ignoring holidays), for "Mon–Fri · 5 a.m.–5 p.m." labels. */
export function typicalWindow(rule: Hours, nowMs: number, viewerTz: string): { start: number; end: number } {
  const wins = windowsAround(rule, nowMs, viewerTz, [], 8);
  const w = wins.find((x) => x.end > nowMs) ?? wins[0];
  return { start: w.start, end: w.end };
}

/** Segments of the viewer's current day (0..1) covered by a rule, for the day bar. */
export function daySegments(rule: Hours | undefined, nowMs: number, viewerTz: string, holidays: Holiday[]) {
  if (!rule) return [];
  const day = wallClock(nowMs, viewerTz).date;
  const from = zonedToInstant(day, 0, viewerTz);
  const to = zonedToInstant(addDays(day, 1), 0, viewerTz);
  const span = to - from;
  return windowsAround(rule, nowMs, viewerTz, holidays, 2)
    .map((w) => ({ a: Math.max(w.start, from), b: Math.min(w.end, to) }))
    .filter((s) => s.b > s.a)
    .map((s) => ({ from: (s.a - from) / span, to: (s.b - from) / span }));
}

/** Where "now" sits in the viewer's day (0..1). */
export function dayFraction(nowMs: number, viewerTz: string) {
  const day = wallClock(nowMs, viewerTz).date;
  const from = zonedToInstant(day, 0, viewerTz);
  const to = zonedToInstant(addDays(day, 1), 0, viewerTz);
  return (nowMs - from) / (to - from);
}

/** Days between the viewer's today and the day of an instant (0 = today, 1 = tomorrow). */
export function dayOffset(nowMs: number, atMs: number, viewerTz: string) {
  const a = wallClock(nowMs, viewerTz).date;
  const b = wallClock(atMs, viewerTz).date;
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Holiday on the viewer's (or Ottawa's) today, if any. */
export function holidayToday(nowMs: number, viewerTz: string, holidays: Holiday[]) {
  const tz = isCanadianZone(viewerTz) ? viewerTz : OTTAWA;
  const d = wallClock(nowMs, tz).date;
  return holidays.find((x) => x.date === d);
}

/* ------------------------------------------------------------------ formatting (locale-aware, isomorphic) */

/** "5 a.m." / "5:30 p.m." / "noon" (en-CA) · "5 h" / "17 h 30" / "midi" (fr-CA, Canada.ca style). */
export function formatTime(ms: number, tz: string, intl: string) {
  const w = wallClock(ms, tz);
  const hh = Math.floor(w.minutes / 60);
  const mm = w.minutes % 60;
  // Canada.ca style: "noon" and "midnight" ("midi", "minuit"), never "12 p.m." or "12 a.m.".
  if (w.minutes === 0 || w.minutes === 720) {
    if (intl.startsWith('fr')) return w.minutes ? 'midi' : 'minuit';
    if (intl.startsWith('en')) return w.minutes ? 'noon' : 'midnight';
  }
  // Non-breaking spaces keep "8:30 a.m." / "16 h 30" on one line.
  if (intl.startsWith('fr')) return mm ? `${hh}\u00a0h\u00a0${String(mm).padStart(2, '0')}` : `${hh}\u00a0h`;
  return new Intl.DateTimeFormat(intl, { timeZone: tz, hour: 'numeric', ...(mm ? { minute: '2-digit' } : {}) }).format(new Date(ms)).replace(/\s/g, '\u00a0');
}

/** "Mon–Fri" / "lun.–ven." / "Every day" handled by the caller. */
export function formatDays(days: Weekday[], intl: string) {
  const name = (d: Weekday) => new Intl.DateTimeFormat(intl, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + d)));
  const sorted = [...days].sort();
  const contiguous = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (contiguous && sorted.length > 2) return `${name(sorted[0])}–${name(sorted[sorted.length - 1])}`;
  return sorted.map(name).join(', ');
}

/** Full weekday name of an instant in a zone ("Thursday" / "jeudi"). */
export function formatWeekday(ms: number, tz: string, intl: string) {
  return new Intl.DateTimeFormat(intl, { weekday: 'long', timeZone: tz }).format(new Date(ms));
}

/** French names for zone cities that differ from the IANA (English) spelling. */
const CITY_FR: Record<string, string> = {
  London: 'Londres', Lisbon: 'Lisbonne', Brussels: 'Bruxelles', Vienna: 'Vienne', Athens: 'Athènes', Copenhagen: 'Copenhague',
  Warsaw: 'Varsovie', Moscow: 'Moscou', Bucharest: 'Bucarest', Kyiv: 'Kyiv', Kiev: 'Kyiv', Belgrade: 'Belgrade', Istanbul: 'Istanbul',
  Mexico_City: 'Mexico', Havana: 'La Havane', Sao_Paulo: 'São Paulo', Bogota: 'Bogota', Lima: 'Lima', New_York: 'New York',
  Los_Angeles: 'Los Angeles', Chicago: 'Chicago', Denver: 'Denver', Phoenix: 'Phoenix', Port_au_Prince: 'Port-au-Prince',
  Cairo: 'Le Caire', Algiers: 'Alger', Casablanca: 'Casablanca', Tunis: 'Tunis', Johannesburg: 'Johannesburg', Lagos: 'Lagos',
  Dubai: 'Dubaï', Tehran: 'Téhéran', Beirut: 'Beyrouth', Jerusalem: 'Jérusalem', Riyadh: 'Riyad', Karachi: 'Karachi',
  Kolkata: 'Calcutta', Calcutta: 'Calcutta', Dhaka: 'Dacca', Singapore: 'Singapour', Manila: 'Manille', Seoul: 'Séoul',
  Ho_Chi_Minh: 'Hô-Chi-Minh-Ville', Saigon: 'Hô-Chi-Minh-Ville', Hong_Kong: 'Hong Kong', Shanghai: 'Shanghai', Taipei: 'Taipei',
  Tokyo: 'Tokyo', Sydney: 'Sydney', Auckland: 'Auckland', Honolulu: 'Honolulu', St_Johns: 'St. John’s', Montreal: 'Montréal',
};

/** City-ish label of a zone in the answer's language: "Vancouver", "St. John’s", "Londres". */
export function zoneCity(tz: string, lang: 'en' | 'fr' = 'en') {
  const last = tz.split('/').pop() ?? tz;
  if (lang === 'fr' && CITY_FR[last]) return CITY_FR[last];
  if (last === 'St_Johns') return 'St. John’s';
  if (last === 'Montreal') return 'Montréal';
  return last.replace(/_/g, ' ');
}
