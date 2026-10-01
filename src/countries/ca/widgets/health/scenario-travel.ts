/**
 * Reading a travel question for the scripted health answers (pure, server only): the departure date ("I leave
 * December 20", « le 20 décembre », "2026-12-20"), resolved to its next occurrence in the person's time zone.
 * The destination is found by the tool itself, against travel.gc.ca's own list (./travel-parse.ts).
 */
import type { Ctx } from './scenario-queries';

const MONTHS: [RegExp, number][] = [
  [/^(jan(uary)?|janv(ier)?)$/, 1],
  [/^(feb(ruary)?|f[ée]v(r(ier)?)?)$/, 2],
  [/^(mar(ch)?|mars)$/, 3],
  [/^(apr(il)?|avr(il)?)$/, 4],
  [/^(may|mai)$/, 5],
  [/^(june?|juin)$/, 6],
  [/^(july?|juil(let)?)$/, 7],
  [/^(aug(ust)?|ao[uû]t)$/, 8],
  [/^(sep(t(ember)?)?|sept(embre)?)$/, 9],
  [/^(oct(ober|obre)?)$/, 10],
  [/^(nov(ember|embre)?)$/, 11],
  [/^(dec(ember)?|d[ée]c(embre)?)$/, 12],
];
const MONTH = '(jan(?:uary|v(?:ier)?)?|feb(?:ruary)?|f[ée]v(?:r(?:ier)?)?|mar(?:ch|s)?|apr(?:il)?|avr(?:il)?|may|mai|june?|juin|july?|juil(?:let)?|aug(?:ust)?|ao[uû]t|sep(?:t(?:ember|embre)?)?|oct(?:ober|obre)?|nov(?:ember|embre)?|dec(?:ember)?|d[ée]c(?:embre)?)';
const DAY = '(\\d{1,2})(?:st|nd|rd|th|er|e)?';
const YEAR = '(?:,?\\s+(20\\d{2}))?';
/** "December 20", "Dec. 20th, 2026" */
const MONTH_DAY = new RegExp(`(?<![\\p{L}\\d])${MONTH}\\.?\\s+(?:the\\s+)?${DAY}(?![\\d:])${YEAR}`, 'iu');
/** "20 December", "the 20th of December", « le 20 décembre », « 1er mars 2027 » */
const DAY_MONTH = new RegExp(`(?<![\\p{L}\\d])${DAY}\\s+(?:of\\s+|de\\s+)?${MONTH}\\.?(?![\\p{L}])${YEAR}`, 'iu');
const ISO = /\b(20\d{2})-(\d{2})-(\d{2})\b/;

const pad = (n: number) => String(n).padStart(2, '0');
const real = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** Today (YYYY-MM-DD) where the person is; Eastern time when the browser didn't say. */
export function todayIn(timeZone: string | undefined, now = new Date()): string {
  const fmt = (tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  try {
    return fmt(timeZone || 'America/Toronto');
  } catch {
    return fmt('America/Toronto');
  }
}

/** The date named in a question and the words that named it; a date without a year is its next occurrence from `today`. */
export function tripDateOf(text: string, today: string): { date: string; phrase: string } | null {
  const iso = text.match(ISO);
  if (iso && real(Number(iso[1]), Number(iso[2]), Number(iso[3]))) return { date: iso[0], phrase: iso[0] };
  const md = text.match(MONTH_DAY);
  const dm = md ? null : text.match(DAY_MONTH);
  const m = md ?? dm;
  if (!m) return null;
  const [monthWord, dayWord, yearWord] = md ? [m[1], m[2], m[3]] : [m[2], m[1], m[3]];
  const month = MONTHS.find(([re]) => re.test(monthWord.toLowerCase()))?.[1];
  const day = Number(dayWord);
  if (!month || day < 1 || day > 31) return null;
  const thisYear = Number(today.slice(0, 4));
  for (const y of yearWord ? [Number(yearWord)] : [thisYear, thisYear + 1]) {
    const date = `${y}-${pad(month)}-${pad(day)}`;
    if (real(y, month, day) && (yearWord || date >= today)) return { date, phrase: m[0] };
  }
  return null;
}

/**
 * Input of the `healthTravel` call: the question as the destination text (the tool finds the place in it, and
 * shows every notice when it names none) without the date words, and the departure date when one is given.
 */
export function travelInputOf({ text, lang, timeZone }: Ctx, now = new Date()) {
  const trip = tripDateOf(text, todayIn(timeZone, now));
  const where = (trip ? text.replace(trip.phrase, ' ') : text).replace(/\s+/g, ' ').trim().slice(0, 200);
  return { destination: where || undefined, travelDate: trip?.date, lang };
}
