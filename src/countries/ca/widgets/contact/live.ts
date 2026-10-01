/**
 * Federal public holidays for the contact tools (server only).
 *
 * Provenance: the bundled list (`data/holidays.ts`, checked against canada.ca) is the authority for every year
 * it covers, so "closed today for <holiday>" is never a statement from a third-party feed. canada-holidays.ca
 * is a community API, not a Government of Canada host: it is only asked about years the bundle doesn't
 * cover yet (so the card keeps working past the bundled range), cached 24 h and validated at the boundary.
 */
import 'server-only';
import { z } from 'zod';
import type { Holiday } from '@/lib/dates/business-days';
import { fetchJson } from '@/lib/server/fetch-json';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';

const HOLIDAYS_API = 'https://canada-holidays.ca/api/v1/holidays';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Only the fields the card uses; a holiday the API lists without a usable date or name is skipped, not fatal. */
const ApiHolidays = z.object({
  holidays: z.array(
    z.object({
      observedDate: z.string().nullish(),
      date: z.string().nullish(),
      nameEn: z.string().nullish(),
      nameFr: z.string().nullish(),
    }),
  ),
});

const BUNDLED_YEARS = new Set(FEDERAL_HOLIDAYS.map((h) => Number(h.date.slice(0, 4))));

/** The bundled holidays, plus the API's for any of `years` the bundle lacks. `live`: some came from the API. */
export async function federalHolidays(years: number[], signal?: AbortSignal): Promise<{ holidays: Holiday[]; live: boolean }> {
  const missing = years.filter((y) => !BUNDLED_YEARS.has(y));
  if (!missing.length) return { holidays: FEDERAL_HOLIDAYS, live: false };
  const results = await Promise.all(
    missing.map((y) => fetchJson(`${HOLIDAYS_API}?year=${y}&federal=true`, ApiHolidays, { revalidate: 86_400, timeout: 3500, signal })),
  );
  const extra: Holiday[] = [];
  results.forEach((res, i) => {
    if (!res.ok) return;
    for (const h of res.data.holidays) {
      const date = h.observedDate ?? h.date ?? '';
      // Only the year that was asked for: an entry can't change a day the bundled list already covers.
      if (ISO_DATE.test(date) && Number(date.slice(0, 4)) === missing[i] && h.nameEn) extra.push({ date, name: { en: h.nameEn, fr: h.nameFr ?? h.nameEn } });
    }
  });
  return { holidays: extra.length ? [...FEDERAL_HOLIDAYS, ...extra] : FEDERAL_HOLIDAYS, live: extra.length > 0 };
}
