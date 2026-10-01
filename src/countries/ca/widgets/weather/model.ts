/**
 * Pure transforms from the raw MSC GeoMet / CWFIS JSON into the widget's compact model (isomorphic, no
 * network): conditions, forecast periods, hours, sun, normals, AQHI and fire hotspots. Alerts are in
 * alerts-model.ts. The tool (server) and the fixtures (lab) both go through these, so what you see in the
 * lab is exactly what a live answer renders. Input types come from schemas.ts (validated in live.ts).
 */
import { aqhiCategory, type Lang } from './data';
import { distanceKm } from './geo';
import type { Leaf, RawAqhiForecast, RawAqhiObservation, RawCity, RawHotspot, RawWind, Scalar } from './schemas';
import type { Alert, AqhiNow, Current, Day, Hour, Hotspots, Period, Sky, Wind } from './types';

/** Bilingual leaf ({ en, fr }) → the value in our language (English when ours is missing). */
export const L = (v: Leaf, lang: Lang): Scalar | undefined => {
  if (v == null) return undefined;
  return typeof v === 'object' ? (v[lang] ?? v.en ?? undefined) : v;
};
/** The same, as text ('' when missing). */
export const str = (v: Leaf, lang: Lang): string => {
  const x = L(v, lang);
  return x == null ? '' : String(x);
};
/**
 * Typographic apostrophes in wording taken from the feeds ("Aujourd'hui" → "Aujourd’hui", "l'air" → "l’air"),
 * so feed text and the widget's own strings use one form. Only an apostrophe between two letters changes.
 */
