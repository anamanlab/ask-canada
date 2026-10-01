/**
 * Server side of the office finder: locate the person (Government of Canada geolocator, postal codes
 * reduced to their first 3 characters), rank the official office list, and overlay LIVE status and wait
 * times from ESDC's public wait-time feed. Every network call has a timeout and a graceful fallback.
 * Upstream JSON and the bundled office list are validated with zod at the boundary.
 * Imports the full dataset: server only (the tool and the scripted scenarios import this module).
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import OFFICES_JSON from './offices.json';
import { appointmentSources, LIVE, type L } from './data';
import { FeedSchema, measuredAt } from './feed';
import { localNow } from './hours';
import { parseOffices } from './schema';
import { candidatePool, finderSources, fold, fsaOf, listFor, passportFocus, PROV_BY_LETTER } from './search';
import type { AppointmentFocus, AppointmentOutput, FinderOutput, LiveStatus, Need, Office, Origin, ResultOffice } from './types';

/** The official office list, checked once when the module loads. */
const OFFICES: Office[] = parseOffices(OFFICES_JSON);

const PROV_ABBR: Record<string, string> = {
  Alberta: 'AB', 'British Columbia': 'BC', Manitoba: 'MB', 'New Brunswick': 'NB', 'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT', 'Nova Scotia': 'NS', Nunavut: 'NU', Ontario: 'ON', 'Prince Edward Island': 'PE',
  Quebec: 'QC', Saskatchewan: 'SK', Yukon: 'YT',
};
const PLACE_CATEGORIES = new Set([
  'City', 'Town', 'Village', 'Hamlet', 'Community', 'Unincorporated Area', 'Dispersed Rural Community', 'Indian Reserve',
  'Settlement', 'Rural Community', 'Municipality', 'Township', 'Organized Hamlet', 'Northern Village', 'Resort Village',
  'Summer Village', 'Metis Settlement', 'Inuit Village', 'Charter Community', 'Indian Settlement', 'Municipal District',
]);

