/**
 * Live travel health notices for `healthTravel` (server only): the notice table on travel.gc.ca / voyage.gc.ca,
 * fetched with a timeout and a cache window. Returns a renderable shape (live: false) instead of throwing.
 */
import 'server-only';
import { addDays } from '@/lib/dates/business-days';
import { URLS, type Lang, type TravelModified } from './data';
import { otherLang, travelLinks } from './links';
import { page } from './live-shared';
import { CLINIC_LEAD_DAYS, type ThnLevel, type TravelOutput } from './travel';
import { byLevel, dateModifiedOf, findPlace, noticesFor, parseThn, placeCandidate } from './travel-parse';

export async function liveTravel(
  input: { destination?: string | null; travelDate?: string | null; lang: Lang },
  signal?: AbortSignal,
  now = new Date(),
): Promise<TravelOutput> {
  const { lang } = input;
  const other = otherLang(lang);
  // The destination may be a place ("Cuba") or a whole question ("What vaccines do I need for Cuba?").
  const asked = input.destination?.trim().slice(0, 200) || null;
  const travelDate = input.travelDate && /^\d{4}-\d{2}-\d{2}$/.test(input.travelDate) ? input.travelDate : null;
  const place = asked ? findPlace(asked) : null;
  const query = place ? place[lang] : asked ? placeCandidate(asked) : null;
  const base = { lang, fetchedAt: now.toISOString(), travelDate, clinicBy: travelDate ? addDays(travelDate, -CLINIC_LEAD_DAYS) : null, query };
  // The other language's links, sources and destination name: a reader who switches language keeps a card in one language.
  const links = (live: boolean, modified?: TravelModified) => ({ ...travelLinks(lang, live, modified), alt: { ...travelLinks(other, live, modified), destination: place ? place[other] : null } });
  const offline = (reason: TravelOutput['offline'], modified?: TravelModified): TravelOutput => ({
    ...base,
    live: false,
    offline: reason,
    destination: place ? place[lang] : null,
    unknownDestination: false,
    notices: [],
    totalNotices: 0,
    highestLevel: 0,
    ...links(false, modified),
  });

  // The vaccines page is fetched only for its "Date modified" (cached for a day): a slow answer there never
  // delays the notices, and a failed one falls back to the recorded date.
  const [html, vaccines] = await Promise.all([
    page(URLS.thn[lang], { signal, timeout: 5000, revalidate: 3600 }),
    page(URLS.travelVaccines[lang], { signal, timeout: 2500, revalidate: 86_400 }),
  ]);
  const vaccinesModified = vaccines == null ? null : dateModifiedOf(vaccines);
  if (html == null) return offline('unreachable', { vaccines: vaccinesModified });
  const { notices: all, rows, modified: noticesModified } = parseThn(html, lang);
  const modified = { notices: noticesModified, vaccines: vaccinesModified };
  if (!all.length) {
    // The page answered but its table gave nothing: the markup changed (as it did in September 2026). Say so in
    // the log, and tell the person the notices couldn't be read, not that the site is down.
    console.warn(`[health] travel health notices: fetched ${URLS.thn[lang]} (${html.length} bytes) but parsed 0 notices from ${rows} table rows`);
    return offline('unreadable', modified);
  }
  const notices = (place ? noticesFor(place, all) : [...all]).sort(byLevel);
  return {
    ...base,
    live: true,
    destination: place ? place[lang] : null,
    unknownDestination: Boolean(query && !place),
    notices,
    specific: place ? notices.filter((n) => !n.global).length : undefined,
    totalNotices: all.length,
    highestLevel: notices.reduce<ThnLevel | 0>((m, n) => (n.level > m ? n.level : m), 0),
    ...links(true, modified),
  };
}
