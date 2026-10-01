/**
 * Where a return sits on the CRA service-standard timeline.
 * Pure and isomorphic (tools on the server, widgets on the device). Every constant comes from ../data.ts, where
 * each one is traced to its canada.ca page.
 */
import { addDays, diffDays, fromISO } from '@/lib/dates/business-days';
import { REFUND } from '../data';
import { iso, onTime } from './deadlines';

export type RefundInput = {
  filedOn?: string | null;
  method: 'online' | 'paper';
  abroad?: boolean;
  /** The person's own answer to "Did you file on time?"; null/undefined: inferred from the date. */
  onTime?: boolean | null;
  today: string;
};
export type RefundOutput = {
  today: string;
  filedOn: string | null;
  method: 'online' | 'paper';
  abroad: boolean;
  weeks: number;
  target: number;
  /**
   * Whether the service standard applies. The CRA's 2-week / 12-week goals only cover returns "received on
   * or before filing due dates" (service-standards-2026-27.html). null when the filing date is unknown.
   */
  onTime: boolean | null;
  /** What the date alone suggests (before the person's own answer). */
  onTimeGuess: boolean | null;
  /** True when the date falls between April 30 and June 15: on time only for the self-employed. */
  selfEmployedWindow: boolean;
  /** The April 30 due date (on-time date) the filing most likely relates to. */
  dueDate: string | null;
  /** June 15 due date for the self-employed, same year. */
  selfEmployedDue: string | null;
  /** Notice of assessment expected by (service standard). null for late returns: no standard applies. */
  expectedBy: string | null;
  /** Wait at least until this date before contacting the CRA. */
  contactAfter: string | null;
  stage: 'unknown' | 'future' | 'processing' | 'due' | 'late' | 'contact';
  elapsedDays: number | null;
  standardDays: number;
  contactDays: number;
  lines: typeof REFUND.automated;
};

/**
 * Was a return filed on this date on time? A return filed between January 1 and April 30 (rolled to the next
 * business day) most likely covers the previous year and is on time; between April 30 and June 15 it's on
 * time only for the self-employed; after June 15 (to December 31) it's late.
 */
export function filingTimeliness(filedOn: string) {
  const y = Number(filedOn.slice(0, 4));
  const due = onTime(iso(y, 4, 30));
  const selfDue = onTime(iso(y, 6, 15));
  return { due, selfDue, onTime: filedOn <= due, selfEmployedWindow: filedOn > due && filedOn <= selfDue };
}

export function refundStatus({ filedOn, method, abroad = false, onTime: said, today }: RefundInput): RefundOutput {
  const weeks = method === 'online' ? REFUND.digitalWeeks : REFUND.paperWeeks;
  const contactWeeks = abroad ? REFUND.contactAfterWeeksAbroad : REFUND.contactAfterWeeks;
  const standardDays = weeks * 7;
  const contactDays = Math.max(contactWeeks * 7, standardDays);
  const valid = filedOn && /^\d{4}-\d{2}-\d{2}$/.test(filedOn) && !Number.isNaN(fromISO(filedOn).getTime()) ? filedOn : null;
  const timing = valid ? filingTimeliness(valid) : null;
  const onTimeGuess = timing ? timing.onTime : null;
  const isOnTime = timing ? (said ?? timing.onTime) : null;
  const expectedBy = valid && isOnTime ? addDays(valid, standardDays) : null;
  const contactAfter = valid ? addDays(valid, contactDays) : null;
  const elapsed = valid ? diffDays(valid, today) : null;
  const stage: RefundOutput['stage'] =
    elapsed == null
      ? 'unknown'
      : elapsed < 0
        ? 'future'
        : // "Contact the CRA after {date}": the day itself still waits, the next day is the first to call.
          elapsed > contactDays
          ? 'contact'
          : !isOnTime
            ? 'late'
            : elapsed <= standardDays
              ? 'processing'
              : 'due';
  return {
    today,
    filedOn: valid,
    method,
    abroad,
    weeks,
    target: method === 'online' ? REFUND.digitalTarget : REFUND.paperTarget,
    onTime: isOnTime,
    onTimeGuess,
    selfEmployedWindow: timing?.selfEmployedWindow ?? false,
    dueDate: timing?.due ?? null,
    selfEmployedDue: timing?.selfDue ?? null,
    expectedBy,
    contactAfter,
    stage,
    elapsedDays: elapsed,
    standardDays,
    contactDays,
    lines: REFUND.automated,
  };
}