export const typo = (s: string) => s.replace(/(?<=\p{L})'(?=\p{L})/gu, '’');
/** A feed value shown as wording (a period name, a summary, a condition): text with typographic apostrophes. */
export const words = (v: Leaf, lang: Lang): string => typo(str(v, lang));
const optional = (v: Leaf, lang: Lang): string | undefined => words(v, lang) || undefined;
const num = (v: Scalar | null | undefined): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/** ECCC icon code → sky family. Codes 30–39 are the night versions. */
const SKY: Record<number, Sky> = {
  0: 'clear', 1: 'mostly-clear', 2: 'partly-cloudy', 3: 'mostly-cloudy', 4: 'mostly-cloudy', 5: 'partly-cloudy',
  6: 'showers', 7: 'mixed', 8: 'flurries', 9: 'thunder', 10: 'cloudy', 11: 'rain', 12: 'rain', 13: 'rain', 14: 'freezing',
  15: 'mixed', 16: 'flurries', 17: 'snow', 18: 'snow', 19: 'thunder', 20: 'fog', 21: 'fog', 22: 'partly-cloudy', 23: 'haze',
  24: 'fog', 25: 'blowing-snow', 26: 'snow', 27: 'hail', 28: 'drizzle', 29: 'cloudy', 30: 'clear', 31: 'mostly-clear',
  32: 'partly-cloudy', 33: 'mostly-cloudy', 34: 'mostly-cloudy', 35: 'partly-cloudy', 36: 'showers', 37: 'mixed',
  38: 'flurries', 39: 'thunder', 40: 'blowing-snow', 41: 'tornado', 42: 'tornado', 43: 'wind', 44: 'smoke', 45: 'dust',
  46: 'hail', 47: 'thunder', 48: 'tornado',
};
function skyOf(code: number | undefined): { sky: Sky; night: boolean } {
  const c = code ?? 10;
  return { sky: SKY[c] ?? 'cloudy', night: c >= 30 && c <= 39 };
}

const POP = /(\d{1,3})\s*(?:percent|pour cent|%)/i;

function windOf(w: RawWind | null | undefined, lang: Lang): Wind | undefined {
  const speed = num(L(w?.speed?.value, lang));
  if (speed == null) return undefined;
  const gust = num(L(w?.gust?.value, lang));
  const dir = L(w?.direction?.value, lang) ?? L(w?.direction, lang);
  return {
    speed,
    gust: gust && gust > speed ? gust : undefined,
    dir: typeof dir === 'string' ? dir : undefined,
    bearing: num(L(w?.bearing?.value, lang)),
  };
}

const sameDay = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 18 * 3600_000;

export function parseCurrent(p: RawCity, lang: Lang, sun?: { rise: string; set: string } | null): Current | null {
  const cc = p.currentConditions;
  const observedAt = str(cc?.timestamp, lang);
  if (!cc || !observedAt) return null;
  const temp = num(L(cc.temperature?.value, lang)) ?? null;
  const code = num(cc.iconCode?.value);
  const { sky } = skyOf(code);
  let { night } = skyOf(code);
  // Codes without a night version (snow, fog, smoke…) don't say whether it's dark: ask the sun.
  if (sun && !night && sameDay(observedAt, sun.rise)) night = observedAt < sun.rise || observedAt > sun.set;
  const humidex = num(L(cc.humidex?.value, lang));
  const chill = num(L(cc.windChill?.value, lang));
  // ECCC reports wind chill at or below 0 °C and humidex from about 20 °C; ignore stray values outside that.
  const feelsLike =
    temp != null && chill != null && temp <= 0 && chill < temp
      ? { value: chill, kind: 'windchill' as const }
      : temp != null && humidex != null && temp >= 20 && humidex >= temp + 1
        ? { value: humidex, kind: 'humidex' as const }
        : undefined;
  // ECCC observations are Title Case ("Light Drizzle"); forecasts are sentence case. Match the forecasts.
  const rawCondition = words(cc.condition, lang).trim();
  const condition = rawCondition ? rawCondition.charAt(0).toUpperCase() + rawCondition.slice(1).toLowerCase() : '';
  const kPa = num(L(cc.pressure?.value, lang));
  return {
    observedAt,
    temp,
    condition,
    sky: code == null && /smoke|fumée/i.test(condition) ? 'smoke' : sky,
    night,
    feelsLike,
    humidity: num(L(cc.relativeHumidity?.value, lang)),
    dewpoint: num(L(cc.dewpoint?.value, lang)),
    wind: windOf(cc.wind, lang),
    pressure: kPa != null ? { kPa, tendency: optional(cc.pressure?.tendency, lang) } : undefined,
    station: optional(cc.station?.value, lang),
  };
}

export function parsePeriods(p: RawCity, lang: Lang): Period[] {
  return (p.forecastGroup?.forecasts ?? []).map((f) => {
    const t = f.temperatures?.temperature;
    const first = Array.isArray(t) ? t[0] : t;
    const cls = L(first?.class, lang);
    const code = num(f.abbreviatedForecast?.icon?.value);
    const text = words(f.textSummary, lang);
    const cloud = str(f.cloudPrecip, lang);
    return {
      name: words(f.period?.textForecastName, lang),
      night: cls === 'low' || (code != null && code >= 30 && code <= 39),
      temp: num(L(first?.value, lang)) ?? null,
      summary: words(f.abbreviatedForecast?.textSummary, lang),
      text,
      sky: skyOf(code).sky,
      pop: num((cloud.match(POP) ?? text.match(POP))?.[1]),
      uv: num(L(f.uv?.index, lang)),
      uvCategory: optional(f.uv?.category, lang),
      humidex: num(L(f.humidex?.calculated, lang)),
      windChill: num(L(f.windChill?.calculated, lang)),
    };
  });
}

/** Pair day and night periods into rows ("Tonight" alone when the forecast starts in the evening). */
export function toDays(periods: Period[]): Day[] {
  const days: Day[] = [];
  for (const p of periods) {
    const last = days[days.length - 1];
    if (p.night && last && !last.night && last.day) {
      last.night = p;
      last.low = p.temp;
      last.pop = Math.max(last.pop ?? 0, p.pop ?? 0) || undefined;
      continue;
    }
    days.push({
      key: `${days.length}-${p.name}`,
      label: p.name,
      day: p.night ? undefined : p,
      night: p.night ? p : undefined,
      high: p.night ? null : p.temp,
      low: p.night ? p.temp : null,
      pop: p.pop,
      sky: p.sky,
    });
  }
  return days.slice(0, 7);
}

export function parseHours(p: RawCity, lang: Lang, limit = 24): Hour[] {
  return (p.hourlyForecastGroup?.hourlyForecasts ?? []).slice(0, limit).flatMap((h) => {
    if (!h.timestamp) return [];
    const { sky, night } = skyOf(num(h.iconCode?.value));
    const pop = num(L(h.lop?.value, lang));
    return [
      {
        at: h.timestamp,
        temp: num(L(h.temperature?.value, lang)) ?? null,
        sky,
        night,
        condition: words(h.condition, lang),
        pop: pop != null && pop > 0 ? pop : undefined,
        wind: windOf(h.wind, lang),
        uv: num(L(h.uv?.index?.value, lang)),
      },
    ];
  });
}

export function parseSun(p: RawCity): { rise: string; set: string } | null {
  const rise = L(p.riseSet?.sunrise, 'en');
  const set = L(p.riseSet?.sunset, 'en');
  return typeof rise === 'string' && typeof set === 'string' ? { rise, set } : null;
}

export function parseNormals(p: RawCity, lang: Lang) {
  const list = p.forecastGroup?.regionalNormals?.temperature ?? [];
  const get = (c: string) => num(L(list.find((t) => L(t.class, lang) === c)?.value, lang)) ?? null;
  return { normalHigh: get('high'), normalLow: get('low') };
}

/* ------------------------------------------------------------------ air quality */

/**
 * "Tomorrow Night" → "Tomorrow night" (ECCC's AQHI periods are Title Case in English; French is kept as sent).
 * The evening issuance ends with "Day 3" / "Jour 3", which means nothing to a resident: day 1 is the day it was
 * published (Today/Tonight), day 2 is Tomorrow, so day N is the publication's local date + N − 1 ("Friday").
 */
const periodLabel = (s: string, lang: Lang, publishedAt?: string | null, tz?: string) => {
  const day = s.match(/^(?:day|jour)\s+(\d+)$/i);
  if (day && publishedAt && tz && Number.isFinite(Date.parse(publishedAt))) {
    const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(publishedAt)).split('-').map(Number);
    const name = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d + Number(day[1]) - 1)));
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return lang === 'fr' || !s ? s : s.charAt(0).toUpperCase() + s.slice(1).toLocaleLowerCase('en-CA');
};

