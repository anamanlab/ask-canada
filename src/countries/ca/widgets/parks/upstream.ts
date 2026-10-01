/**
 * The upstream services behind the `parks` tools (server only): the CWFIS GeoServer (fire danger, hotspots,
 * fire perimeters), Parks Canada pages (bulletins) and the NRCan geolocator (place names). Every request has
 * a timeout and a cache window, every JSON response is validated at the boundary, and a failure comes back
 * as null or `{ ok: false }` for live.ts to turn into an honest fallback.
 * Nothing personal is sent: only park coordinates, or the place name the person typed (to the geolocator).
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson, fetchText, type FetchResult } from '@/lib/server/fetch-json';
import type { Lang } from './data';
import { fold, type Origin } from './model';
import { CITIES } from './places';

/* ------------------------------------------------------------------ endpoints */

const API = {
  cwfis: 'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/ows',
  geolocator: 'https://geolocator.api.geo.ca/',
} as const;
/** Seconds in the Next data cache. */
const REVALIDATE = { fire: 1800, bulletins: 1800, geo: 86_400 } as const;
const TIMEOUT_MS = 4500;
/** The NRCan geolocator can be slow on a cold call: wait longer, and retry once, before giving up on a place. */
const GEO_TIMEOUT_MS = 8000;
const GEO_RETRY_TIMEOUT_MS = 5000;
/** Parks Canada pages can be slow to render; give them longer before falling back. */
const PAGE_TIMEOUT_MS = 8000;

const HEADERS = { 'User-Agent': 'AskCanada/1.0 (+https://canada.ryancampbell.com)' };

/* ------------------------------------------------------------------ upstream shapes */

/** NRCan geolocator: an array of candidates (empty when nothing matches). */
const GeoResults = z.array(
  z.object({
    name: z.string().nullish(),
    category: z.string().nullish(),
    lat: z.number().nullish(),
    lng: z.number().nullish(),
  }),
);

/** GeoServer writes numbers as numbers or strings depending on the layer's column type. */
const numeric = z.union([z.number(), z.string()]).nullish();
/** A CWFIS WFS GeoJSON answer, with only the properties these tools ask for. */
const Features = z.object({
  features: z.array(
    z.object({
      properties: z.object({ GRIDCODE: numeric, lat: numeric, lon: numeric, lastdate: z.string().nullish() }).nullish(),
    }),
  ),
});
export type Features = z.output<typeof Features>;
export const num = (v: number | string | null | undefined) => (v == null || v === '' ? NaN : Number(v));

/* ------------------------------------------------------------------ fetching */

/**
 * One request per URL at a time: the scripted answer and the widget (and the 48 parks of the national view)
 * share the same in-flight or just-finished result for a minute. Failures aren't kept.
 */
type Entry<T> = { at: number; value: Promise<FetchResult<T>> };
const MEMO_MS = 60_000;
function shared<T>(store: Map<string, Entry<T>>, key: string, load: () => Promise<FetchResult<T>>): Promise<FetchResult<T>> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) return hit.value;
  const value = load();
  store.set(key, { at: Date.now(), value });
  const oldest = store.size > 200 ? store.keys().next().value : undefined;
  if (oldest !== undefined) store.delete(oldest);
  void value.then((r) => {
    if (!r.ok && store.get(key)?.value === value) store.delete(key);
  });
  return value;
}

const featureMemo = new Map<string, Entry<Features>>();
const geoMemo = new Map<string, Entry<z.output<typeof GeoResults>>>();
const pageMemo = new Map<string, Entry<string>>();

const qs = (base: string, params: Record<string, string | number>) =>
  `${base}?${Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')}`;

/** CWFIS features for a layer and filter, or null when the service didn't answer with what we expect. */
export async function wfs(typeName: string, cql: string, propertyName: string, signal?: AbortSignal): Promise<Features['features'] | null> {
  const url = qs(API.cwfis, { service: 'WFS', version: '1.0.0', request: 'GetFeature', typeName, outputFormat: 'application/json', propertyName, CQL_FILTER: cql });
  const res = await shared(featureMemo, url, () => fetchJson(url, Features, { revalidate: REVALIDATE.fire, timeout: TIMEOUT_MS, signal, headers: HEADERS }));
  return res.ok ? res.data.features : null;
}

