/**
 * Weather, alerts and air quality: verified facts, official pages and live endpoints.
 * Isomorphic (tool on the server, widget on the client). Checked 2026-09-30.
 *
 * Live data (Government of Canada, open data; fetched server-side by tools/weather.ts)
 * - City page weather (current conditions, 7-day forecast, hourly, sunrise/sunset, normals, alerts list):
 *   https://api.weather.gc.ca/collections/citypageweather-realtime/items/{id}  (MSC GeoMet OGC API, ECCC)
 * - Weather alerts with full text, colour, impact and confidence (polygons; bbox query for a place):
 *   https://api.weather.gc.ca/collections/weather-alerts/items
 * - AQHI observations (hourly) and forecasts (period maximums, incl. `aqhi_insmoke`):
 *   https://api.weather.gc.ca/collections/aqhi-observations-realtime/items
 *   https://api.weather.gc.ca/collections/aqhi-forecasts-realtime/items
 * - Satellite fire hotspots, last 24 h (Canadian Wildland Fire Information System, NRCan):
 *   https://cwfis.cfs.nrcan.gc.ca/geoserver/public/ows (WFS, typeName public:hotspots_last24hrs)
 * - Place names and postal-code areas (FSA only is ever sent): NRCan Geolocator https://geolocator.api.geo.ca/
 *
 * Verified facts
 * - Colour-coded alerts: yellow, orange, red (no other colours). Yellow: hazardous weather may cause damage,
 *   disruption or health impacts; moderate, localized and/or short-term; most common. Orange: severe weather
 *   likely to cause significant damage, disruption or health impacts; major, widespread and/or may last a few
 *   days; uncommon. Red: very dangerous, possibly life-threatening weather will cause extreme damage and
 *   disruption; extensive, widespread and prolonged; rare. "Always read the full weather alert text."
 *   Marine warnings are not colour-coded.
 *   Launch date: "As of November 26, 2025, all weather alerts will be colour coded." ECCC news release
 *   https://www.canada.ca/en/environment-climate-change/news/2025/11/colour-coded-weather-alerts.html
 *   (dcterms.issued 2025-11-26; FR .../nouvelles/2025/11/alertes-meteorologiques-par-code-de-couleur.html)
 *   colour-coded-alerts.html (Date modified 2026-02-20; FR alertes-code-couleur.html 2026-03-20)
 * - Alert types: Warnings = act now, severe weather happening or will happen, usually 6 to 24 hours ahead
 *   (tornadoes can come with less than 30 minutes' notice). Advisories = act now, significant but less
 *   severe (blowing snow, fog, freezing drizzle, frost). Watches = get ready, conditions favourable, may be
 *   upgraded. Statements are not colour-coded. Special Air Quality Statements are no longer issued; Air
 *   Quality Warnings are used instead (e.g. smoke). "We issue Special Weather Statements for information
 *   only, they are not an alert", so they are never counted as alerts. weather-alerts.html (2026-08-12)
 * - AQHI: scale 1 to 10+. Low risk 1-3, Moderate 4-6, High 7-10, Very high 10+. People at risk: children,
 *   people over 65, those with health conditions. Recommendations per category for the general population
 *   and people at risk (messages/*.json `aqhi.advice.*`, quoted in plain language). Re-checked 2026-09-30: the
 *   official EN table says "coughing or throat irritation" for moderate/people at risk and "coughing and throat
 *   irritation" elsewhere; the FR table says "de la toux ou une irritation de la gorge" for both moderate rows and
 *   "et" for high and very high. We keep each wording verbatim (scenarios too). Québec uses Info-Smog
 *   instead of the AQHI. info-smog.html (Date modified 2026-07-15, re-checked 2026-09-30): "Quebec is the only
 *   province that uses the Info-Smog program"; forecasts are issued daily at 5:00 a.m. EST (today, tonight and
 *   tomorrow) and 4:00 p.m. EST (evening, tonight and tomorrow); three categories: good, fair, poor (FR: bon,
 *   acceptable, mauvais). During wildfire smoke events the AQHI is calculated hourly from PM2.5 only.
 *   Forecasts are issued at 6 a.m. and 5 p.m. local time. air-quality-health-index/about.html (2026-05-28)
 * - Wildfire smoke: PM2.5 is the main health risk; air quality may be poor even if you can't see or smell
 *   smoke; protect indoor air (windows and doors closed, best filter your system handles, certified portable
 *   air cleaner, change filters, limit exhaust fans); serious symptoms (wheezing, chest pain, severe cough,
 *   shortness of breath) → talk to a health care provider or seek urgent care; emergency → 9-1-1.
 *   Health Canada, wildfire-smoke-health.html (2025-08-12); overview wildfire-smoke.html (2026-07-17):
 *   "Wildfire season typically runs from early April to October."
 *   FR fumee-feu-foret-sante.html (2025-08-12), re-checked 2026-10-01, verbatim: "La qualité de l'air peut être
 *   mauvaise, même si vous ne pouvez pas voir ni sentir la fumée." (messages `smoke.invisible` and the source
 *   quote keep the page's own wording.)
 * - Humidex and wind chill are index values written without a degree sign (checked 2026-10-01): the
 *   weather.gc.ca city page shows "Humidex: 28" beside "Temperature: 22.0°C"; humidex.html (2026-05-13) says
 *   "humidex of 40"; wind-chill-index.html (2025-12-16) says "if the outside temperature is -10ºC, but the
 *   wind chill is -20". The hero line therefore reads "Humidex 41" and "Wind chill −36" (format.ts `useIndex`).
 *   https://www.canada.ca/en/services/environment/weather/severeweather/humidex.html
 *   https://www.canada.ca/en/services/environment/weather/severeweather/wind-chill-index.html
 */
