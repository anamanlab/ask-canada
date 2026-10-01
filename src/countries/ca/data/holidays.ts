/**
 * Federal statutory holidays (observed dates) used for business-day estimates.
 * Source: canada-holidays.ca API (federal=true), which mirrors canada.ca. Verified 2026-09-29.
 * https://canada-holidays.ca/api/v1/holidays?year=2026&federal=true
 * Widgets needing provincial holidays should call the live API (see the `dates` widget).
 */
import type { Holiday } from '@/lib/dates/business-days';

export const FEDERAL_HOLIDAYS_SOURCE = 'https://canada-holidays.ca/api/v1/holidays?federal=true';

export const FEDERAL_HOLIDAYS: Holiday[] = [
  { date: '2026-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' } },
  { date: '2026-04-03', name: { en: 'Good Friday', fr: 'Vendredi saint' } },
  { date: '2026-04-06', name: { en: 'Easter Monday', fr: 'Lundi de Pâques' } },
  { date: '2026-05-18', name: { en: 'Victoria Day', fr: 'Fête de la Reine' } },
  { date: '2026-07-01', name: { en: 'Canada Day', fr: 'Fête du Canada' } },
  { date: '2026-08-03', name: { en: 'Civic Holiday', fr: 'Premier lundi d’août' } },
  { date: '2026-09-07', name: { en: 'Labour Day', fr: 'Fête du travail' } },
  { date: '2026-09-30', name: { en: 'National Day for Truth and Reconciliation', fr: 'Journée nationale de la vérité et de la réconciliation' } },
  { date: '2026-10-12', name: { en: 'Thanksgiving', fr: 'Action de grâce' } },
  { date: '2026-11-11', name: { en: 'Remembrance Day', fr: 'Jour du Souvenir' } },
  { date: '2026-12-25', name: { en: 'Christmas Day', fr: 'Noël' } },
  { date: '2026-12-28', name: { en: 'Boxing Day', fr: 'Lendemain de Noël' } },
  { date: '2027-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' } },
  { date: '2027-03-26', name: { en: 'Good Friday', fr: 'Vendredi saint' } },
  { date: '2027-03-29', name: { en: 'Easter Monday', fr: 'Lundi de Pâques' } },
  { date: '2027-05-24', name: { en: 'Victoria Day', fr: 'Fête de la Reine' } },
  { date: '2027-07-01', name: { en: 'Canada Day', fr: 'Fête du Canada' } },
  { date: '2027-08-02', name: { en: 'Civic Holiday', fr: 'Premier lundi d’août' } },
  { date: '2027-09-06', name: { en: 'Labour Day', fr: 'Fête du travail' } },
  { date: '2027-09-30', name: { en: 'National Day for Truth and Reconciliation', fr: 'Journée nationale de la vérité et de la réconciliation' } },
  { date: '2027-10-11', name: { en: 'Thanksgiving', fr: 'Action de grâce' } },
  { date: '2027-11-11', name: { en: 'Remembrance Day', fr: 'Jour du Souvenir' } },
  { date: '2027-12-27', name: { en: 'Christmas Day', fr: 'Noël' } },
  { date: '2027-12-28', name: { en: 'Boxing Day', fr: 'Lendemain de Noël' } },
];

/**
 * Today's date (ISO) in the person's time zone when it's known (an IANA name sent by their browser), so
 * someone in Vancouver at 11 p.m. isn't planning from tomorrow. Falls back to the capital region.
 */
export function todayInCanada(now = new Date(), timeZone?: string) {
  const fmt = (tz: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (timeZone) {
    try {
      return fmt(timeZone);
    } catch {
      /* unknown zone: fall back */
    }
  }
  return fmt('America/Toronto');
}