export const page = (url: string, signal?: AbortSignal) =>
  shared(pageMemo, url, () => fetchText(url, { revalidate: REVALIDATE.bulletins, timeout: PAGE_TIMEOUT_MS, signal, headers: HEADERS }));

/* ------------------------------------------------------------------ places */

const PLACE = /city|town|village|municipal|hamlet|community|settlement|cit[ée]|ville|district|urban|unorganized|first nation|boundary|population/i;

const PROVINCE_SUFFIX = /\s+(ab|bc|mb|nb|nl|ns|nt|nu|on|pe|pei|qc|sk|yt|alberta|british columbia|colombie britannique|manitoba|new brunswick|nouveau brunswick|newfoundland( and labrador)?|terre neuve( et labrador)?|nova scotia|nouvelle ecosse|ontario|quebec|saskatchewan|yukon|nunavut|northwest territories|prince edward island|ile du prince edouard)$/;

/** Geocoded places, including misses, so the scripted answer and the widget always agree on a place. */
const places = new Map<string, { at: number; value: Promise<Origin | null> }>();
const PLACES_MS = 10 * 60_000;

/**
 * A Canadian place name → coordinates. Known towns resolve locally (no network); anything else goes to the
 * NRCan geolocator with a generous timeout and one retry, because a cold call can take several seconds.
 */
export function geocode(query: string, lang: Lang, signal?: AbortSignal): Promise<Origin | null> {
  const q = fold(query).replace(PROVINCE_SUFFIX, '').trim();
  if (!q) return Promise.resolve(null);
  const city = CITIES.find((c) => c.names.some((n) => fold(n) === q));
  if (city) return Promise.resolve({ label: city.label[lang], lat: city.lat, lng: city.lng });
  const key = `${lang}:${q}`;
  const hit = places.get(key);
  if (hit && Date.now() - hit.at < PLACES_MS) return hit.value;
  const value = lookup(query, q, lang, signal);
  places.set(key, { at: Date.now(), value });
  // Keep a miss only briefly (long enough for the answer and the widget to agree), so a slow day heals fast.
  void value.then((v) => {
    if (!v && places.get(key)?.value === value) places.set(key, { at: Date.now() - PLACES_MS + 90_000, value });
  });
  const oldest = places.size > 300 ? places.keys().next().value : undefined;
  if (oldest !== undefined) places.delete(oldest);
  return value;
}

async function lookup(query: string, q: string, lang: Lang, signal?: AbortSignal): Promise<Origin | null> {
  const url = qs(API.geolocator, { q: query.slice(0, 80), lang });
  const ask = (timeout: number) => shared(geoMemo, url, () => fetchJson(url, GeoResults, { revalidate: REVALIDATE.geo, timeout, signal, headers: HEADERS }));
  let res = await ask(GEO_TIMEOUT_MS);
  // A failed request (timeout or error) gets one more try; an empty array is a real "no such place".
  if (!res.ok && res.reason !== 'aborted') res = await ask(GEO_RETRY_TIMEOUT_MS);
  if (!res.ok) return null;
  const found = res.data.flatMap((d) => (typeof d.lat === 'number' && typeof d.lng === 'number' ? [{ name: d.name ?? '', category: d.category ?? '', lat: d.lat, lng: d.lng }] : []));
  // Only accept a result whose name is the place asked for: the geolocator also returns loose matches
  // ("Zzyzxville" → Rapid City), and a wrong origin is worse than none.
  const named = (d: (typeof found)[number]) => {
    const n = fold(d.name.split(',')[0]);
    return n === q || n.startsWith(`${q} `) || n.replace(/^(city of|town of|ville de|municipalite de) /, '') === q;
  };
  const hit = found.find((d) => named(d) && PLACE.test(d.category)) ?? found.find(named);
  if (!hit) return null;
  const name = (hit.name || query).split(',')[0].trim();
  return { label: name, lat: hit.lat, lng: hit.lng };
}