import type { ToolSource } from '@/lib/widgets/types';

const CHECKED = '2026-09-30';
export type Lang = 'en' | 'fr';

export const API = {
  city: (id: string) => `https://api.weather.gc.ca/collections/citypageweather-realtime/items/${encodeURIComponent(id)}?f=json`,
  alerts: 'https://api.weather.gc.ca/collections/weather-alerts/items',
  aqhiObs: 'https://api.weather.gc.ca/collections/aqhi-observations-realtime/items',
  aqhiFcst: 'https://api.weather.gc.ca/collections/aqhi-forecasts-realtime/items',
  hotspots: 'https://cwfis.cfs.nrcan.gc.ca/geoserver/public/ows',
  geolocator: 'https://geolocator.api.geo.ca/',
} as const;

/** Cache windows (seconds) for live feeds. */
export const REVALIDATE = { city: 600, alerts: 300, aqhi: 900, hotspots: 1800, geo: 86_400 } as const;
export const TIMEOUT_MS = 4500;

const C = 'https://www.canada.ca';
export const URLS = {
  colourLaunch: {
    en: `${C}/en/environment-climate-change/news/2025/11/colour-coded-weather-alerts.html`,
    fr: `${C}/fr/environnement-changement-climatique/nouvelles/2025/11/alertes-meteorologiques-par-code-de-couleur.html`,
  },
  forecastHome: { en: 'https://weather.gc.ca/canada_e.html', fr: 'https://meteo.gc.ca/canada_f.html' },
  alertMap: { en: 'https://weather.gc.ca/index_e.html?layers=alert', fr: 'https://meteo.gc.ca/index_f.html?layers=alert' },
  colourCoded: {
    en: `${C}/en/services/environment/weather/severeweather/weather-alerts/colour-coded-alerts.html`,
    fr: `${C}/fr/services/environnement/meteo/conditionsdangereuses/alertes-meteo/alertes-code-couleur.html`,
  },
  alertTypes: {
    en: `${C}/en/services/environment/weather/severeweather/weather-alerts.html`,
    fr: `${C}/fr/services/environnement/meteo/conditionsdangereuses/alertes-meteo.html`,
  },
  aqhiAbout: {
    en: `${C}/en/environment-climate-change/services/air-quality-health-index/about.html`,
    fr: `${C}/fr/environnement-changement-climatique/services/cote-air-sante/a-propos.html`,
  },
  aqhiLocal: { en: 'https://weather.gc.ca/airquality/pages/index_e.html', fr: 'https://meteo.gc.ca/airquality/pages/index_f.html' },
  infoSmog: {
    en: `${C}/en/environment-climate-change/services/info-smog.html`,
    fr: `${C}/fr/environnement-changement-climatique/services/info-smog.html`,
  },
  smokeForecast: { en: 'https://weather.gc.ca/firework/index_e.html', fr: 'https://meteo.gc.ca/firework/index_f.html' },
  smokeHealth: {
    en: `${C}/en/health-canada/services/publications/healthy-living/wildfire-smoke-health.html`,
    fr: `${C}/fr/sante-canada/services/publications/vie-saine/fumee-feu-foret-sante.html`,
  },
  smokeOverview: {
    en: `${C}/en/services/health/healthy-living/environment/air-quality/wildfire-smoke.html`,
    fr: `${C}/fr/services/sante/vie-saine/environnement/qualite-air/fumee-feux-foret.html`,
  },
  fireMap: { en: 'https://cwfis.cfs.nrcan.gc.ca/interactive-map', fr: 'https://cwfis.cfs.nrcan.gc.ca/carte-interactive' },
  weatherCan: {
    en: `${C}/en/environment-climate-change/services/weather-general-tools-resources/weathercan.html`,
    fr: `${C}/fr/environnement-changement-climatique/services/conditions-meteorologiques-ressources-outils-generaux/meteocan.html`,
  },
  weatherTopic: { en: `${C}/en/services/environment/weather.html`, fr: `${C}/fr/services/environnement/meteo.html` },
} as const;

