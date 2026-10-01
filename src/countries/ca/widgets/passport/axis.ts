/**
 * The timeline's axis (pure): which stretch of time the Gantt bar shows and where a date sits on it.
 *
 * - 'months': first of this month to the month of the latest date (expiry, in hand, trip), at least 4 months
 *   and at most MAX_MONTHS wide. An expiry more than 6 months back, or further out than the axis, gets a break
 *   mark and an off-axis pin ("‹ Expired Nov 2025", "Expires Jun 2029 ›").
 * - 'days': a trip within DAY_SCALE_DAYS. The axis runs from today to a few days past the departure, one
 *   column per day with weekends and statutory holidays marked, so today, the pick-up date and the trip sit
 *   well apart. The expiry (months away) is always off-axis.
 */
import { addDays, addMonths, diffDays, isWeekend } from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';

/** The longest month axis we draw. */
const MAX_MONTHS = 16;
/** A trip this close switches the axis (and the big number) to days. */
export const DAY_SCALE_DAYS = 28;

export type Axis = {
  scale: 'months' | 'days';
  /** First day on the axis, and the first day after it. */
  start: string;
  end: string;
  /** One ISO date per column: the first of each month, or each day. */
  ticks: string[];
  /** Days (ISO) on a day axis when passport offices are closed: weekends and statutory holidays. */
  closed: string[];
  /** The axis is cut at the start (expiry long past) or at the end (something lies beyond it). */
  brokenStart: boolean;
  brokenEnd: boolean;
};

export function buildAxis({
  today,
  expiryEnd,
  expired,
  inHandBy,
  trip,
}: {
  today: string;
  /** Last day of the expiry (month), when the expiry is known. */
  expiryEnd: string | null;
  expired: boolean;
  inHandBy: string;
  trip: string | null;
}): Axis {
  if (trip && diffDays(today, trip) <= DAY_SCALE_DAYS) {
    const days = Math.max(10, diffDays(today, trip) + 3);
    const ticks = Array.from({ length: days }, (_, i) => addDays(today, i));
    const end = addDays(today, days);
    return {
      scale: 'days',
      start: today,
      end,
      ticks,
      closed: ticks.filter((d) => isWeekend(d) || FEDERAL_HOLIDAYS.some((h) => h.date === d)),
      brokenStart: expired,
      brokenEnd: (!!expiryEnd && !expired) || inHandBy >= end,
    };
  }
  const todayMonth = `${today.slice(0, 7)}-01`;
  const floor = addMonths(todayMonth, -6);
  const expMonth = expiryEnd ? `${expiryEnd.slice(0, 7)}-01` : todayMonth;
  const brokenStart = expired && expMonth < floor;
  const start = expired ? (brokenStart ? floor : expMonth) : todayMonth;
  const last = [expired || !expiryEnd ? inHandBy : expiryEnd, inHandBy, trip ?? '', today].sort().pop()!;
  const lastMonth = `${last.slice(0, 7)}-01`;
  const ticks: string[] = [];
  let brokenEnd = false;
  for (let m = start; m <= lastMonth; m = addMonths(m, 1)) {
    if (ticks.length === MAX_MONTHS) {
      brokenEnd = true;
      break;
    }
    ticks.push(m);
  }
  while (ticks.length < 4) ticks.push(addMonths(ticks[ticks.length - 1], 1));
  return { scale: 'months', start, end: addMonths(ticks[ticks.length - 1], 1), ticks, closed: [], brokenStart, brokenEnd };
}

/** Where a date sits on the axis, 0–100 (clamped). `edge: 'end'` is the end of that day ("ready by the end of"). */
export function axisPos(axis: Axis, iso: string, edge: 'start' | 'end' = 'start') {
  const total = diffDays(axis.start, axis.end);
  const at = diffDays(axis.start, iso) + (edge === 'end' && axis.scale === 'days' ? 1 : 0);
  return Math.max(0, Math.min(100, (at / total) * 100));
}