const GeoHitSchema = z.object({
  key: z.string().nullish(),
  name: z.string().nullish(),
  province: z.string().nullish(),
  category: z.string().nullish(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});
type GeoHit = z.infer<typeof GeoHitSchema>;
/** The geolocator answers with a list of mixed hits; ones without usable coordinates are dropped, not fatal. */
const GeoHitsSchema = z.array(z.unknown()).transform((items) =>
  items.flatMap((item) => {
    const hit = GeoHitSchema.safeParse(item);
    return hit.success ? [hit.data] : [];
  }),
);

async function geolocate(q: string, signal?: AbortSignal): Promise<GeoHit[] | null> {
  const res = await fetchJson(LIVE.geolocator(q), GeoHitsSchema, { revalidate: 86_400, timeout: 6000, signal });
  return res.ok ? res.data : null;
}

const provAbbr = (p?: string | null) => (p ? PROV_ABBR[p.split(' / ')[0]] : undefined);

/** Offline fallback: centroid of offices sharing the FSA (or its first two characters, then the province). */
function offlineFsa(fsa: string): Origin | null {
  for (const len of [3, 2]) {
    const hits = OFFICES.filter((o) => o.postal?.startsWith(fsa.slice(0, len)) && o.kind !== 'outreach');
    if (hits.length) {
      return { lat: avg(hits.map((h) => h.lat)), lng: avg(hits.map((h) => h.lng)), label: fsa, precision: len === 3 ? 'fsa' : 'region' };
    }
  }
  const prov = PROV_BY_LETTER[fsa[0]];
  const hits = OFFICES.filter((o) => o.prov === prov && o.kind !== 'outreach');
  return hits.length ? { lat: avg(hits.map((h) => h.lat)), lng: avg(hits.map((h) => h.lng)), label: fsa, precision: 'region' } : null;
}
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** Offline fallback for a place name: an office in a town of that name. */
function offlinePlace(text: string): Origin | null {
  const q = fold(text.replace(/,.*$/, ''));
  if (!q) return null;
  const hit = OFFICES.find((o) => fold(o.city.en) === q || fold(o.city.fr) === q) ?? OFFICES.find((o) => fold(o.short.en) === q);
  return hit ? { lat: hit.lat, lng: hit.lng, label: `${hit.city.en}, ${hit.prov}`, precision: 'place' } : null;
}

async function locate(input: { location?: string; latitude?: number; longitude?: number }, signal?: AbortSignal): Promise<{ origin: Origin | null; geocoded: boolean }> {
  if (input.latitude != null && input.longitude != null) {
    return { origin: { lat: input.latitude, lng: input.longitude, label: '', precision: 'coords' }, geocoded: false };
  }
  const text = input.location?.trim();
  if (!text) return { origin: null, geocoded: false };
  const fsa = fsaOf(text);
  if (fsa) {
    // Privacy: only the first three characters ever leave the server.
    const hits = await geolocate(fsa, signal);
    const h = hits?.find((x) => (x.key === 'fsa' || x.key === 'locate') && (x.name ?? '').toUpperCase().startsWith(fsa));
    if (h) return { origin: { lat: h.lat, lng: h.lng, label: fsa, precision: 'fsa' }, geocoded: true };
    return { origin: offlineFsa(fsa), geocoded: false };
  }
  const hits = await geolocate(text, signal);
  if (hits) {
    const q = fold(text.replace(/,.*$/, ''));
    const place =
      hits.find((x) => x.key === 'geonames' && x.category && PLACE_CATEGORIES.has(x.category) && fold(x.name ?? '') === q) ??
      hits.find((x) => x.key === 'geonames' && x.category && PLACE_CATEGORIES.has(x.category)) ??
      hits.find((x) => x.key === 'nominatim' && provAbbr(x.province));
    if (place) {
      const name = (place.name ?? text).split(',')[0];
      const p = provAbbr(place.province);
      return { origin: { lat: place.lat, lng: place.lng, label: p ? `${name}, ${p}` : name, precision: 'place' }, geocoded: true };
    }
  }
  return { origin: offlinePlace(text), geocoded: false };
}

/**
 * Read one office's status from the feed. Never through the data cache (`revalidate: 0`): a cached copy can be
 * yesterday evening's "closed", served while it revalidates, and that would send someone home from an open
 * office. The wait is kept only when the feed dated it today (office-local).
 */
async function readStatus(o: Office, signal: AbortSignal): Promise<LiveStatus | null> {
  const res = await fetchJson(LIVE.waitTimes(o.id), FeedSchema, { revalidate: 0, timeout: 3000, signal });
  if (!res.ok) return null;
  const f = res.data;
  const today = localNow(Date.parse(res.at), o.tz).date;
  const seconds = f.waitTimeManualSeconds ?? 0;
  const waiting = !f.isClosed && !f.waitTimeNotAvailable && f.waitTimeManualDate === today && seconds > 0;
  return {
    closed: f.isClosed,
    holiday: f.isHoliday,
    unexpected: f.isClosedUnexpected,
    waitMin: waiting ? Math.max(1, Math.round(seconds / 60)) : undefined,
    waitAt: waiting ? measuredAt(f.en?.waitTimeMoment) : undefined,
    updated: f.lastUpdated,
    at: res.at,
  };
}

/**
 * One reading per office is shared for a few seconds, so the sentence above the card and the card itself (two
 * lookups for one question) always agree, and a busy area isn't asked twice. Each reading keeps the time it
 * was really taken (`at`), so its age is never hidden. Failed readings are not kept.
 * A reading is cancelled only when every tool call waiting on it has been aborted: one caller going away never
 * takes the answer from another.
 */
const SHARE_MS = 20_000;
type Reading = { taken: number; status: Promise<LiveStatus | null>; stop: AbortController; waiting: number; done: boolean };
const readings = new Map<string, Reading>();

/** Count a caller in; if it aborts while the reading is still running and nobody else waits, stop the request. */
function join(r: Reading, signal?: AbortSignal) {
  r.waiting++;
  if (!signal) return;
  const leave = () => {
    if (--r.waiting <= 0 && !r.done) r.stop.abort();
  };
  if (signal.aborted) leave();
  else signal.addEventListener('abort', leave, { once: true });
}

/** Live status for one office (null when the feed is slow, down, not in the expected shape, or the call was aborted). */
function liveStatus(o: Office, signal?: AbortSignal): Promise<LiveStatus | null> {
  const now = Date.now();
  for (const [id, r] of readings) if (now - r.taken >= SHARE_MS) readings.delete(id);
  let r = readings.get(o.id);
  // A reading everyone walked away from was stopped; it answers nobody.
  if (!r || r.stop.signal.aborted) {
    const stop = new AbortController();
    const reading: Reading = {
      taken: now,
      stop,
      waiting: 0,
      done: false,
      status: readStatus(o, stop.signal).then((s) => {
        reading.done = true;
        if (!s && readings.get(o.id) === reading) readings.delete(o.id);
        return s;
      }),
    };
    readings.set(o.id, reading);
    r = reading;
  }
  join(r, signal);
  return r.status;
}

export async function findOffices(input: {
  location?: string;
  latitude?: number;
  longitude?: number;
  need?: Need;
  /** The person asked for a passport office by name (not just somewhere to apply). */
  passportOffice?: boolean;
  lang?: L;
}, signal?: AbortSignal): Promise<FinderOutput> {
  const lang = input.lang ?? 'en';
  const need = input.need ?? 'any';
  const asOf = new Date().toISOString();
  const { origin, geocoded } = await locate(input, signal);
  if (!origin) {
    return {
      status: input.location?.trim() ? 'not-found' : 'no-location',
      need,
      query: input.location?.trim().slice(0, 60) || undefined,
      origin: null,
      offices: [],
      asOf,
      live: false,
      geocoded,
      lang,
      sources: finderSources({ need, offices: [] }, lang),
    };
  }
  const pool = candidatePool(OFFICES, origin);
  // Live status for what's on screen first: the nearest for the asked need, then the rest of the pool.
  const focusId = passportFocus(pool, need, input.passportOffice)?.id;
  const asked = [...new Set([...listFor(pool, need, focusId), ...pool])].slice(0, 14);
  const lives = await Promise.all(asked.map((o) => liveStatus(o, signal)));
  const liveById = new Map(asked.map((o, i) => [o.id, lives[i]] as const));
  const offices: ResultOffice[] = pool.map((o) => {
    const l = liveById.get(o.id);
    return l ? { ...o, live: l } : o;
  });
  return {
    status: 'ok',
    need,
    focusId,
    origin,
    offices,
    asOf,
    live: lives.some(Boolean),
    geocoded,
    lang,
    sources: finderSources({ need, offices, focusId }, lang),
  };
}

export function appointmentInfo(input: { focus?: AppointmentFocus; lang?: L }): AppointmentOutput {
  const lang = input.lang ?? 'en';
  const focus = input.focus ?? 'passport';
  return { focus, lang, sources: appointmentSources(lang, focus) };
}
