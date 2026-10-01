/**
 * Reading a passport question (EN + FR): the expiry month, the departure date ("in 10 days", "le 15 octobre"),
 * and whether the passport already expired. Pure; used by the scripted scenarios and their computed answers.
 */
import { addDays } from '@/lib/dates/business-days';
import { lastMonthOccurrence, nextMonthOccurrence } from '../plan';

export type L = 'en' | 'fr';
/** What a scenario is told about the question. `timeZone` is the reader's, so "today" is their date. */
export type Ctx = { text: string; lang: L; timeZone?: string };

export const MONTHS: [RegExp, number][] = [
  [/\b(january|jan|janvier)\b/i, 1],
  [/\b(february|feb|février|fevrier)\b/i, 2],
  [/\b(march|mars)\b/i, 3],
  [/\b(april|apr|avril)\b/i, 4],
  [/\b(may|mai)\b/i, 5],
  [/\b(june|juin)\b/i, 6],
  [/\b(july|juillet)\b/i, 7],
  [/\b(august|aug|août|aout)\b/i, 8],
  [/\b(september|sept|septembre)\b/i, 9],
  [/\b(october|oct|octobre)\b/i, 10],
  [/\b(november|nov|novembre)\b/i, 11],
  [/\b(december|dec|décembre|decembre)\b/i, 12],
];
/** Full month names, EN + FR, as a regex alternation. */
export const MONTH_ANY = 'january|february|march|april|may|june|july|august|september|october|november|december|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';
const MONTH_WORDS = `${MONTH_ANY}|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec`;
const ABBR: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const monthIn = (text: string) => MONTHS.find(([re]) => re.test(text))?.[1];
const monthNum = (w: string) => ABBR[w.toLowerCase()] ?? monthIn(w);

const NUM: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10,
};

/** Travel-date phrases: "tomorrow", "next week", "in 10 days", "in two weeks", "on October 15", "le 15 octobre". */
export const TRAVEL_DATE = new RegExp(
  [
    String.raw`\b(tomorrow|demain)\b`,
    String.raw`\b(next week|la semaine prochaine)\b`,
    String.raw`\b(?:in|dans)\s+(\d{1,2}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+(days?|weeks?|jours?|semaines?)\b`,
    String.raw`\b(${MONTH_WORDS})\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b`,
    String.raw`\b(\d{1,2})(?:er|st|nd|rd|th)?\s+(${MONTH_WORDS})\b`,
    String.raw`\b(20\d{2}-\d{2}-\d{2})\b`,
  ].join('|'),
  'i',
);
export const TRAVEL_WORDS = /(?<!\p{L})(travel\w*|trip|flight|fly\w*|plane|leav\w*|vacation|holiday|need (it|my passport)|voyag\w*|vol|avion|pars|partir|départ|besoin)(?!\p{L})/iu;

/**
 * The departure date in the person's words, as ISO (a past month/day means next year), plus the phrase.
 * `relative` phrases ("tomorrow", "in 10 days") count from today, so the date they mean depends on whose
 * today it is.
 */
export function travelDateFrom(text: string, today: string): { date: string; phrase: string; relative: boolean } | null {
  const m = text.match(TRAVEL_DATE);
  if (!m) return null;
  const [phrase, tomorrow, nextWeek, n, unit, mon1, day1, day2, mon2, iso] = m;
  const relative = !!(tomorrow || nextWeek || (n && unit));
  let date: string | null = null;
  if (tomorrow) date = addDays(today, 1);
  else if (nextWeek) date = addDays(today, 7);
  else if (n && unit) {
    const count = /^\d+$/.test(n) ? Number(n) : (NUM[n.toLowerCase()] ?? 1);
    date = addDays(today, /^(week|semaine)/i.test(unit) ? count * 7 : count);
  } else if ((mon1 && day1) || (mon2 && day2)) {
    const month = monthNum((mon1 ?? mon2).toLowerCase());
    const day = Number(day1 ?? day2);
    if (month && day >= 1 && day <= 31) {
      const y = Number(today.slice(0, 4));
      const md = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      date = `${`${y}-${md}` < today ? y + 1 : y}-${md}`;
    }
  } else if (iso) date = iso;
  return date ? { date, phrase, relative } : null;
}

/** "it expired in March", "a expiré en mars", "already expired": a month-only expiry in the past. */
// \b is ASCII-only in JS, so accented endings ("expiré") need Unicode-aware boundaries.
export const PAST = /(?<!\p{L})(expired|ran out|a expiré|a expire|est expiré|est expire|était expiré|déjà expiré|est échu)(?!\p{L})/iu;
const yearIn = (text: string) => text.match(/\b(20\d{2})\b/)?.[1];

/** The expiry the person described, as 'YYYY-MM' (explicit year > past tense > next occurrence). */
export function expiryFrom(text: string, today: string) {
  const month = monthIn(text) ?? 3;
  const year = yearIn(text);
  if (year) return `${year}-${String(month).padStart(2, '0')}`;
  return PAST.test(text) ? lastMonthOccurrence(month, today) : nextMonthOccurrence(month, today);
}

/** Planner input for a trip question: the departure date, plus the expiry month if they gave one. */
export function tripInput(text: string, lang: L, today: string) {
  const t = travelDateFrom(text, today);
  const rest = t ? text.replace(t.phrase, ' ') : text;
  const expiry = /(?<!\p{L})(expir\w*|échu|echu)/iu.test(rest) && monthIn(rest) ? expiryFrom(rest, today) : undefined;
  return { travelDate: t?.date, expiry, lang };
}
