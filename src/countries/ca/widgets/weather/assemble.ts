/**
 * Assemble tool outputs from already-fetched feeds (pure, isomorphic). live.ts fetches and calls these;
 * fixtures.ts calls them with recorded/fixture feeds — one code path for both.
 */
import { URLS, cityPageUrl, isStale, sources, type Lang, type Province } from './data';
import { cityPageAlertUrl, cityPageAlerts, groupAlerts, placeAlerts } from './alerts-model';
import { parseCurrent, parseHours, parseNormals, parsePeriods, parseSun, smokeSignal, toDays } from './model';
import { toLite } from './nearest';
import { cityById, timeZoneFor } from './places';
import type { RawAlert, RawCity } from './schemas';
import { outlookDays } from './outlook';
import type { AirOutput, AlertsOutput, AqhiNow, ForecastFocus, ForecastOutput, Hotspots, Place, PlaceLite } from './types';

export const toPlace = (p: PlaceLite, via: Place['via'], extra: Partial<Place> = {}): Place => ({
  ...p,
  tz: timeZoneFor(p.province, p.lat, p.lon),
  via,
  ...extra,
});

/** A forecast location by id (fixtures). Throws on an id that isn't a forecast location. */
export function placeById(id: string, lang: Lang, via: Place['via'] = 'name', extra: Partial<Place> = {}) {
  const row = cityById(id);
  if (!row) throw new Error(`Unknown forecast location: ${id}`);
  return toPlace(toLite(row, lang), via, extra);
}

/**
 * Sources of an answer that asks for a place first (no place, not found, ambiguous, lookup unavailable): the
 * official page that covers every place for that tool.
 */
export const pickerSources = {
  forecast: (lang: Lang) => [sources.city(URLS.forecastHome[lang], lang)],
  alerts: (lang: Lang) => [sources.alertMap(lang)],
  air: (lang: Lang) => [sources.aqhiLocal(lang), sources.aqhiAbout(lang)],
};

export function forecastOutput(o: {
  place: Place;
  raw: RawCity | null;
  alertFeatures: RawAlert[] | null;
  aqhi: AqhiNow | null;
  lang: Lang;
  now?: Date;
  focus?: ForecastFocus;
  fetchedAt?: string;
}): ForecastOutput {
  const { place, raw, lang } = o;
  const now = o.now ?? new Date();
  const fetchedAt = o.fetchedAt ?? now.toISOString();
  const page = cityPageUrl(place.lat, place.lon, lang);
  if (!raw) return { status: 'unavailable', place, page, lang, fetchedAt, sources: [sources.city(page, lang, false)] };
  const alertUrl = cityPageAlertUrl(raw, lang) ?? page;
  const alerts = o.alertFeatures ? placeAlerts(o.alertFeatures, lang, now, alertUrl) : cityPageAlerts(raw, lang);
  const sun = parseSun(raw);
  const days = toDays(parsePeriods(raw, lang));
  const first = days[0];
  // Only call the forecast live when Environment Canada updated it within the freshness window.
  const updatedAt = raw.lastUpdated ?? fetchedAt;
  const live = !isStale(updatedAt, fetchedAt);
  // "Tomorrow" and "this weekend" are answered by the 7-day list with that day's row open.
  const asked = o.focus === 'tomorrow' || o.focus === 'weekend' ? o.focus : null;
  const openDay = asked ? outlookDays(days, asked, fetchedAt, place.tz, lang)[0]?.key : undefined;
  const src = [sources.city(page, lang, live)];
  if (alerts.length) src.push(sources.colourCoded(lang));
  if (o.aqhi) src.push(sources.aqhiLocal(lang));
  return {
    status: 'ok',
    live: true,
    lang,
    fetchedAt,
    place,
    page,
    updatedAt,
    current: parseCurrent(raw, lang, sun),
    today: { high: first?.high ?? null, low: first?.low ?? null, ...parseNormals(raw, lang) },
    days,
    hours: parseHours(raw, lang),
    alerts,
    aqhi: o.aqhi,
    sun,
    focus: o.focus === 'tomorrow' || o.focus === 'weekend' ? 'week' : (o.focus ?? 'now'),
    ...(openDay ? { openDay } : {}),
    sources: src,
  };
}

