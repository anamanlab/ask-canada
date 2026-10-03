/**
 * Calendar maths on ISO dates (YYYY-MM-DD), timezone-safe (no Date-string parsing drift).
 * Country packs supply their own holiday lists.
 */
import type { Locale } from '@/lib/i18n/config';

/**
 * A public holiday. `name` is keyed by locale so a pack can name its holidays in its own official
 * languages (`{ en, pt }` for Brazil); `en` is required because it is the source language.
 */
export type Holiday = { date: string; name: { en: string } & Partial<Record<Locale, string>> };

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d || 1, 12);
};
export const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const addMonths = (iso: string, n: number) => {
  const d = fromISO(iso);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
};
export const diffDays = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);
export const isWeekend = (iso: string) => [0, 6].includes(fromISO(iso).getDay());
export const lastDayOfMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return toISO(new Date(y, m, 0, 12));
};

/**
 * Count `n` business days after `start` (start itself not counted), skipping weekends and holidays.
 * Returns the resulting date and the holidays that were skipped.
 */
export function addBusinessDays(start: string, n: number, holidays: Holiday[]) {
  const set = new Map(holidays.map((h) => [h.date, h]));
  const skipped: Holiday[] = [];
  let d = start;
  let left = n;
  while (left > 0) {
    d = addDays(d, 1);
    if (isWeekend(d)) continue;
    const h = set.get(d);
    if (h) {
      skipped.push(h);
      continue;
    }
    left--;
  }
  return { date: d, skipped };
}

/** Whole months between two ISO dates (floor), e.g. Sep 29 -> Mar 31 = 6. */
export function monthsBetween(a: string, b: string) {
  const A = fromISO(a);
  const B = fromISO(b);
  let m = (B.getFullYear() - A.getFullYear()) * 12 + (B.getMonth() - A.getMonth());
  if (B.getDate() < A.getDate()) m--;
  return m;
}
