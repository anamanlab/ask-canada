/**
 * Parsers for the live feeds (server only): the benefits calendar and CRA alert markup on canada.ca, and the
 * canada-holidays.ca JSON, validated with zod at the boundary. Pure functions of the response body.
 */
import 'server-only';
import { z } from 'zod';
import { isProvince, type HolidayItem, type Lang, type Program } from './data';
import { CALENDAR_IDS, isClcHoliday, withRules } from './fallback';
import { sentencesOf } from './select';
import type { LiveNotice } from './types';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const textToISO = (text: string): string | null => {
  const m = text.replace(/&nbsp;| /g, ' ').match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1].toLowerCase());
  if (mo < 0) return null;
  return `${m[3]}-${String(mo + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
};

/** Every date listed per program on the English benefits calendar page (all years it shows). */
export function parseBenefitsCalendar(html: string): Partial<Record<Program, string[]>> {
  const out: Partial<Record<Program, string[]>> = {};
  const clean = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of clean.matchAll(/<details[^>]*\bid="([a-z]+)-(\d{4})"[^>]*>([\s\S]*?)<\/details>/g)) {
    const program = CALENDAR_IDS[m[1]];
    if (!program) continue;
    for (const li of m[3].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const iso = textToISO(li[1].replace(/<[^>]+>/g, ' '));
      if (iso) (out[program] ??= []).push(iso);
    }
  }
  for (const k of Object.keys(out) as Program[]) out[k] = [...new Set(out[k])].sort();
  return out;
}

/** Info/warning alerts shown on a canada.ca page (commented-out alerts are ignored). */
export function parseAlerts(html: string, url: string, lang?: Lang): LiveNotice[] {
  const clean = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  const main = clean.match(/<main[\s\S]*?<\/main>/)?.[0] ?? clean;
  const out: LiveNotice[] = [];
  const strip = (s: string) =>
    s
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;|&rsquo;/g, '’')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  for (const m of main.matchAll(/<(section|div)[^>]*class="[^"]*\balert alert-(info|warning)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)) {
    const title = strip(m[3].match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/)?.[1] ?? '');
    // Every paragraph: the reassurance ("Payments by direct deposit will be issued as scheduled.") is often the last.
    const paras = [...m[3].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((p) => strip(p[1])).filter(Boolean);
    const body = clipSentences(paras.join(' '), 500);
    if (title && title.length < 160) out.push({ tone: m[2] === 'warning' ? 'warn' : 'info', title, body: body || undefined, url, lang });
    if (out.length >= 2) break;
  }
  return out;
}

/** Whole sentences up to `max` characters (never cuts a sentence; a single long first sentence is kept whole). */
function clipSentences(text: string, max: number): string {
  let out = '';
  for (const x of sentencesOf(text)) {
    const next = out ? `${out} ${x}` : x;
    if (out && next.length > max) break;
    out = next;
  }
  return out;
}

/** canada-holidays.ca `/api/v1/holidays?year=YYYY`: the fields the tools read (anything else is ignored). */
export const HolidaysFeed = z.object({
  holidays: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      observedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
      nameEn: z.string().min(1),
      nameFr: z.string().nullish(),
      federal: z.union([z.number(), z.boolean()]),
      provinces: z.array(z.object({ id: z.string() })).nullish(),
    }),
  ),
});

/**
 * The feed as holidays, with the rules the API doesn't carry (`withRules`: official names, Quebec's Good Friday or
 * Easter Monday, Newfoundland and Labrador's six statutory holidays). Provincial source links come from the verified
 * `PROVINCE_SOURCES` (EN + FR), not from the feed.
 */
export function toHolidays(feed: z.output<typeof HolidaysFeed>): HolidayItem[] {
  return withRules(
    feed.holidays.map((h) => {
      const provinces = (h.provinces ?? []).map((p) => p.id).filter(isProvince);
      const federal = Boolean(h.federal);
      const item: HolidayItem = { date: h.date, name: { en: h.nameEn, fr: h.nameFr || h.nameEn }, federal, clc: isClcHoliday(h.nameEn, federal), provinces };
      if (h.observedDate && h.observedDate !== h.date) item.observed = h.observedDate;
      return item;
    }),
  );
}
