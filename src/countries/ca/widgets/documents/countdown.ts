/**
 * The day counts behind every deadline and payment row, shared by the tool (server) and the card (browser).
 * The card re-runs them against the reader's own date, so an answer reopened a week later still counts right.
 * Kept apart from ./explain so the card doesn't ship the holiday table, the redactor or the source catalogue.
 */
import { diffDays } from '@/lib/dates/business-days';

export type DeadlineStatus = 'passed' | 'soon' | 'upcoming';

/** A deadline within this many days is "soon" (amber). */
const SOON_DAYS = 14;

/**
 * Days from `today` to a deadline (negative: passed) and what that means. Counts to the date itself (never
 * nudges people past what the letter printed); only once that date has passed does the next-business-day
 * grace (`onTimeBy`, CRA dates on a weekend or holiday) keep it open.
 */
export function countdown(today: string, date: string, onTimeBy?: string): { days: number; status: DeadlineStatus } {
  let days = diffDays(today, date);
  if (days < 0 && onTimeBy && onTimeBy !== date && diffDays(today, onTimeBy) >= 0) days = diffDays(today, onTimeBy);
  return { days, status: days < 0 ? 'passed' : days <= SOON_DAYS ? 'soon' : 'upcoming' };
}

/** The first of `dates` (sorted, YYYY-MM-DD) on or after `today`. */
export const nextOnOrAfter = (dates: string[], today: string): string | null => dates.find((d) => d >= today) ?? null;
