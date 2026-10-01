/**
 * Key dates: pure selectors over a tool output, shared by the widgets (instant filtering on the device), the builders
 * and the scenarios. No fallback tables and no parsers in here: everything works on the data the tool returned.
 * All dates are ISO `YYYY-MM-DD` calendar dates (no time zones). The shapes are in ./types.ts, name grammar in ./names.ts.
 */
import { addDays, diffDays, isWeekend } from '@/lib/dates/business-days';
import { CGEB_START, CORE_PROGRAMS, PROVINCIAL_PROGRAM, isChoiceIn, type HolidayItem, type Program, type Province } from './data';
import { GOVERNMENT_SCHEDULES } from './sources';
import type { CalEvent, CalendarOutput } from './types';

const yearOf = (iso: string) => Number(iso.slice(0, 4));

/** A notice's text as whole sentences (the official wording, split for reading, never rewritten). */
export const sentencesOf = (text: string) => text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((x) => x.trim()).filter(Boolean) ?? [];

/* ------------------------------------------------------------------ holidays */

export const dayOff = (h: HolidayItem) => h.observed ?? h.date;

/**
 * A Canada Labour Code holiday as federally regulated employees get it. The feed's observed day (Boxing Day 2026:
 * Monday, Dec 28) is the federal public service's practice; the Code says that when New Year's Day, Canada Day, the
 * National Day for Truth and Reconciliation, Remembrance Day, Christmas Day or Boxing Day "fall on a Saturday or Sunday
 * that is not a scheduled work day, you are entitled to a holiday with pay on the scheduled work day immediately
 * before or after" (vacations-holidays.html [2025-12-12]); the CRA lists "Boxing Day – Saturday, December 26, 2026".
 * So the federal view keeps the calendar date and flags the rule. Cached, so the same holiday is the same object.
 */
const CLC_VIEW = new WeakMap<HolidayItem, HolidayItem>();
export function clcView(h: HolidayItem): HolidayItem {
  if (!h.clc || !h.observed || !isWeekend(h.date)) return h;
  let v = CLC_VIEW.get(h);
  if (!v) {
    v = { ...h, clcWeekend: true };
    delete v.observed;
    CLC_VIEW.set(h, v);
  }
  return v;
}

/**
 * A holiday as a province's list shows it. When it falls on a Saturday or Sunday, the feed's observed Monday (Boxing
 * Day 2026: Dec 28) is the federal public service's day off, not a provincial rule: Ontario gives "a substitute holiday
 * off with public holiday pay" or holiday pay by written agreement, and other provinces differ. So the province view
 * keeps the calendar date and names that Monday only as a common substitute (`substitute`). Weekday moves (N.L.'s
 * holidays observed on the nearest Monday) are the province's own schedule and stay as they are. Cached like `clcView`.
 */
const PROV_VIEW = new WeakMap<HolidayItem, HolidayItem>();
export function provView(h: HolidayItem): HolidayItem {
  if (!h.observed || !isWeekend(h.date)) return h;
  let v = PROV_VIEW.get(h);
  if (!v) {
    v = { ...h, substitute: h.observed };
    delete v.observed;
    PROV_VIEW.set(h, v);
  }
  return v;
}

/**
 * One holiday as the answer to "is it a holiday here?": the province's view, or without a province the federal one.
 * A provincial government's own day that isn't statutory there (N.L.) follows that government's schedule: with one
 * published for the year, its day off is the schedule's (the feed's observed day, checked against it in the tests);
 * without one, the feed's observed day is unpublished, so it's dropped and the answer says the schedule isn't out
 * (`unscheduled`), as the year's list does by showing these days undated.
 */
export function askedView(h: HolidayItem, province: Province | null): HolidayItem & { unscheduled?: true } {
  if (!province) return clcView(h);
  if (h.provinces.includes(province) || !h.government?.includes(province)) return provView(h);
  if (GOVERNMENT_SCHEDULES[province]?.[yearOf(h.date)]) return h;
  const v: HolidayItem & { unscheduled?: true } = { ...h, unscheduled: true };
  delete v.observed;
  return v;
}

/**
 * Statutory holidays for a province, or without one the 10 Canada Labour Code general holidays.
 * `federalOnly`: CLC holidays the province doesn't observe (federally regulated workplaces still do); a CLC holiday
 * on the date of one of the province's own (Canada Day and N.L.'s Memorial Day, July 1) isn't listed again.
 * `publicService`: federal public-service days that aren't CLC holidays (Easter Monday, Civic Holiday) and that
 * the province doesn't observe.
 * `government`: days the province's own government gives its employees that aren't statutory there (N.L.).
 */
export function holidaysFor(all: HolidayItem[], province: Province | null, year?: number) {
  const inYear = (h: HolidayItem) => year == null || yearOf(h.date) === year;
  const here = (h: HolidayItem) => (province ? h.provinces.includes(province) : h.clc);
  const stat = all.filter((h) => inYear(h) && here(h)).map((h) => (province ? provView(h) : clcView(h)));
  const dates = new Set(stat.map((h) => h.date));
  const federalOnly = province ? all.filter((h) => inYear(h) && h.clc && !here(h) && !dates.has(h.date)) : [];
  const publicService = all.filter((h) => inYear(h) && h.federal && !h.clc && !here(h));
  const government = province ? all.filter((h) => inYear(h) && h.government?.includes(province)) : [];
  const byDay = (a: HolidayItem, b: HolidayItem) => dayOff(a).localeCompare(dayOff(b));
  return { stat: stat.sort(byDay), federalOnly: federalOnly.sort(byDay), publicService: publicService.sort(byDay), government: government.sort(byDay) };
}

