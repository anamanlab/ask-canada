/**
 * Life-event checklists: the output shape and the small pure helpers the checklist renders with (message keys
 * and values, who's involved, the deadline the hero points at, the plain-text copy). Isomorphic and light: no
 * page table, no catalogs. The planner that builds a checklist is plan.ts (server, and on demand in the browser).
 */
import { addMonths } from '@/lib/dates/business-days';
import { formatCurrency, type MessageValues } from '@/lib/i18n/format';
import type { ToolSource } from '@/lib/widgets/types';
import { COUNTED_AGENCIES, FACTS, PHONES, type Agency, type Channel, type DateKind, type DueRule, type EventId, type Lang, type Phase, type Region, type Tone } from './facts';

export type ChecklistInput = {
  event?: EventId | null;
  /** Anchor date for the event (moving day, due date, last day of work, date of death…). */
  date?: string | null;
  /** Two-letter province or territory code. */
  region?: string | null;
  lang?: Lang;
  /**
   * Lab only (never in the tool schema): ticks and skips to show when nothing is saved on the device yet, and
   * `pinned` to keep the fixture on the day it was planned for instead of following the device's clock.
   */
  preview?: { done?: string[]; skipped?: string[]; pinned?: boolean };
};

export type Due = {
  rule: DueRule;
  date: string;
  /** 'by' = a deadline; 'from' = the earliest date something can start. */
  kind: 'by' | 'from';
  /** Days from today (negative = in the past). */
  days: number;
  passed: boolean;
  /** The calendar date before a weekend/holiday rollover, when one applied. */
  rolledFrom?: string;
};

export type PlanTask = {
  id: string;
  agency: Agency;
  phase: Phase;
  url: string;
  channels: Channel[];
  /** "Only if…" key (messages `cond.<key>`), or null when it applies to everyone. */
  cond: string | null;
  due: Due | null;
  /** Message key variant: 'auto' when a region makes it automatic, 'note' when a regional note is shown. */
  variant: 'auto' | 'note' | null;
  /** Plain-language text in `lang`, for the model (the widget renders from its own catalog). */
  title: string;
  detail: string;
  only?: string;
  dueText?: string;
};

export type Plan = {
  event: EventId;
  tone: Tone;
  dateKind: DateKind;
  hubUrl: string;
  tasks: PlanTask[];
  agencies: Agency[];
  /** The soonest meaningful deadline (drives the hero countdown). */
  keyDue: Due | null;
};

export type EventSummary = { id: EventId; steps: number; agencies: Agency[] };

export type ChecklistOutput = {
  version: 1;
  lang: Lang;
  today: string;
  event: EventId | null;
  date: string | null;
  region: Region | null;
  plan: Plan | null;
  events: EventSummary[];
  /** One-line summary for the model. */
  summary: string;
  sources: ToolSource[];
};

/**
 * How far ahead each event's date can be, in months. A death, a marriage or a change of status has happened
 * (a deadline counted from a date that hasn't come would be nonsense); a last day of work is known a notice
 * period ahead, a due date a pregnancy ahead, a move a couple of years ahead, and a CPP start at most ten
 * years ahead (60 to 70).
 */
const MONTHS_AHEAD: Record<EventId, number> = { moving: 24, baby: 10, marriage: 0, 'job-loss': 3, retiring: 120, death: 0 };

/**
 * The dates an event accepts, around today: the date field's min and max, so a slip of the finger (1900, 9999)
 * can't re-plan the list. A CPP start date is always ahead; everything else can be up to two years back.
 */
export const dateWindow = (event: EventId, today: string) => ({
  min: event === 'retiring' ? today : addMonths(today, -24),
  max: addMonths(today, MONTHS_AHEAD[event]),
});

/**
 * The date as given, unless it is further ahead than the event allows (see `dateWindow`): then no date at all.
 * Older dates are kept: a death three years ago still has its (missed) deadlines.
 */
export const acceptDate = (event: EventId | null, date: string | null | undefined, today: string) =>
  event && date && date <= dateWindow(event, today).max ? date : null;

/**
 * Canada.ca French writes the first of the month "1er" ("le 1er juin 2027"); Intl's fr-CA gives "1 juin".
 * Applied to every date the checklist formats (chips, the hero, the date field, the copied list).
 */
