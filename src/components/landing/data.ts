/**
 * Live, dated data for the landing showcase (server only). Country specifics come from the pack.
 */
import 'server-only';
import { packServer as pack } from '@/countries/active.server';
import { diffDays } from '@/lib/dates/business-days';

export function todayInPack(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: pack.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function upcomingHolidays(n = 3, today = todayInPack()) {
  return pack.showcase.holidays.filter((h) => h.date > today).slice(0, n);
}

/** Days until the next individual tax filing deadline. */
export function taxCountdown(today = todayInPack()) {
  const { month, day, selfEmployedMonth, selfEmployedDay } = pack.showcase.taxDeadline;
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = Number(today.slice(0, 4));
  const thisYear = `${y}-${pad(month)}-${pad(day)}`;
  const deadline = today <= thisYear ? thisYear : `${y + 1}-${pad(month)}-${pad(day)}`;
  const dy = Number(deadline.slice(0, 4));
  const selfEmployed = `${dy}-${pad(selfEmployedMonth)}-${pad(selfEmployedDay)}`;
  const start = `${dy - 1}-${pad(month)}-${pad(day + 1 > 28 ? 1 : day + 1)}`;
  const days = diffDays(today, deadline);
  const progress = Math.min(1, Math.max(0, diffDays(start, today) / Math.max(1, diffDays(start, deadline))));
  return { deadline, selfEmployed, taxYear: dy - 1, days, progress, today };
}
