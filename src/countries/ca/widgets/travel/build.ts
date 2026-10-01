/**
 * Builds each travel tool's output (server-side: tools/travel.ts and scenarios/travel.ts). Never throws:
 * a feed that's down becomes an `offline` / `live: false` shape with the official page as fallback.
 */
import { countryByIso, findCountry, fold, suggestCountries } from './countries';
import { computeExemption, tierFromHours } from './exemption';
import { fetchBorderWaits, fetchCountryAdvisory, fetchWaitNotices, ottawaToday } from './live';
import { destinationUrl, helpProse } from './parse-advisory';
import { POPULAR, SOURCES, fallbackWaitNotices, inBoth } from './sources';
import type { ToolSource } from '@/lib/widgets/types';
import type { AbsenceTier, AdvisoryFocus, AdvisoryOutput, BorderWaitsOutput, CountryAdvisory, Crossing, DutyFreeOutput, EmergencyOutput, Lang, Province } from './types';

type BorderWaitsNotice = Extract<BorderWaitsOutput, { live: true }>['notices'][number];

const nameOf = (row: readonly string[], lang: Lang) => (lang === 'fr' ? row[2] : row[1]);
const namesOf = (row: readonly string[]) => ({ en: row[1], fr: row[2] });
const urlsOf = (row: readonly string[]) => ({ en: destinationUrl('en', row[3]), fr: destinationUrl('fr', row[4]) });

/** `sources` in the answer's language (what the chat cites) plus the same list in both, for the card's footer. */
const cited = (lang: Lang, list: (l: Lang) => ToolSource[]) => ({ sources: list(lang), sourcesIn: inBoth(list) });

/** The destination's own page: the feed's name and link in the answer's language, ours in the other one. */
const destinationSource = (c: CountryAdvisory, row: readonly string[], lang: Lang, l: Lang) =>
  l === lang ? SOURCES.destination(l, c.name, c.url, c.updated.slice(0, 10)) : SOURCES.destination(l, nameOf(row, l), urlsOf(row)[l], c.updated.slice(0, 10));

export async function buildAdvisory(
  { destination, lang = 'en', focus = 'safety' }: { destination?: string; lang?: Lang; focus?: AdvisoryFocus },
  signal?: AbortSignal,
): Promise<AdvisoryOutput> {
  const popular = () => POPULAR.map((iso) => countryByIso(iso)!).filter(Boolean).slice(0, 6);
  if (!destination?.trim()) {
    return {
      kind: 'start',
      lang,
      live: false,
      focus,
      suggestions: popular().map((c) => ({ iso: c[0], name: nameOf(c, lang), names: namesOf(c) })),
      ...cited(lang, (l) => [SOURCES.roca(l), SOURCES.advisories(l), SOURCES.explained(l)]),
    };
  }
  const row = findCountry(destination);
  if (!row) {
    const near = suggestCountries(destination ?? '');
    const list = (near.length ? near : popular()).slice(0, 6);
    return {
      kind: 'not-found',
      lang,
      live: false,
      focus,
      // A whole question ("How do I register my trip?") isn't a place name: ask "Where are you going?" instead.
      query: (destination ?? '').trim().split(/\s+/).length <= 3 ? (destination ?? '').trim().slice(0, 40) : '',
      suggestions: list.map((c) => ({ iso: c[0], name: nameOf(c, lang), names: namesOf(c) })),
      ...cited(lang, (l) => [SOURCES.advisories(l), SOURCES.explained(l), SOURCES.roca(l)]),
    };
  }
  const live = await fetchCountryAdvisory(row[0], lang, signal);
  const url = destinationUrl(lang, lang === 'fr' ? row[4] : row[3]);
  if (!live) {
    return {
      kind: 'offline',
      lang,
      live: false,
      focus,
      country: { iso: row[0], name: nameOf(row, lang), names: namesOf(row), urls: urlsOf(row), url },
      ...cited(lang, (l) => [SOURCES.destination(l, nameOf(row, l), l === lang ? url : urlsOf(row)[l], undefined, false), SOURCES.explained(l), SOURCES.roca(l), SOURCES.emergency(l)]),
    };
  }
  const c = live.country;
  return {
    kind: 'advisory',
    lang,
    live: true,
    focus,
    fetchedAt: live.fetchedAt,
    country: { ...c, names: namesOf(row), urls: urlsOf(row), url: c.url.endsWith('/') ? url : c.url },
    ...cited(lang, (l) => [destinationSource(c, row, lang, l), SOURCES.explained(l), SOURCES.roca(l), SOURCES.emergency(l)]),
  };
}

export function buildDutyFree({
  lang = 'en',
  tier,
  hoursAway,
  daysAway,
  spent,
  alcohol,
  tobacco,
}: {
  lang?: Lang;
  tier?: AbsenceTier;
  hoursAway?: number;
  daysAway?: number;
  spent?: number;
  alcohol?: boolean;
  tobacco?: boolean;
}): DutyFreeOutput {
  const t: AbsenceTier = tier ?? (hoursAway != null ? tierFromHours(hoursAway) : daysAway != null ? tierFromHours(daysAway * 24) : 'h48');
  return {
    lang,
    result: computeExemption({ tier: t, spent: spent ?? 0, alcohol: !!alcohol, tobacco: !!tobacco }),
    ...cited(lang, (l) => [SOURCES.declare(l), SOURCES.bis(l), SOURCES.surtaxes(l), SOURCES.arrivecan(l)]),
  };
}

