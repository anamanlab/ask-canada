/**
 * "Tomorrow" and "this weekend" in a 7-day forecast (pure, isomorphic, unit-tested in geocode.test.mjs):
 * which rows of `days` a question is about, and whether rain or snow is in them. Environment Canada names
 * the first row "Today" or "Tonight" and every later one by its weekday, so rows are found by weekday name
 * in the place's own time zone.
 */
import type { Lang } from './data';
import type { Day, Period, Sky } from './types';

const weekdayName = (ms: number, lang: Lang) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', timeZone: 'UTC' }).format(new Date(ms)).toLowerCase();

/** Local calendar date of an instant in a zone, as a UTC-midnight timestamp (safe to add whole days to). */
function localDate(iso: string, tz: string) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const DAY_MS = 86_400_000;

/** The rows a "tomorrow" or "this weekend" question is about (empty when the forecast doesn't reach them). */
export function outlookDays(days: Day[], when: 'tomorrow' | 'weekend', now: string, tz: string, lang: Lang): Day[] {
  const today = localDate(now, tz);
  // A later row by its weekday name ("Saturday", "samedi"); the first row is today whatever it is called.
  const row = (offset: number) => (offset === 0 ? days[0] : days.slice(1).find((d) => d.label.toLowerCase().startsWith(weekdayName(today + offset * DAY_MS, lang))));
  if (when === 'tomorrow') return [row(1)].filter((d) => d != null);
  const dow = new Date(today).getUTCDay();
  // On Sunday the weekend is today; on Saturday, today and tomorrow; otherwise the coming Saturday and Sunday.
  const offsets = dow === 0 ? [0] : dow === 6 ? [0, 1] : [6 - dow, 7 - dow];
  return offsets.map(row).filter((d) => d != null);
}

const RAIN: Sky[] = ['drizzle', 'showers', 'rain', 'freezing', 'mixed', 'thunder', 'hail'];
const SNOW: Sky[] = ['flurries', 'snow', 'blowing-snow', 'mixed'];

export type Precip = {
  /** The periods with that kind of precipitation, in order. */
  periods: Period[];
  /** Highest chance among them; null when any of them is forecast without a percentage (it is expected). */
  chance: number | null;
};

/** Rain (or snow) in the given rows: which periods, and the chance Environment Canada gives. */
export function precipIn(days: Day[], kind: 'rain' | 'snow'): Precip | null {
  const family = kind === 'rain' ? RAIN : SNOW;
  const periods = days.flatMap((d) => [d.day, d.night]).filter((p): p is Period => p != null && family.includes(p.sky));
  if (!periods.length) return null;
  return { periods, chance: periods.some((p) => p.pop == null) ? null : Math.max(...periods.map((p) => p.pop ?? 0)) };
}