export const ordinalDay = (text: string, intl: string) =>
  intl.startsWith('fr') ? text.replace(/(^|\s)1(?=\s\p{L})/u, (_, lead: string) => `${lead}1er`) : text;

/** Values available to every task message (numbers are formatted by the message formatter). */
export function messageValues(intl: string): MessageValues {
  const money = (n: number) => formatCurrency(n, intl);
  return {
    phone: PHONES.craIndividual,
    cppPhone: PHONES.cppOas,
    weeks: FACTS.eiWeeks,
    std: FACTS.parentalStandardWeeks,
    stdShared: FACTS.parentalStandardShared,
    stdMax: money(FACTS.parentalStandardMax),
    ext: FACTS.parentalExtendedWeeks,
    extShared: FACTS.parentalExtendedShared,
    extMax: money(FACTS.parentalExtendedMax),
    years: FACTS.childPassportYears,
    months: FACTS.commonLawMonths,
    km: FACTS.movingKm,
    basic: money(FACTS.cppDeathBasic),
    topUp: money(FACTS.cppDeathTopUp),
    days: FACTS.cppDeathDays,
    min: FACTS.cppEarliest,
    max: FACTS.cppLatest,
    std65: FACTS.cppStandard,
    early: FACTS.cppEarlyPct,
    late: FACTS.cppLatePct,
    applyMonths: FACTS.cppApplyMonths,
    age: FACTS.rrspAge,
    allowMin: FACTS.survivorAllowanceMin,
    allowMax: FACTS.survivorAllowanceMax,
    page: FACTS.passportAddressPage,
    sinDays: FACTS.sinOnlineDays,
  };
}

/** Message key for a task (`task.<event>.<id>.<part>`), honouring a variant when the catalog has it. */
export const taskKey = (event: EventId, id: string, part: 'title' | 'detail', variant: PlanTask['variant'] = null) =>
  variant === 'auto' ? `task.${event}.${id}.${part}Auto` : `task.${event}.${id}.${part}`;

/**
 * The named federal organizations involved (catch-all buckets like "your province" aren't counted). The
 * Passport Program is part of IRCC, so it counts as IRCC: a row can still say "Passport Program".
 */
export const countAgencies = (tasks: { agency: Agency }[]): Agency[] =>
  [...new Set(tasks.map((t) => (t.agency === 'passport' ? 'ircc' : t.agency)))].filter((a) => COUNTED_AGENCIES.includes(a));

/**
 * The deadline the hero counts down to: the soonest open deadline, else the soonest "can start from" date,
 * else the most recent missed deadline (e.g. the final return after the 60-day mark). The checklist passes only
 * the tasks still open, so a ticked or skipped deadline hands over to the next one.
 */
export function pickKeyDue(tasks: { due: Due | null }[]): Due | null {
  const all = tasks.map((t) => t.due).filter((d): d is Due => !!d);
  const open = all.filter((d) => !d.passed);
  return (
    open.filter((d) => d.kind === 'by').sort((a, b) => a.days - b.days)[0] ??
    open.filter((d) => d.kind === 'from').sort((a, b) => a.days - b.days)[0] ??
    all.filter((d) => d.passed && d.kind === 'by').sort((a, b) => b.days - a.days)[0] ??
    null
  );
}

/** Plain-text checklist (for "Copy checklist"). */
export function checklistText(
  plan: Plan,
  t: (key: string, values?: MessageValues) => string,
  opts: { done: string[]; skipped: string[]; fmtDate: (iso: string) => string },
) {
  const lines = [t('copy.header', { event: t(`event.${plan.event}.name`) }), ''];
  for (const task of plan.tasks) {
    if (opts.skipped.includes(task.id)) continue;
    const box = task.phase === 'auto' ? '•' : opts.done.includes(task.id) ? '[x]' : '[ ]';
    const due = task.due ? ` (${t(`due.${task.due.rule}${task.due.passed ? '.passed' : ''}`, { date: opts.fmtDate(task.due.date) })})` : '';
    lines.push(`${box} ${t(taskKey(plan.event, task.id, 'title', task.variant))}${due}`);
    lines.push(`    ${task.url}`);
  }
  lines.push('', t('copy.footer'));
  return lines.join('\n');
}