/** Crossing names people use that differ from CBSA's office names. */
const CROSSING_ALIASES: Record<string, string> = {
  'peace arch': 'douglas',
  blaine: 'pacific-highway',
  'truck crossing': 'pacific-highway',
  lacolle: 'st-bernard-de-lacolle',
  'detroit windsor tunnel': 'windsor-and-detroit-tunnel',
  'windsor tunnel': 'windsor-and-detroit-tunnel',
  'gordie howe': 'gordie-howe-international-bridge',
  'thousand islands': 'thousand-islands-bridge',
  '1000 islands': 'thousand-islands-bridge',
  'lewiston': 'queenston-lewiston-bridge',
  'sumas': 'abbotsford-huntingdon',
  'sweetgrass': 'coutts',
  'pembina': 'emerson',
  'champlain': 'st-bernard-de-lacolle',
  'houlton': 'woodstock-road',
  'calais': 'st-stephen',
  'windsor detroit tunnel': 'windsor-and-detroit-tunnel',
  'tunnel windsor detroit': 'windsor-and-detroit-tunnel',
};

/** The crossing a piece of text names ("Peace Arch", "the Lacolle crossing"), or undefined. */
function matchCrossing(rows: Crossing[], text: string): Crossing | undefined {
  const q = fold(text);
  if (!q) return undefined;
  // A crossing answers to its name in either language (« Pont Ambassador » asked from an English page).
  const labels = (r: Crossing) => [r.name, r.names?.en, r.names?.fr].filter((n): n is string => !!n).map(fold);
  const alias = Object.entries(CROSSING_ALIASES).find(([k]) => q.includes(k))?.[1];
  return (
    rows.find((r) => r.id === alias) ??
    rows.find((r) => q.includes(r.id.replace(/-/g, ' ')) || labels(r).some((n) => q.includes(n))) ??
    rows.find((r) => q.length > 3 && labels(r).some((n) => n.includes(q))) ??
    rows.find((r) => q.includes(fold(r.canada.split(',')[0])) || q.includes(fold(r.us.split(',')[0])))
  );
}

/**
 * Notices from the CBSA wait-times page, read live (live.ts); each is tied to the crossing it names, or
 * shown for every crossing when it names none. If the page can't be read, only the dated fallback in
 * data.ts is used, and only until its end date.
 */
async function waitNotices(rows: Crossing[], lang: Lang, signal?: AbortSignal): Promise<BorderWaitsNotice[]> {
  const other: Lang = lang === 'fr' ? 'en' : 'fr';
  const [live, alt] = await Promise.all([fetchWaitNotices(lang, signal), fetchWaitNotices(other, signal)]);
  if (live) {
    // CBSA's two pages carry the same notices in the same order: pair them only when they line up (count and end date).
    const paired = alt?.length === live.length && alt.every((n, i) => n.until === live[i].until) ? alt : null;
    return live.map((n, i) => {
      const own = { title: n.title, body: n.body };
      const o = paired?.[i];
      const text = o ? ({ [lang]: own, [other]: { title: o.title, body: o.body } } as Record<Lang, typeof own>) : undefined;
      return { id: `cbsa-${i}`, crossing: matchCrossing(rows, n.title)?.id ?? '', ...own, ...(text ? { text } : {}) };
    });
  }
  const today = ottawaToday();
  return fallbackWaitNotices(lang, today);
}

export async function buildBorderWaits(
  { lang = 'en', province, crossing }: { lang?: Lang; province?: Province; crossing?: string },
  signal?: AbortSignal,
): Promise<BorderWaitsOutput> {
  const rows = await fetchBorderWaits(lang, signal);
  // Only the page these numbers come from: the answer cites nothing else.
  const sources = cited(lang, (l) => [SOURCES.waits(l, !!rows)]);
  if (!rows) return { live: false, lang, province: province ?? null, highlight: null, crossings: [], notices: [], ...sources };
  const highlight = crossing ? (matchCrossing(rows, crossing)?.id ?? null) : null;
  const notices = await waitNotices(rows, lang, signal);
  return { live: true, lang, asOf: new Date().toISOString(), province: province ?? null, highlight, crossings: rows, notices, ...sources };
}

export async function buildEmergency({ destination, lang = 'en' }: { destination?: string; lang?: Lang }, signal?: AbortSignal): Promise<EmergencyOutput> {
  const sources = cited(lang, (l) => [SOURCES.emergency(l), SOURCES.roca(l)]);
  if (!destination?.trim()) return { lang, country: null, countryMissing: null, ...sources };
  const row = findCountry(destination);
  if (!row) return { lang, country: null, countryMissing: { query: destination.slice(0, 80) }, ...sources };
  const url = destinationUrl(lang, lang === 'fr' ? row[4] : row[3]);
  const live = await fetchCountryAdvisory(row[0], lang, signal);
  if (!live) return { lang, country: null, countryMissing: { query: nameOf(row, lang), url, names: namesOf(row), urls: urlsOf(row) }, ...sources };
  const c = live.country;
  return {
    lang,
    country: { iso: c.iso, name: c.name, names: namesOf(row), urls: urlsOf(row), url: c.url, emergency: c.help.emergency, tollFree: c.help.tollFree, offices: c.help.offices, prose: helpProse(c) },
    countryMissing: null,
    ...cited(lang, (l) => [SOURCES.emergency(l), destinationSource(c, row, lang, l), SOURCES.roca(l)]),
  };
}