/** The run of days off around a holiday (weekends + other holidays), e.g. Sat–Mon for a Monday holiday. */
export function longWeekend(day: string, offDays: Set<string>) {
  const off = (d: string) => isWeekend(d) || offDays.has(d);
  let start = day;
  let end = day;
  while (off(addDays(start, -1))) start = addDays(start, -1);
  while (off(addDays(end, 1))) end = addDays(end, 1);
  const days = diffDays(start, end) + 1;
  return days >= 3 ? { start, end, days } : null;
}

export function nextHoliday(all: HolidayItem[], province: Province | null, today: string) {
  const { stat } = holidaysFor(all, province);
  return stat.find((h) => dayOff(h) >= today) ?? null;
}

/** The next holiday after today (never today's) that makes a weekend of 3 days or more. */
export function nextLongWeekend(all: HolidayItem[], province: Province | null, today: string) {
  const off = offDaysFor(all, province);
  for (const h of holidaysFor(all, province).stat) {
    if (dayOff(h) <= today) continue;
    const lw = longWeekend(dayOff(h), off);
    if (lw && lw.start > today) return { holiday: h, ...lw };
  }
  return null;
}

export function offDaysFor(all: HolidayItem[], province: Province | null) {
  return new Set(holidaysFor(all, province).stat.map(dayOff));
}

/* ------------------------------------------------------------------ calendar */

const DEFAULT_PROGRAMS: Program[] = ['ccb', 'cgeb', 'oas', 'cpp', 'cwb', 'cdb'];

/**
 * Programs followed when nobody chose any: the main federal ones plus the province's own. In Quebec the CPP starts
 * off: people who worked only in Quebec (or live there after working elsewhere too) get the Quebec Pension Plan from
 * Retraite Québec instead (CPP eligibility page, see data.ts); the chip is still one tap away.
 */
export function defaultPrograms(province: Province | null): Program[] {
  const base = province === 'QC' ? DEFAULT_PROGRAMS.filter((p) => p !== 'cpp') : DEFAULT_PROGRAMS;
  const extra = province ? PROVINCIAL_PROGRAM[province] : undefined;
  return extra ? [...base, extra] : base;
}

export function programsFor(province: Province | null): Program[] {
  const extra = province ? PROVINCIAL_PROGRAM[province] : undefined;
  return extra ? [...CORE_PROGRAMS, extra] : CORE_PROGRAMS;
}

/**
 * The month the calendar opens on: the month asked for, never one already over, and when nothing is left this
 * month (e.g. on the 30th) the month of the next date instead.
 */
export function openingMonth(o: Pick<CalendarOutput, 'month' | 'pinToday'>, today: string, upcoming: CalEvent[]): string {
  const now = today.slice(0, 7);
  const start = o.month < now && !o.pinToday ? now : o.month;
  if (start === now && upcoming.length && !upcoming.some((e) => e.date.startsWith(start))) return upcoming[0].date.slice(0, 7);
  return start;
}

/** Everything on the calendar for a selection, soonest first. */
export function buildEvents(
  o: Pick<CalendarOutput, 'payments' | 'taxes' | 'holidays'>,
  sel: { programs: Program[]; province: Province | null; taxes: boolean; holidays: boolean },
): CalEvent[] {
  const ev: CalEvent[] = [];
  for (const p of sel.programs) {
    for (const date of o.payments[p] ?? []) {
      ev.push({ id: `${p}-${date}`, date, kind: 'payment', program: p, gst: p === 'cgeb' && date < CGEB_START ? true : undefined });
    }
  }
  if (sel.taxes) {
    for (const t of o.taxes) ev.push({ id: `tax-${t.kind}-${t.date}`, date: t.date, kind: 'tax', tax: t.kind, taxYear: t.year, onTimeBy: t.onTimeBy, expected: t.expected });
  }
  if (sel.holidays) {
    const { stat } = holidaysFor(o.holidays, sel.province);
    for (const h of stat) {
      const choice = h.choice && isChoiceIn(h, sel.province) ? h.choice : null;
      ev.push({
        id: `hol-${h.date}-${h.name.en}`,
        date: dayOff(h),
        kind: 'holiday',
        holiday: { name: choice ? choice.name : h.name, date: h.date, federal: h.federal, clc: h.clc, statutory: !!sel.province, choice: choice ? true : undefined, clcWeekend: h.clcWeekend, substitute: h.substitute },
      });
    }
  }
  const order = { holiday: 0, tax: 1, payment: 2 };
  return ev.sort((a, b) => a.date.localeCompare(b.date) || order[a.kind] - order[b.kind]);
}

/* ------------------------------------------------------------------ holidays tool */

/**
 * The next date for each thing followed (program, deadlines, holidays), for the "next for each" tiles. The hero's own
 * dates get no tile: a hero payment stands for its program's next date; a hero holiday or deadline doesn't stand for
 * the next one (Boxing Day in the hero, New Year's Day still gets a tile). `eachDeadline`: a taxes-only calendar
 * shows the next date of every deadline; otherwise just the next deadline, to keep the tiles short.
 */
export function nextForEach(upcoming: CalEvent[], hero: CalEvent[], eachDeadline: boolean): CalEvent[] {
  const out: CalEvent[] = [];
  const seen = new Set<string>();
  for (const e of upcoming) {
    const k = e.kind === 'payment' ? `p-${e.program}` : e.kind === 'tax' && eachDeadline ? `t-${e.tax}` : e.kind;
    if (hero.some((h) => h.id === e.id)) {
      if (e.kind === 'payment') seen.add(k);
      continue;
    }
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}