export function placeAlertsOutput(o: { place: Place; features: RawAlert[] | null; raw: RawCity | null; lang: Lang; now?: Date; servedAt?: string }): AlertsOutput {
  const { place, raw, lang } = o;
  const now = o.now ?? new Date();
  const fetchedAt = now.toISOString();
  const page = cityPageUrl(place.lat, place.lon, lang);
  const alertUrl = (raw && cityPageAlertUrl(raw, lang)) ?? page;
  const alerts = o.features ? placeAlerts(o.features, lang, now, alertUrl) : raw ? cityPageAlerts(raw, lang) : null;
  if (!alerts) return { status: 'unavailable', place, page, lang, fetchedAt, sources: [sources.city(page, lang, false), sources.colourCoded(lang)] };
  return {
    status: 'ok',
    scope: 'place',
    live: true,
    place,
    page: alertUrl,
    alerts,
    lang,
    fetchedAt,
    ...(o.features && o.servedAt ? { servedAt: o.servedAt } : {}),
    sources: [sources.city(alertUrl, lang), sources.colourCoded(lang), sources.alertTypes(lang)],
  };
}

export function wideAlertsOutput(o: { features: RawAlert[] | null; province?: Province; lang: Lang; now?: Date; servedAt?: string }): AlertsOutput {
  const { lang, province } = o;
  const now = o.now ?? new Date();
  const fetchedAt = now.toISOString();
  const page = URLS.alertMap[lang];
  if (!o.features) return { status: 'unavailable', province, page, lang, fetchedAt, sources: [sources.alertMap(lang, false), sources.colourCoded(lang)] };
  const { groups, counts, total, statements } = groupAlerts(o.features, lang, now, province);
  return {
    status: 'ok',
    scope: province ? 'province' : 'canada',
    live: true,
    province,
    page,
    counts,
    total,
    statements,
    groups,
    lang,
    fetchedAt,
    ...(o.servedAt ? { servedAt: o.servedAt } : {}),
    sources: [sources.alertMap(lang), sources.colourCoded(lang), sources.alertTypes(lang)],
  };
}

export function airOutput(o: {
  place: Place;
  aqhi: AqhiNow | null;
  gap?: 'far' | 'unavailable';
  nearest?: { name: string; distanceKm: number } | null;
  alertFeatures: RawAlert[] | null;
  raw: RawCity | null;
  hotspots: Hotspots | null;
  focus?: 'aqhi' | 'smoke';
  lang: Lang;
  now?: Date;
}): AirOutput {
  const { place, aqhi, lang, raw } = o;
  const now = o.now ?? new Date();
  const quebec = place.province === 'qc';
  const airAlerts = (o.alertFeatures ? placeAlerts(o.alertFeatures, lang, now) : raw ? cityPageAlerts(raw, lang) : []).filter((a) => a.airQuality);
  const condition = raw ? (parseCurrent(raw, lang)?.condition ?? '') : '';
  const gap = aqhi ? undefined : quebec && o.gap === 'far' ? 'quebec' : (o.gap ?? 'unavailable');
  const focus = o.focus ?? 'aqhi';
  const smoke = smokeSignal({ airAlerts, aqhi, condition });
  // A Quebec place with no AQHI is answered by Info-Smog, so that source leads (it's also the handoff).
  const src = gap === 'quebec' ? [sources.infoSmog(lang), sources.aqhiLocal(lang, false), sources.aqhiAbout(lang)] : [sources.aqhiLocal(lang, Boolean(aqhi)), sources.aqhiAbout(lang)];
  if (quebec && gap !== 'quebec') src.push(sources.infoSmog(lang));
  // Smoke sources only when the widget renders its Smoke section (same rule as WeatherAirQuality `showSmoke`):
  // an AQHI-only answer never lists a source it doesn't show or cite.
  const showSmoke = focus === 'smoke' || smoke || airAlerts.length > 0;
  if (showSmoke) src.push(sources.smokeHealth(lang), sources.smokeForecast(lang));
  if (showSmoke && o.hotspots) src.push(sources.fireMap(lang));
  return {
    status: 'ok',
    live: Boolean(aqhi || o.alertFeatures || o.hotspots),
    place,
    focus,
    aqhi,
    gap,
    nearest: o.nearest ?? null,
    airAlerts,
    hotspots: o.hotspots,
    smoke,
    page: URLS.aqhiLocal[lang],
    lang,
    fetchedAt: now.toISOString(),
    sources: src,
  };
}