/** AQHI readings are shown as whole numbers from 1 (1.4 → 1, 0.3 → 1). */
const whole = (v: number) => Math.max(1, Math.round(v));

export function parseAqhi(
  obs: RawAqhiObservation | undefined,
  fcst: RawAqhiForecast | undefined,
  community: { id: string; name: string; km: number },
  lang: Lang,
  /** The place's time zone, to name "Day 3" by its weekday. */
  tz?: string,
): AqhiNow {
  const o = obs?.properties;
  const raw = num(o?.aqhi);
  const value = raw != null ? whole(raw) : null;
  const publishedAt = fcst?.properties.publication_datetime ?? undefined;
  const periods = fcst?.properties.forecast_period ?? {};
  const forecast = Object.keys(periods)
    .sort()
    .flatMap((k) => {
      const p = periods[k];
      const v = num(p.aqhi);
      if (v == null) return [];
      const smoke = num(p.aqhi_insmoke);
      return [{ label: typo(periodLabel((lang === 'fr' ? p.forecast_period_fr : p.forecast_period_en) ?? '', lang, publishedAt, tz)), value: whole(v), inSmoke: smoke != null ? whole(smoke) : null }];
    });
  const note = typo(((lang === 'fr' ? o?.special_notes_fr : o?.special_notes_en) ?? '').trim());
  return {
    communityId: community.id,
    community: community.name,
    distanceKm: community.km,
    value,
    category: value != null ? aqhiCategory(value) : forecast[0] ? aqhiCategory(forecast[0].value) : null,
    observedAt: o?.observation_datetime ?? undefined,
    forecast,
    publishedAt,
    note: note || undefined,
  };
}

/** Satellite hotspots → how many within the radius and how close the nearest is. */
export function summarizeHotspots(features: RawHotspot[], lat: number, lon: number, radiusKm: number): Hotspots {
  let count = 0;
  let nearest: number | null = null;
  for (const f of features) {
    const d = distanceKm(lat, lon, Number(f.properties.lat), Number(f.properties.lon));
    if (!Number.isFinite(d) || d > radiusKm) continue;
    count++;
    if (nearest == null || d < nearest) nearest = d;
  }
  return { count, nearestKm: nearest == null ? null : Math.round(nearest), radiusKm };
}

/** A hint of smoke: an air quality alert, smoke in the observed conditions, or an in-smoke AQHI forecast. */
export function smokeSignal(opts: { airAlerts: Alert[]; aqhi: AqhiNow | null; condition?: string }) {
  const { airAlerts, aqhi, condition } = opts;
  return airAlerts.length > 0 || /smoke|fumée/i.test(condition ?? '') || Boolean(aqhi?.forecast.some((f) => f.inSmoke != null));
}
