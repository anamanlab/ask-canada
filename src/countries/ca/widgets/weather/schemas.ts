/**
 * Shapes of the upstream feeds (MSC GeoMet city pages, weather alerts and AQHI; CWFIS hotspots; the NRCan
 * Geolocator), validated at the boundary by live.ts. The parsers in model.ts / alerts-model.ts are typed
 * from these, and the lab fixtures build the same shapes.
 *
 * Only the envelope is strict (an item has `properties`, a collection has `features`). Every field inside is
 * "soft": a missing or oddly shaped field becomes undefined instead of failing the whole feed, so one odd
 * value at one station never takes a forecast down. Unknown keys are dropped.
 */
import { z } from 'zod';

const soft = <T extends z.ZodType>(schema: T) => schema.nullish().catch(undefined);

const Scalar = z.union([z.string(), z.number()]);
/** A value, or the same value in both languages ({ en, fr }). */
const Leaf = z.union([Scalar, z.object({ en: Scalar.nullish(), fr: Scalar.nullish() })]);
const leaf = soft(Leaf);
const text = soft(z.string());
/** `{ value: leaf }`, how city pages wrap measurements. */
const valued = soft(z.object({ value: leaf }));

const Wind = z.object({
  speed: valued,
  gust: valued,
  bearing: valued,
  // `{ value: { en, fr } }` in observations and hourly forecasts; older payloads carry `{ en, fr }` directly.
  direction: soft(z.object({ value: leaf, en: Scalar.nullish(), fr: Scalar.nullish() })),
});

const Temperature = z.object({ class: leaf, value: leaf });

const ForecastPeriod = z.object({
  period: soft(z.object({ textForecastName: leaf })),
  temperatures: soft(z.object({ temperature: soft(z.union([z.array(Temperature), Temperature])) })),
  abbreviatedForecast: soft(z.object({ icon: soft(z.object({ value: soft(Scalar) })), textSummary: leaf })),
  textSummary: leaf,
  cloudPrecip: leaf,
  uv: soft(z.object({ index: leaf, category: leaf })),
  humidex: soft(z.object({ calculated: leaf })),
  windChill: soft(z.object({ calculated: leaf })),
});

const HourlyForecast = z.object({
  timestamp: text,
  temperature: valued,
  iconCode: soft(z.object({ value: soft(Scalar) })),
  condition: leaf,
  lop: valued,
  wind: soft(Wind),
  uv: soft(z.object({ index: valued })),
});

const CityWarning = z.object({ description: leaf, type: leaf, alertColourLevel: leaf, eventIssue: leaf, url: leaf });

/** `properties` of one citypageweather-realtime item. */
const CityPage = z.object({
  lastUpdated: text,
  region: leaf,
  currentConditions: soft(
    z.object({
      timestamp: leaf,
      iconCode: soft(z.object({ value: soft(Scalar) })),
      condition: leaf,
      temperature: valued,
      humidex: valued,
      windChill: valued,
      relativeHumidity: valued,
      dewpoint: valued,
      wind: soft(Wind),
      pressure: soft(z.object({ value: leaf, tendency: leaf })),
      station: valued,
    }),
  ),
  forecastGroup: soft(
    z.object({
      regionalNormals: soft(z.object({ temperature: soft(z.array(Temperature)) })),
      forecasts: soft(z.array(ForecastPeriod)),
    }),
  ),
  hourlyForecastGroup: soft(z.object({ hourlyForecasts: soft(z.array(HourlyForecast)) })),
  riseSet: soft(z.object({ sunrise: leaf, sunset: leaf })),
  warnings: soft(z.array(CityWarning)),
});
export const CityItem = z.object({ properties: CityPage });

/** One feature of the weather-alerts collection. */
const AlertFeature = z.object({
  id: soft(Scalar),
  properties: z.object({
    alert_code: text,
    alert_type: text,
    alert_name_en: text,
    alert_name_fr: text,
    alert_short_name_en: text,
    alert_short_name_fr: text,
    alert_text_en: text,
    alert_text_fr: text,
    publication_datetime: text,
    expiration_datetime: text,
    event_end_datetime: text,
    risk_colour_en: text,
    impact_en: text,
    impact_fr: text,
    confidence_en: text,
    confidence_fr: text,
    feature_name_en: text,
    feature_name_fr: text,
    feature_id: soft(Scalar),
    province: text,
    status_en: text,
  }),
});
/** pygeoapi collections carry the server's `timeStamp`: when this list was produced. */
export const AlertCollection = z.object({ timeStamp: text, features: z.array(AlertFeature) });

const AqhiObservation = z.object({
  properties: z.object({ aqhi: soft(Scalar), observation_datetime: text, special_notes_en: text, special_notes_fr: text }),
});
export const AqhiObservations = z.object({ timeStamp: text, features: z.array(AqhiObservation) });

const AqhiForecast = z.object({
  properties: z.object({
    publication_datetime: text,
    forecast_period: soft(
      z.record(z.string(), z.object({ forecast_period_en: text, forecast_period_fr: text, aqhi: soft(Scalar), aqhi_insmoke: soft(Scalar) })),
    ),
  }),
});
export const AqhiForecasts = z.object({ timeStamp: text, features: z.array(AqhiForecast) });

const Hotspot = z.object({ properties: z.object({ lat: soft(Scalar), lon: soft(Scalar) }) });
export const Hotspots = z.object({ features: z.array(Hotspot) });

/** NRCan Geolocator: a flat list of hits from several indexes (`key`: geonames, fsa, locate, nominatim…). */
export const GeolocatorHits = z.array(
  z.object({ key: text, name: text, province: text, category: text, lat: soft(z.number()), lng: soft(z.number()) }),
);

export type Scalar = z.output<typeof Scalar>;
export type Leaf = z.output<typeof leaf>;
export type RawWind = z.output<typeof Wind>;
export type RawCity = z.output<typeof CityPage>;
export type RawAlert = z.output<typeof AlertFeature>;
export type RawAqhiObservation = z.output<typeof AqhiObservation>;
export type RawAqhiForecast = z.output<typeof AqhiForecast>;
export type RawHotspot = z.output<typeof Hotspot>;
