/**
 * Live feeds for the key dates tools (server only: imported by tools/dates.ts and scenarios/dates.ts).
 * Each has a short timeout, Next.js caching and returns `null` (or no notices) on any failure, so callers fall back
 * to the verified data in ./fallback.ts. The browser never talks to these hosts.
 */
import 'server-only';
import { fetchJson, fetchText } from '@/lib/server/fetch-json';
import { URLS, type HolidayItem, type Lang, type Program } from './data';
import { HOLIDAYS_API } from './fallback';
import { HolidaysFeed, parseAlerts, parseBenefitsCalendar, toHolidays } from './parse';
import type { LiveNotice } from './types';
import { holidayProblems } from './verify';

/** Benefit payment dates from canada.ca's benefits calendar (6 h cache). */
export async function fetchPayments(signal?: AbortSignal): Promise<Partial<Record<Program, string[]>> | null> {
  const page = await fetchText(URLS.calendar.en, { revalidate: 21_600, timeout: 4000, signal });
  if (!page.ok) return null;
  const parsed = parseBenefitsCalendar(page.data);
  // Sanity check: the page layout changed if the monthly programs are missing.
  if (!parsed.ccb?.length || !parsed.cpp?.length || !parsed.oas?.length) return null;
  return parsed;
}

/**
 * Statutory holidays for the given years from canada-holidays.ca (24 h cache), validated against `HolidaysFeed` and
 * then against the verified counts per province (`holidayProblems`).
 */
export async function fetchHolidays(years: number[], signal?: AbortSignal): Promise<{ holidays: HolidayItem[] } | null> {
  const feeds = await Promise.all(years.map((y) => fetchJson(`${HOLIDAYS_API}?year=${y}`, HolidaysFeed, { revalidate: 86_400, timeout: 4000, signal })));
  const lists = feeds.map((f) => (f.ok ? toHolidays(f.data) : []));
  // A year that can't be read, is implausibly short, or doesn't match the official lists means the whole feed isn't
  // trusted: the tools then use the verified snapshot.
  if (lists.some((l, i) => l.length < 10 || holidayProblems(l, years[i]).length > 0)) return null;
  return { holidays: lists.flat() };
}

/** Alerts currently shown on the CRA payment-dates page (1 h cache). Empty when none or unreachable. */
async function fetchPaymentAlerts(lang: Lang, signal?: AbortSignal): Promise<LiveNotice[]> {
  const url = URLS.craPayDates[lang];
  const page = await fetchText(url, { revalidate: 3_600, timeout: 3500, signal });
  return page.ok ? parseAlerts(page.data, url, lang) : [];
}

/**
 * The alerts in English and French, so the widget shows the notice in the reader's language even when the
 * model didn't pass `lang` (the renderer picks by UI locale, then falls back to the other language).
 */
export async function fetchPaymentAlertsBoth(signal?: AbortSignal): Promise<LiveNotice[]> {
  const [en, fr] = await Promise.all([fetchPaymentAlerts('en', signal), fetchPaymentAlerts('fr', signal)]);
  return [...en, ...fr];
}