/** A city page on weather.gc.ca / meteo.gc.ca for a point. */
export const cityPageUrl = (lat: number, lon: number, lang: Lang) =>
  lang === 'fr'
    ? `https://meteo.gc.ca/fr/location/index.html?coords=${lat.toFixed(2)},${lon.toFixed(2)}`
    : `https://weather.gc.ca/en/location/index.html?coords=${lat.toFixed(2)},${lon.toFixed(2)}`;

const T = {
  city: { en: 'Local forecast — Environment Canada', fr: 'Prévisions locales — Environnement Canada' },
  alertMap: { en: 'Weather alerts map — Environment Canada', fr: 'Carte des alertes météo — Environnement Canada' },
  colourCoded: { en: 'Colour-coded weather alerts', fr: 'Alertes météo par code de couleur' },
  alertTypes: { en: 'Weather alerts', fr: 'Alertes météo' },
  aqhiLocal: { en: 'Air Quality Health Index — local forecasts', fr: 'Cote air santé — prévisions locales' },
  aqhiAbout: { en: 'About the Air Quality Health Index (AQHI)', fr: 'À propos de la cote air santé (CAS)' },
  infoSmog: { en: 'Info-Smog (Quebec)', fr: 'Info-Smog (Québec)' },
  smokeHealth: { en: 'Wildfire smoke and your health', fr: 'La fumée des feux de forêt et votre santé' },
  smokeForecast: { en: 'FireWork wildfire smoke forecast', fr: 'Prévisions de fumée FireWork' },
  fireMap: { en: 'Canadian Wildland Fire Information System', fr: 'Système canadien d’information sur les feux de végétation' },
};

const src = (k: keyof typeof T, url: string, lang: Lang, extra: Partial<ToolSource> = {}): ToolSource => ({
  title: T[k][lang],
  url,
  checked: CHECKED,
  ...extra,
});

