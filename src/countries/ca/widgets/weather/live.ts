/**
 * Live Government of Canada weather data, fetched on the server (tools/weather.ts and the scripted
 * scenarios). Every request has a timeout and a cache window, and every failure degrades to a shape the
 * widget can render (with the official page as the fallback). Nothing personal is sent: only a place name,
 * a postal-code area (first 3 characters) or rounded coordinates.
 */
import 'server-only';
import type { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import { API, AQHI_MAX_KM, HOTSPOT_RADIUS_KM, REVALIDATE, TIMEOUT_MS, type Lang, type Province } from './data';
import { airOutput, forecastOutput, pickerSources, placeAlertsOutput, toPlace, wideAlertsOutput } from './assemble';
import { forecastCityFor, optionsFor, pickFsa, pickNamed, type GeoPick } from './geocode';
import { fsaOf } from './geo';
import { parseAqhi, summarizeHotspots } from './model';
import { nearestCity } from './nearest';
import { matchCity, nearestAqhi, popularPlaces, splitProvince } from './places';
import { AlertCollection, AqhiForecasts, AqhiObservations, CityItem, GeolocatorHits, Hotspots } from './schemas';
import type { AirOutput, AlertsOutput, ForecastFocus, ForecastOutput, LocateFailure, Place } from './types';

const HEADERS = { 'User-Agent': 'AskCanada/1.0 (+https://canada.ryancampbell.com)' };
const MIN = 60_000;
/** Short in-process memo so a scenario's heading and its tool call share one upstream request. */
const MEMO_MS = MIN;
const MEMO_MAX = 300;

type Freshness<T> = {
  /** When upstream produced this response (pygeoapi collections carry a server `timeStamp`). */
  served?: (data: T) => string | null | undefined;
  /** The data's own "last updated" time (a city page's `lastUpdated`, the latest AQHI observation). */
  stamp?: (data: T) => string | null | undefined;
  /** Refetch when that stamp is older than this (and the copy wasn't just served). */
  maxAgeMs?: number;
};
type Got<T> = { data: T; servedAt?: string } | null;

/**
 * A validated upstream feed: GET JSON through the Next data cache (`fetchJson` adds the timeout and checks
 * the shape), but never serve an old copy as live. The cache is stale-while-revalidate: after a quiet spell,
 * the first request gets whatever was cached, however old. So when the copy is past its window, or the
 * data's own timestamp is too old, fetch once more without the cache and use that answer when it arrives.
 * If that fails, the older copy is still better than nothing, and `servedAt` lets the widget say how old it
 * is instead of calling it live. Returns null when the feed is unreachable or not the shape we expect, or
 * when the chat turn was cancelled (`signal`, the tool call's abort signal: no upstream work for nobody).
 */
function feed<S extends z.ZodType>(schema: S, revalidate: number, fresh: Freshness<z.output<S>> = {}) {
  const memo = new Map<string, { at: number; value: Promise<Got<z.output<S>>> }>();
  const load = async (url: string, signal?: AbortSignal): Promise<Got<z.output<S>>> => {
    const get = (cache: number) => fetchJson(url, schema, { revalidate: cache, timeout: TIMEOUT_MS, headers: HEADERS, signal });
    let r = await get(revalidate);
    if (!r.ok) {
      if (r.reason === 'invalid') console.warn(`[weather] ${r.detail}`);
      return null;
    }
    const now = Date.now();
    const servedMs = (data: z.output<S>) => Date.parse(fresh.served?.(data) ?? '');
    const age = now - servedMs(r.data); // NaN when the feed doesn't say when it was served
    const stamp = Date.parse(fresh.stamp?.(r.data) ?? '');
    const oldContent = fresh.maxAgeMs != null && now - stamp > fresh.maxAgeMs && !(age <= 2 * MIN);
    if (age > revalidate * 1000 + MIN || oldContent) {
      const again = await get(0);
      if (again.ok) r = again;
    }
    const served = servedMs(r.data);
    return { data: r.data, servedAt: Number.isFinite(served) ? new Date(served).toISOString() : undefined };
  };
  return async (url: string, signal?: AbortSignal): Promise<Got<z.output<S>>> => {
    const hit = memo.get(url);
    if (hit && Date.now() - hit.at < MEMO_MS) {
      // A memoized request carries the signal of whoever asked first. If it came back empty (they cancelled
      // their turn, or it failed), this caller asks again on its own signal instead of inheriting the failure.
      const shared = await hit.value;
      if (shared) return shared;
    }
    if (signal?.aborted) return null;
    const value = load(url, signal);
    memo.set(url, { at: Date.now(), value });
    if (memo.size > MEMO_MAX) {
      const oldest = memo.keys().next();
      if (!oldest.done) memo.delete(oldest.value);
    }
    const out = await value;
    if (out == null && memo.get(url)?.value === value) memo.delete(url); // don't remember failures
    return out;
  };
}

/** City pages: refreshed when `lastUpdated` is more than 20 minutes old. */
const cityItems = feed(CityItem, REVALIDATE.city, { stamp: (d) => d.properties.lastUpdated, maxAgeMs: 20 * MIN });
/** Alerts: refetch any copy more than 10 minutes old. */
const alertCollections = feed(AlertCollection, REVALIDATE.alerts, { served: (d) => d.timeStamp, stamp: (d) => d.timeStamp, maxAgeMs: 10 * MIN });
/** Observations are hourly: a latest reading more than 90 minutes old means the cached copy missed one. */
const aqhiObservations = feed(AqhiObservations, REVALIDATE.aqhi, { served: (d) => d.timeStamp, stamp: (d) => d.features[0]?.properties.observation_datetime, maxAgeMs: 90 * MIN });
const aqhiForecasts = feed(AqhiForecasts, REVALIDATE.aqhi, { served: (d) => d.timeStamp });
const hotspotLists = feed(Hotspots, REVALIDATE.hotspots);
const geolocatorHits = feed(GeolocatorHits, REVALIDATE.geo);

const qs = (base: string, params: Record<string, string | number>) =>
  `${base}?${Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')}`;

/* ------------------------------------------------------------------ places */

type Geo = { ok: true; pick: Exclude<GeoPick, { kind: 'none' }> } | { ok: false; reason: 'unreachable' | 'no-hit' };

/**
 * Ask the NRCan Geolocator where a postal-code area or a place name is. "The feed didn't answer" and "the
 * feed has no such place" are different answers: an unreachable feed is asked once more, and is then reported
 * as unreachable, never as "not found".
 */
async function geolocate(query: string, signal?: AbortSignal): Promise<Geo> {
  const fsa = fsaOf(query);
  const { name, province: hint } = splitProvince(query);
  const q = fsa ?? name;
  if (!q || q.length < 2) return { ok: false, reason: 'no-hit' };
  const url = qs(API.geolocator, { q, lang: 'en' });
  // Failures aren't memoized, so the second call is a fresh request.
  const got = (await geolocatorHits(url, signal)) ?? (signal?.aborted ? null : await geolocatorHits(url, signal));
  if (!got) return { ok: false, reason: 'unreachable' };
  const hits = got.data.flatMap((d) => (d.lat != null && d.lng != null ? [{ key: d.key ?? '', name: d.name ?? '', category: d.category ?? '', province: d.province, lat: d.lat, lon: d.lng }] : []));
  const pick = fsa ? pickFsa(hits, fsa) : pickNamed(hits, q, hint);
  return pick.kind === 'none' ? { ok: false, reason: 'no-hit' } : { ok: true, pick };
}

type LocateInput = { location?: string; latitude?: number; longitude?: number; lang: Lang };
/** Per-call options: the tool call's abort signal (a cancelled chat turn stops its upstream requests). */
type CallOptions = { abortSignal?: AbortSignal };
type Located = { place: Place } | LocateFailure;

/** A typed place → its forecast location, or why not (not found, ambiguous, lookup unavailable). */
async function lookup(q: string, lang: Lang, signal?: AbortSignal): Promise<Located> {
  const fsa = fsaOf(q);
  if (!fsa) {
    const m = matchCity(q, lang);
    if (m.kind === 'one') return { place: toPlace(m.place, 'name', { query: q, ...(m.alternatives.length ? { others: m.alternatives } : {}) }) };
    if (m.kind === 'many') return { status: 'ambiguous', query: q, options: m.options };
  }
  const g = await geolocate(q, signal);
  if (!g.ok) return { status: g.reason === 'unreachable' ? 'lookup-unavailable' : 'not-found', query: q, popular: popularPlaces(lang) };
  if (g.pick.kind === 'many') return { status: 'ambiguous', query: g.pick.points[0].name, options: optionsFor(g.pick, lang) };
  const n = forecastCityFor(g.pick, lang);
  return { place: toPlace(n.place, 'nearest', { query: fsa ?? q, distanceKm: n.km }) };
}

/**
 * One outcome per typed place for a minute, so a scripted answer's prose and its tool call (two calls a
 * moment apart) can never disagree about where "K1A 0B1" is. An unavailable lookup isn't remembered.
 */
const located = new Map<string, { at: number; value: Promise<Located> }>();

/** Find the forecast location for what the person said (or where they are). */
async function locate({ location, latitude, longitude, lang }: LocateInput, signal?: AbortSignal): Promise<Located> {
  if (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    const n = nearestCity(lat, lon, lang);
    return { place: toPlace(n.place, 'coords', { distanceKm: n.km }) };
  }
  const q = location?.trim();
  if (!q) return { status: 'need-location', popular: popularPlaces(lang) };
  const key = `${lang}|${q.toLowerCase()}`;
  const hit = located.get(key);
  if (hit && Date.now() - hit.at < MEMO_MS) {
    // Shared with whoever asked first; if their lookup failed (or their turn was cancelled), ask again.
    const shared = await hit.value;
    if (!('status' in shared) || shared.status !== 'lookup-unavailable') return shared;
  }
  const value = lookup(q, lang, signal);
  located.set(key, { at: Date.now(), value });
  if (located.size > MEMO_MAX) {
    const oldest = located.keys().next();
    if (!oldest.done) located.delete(oldest.value);
  }
  const out = await value;
  if ('status' in out && out.status === 'lookup-unavailable' && located.get(key)?.value === value) located.delete(key);
  return out;
}

/* ------------------------------------------------------------------ feeds */

/** The city page for a forecast location (null = feed unreachable). */
const cityRaw = async (id: string, signal?: AbortSignal) => (await cityItems(API.city(id), signal))?.data.properties ?? null;

/** Alerts whose areas contain the point (tiny bbox around it). `features: null` = feed unreachable. */
async function alertsAt(lat: number, lon: number, signal?: AbortSignal) {
  const d = 0.01;
  const got = await alertCollections(qs(API.alerts, { f: 'json', limit: 200, skipGeometry: 'true', bbox: `${(lon - d).toFixed(3)},${(lat - d).toFixed(3)},${(lon + d).toFixed(3)},${(lat + d).toFixed(3)}` }), signal);
  return { features: got?.data.features ?? null, servedAt: got?.servedAt };
}

async function allAlerts(signal?: AbortSignal) {
  const got = await alertCollections(qs(API.alerts, { f: 'json', limit: 2000, skipGeometry: 'true' }), signal);
  return { features: got?.data.features ?? null, servedAt: got?.servedAt };
}

async function aqhiFor(lat: number, lon: number, lang: Lang, tz: string, signal?: AbortSignal) {
  const c = nearestAqhi(lat, lon, lang);
  if (c.km > AQHI_MAX_KM) return { aqhi: null, nearest: { name: c.name, distanceKm: c.km }, gap: 'far' as const };
  const [obs, fcst] = await Promise.all([
    aqhiObservations(qs(API.aqhiObs, { f: 'json', location_id: c.id, sortby: '-observation_datetime', limit: 1 }), signal),
    aqhiForecasts(qs(API.aqhiFcst, { f: 'json', location_id: c.id, aqhi_type: 'AQHI-Forecast-Period', sortby: '-publication_datetime', limit: 1 }), signal),
  ]);
  const o = obs?.data.features[0];
  const f = fcst?.data.features[0];
  if (!o && !f) return { aqhi: null, nearest: { name: c.name, distanceKm: c.km }, gap: 'unavailable' as const };
  // An observation more than 6 hours old isn't "now".
  const fresh = o && Date.now() - Date.parse(o.properties.observation_datetime ?? '') < 6 * 3600_000 ? o : undefined;
  return { aqhi: parseAqhi(fresh, f, c, lang, tz), nearest: null, gap: undefined };
}

async function hotspotsNear(lat: number, lon: number, signal?: AbortSignal) {
  const dLat = HOTSPOT_RADIUS_KM / 111 + 0.05;
  const dLon = HOTSPOT_RADIUS_KM / (111 * Math.cos((lat * Math.PI) / 180)) + 0.05;
  const url = qs(API.hotspots, {
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: 'public:hotspots_last24hrs',
    outputFormat: 'application/json',
    propertyName: 'lat,lon',
    CQL_FILTER: `lat BETWEEN ${(lat - dLat).toFixed(3)} AND ${(lat + dLat).toFixed(3)} AND lon BETWEEN ${(lon - dLon).toFixed(3)} AND ${(lon + dLon).toFixed(3)}`,
  });
  const got = await hotspotLists(url, signal);
  return got ? summarizeHotspots(got.data.features, lat, lon, HOTSPOT_RADIUS_KM) : null;
}

/* ------------------------------------------------------------------ tool outputs */

const stamp = () => new Date().toISOString();

type ForecastInput = LocateInput & { focus?: ForecastFocus };

export async function buildForecast(input: ForecastInput, { abortSignal: signal }: CallOptions = {}): Promise<ForecastOutput> {
  const { lang } = input;
  const found = await locate(input, signal);
  if ('status' in found) return { ...found, lang, fetchedAt: stamp(), sources: pickerSources.forecast(lang) };
  const { place } = found;
  const [raw, alerts, air] = await Promise.all([cityRaw(place.id, signal), alertsAt(place.lat, place.lon, signal), aqhiFor(place.lat, place.lon, lang, place.tz, signal)]);
  return forecastOutput({ place, raw, alertFeatures: alerts.features, aqhi: air.aqhi, lang, focus: input.focus });
}

type AlertsInput = LocateInput & { province?: Province };

export async function buildAlerts(input: AlertsInput, { abortSignal: signal }: CallOptions = {}): Promise<AlertsOutput> {
  const { lang, province } = input;
  const wantsPlace = Boolean(input.location?.trim()) || (input.latitude != null && input.longitude != null);
  if (!wantsPlace) {
    const all = await allAlerts(signal);
    return wideAlertsOutput({ features: all.features, province, lang, servedAt: all.servedAt });
  }
  const found = await locate(input, signal);
  if ('status' in found) return { ...found, lang, fetchedAt: stamp(), sources: pickerSources.alerts(lang) };
  const { place } = found;
  const [hits, raw] = await Promise.all([alertsAt(place.lat, place.lon, signal), cityRaw(place.id, signal)]);
  return placeAlertsOutput({ place, features: hits.features, raw, lang, servedAt: hits.servedAt });
}

type AirInput = LocateInput & { focus?: 'aqhi' | 'smoke' };

export async function buildAir(input: AirInput, { abortSignal: signal }: CallOptions = {}): Promise<AirOutput> {
  const { lang } = input;
  const found = await locate(input, signal);
  if ('status' in found) return { ...found, ...(input.focus ? { focus: input.focus } : {}), lang, fetchedAt: stamp(), sources: pickerSources.air(lang) };
  const { place } = found;
  const [air, alerts, hotspots, raw] = await Promise.all([
    aqhiFor(place.lat, place.lon, lang, place.tz, signal),
    alertsAt(place.lat, place.lon, signal),
    hotspotsNear(place.lat, place.lon, signal),
    cityRaw(place.id, signal),
  ]);
  return airOutput({ place, aqhi: air.aqhi, gap: air.gap, nearest: air.nearest, alertFeatures: alerts.features, raw, hotspots, focus: input.focus, lang });
}
