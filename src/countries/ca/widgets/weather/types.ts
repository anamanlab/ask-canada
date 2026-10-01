/** Shapes shared by the weather tools (server) and renderers (client). All JSON-serializable. */
import type { ToolSource } from '@/lib/widgets/types';
import type { AlertColour, AqhiCategory, Lang, Province } from './data';

/** Sky/icon family derived from ECCC icon codes. */
export type Sky =
  | 'clear'
  | 'mostly-clear'
  | 'partly-cloudy'
  | 'mostly-cloudy'
  | 'cloudy'
  | 'drizzle'
  | 'showers'
  | 'rain'
  | 'freezing'
  | 'mixed'
  | 'flurries'
  | 'snow'
  | 'blowing-snow'
  | 'thunder'
  | 'hail'
  | 'fog'
  | 'haze'
  | 'smoke'
  | 'dust'
  | 'wind'
  | 'tornado';

export type PlaceLite = { id: string; name: string; province: Province; lat: number; lon: number };

export type Place = PlaceLite & {
  /** IANA time zone used to show local times. */
  tz: string;
  /** How the place was found. */
  via: 'name' | 'nearest' | 'coords';
  /** What the person typed (for "nearest to …" copy). */
  query?: string;
  /** Distance from the searched point to this forecast location (km), when found by proximity. */
  distanceKm?: number;
  /** Other places with the same name (e.g. Windsor, NS when Windsor, ON was picked). */
  others?: PlaceLite[];
};

export type Wind = { speed: number; gust?: number; dir?: string; bearing?: number };

export type Current = {
  observedAt: string;
  temp: number | null;
  condition: string;
  sky: Sky;
  night: boolean;
  feelsLike?: { value: number; kind: 'humidex' | 'windchill' };
  humidity?: number;
  dewpoint?: number;
  wind?: Wind;
  pressure?: { kPa: number; tendency?: string };
  station?: string;
};

export type Period = {
  /** e.g. "Today", "Tonight", "Thursday night" (localized by ECCC). */
  name: string;
  night: boolean;
  temp: number | null;
  summary: string;
  text: string;
  sky: Sky;
  pop?: number;
  uv?: number;
  /** ECCC's UV category word ("moderate", "modéré"). */
  uvCategory?: string;
  humidex?: number;
  windChill?: number;
};

export type Day = {
  key: string;
  /** Day label (Today / Thursday / …). */
  label: string;
  day?: Period;
  night?: Period;
  high: number | null;
  low: number | null;
  pop?: number;
  sky: Sky;
};

export type Hour = { at: string; temp: number | null; sky: Sky; night: boolean; condition: string; pop?: number; wind?: Wind; uv?: number };

export type AlertType = 'warning' | 'watch' | 'advisory' | 'statement' | 'other';

export type Alert = {
  id: string;
  colour: AlertColour | null;
  type: AlertType;
  /** Hazard name, e.g. "Fog", "Heat", "Air quality" (localized). */
  hazard: string;
  /** Official short name, e.g. "Fog (advisory)". */
  name: string;
  issuedAt?: string;
  endsAt?: string;
  area: string;
  province?: string;
  impact?: string;
  confidence?: string;
  /** Paragraphs of the official alert text (may be empty for some alerts). */
  text: string[];
  url: string;
  airQuality: boolean;
};

export type AqhiNow = {
  communityId: string;
  community: string;
  distanceKm: number;
  value: number | null;
  category: AqhiCategory | null;
  observedAt?: string;
  forecast: { label: string; value: number; inSmoke?: number | null }[];
  publishedAt?: string;
  note?: string;
};

export type Hotspots = { count: number; nearestKm: number | null; radiusKm: number };

/** What a forecast question is about. `tomorrow` and `weekend` lead with the 7-day list, that day's row open. */
export type ForecastFocus = 'now' | 'week' | 'hourly' | 'tomorrow' | 'weekend';

type Base = { lang: Lang; fetchedAt: string; sources: ToolSource[] };

/** One choice for an ambiguous name. `near`: the forecast location that answers for a town that isn't one itself. */
export type PlaceOption = PlaceLite & { near?: string };

export type LocateFailure =
  | { status: 'need-location'; popular: PlaceLite[] }
  | { status: 'not-found'; query: string; popular: PlaceLite[] }
  /** The place lookup itself didn't answer (not "no such place"): try again, or pick a city. */
  | { status: 'lookup-unavailable'; query: string; popular: PlaceLite[] }
  | { status: 'ambiguous'; query: string; options: PlaceOption[] };

export type ForecastOutput = Base &
  (
    | LocateFailure
    | { status: 'unavailable'; place: Place; page: string }
    | {
        status: 'ok';
        live: true;
        place: Place;
        page: string;
        updatedAt: string;
        current: Current | null;
        today: { high: number | null; low: number | null; normalHigh: number | null; normalLow: number | null };
        days: Day[];
        hours: Hour[];
        alerts: Alert[];
        aqhi: AqhiNow | null;
        sun: { rise: string; set: string } | null;
        focus: 'now' | 'week' | 'hourly';
        /** `key` of the row to open in the 7-day list (tomorrow, or the weekend's first day), when asked. */
        openDay?: string;
      }
  );

/** One area under a hazard: its own provinces (a boundary area is filed under two) and its own end time. */
export type AlertArea = { name: string; provinces: string[]; endsAt?: string };

export type AlertGroup = {
  key: string;
  colour: AlertColour | null;
  type: AlertType;
  hazard: string;
  name: string;
  /** Per-area records, so a province filter can show that province's areas and end time only (alert-view.ts). */
  areas: AlertArea[];
  provinces: string[];
  airQuality: boolean;
  /** Main time zone of the group's first province or territory. */
  tz: string;
};

export type AlertsOutput = Base &
  (
    | LocateFailure
    | { status: 'unavailable'; place?: Place; province?: Province; page: string }
    | { status: 'ok'; scope: 'place'; live: true; place: Place; page: string; alerts: Alert[]; servedAt?: string }
    | {
        status: 'ok';
        scope: 'canada' | 'province';
        live: true;
        province?: Province;
        page: string;
        /** Distinct areas at their most serious colour (the chips add up to `total`). */
        counts: Record<AlertColour, number>;
        /** Distinct areas under a colour-coded alert (statements are not alerts). */
        total: number;
        /** Distinct areas under a special weather statement (information only, not an alert). */
        statements: number;
        groups: AlertGroup[];
        /** When Environment Canada served this list (if older than the fetch). */
        servedAt?: string;
      }
  );

export type AirOutput = Base &
  (
    /** `focus` is what was asked (AQHI or wildfire smoke), so the picker can ask the same question again. */
    | (LocateFailure & { focus?: 'aqhi' | 'smoke' })
    | {
        status: 'ok';
        live: boolean;
        place: Place;
        focus: 'aqhi' | 'smoke';
        aqhi: AqhiNow | null;
        /** Why there is no AQHI reading. */
        gap?: 'quebec' | 'far' | 'unavailable';
        nearest?: { name: string; distanceKm: number } | null;
        airAlerts: Alert[];
        hotspots: Hotspots | null;
        /** Heuristic: an air quality alert, smoke in the conditions, or AQHI moderate or worse. */
        smoke: boolean;
        page: string;
      }
  );
