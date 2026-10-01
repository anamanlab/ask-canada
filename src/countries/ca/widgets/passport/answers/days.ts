/**
 * Whose "today"? The planner counts from the date on the reader's device. A computed answer is written on the
 * server, which knows that date only when the reader's time zone comes with the question. Without it, the
 * reader's date is one of the dates it is right now somewhere in Canada (St. John's is 4.5 hours ahead of
 * Vancouver), so the answer is written for each of them and kept only where they all agree (see `agreed`).
 */
import { todayInCanada } from '../../../data/holidays';
import type { Clock } from '../types';

const EDGES = ['America/Vancouver', 'America/Toronto', 'America/St_Johns'];

/** The reader's possible dates (ISO), earliest first: one when their time zone is known. */
export function readerDays(timeZone?: string, now = new Date()): string[] {
  if (timeZone) return [todayInCanada(now, timeZone)];
  return [...new Set(EDGES.map((tz) => todayInCanada(now, tz)))].sort();
}

/**
 * The time of day in a time zone (17.5 = 5:30 pm): late in the day, in-person dates count from the next
 * business day (plan.ts). An unknown zone gives no clock, and the plan then assumes office hours.
 */
export function clockIn(now: Date, timeZone?: string): Clock | undefined {
  if (!timeZone) return undefined;
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const num = (type: 'hour' | 'minute') => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { hour: num('hour') + num('minute') / 60, newfoundland: timeZone === 'America/St_Johns' };
  } catch {
    return undefined;
  }
}

/** The reader's possible date and time of day: one when their time zone is known, else one per edge of the country. */
export type Moment = { today: string; clock?: Clock };
export function readerMoments(timeZone?: string, now = new Date()): Moment[] {
  return (timeZone ? [timeZone] : EDGES).map((tz) => ({ today: todayInCanada(now, tz), clock: clockIn(now, tz) }));
}

/** The answer every possible date gives, or null when they differ (the caller then says only what holds for all). */
export function agreed<T>(days: T[], build: (day: T) => string): string | null {
  const [first, ...rest] = days.map(build);
  return rest.every((md) => md === first) ? first : null;
}
