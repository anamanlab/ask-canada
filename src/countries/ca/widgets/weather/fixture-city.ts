/**
 * The lab fixtures' clocks and the city-page builder: a short spec → the exact shape of the live MSC GeoMet
 * city page, so fixtures run through the same parsers as live answers. The places are in fixture-data.ts;
 * weather-alerts, AQHI and CWFIS hotspot inputs are in fixture-alerts.ts.
 */
import type { RawCity } from './schemas';

export type Bi = [string, string?];
const bi = ([en, fr]: Bi) => ({ en, fr: fr ?? en });
const val = (v: number | string) => ({ en: v, fr: v });

export const NOW = new Date('2026-09-30T11:00:00Z'); // Wed 7 a.m. EDT
/** Wed 14 Jan 2026, 4 p.m. CST: a prairie blizzard (normal high −11, low −21). */
export const WINTER_NOW = new Date('2026-01-14T22:00:00Z');
/** Wed 15 Jul 2026, 1 p.m. EDT: southern Ontario heat (normal high 27, low 18). */
export const HEAT_NOW = new Date('2026-07-15T17:00:00Z');
/** Wed 19 Aug 2026, 1 p.m. PDT: Okanagan wildfire smoke (normal high 28, low 12). */
export const SMOKE_NOW = new Date('2026-08-19T20:00:00Z');
export const at = (h: number, base: Date = NOW) => new Date(base.getTime() + h * 3600_000).toISOString().replace('.000Z', 'Z');

type PeriodSpec = {
  name: Bi;
  low?: boolean;
  temp: number;
  icon: number;
  summary: Bi;
  text: Bi;
  uv?: [number, Bi];
  humidex?: number;
  windChill?: number;
};

type CitySpec = {
  id: string;
  name: Bi;
  region: Bi;
  lat: number;
  lon: number;
  current?: {
    temp: number;
    icon: number;
    condition: Bi;
    humidity?: number;
    dewpoint?: number;
    wind?: [number, string, string, number, number?];
    pressure?: [number, Bi];
    humidex?: number;
    windChill?: number;
    station?: Bi;
  };
  normals: [number, number];
  periods: PeriodSpec[];
  /** [temp, icon, lop, condition] per hour starting now. */
  hours: [number, number, number, Bi, number?, string?][];
  /** Sunrise/sunset, hours from NOW (not shifted). */
  sun?: [number, number];
  /** Hours to shift the observation and hourly forecast (e.g. to show an afternoon). */
  shift?: number;
  /** The fixture's clock (default NOW). */
  base?: Date;
  warnings?: { colour: string; desc: Bi; type: string; url: Bi }[];
};

export function cityRaw(s: CitySpec): RawCity {
  const sh = (h: number) => at(h + (s.shift ?? 0), s.base);
  return {
    lastUpdated: sh(-0.95),
    region: bi(s.region),
    currentConditions: s.current
      ? {
          iconCode: { value: s.current.icon },
          timestamp: val(sh(-1)),
          condition: bi(s.current.condition),
          temperature: { value: val(s.current.temp) },
          relativeHumidity: s.current.humidity != null ? { value: val(s.current.humidity) } : undefined,
          dewpoint: s.current.dewpoint != null ? { value: val(s.current.dewpoint) } : undefined,
          wind: s.current.wind
            ? {
                speed: { value: val(s.current.wind[0]) },
                direction: { value: { en: s.current.wind[1], fr: s.current.wind[2] } },
                bearing: { value: val(s.current.wind[3]) },
                gust: s.current.wind[4] != null ? { value: val(s.current.wind[4]) } : undefined,
              }
            : undefined,
          pressure: s.current.pressure ? { value: val(s.current.pressure[0]), tendency: bi(s.current.pressure[1]) } : undefined,
          humidex: s.current.humidex != null ? { value: val(s.current.humidex) } : undefined,
          windChill: s.current.windChill != null ? { value: val(s.current.windChill) } : undefined,
          station: s.current.station ? { value: bi(s.current.station) } : undefined,
        }
      : {},
    forecastGroup: {
      regionalNormals: {
        temperature: [
          { class: val('high'), value: val(s.normals[0]) },
          { class: val('low'), value: val(s.normals[1]) },
        ],
      },
      forecasts: s.periods.map((p) => ({
        period: { textForecastName: bi(p.name) },
        temperatures: { temperature: [{ class: val(p.low ? 'low' : 'high'), value: val(p.temp) }] },
        abbreviatedForecast: { icon: { value: p.icon }, textSummary: bi(p.summary) },
        cloudPrecip: bi(p.text),
        textSummary: bi(p.text),
        uv: p.uv ? { index: val(String(p.uv[0])), category: bi(p.uv[1]) } : undefined,
        humidex: p.humidex != null ? { calculated: val(String(p.humidex)) } : undefined,
        windChill: p.windChill != null ? { calculated: val(String(p.windChill)) } : undefined,
      })),
    },
    hourlyForecastGroup: {
      hourlyForecasts: s.hours.map(([temp, icon, lop, cond, wind, dir], i) => ({
        timestamp: sh(i),
        temperature: { value: val(temp) },
        iconCode: { value: icon },
        lop: { value: val(lop) },
        condition: bi(cond),
        wind: { speed: { value: val(wind ?? 10) }, direction: { value: val(dir ?? 'S') } },
      })),
    },
    riseSet: s.sun ? { sunrise: val(at(s.sun[0], s.base)), sunset: val(at(s.sun[1], s.base)) } : undefined,
    warnings: s.warnings?.map((w) => ({
      alertColourLevel: val(w.colour),
      description: bi(w.desc),
      type: val(w.type),
      url: bi(w.url),
      eventIssue: val(at(-3, s.base)),
    })),
  };
}
