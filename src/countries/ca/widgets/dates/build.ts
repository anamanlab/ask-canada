/**
 * Key dates: builds the tool outputs (isomorphic and pure: used by the tools, the scenarios and the lab fixtures).
 * Live feeds are merged over the verified fallback in ./fallback.ts; the widgets only ever see the output.
 */
import { addDays, diffDays, isWeekend } from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { PROGRAMS, URLS, calendarSources, holidaySources, isChoiceIn, isProvince, type HolidayItem, type Lang, type Program, type Province } from './data';
import { CRA_HOLIDAYS_2026, GST_NAME, HOLIDAYS_FALLBACK, PAYMENTS_FALLBACK, PROGRAM_NAMES, TAX_DEADLINES, TAX_NAMES } from './fallback';
import { askedView, buildEvents, dayOff, defaultPrograms, holidaysFor, longWeekend, nextLongWeekend, offDaysFor, programsFor } from './select';
import { holidayName } from './names';
import type { CalEvent, CalendarFeeds, CalendarInput, CalendarOutput, Focus, HolidaysInput, HolidaysOutput, TaxDate } from './types';

const yearOf = (iso: string) => Number(iso.slice(0, 4));

/* ------------------------------------------------------------------ taxes */

const CRA_HOLIDAYS = new Set([...CRA_HOLIDAYS_2026, ...FEDERAL_HOLIDAYS.filter((h) => h.date >= '2027-01-01').map((h) => h.date)]);

/** CRA rollover rule: a due date on a weekend or CRA public holiday is on time the next business day. */
export function onTimeBy(date: string): string | undefined {
  let d = date;
  while (isWeekend(d) || CRA_HOLIDAYS.has(d)) d = addDays(d, 1);
  return d === date ? undefined : d;
}

export const taxDates = (): TaxDate[] => TAX_DEADLINES.map((t) => ({ ...t, onTimeBy: onTimeBy(t.date) }));

/* ------------------------------------------------------------------ payments */

/** Live data merged over the verified fallback, program by program (a program missing live keeps its fallback). */
export function mergePayments(live: Partial<Record<Program, string[]>> | null): Record<Program, string[]> {
  const out = { ...PAYMENTS_FALLBACK };
  if (!live) return out;
  for (const p of PROGRAMS) {
    const dates = live[p];
    if (dates?.length) out[p] = dates;
  }
  return out;
}

/* ------------------------------------------------------------------ lookups */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/\bst\.?\s/g, 'saint ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Find a holiday by (part of) its English or French name, the next occurrence on/after `today` first. With a
 * province, a holiday that's statutory there wins ("Canada Day" in N.L. is its Memorial Day (Canada Day)).
 */
export function findHoliday(all: HolidayItem[], query: string, today: string, province: Province | null = null): HolidayItem | null {
  const q = norm(query);
  if (!q) return null;
  const hits = all.filter((h) => {
    const en = norm(h.name.en);
    const fr = norm(h.name.fr);
    return en.includes(q) || fr.includes(q) || q.includes(en) || q.includes(fr);
  });
  if (!hits.length) return null;
  const local = province ? hits.filter((h) => h.provinces.includes(province)) : [];
  const pool = local.length ? local : hits;
  return pool.find((h) => dayOff(h) >= today) ?? pool[pool.length - 1];
}

/** Only unambiguous zones (America/Toronto covers Ontario and Quebec, America/Halifax three provinces). */
const ZONE_PROVINCE: Record<string, Province> = {
  'America/Vancouver': 'BC',
  'America/Edmonton': 'AB',
  'America/Winnipeg': 'MB',
  'America/Regina': 'SK',
  'America/Swift_Current': 'SK',
  'America/St_Johns': 'NL',
  'America/Whitehorse': 'YT',
  'America/Yellowknife': 'NT',
  'America/Iqaluit': 'NU',
  'America/Rankin_Inlet': 'NU',
  'America/Moncton': 'NB',
};
export const provinceFromZone = (tz?: string): Province | null => (tz ? (ZONE_PROVINCE[tz] ?? null) : null);

/* ------------------------------------------------------------------ calendar tool */

function eventName(e: CalEvent, lang: Lang): string {
  if (e.kind === 'payment' && e.program) return e.gst ? GST_NAME[lang] : PROGRAM_NAMES[e.program][lang];
  if (e.kind === 'tax' && e.tax) return TAX_NAMES[e.tax][lang];
  return e.holiday?.name[lang] ?? '';
}

