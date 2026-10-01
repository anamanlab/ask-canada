/**
 * Deadlines for the return being prepared, with the CRA weekend/holiday rollover rule.
 * Pure and isomorphic (tools on the server, widgets on the device). Every constant comes from ../data.ts, where
 * each one is traced to its canada.ca page.
 */
import { FEDERAL_HOLIDAYS } from '../../../data/holidays';
import { addDays, diffDays, isWeekend } from '@/lib/dates/business-days';
import { PENALTY, type Lang } from '../data';

export type DeadlineKind = 'instalment' | 'fhsa' | 'rrsp' | 'file' | 'selfEmployed';
export type Deadline = {
  kind: DeadlineKind;
  /** Statutory date. */
  date: string;
  /** Date that counts as on time (next business day when the statutory date is a weekend or holiday). */
  onTimeBy: string;
  rolled: boolean;
  daysLeft: number;
  past: boolean;
};

export type DeadlinesOutput = {
  today: string;
  /** Tax year of the return being filed (e.g. 2026, filed in 2027). */
  taxYear: number;
  filingYear: number;
  selfEmployed: boolean;
  deadlines: Deadline[];
  next: DeadlineKind | null;
  /** The main date: April 30 (or June 15 when self-employed). */
  main: Deadline;
  /** Days from last year's main date to this one (for the progress ring). */
  seasonSpan: number;
  penalty: typeof PENALTY;
  lang: Lang;
};

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const isHoliday = (d: string) => FEDERAL_HOLIDAYS.some((h) => h.date === d);

/** The CRA rollover rule: weekend or public holiday → the next business day is on time. */
export function onTime(date: string) {
  let d = date;
  while (isWeekend(d) || isHoliday(d)) d = addDays(d, 1);
  return d;
}

/** The return currently being prepared: until June 15 of year Y it's the Y-1 return; afterwards Y's. */
function currentTaxYear(today: string) {
  const y = Number(today.slice(0, 4));
  return today <= iso(y, 6, 15) ? y - 1 : y;
}

/** Payment due date and RRSP deadline for a tax year's return, each already rolled to an on-time business day. */
export function returnDates(taxYear: number) {
  const fy = taxYear + 1;
  return { payDue: onTime(iso(fy, 4, 30)), rrsp: onTime(addDays(iso(fy, 1, 1), 59)) };
}

export function planDeadlines({ today, selfEmployed = false, lang = 'en' }: { today: string; selfEmployed?: boolean; lang?: Lang }): DeadlinesOutput {
  const taxYear = currentTaxYear(today);
  const fy = taxYear + 1;
  // The rollover covers filing and payment dates (and the RRSP date the CRA publishes), not a calendar-year limit.
  const mk = (kind: DeadlineKind, date: string, rolls = true): Deadline => {
    const ot = rolls ? onTime(date) : date;
    return { kind, date, onTimeBy: ot, rolled: ot !== date, daysLeft: diffDays(today, ot), past: ot < today };
  };
  // RRSP: contributions in the first 60 days of the next year count for this return.
  const rrsp = addDays(iso(fy, 1, 1), 59);
  const all: Deadline[] = [
    mk('instalment', iso(taxYear, 12, 15)),
    mk('fhsa', iso(taxYear, 12, 31), false),
    mk('rrsp', rrsp),
    mk('file', iso(fy, 4, 30)),
    mk('selfEmployed', iso(fy, 6, 15)),
  ];
  const deadlines = all.filter((d) => (selfEmployed ? true : d.kind !== 'selfEmployed'));
  const main = deadlines.find((d) => d.kind === (selfEmployed ? 'selfEmployed' : 'file'))!;
  // The instalment date only applies to people the CRA asked to pay by instalments: never flag it as "next".
  const next = deadlines.find((d) => !d.past && d.kind !== 'instalment')?.kind ?? null;
  return {
    today,
    taxYear,
    filingYear: fy,
    selfEmployed,
    deadlines,
    next,
    main,
    seasonSpan: diffDays(onTime(iso(taxYear, Number(main.date.slice(5, 7)), Number(main.date.slice(8, 10)))), main.onTimeBy),
    penalty: PENALTY,
    lang,
  };
}
