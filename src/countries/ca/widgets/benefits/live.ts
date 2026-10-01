/**
 * Live payment dates (server only): the official benefits calendar on canada.ca, read with a timeout, cached
 * for 6 hours and checked at the boundary. Anything unexpected falls back to the dates verified in ./data.ts.
 */
import 'server-only';
import { z } from 'zod';
import { fetchText } from '@/lib/server/fetch-json';
import { URLS } from './data';
import { fallbackDates, parseCalendar, upcoming, type PaymentDates } from './payments';

const isoDates = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));
/** What the parsed page must contain to be trusted: the child benefit's dates at least (every year lists them). */
const Calendar = z.object({
  ccb: isoDates.min(1),
  cgeb: isoDates.optional(),
  cwb: isoDates.optional(),
  cpp: isoDates.optional(),
  oas: isoDates.optional(),
  cdb: isoDates.optional(),
});

export async function paymentDates(today: string, signal?: AbortSignal): Promise<PaymentDates> {
  const page = await fetchText(URLS.calendar.en, { revalidate: 21_600, timeout: 4000, signal });
  if (!page.ok) return fallbackDates(today);
  const parsed = Calendar.safeParse(parseCalendar(page.data));
  if (!parsed.success) return fallbackDates(today);
  return { next: upcoming(parsed.data, today), live: true };
}