export function buildCalendar(
  input: CalendarInput & { provinceGuessed?: boolean },
  today: string,
  feeds: CalendarFeeds = { payments: null, holidays: null },
): CalendarOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const province = input.province && isProvince(input.province) ? input.province : null;
  const focus: Focus = input.focus ?? 'all';
  const allowed = new Set<Program>([...programsFor(province), ...(input.programs ?? [])]);
  const asked = (input.programs ?? []).filter((p) => (PROGRAMS as readonly string[]).includes(p) && allowed.has(p));
  const programs = asked.length ? [...new Set(asked)] : focus === 'taxes' || focus === 'holidays' ? [] : defaultPrograms(province);
  const payments = mergePayments(feeds.payments);
  const holidays = feeds.holidays?.length ? feeds.holidays : HOLIDAYS_FALLBACK;
  const taxes = taxDates();
  const showTaxes = focus === 'all' || focus === 'taxes';
  const showHolidays = focus === 'all' || focus === 'holidays';
  const publishedThrough = Object.values(payments).flat().sort().at(-1) ?? today;
  const month = input.month && /^\d{4}-\d{2}$/.test(input.month) ? input.month : today.slice(0, 7);

  const events = buildEvents({ payments, taxes, holidays }, { programs, province, taxes: showTaxes, holidays: showHolidays });
  const upcoming = events
    .filter((e) => e.date >= today)
    .slice(0, 10)
    .map((e) => ({ date: e.date, what: eventName(e, lang), inDays: diffDays(today, e.date) }));

  return {
    version: 1,
    today,
    lang,
    province,
    provinceGuessed: Boolean(province && input.provinceGuessed),
    focus,
    programs,
    programsAsked: asked.length > 0,
    showTaxes,
    showHolidays,
    month,
    payments,
    paymentsLive: Boolean(feeds.payments && Object.keys(feeds.payments).length),
    publishedThrough,
    taxes,
    holidays,
    holidaysLive: Boolean(feeds.holidays?.length),
    notices: feeds.notices ?? [],
    upcoming,
    links: { signIn: URLS.signIn[lang], craSignIn: URLS.craSignIn[lang], calendar: URLS.calendar[lang], eiAfter: URLS.eiAfter[lang] },
    sources: calendarSources(lang, Boolean(feeds.payments && Object.keys(feeds.payments).length), focus === 'taxes'),
  };
}

/* ------------------------------------------------------------------ holidays tool */

export function buildHolidays(
  input: HolidaysInput & { provinceGuessed?: boolean },
  today: string,
  feed: { holidays: HolidayItem[] | null } = { holidays: null },
): HolidaysOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const province = input.province && isProvince(input.province) ? input.province : null;
  const live = Boolean(feed.holidays?.length);
  const holidays = feed.holidays?.length ? feed.holidays : HOLIDAYS_FALLBACK;
  const years = [...new Set(holidays.map((h) => yearOf(h.date)))].sort();
  const thisYear = yearOf(today);
  // After the year's last holiday, default to next year.
  const lastThisYear = holidaysFor(holidays, province, thisYear).stat.at(-1);
  const fallbackYear = lastThisYear && dayOff(lastThisYear) < today && years.includes(thisYear + 1) ? thisYear + 1 : thisYear;
  const year = input.year && years.includes(input.year) ? input.year : years.includes(fallbackYear) ? fallbackYear : (years.at(-1) ?? thisYear);

  const hit = input.holiday ? findHoliday(holidays, input.holiday, today, province) : null;
  // Without a province the answer is the federal (Canada Labour Code) one; with one, the province's view.
  const found = hit ? askedView(hit, province) : null;
  const asked = found
    ? {
        name: found.name,
        date: found.date,
        observed: found.observed,
        clcWeekend: found.clcWeekend,
        substitute: found.substitute,
        unscheduled: found.unscheduled,
        floating: found.floating,
        statutory: province ? found.provinces.includes(province) : found.clc,
        choice: isChoiceIn(found, province),
        choiceProvinces: found.choice?.provinces ?? [],
        federal: found.federal,
        clc: found.clc,
        provinces: found.provinces,
        government: found.government ?? [],
      }
    : null;

  const { stat } = holidaysFor(holidays, province, year);
  const here = holidaysFor(holidays, province).stat;
  const todayHere = here.find((h) => dayOff(h) === today) ?? null;
  const nx = here.find((h) => dayOff(h) > today) ?? null;
  const nlw = nextLongWeekend(holidays, province, today);
  const off = offDaysFor(holidays, province);
  return {
    version: 1,
    today,
    lang,
    province,
    provinceGuessed: Boolean(province && input.provinceGuessed),
    year,
    years,
    holidays,
    live,
    longWeekendAsked: Boolean(input.longWeekend),
    asked,
    summary: {
      today: todayHere ? holidayName(todayHere, province, lang) : null,
      next: nx
        ? { name: holidayName(nx, province, lang), date: nx.date, dayOff: dayOff(nx), inDays: diffDays(today, dayOff(nx)), longWeekend: longWeekend(dayOff(nx), off) }
        : null,
      nextLongWeekend: nlw ? { name: holidayName(nlw.holiday, province, lang), start: nlw.start, end: nlw.end, days: nlw.days, inDays: diffDays(today, nlw.start) } : null,
      count: stat.length,
      list: stat.map((h) => ({ name: holidayName(h, province, lang), dayOff: dayOff(h) })),
    },
    links: { federal: URLS.federalHolidays[lang], cra: URLS.publicHolidays[lang] },
    sources: holidaySources(lang, province, live),
  };
}