export const sources = {
  city: (url: string, lang: Lang, live = true) => src('city', url, lang, { live }),
  alertMap: (lang: Lang, live = true) => src('alertMap', URLS.alertMap[lang], lang, { live }),
  colourCoded: (lang: Lang) =>
    src('colourCoded', URLS.colourCoded[lang], lang, {
      updated: lang === 'fr' ? '2026-03-20' : '2026-02-20',
      quote:
        lang === 'fr'
          ? 'Les couleurs des alertes météo passent du jaune à l’orange, puis au rouge, à mesure que le risque augmente.'
          : 'The weather alert colours move from yellow, to orange, to red, as the potential risk increases.',
    }),
  alertTypes: (lang: Lang) => src('alertTypes', URLS.alertTypes[lang], lang, { updated: '2026-08-12' }),
  aqhiLocal: (lang: Lang, live = true) => src('aqhiLocal', URLS.aqhiLocal[lang], lang, { live }),
  aqhiAbout: (lang: Lang) =>
    src('aqhiAbout', URLS.aqhiAbout[lang], lang, {
      updated: '2026-05-28',
      quote:
        lang === 'fr'
          ? 'La cote air santé (CAS) est mesurée sur une échelle de 1 à 10+.'
          : 'The AQHI is a scale ranging from 1-10+. It shows you the risk that air quality in your area may have on your health.',
    }),
  infoSmog: (lang: Lang) => src('infoSmog', URLS.infoSmog[lang], lang, { updated: '2026-07-15' }),
  smokeHealth: (lang: Lang) =>
    src('smokeHealth', URLS.smokeHealth[lang], lang, {
      updated: '2025-08-12',
      quote:
        lang === 'fr'
          ? 'La qualité de l’air peut être mauvaise, même si vous ne pouvez pas voir ni sentir la fumée.'
          : 'Air quality may be poor even if you can’t see or smell smoke.',
    }),
  smokeForecast: (lang: Lang) => src('smokeForecast', URLS.smokeForecast[lang], lang, { live: true }),
  fireMap: (lang: Lang, live = true) => src('fireMap', URLS.fireMap[lang], lang, { live }),
};

/** Official alert colours (only these three exist). */
export const ALERT_COLOURS = ['red', 'orange', 'yellow'] as const;
export type AlertColour = (typeof ALERT_COLOURS)[number];

/** AQHI risk categories (about.html). */
export type AqhiCategory = 'low' | 'moderate' | 'high' | 'very-high';
export function aqhiCategory(value: number): AqhiCategory {
  const v = Math.round(value);
  if (v <= 3) return 'low';
  if (v <= 6) return 'moderate';
  if (v <= 10) return 'high';
  return 'very-high';
}

/** AQHI community must be this close to speak for a place (community averages; see about.html). */
export const AQHI_MAX_KM = 60;
/** Radius for satellite fire hotspots around a place. */
export const HOTSPOT_RADIUS_KM = 100;

export const PROVINCES = ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'nt', 'nu', 'on', 'pe', 'qc', 'sk', 'yt'] as const;
export type Province = (typeof PROVINCES)[number];

/**
 * The one freshness rule (hero "Now", hourly "Now", the "Live" badge, the source's live flag and the scripted
 * prose all use it). Environment Canada's observations are hourly: stamped HH:00 and published a few minutes
 * later (AQHI readings later still), so the newest one is routinely 60 to 75 minutes old just before the next
 * lands. A reading is current for 90 minutes; past that, a cycle was missed and it is "the latest", not "now".
 */
export const FRESH_WINDOW_MS = 90 * 60 * 1000;
export const isStale = (at: string, fetchedAt: string) => Date.parse(fetchedAt) - Date.parse(at) > FRESH_WINDOW_MS;
/** True when every given stamp is fresh at `fetchedAt` (missing stamps are ignored). */
export const isLive = (fetchedAt: string, ...stamps: (string | null | undefined)[]) => stamps.every((s) => !s || !isStale(s, fetchedAt));
