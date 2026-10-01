/** Lab fixtures for `weatherForecast`: every state and edge case, built through the live code path. */
import type { Fixture } from '@/lib/widgets/types';
import { forecastOutput, pickerSources, placeById } from './assemble';
import type { Lang } from './data';
import { optionsFor } from './geocode';
import { AIR_QUALITY, BLIZZARD, EXTREME_COLD, HEAT } from './fixture-alerts';
import { HEAT_NOW, NOW, SMOKE_NOW, WINTER_NOW } from './fixture-city';
import { BANFF, IQALUIT, KELOWNA_SMOKE, OTTAWA, QUEBEC_FR, TORONTO_HEAT, WINNIPEG } from './fixture-data';
import { aqhi, hoursAfter, lite, minutesAfter, part } from './lab-kit';
import { popularPlaces } from './places';

export function forecasts(lang: Lang): Fixture[] {
  const ottawa = placeById('on-118', lang);
  const OTTAWA_AQHI = aqhi('FEVNT', ['Ottawa'], 3, 1.66, [['today', 2], ['tonight', 2], ['tomorrow', 2], ['tomorrowNight', 3]], { lang });
  // As the live tool answers when it needs a place first: the same sources (assemble.ts `pickerSources`).
  const picker = { lang, fetchedAt: NOW.toISOString(), sources: pickerSources.forecast(lang) };
  return [
    { name: 'Forecast · streaming input (skeleton)', toolName: 'weatherForecast', part: part('weatherForecast', 'input-streaming', undefined, { location: 'Otta' }) },
    { name: 'Forecast · running (skeleton)', toolName: 'weatherForecast', part: part('weatherForecast', 'input-available', undefined, { location: 'Ottawa' }) },
    {
      name: 'Forecast · Ottawa, drizzly morning (live values, 2026-09-30)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', forecastOutput({ place: ottawa, raw: OTTAWA, alertFeatures: [], aqhi: OTTAWA_AQHI, lang, now: NOW })),
      note: 'Hero case: warmer than normal insight, “Now” slot matching the hero, sunrise and sunset in the hourly strip, AQHI tile that asks a follow-up.',
    },
    {
      // Hourly observations are stamped HH:00 and published a few minutes later: just past the hour the newest
      // one is over 60 minutes old, and that is still "now" (one freshness rule: data.ts `isStale`, 90 minutes).
      name: 'Forecast · Ottawa, 62 minutes after the observation (still “Now” and “Live”: one freshness rule)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', forecastOutput({ place: ottawa, raw: OTTAWA, alertFeatures: [], aqhi: OTTAWA_AQHI, lang, now: minutesAfter(NOW, 2) })),
      note: 'fetchedAt = observedAt + 62 min. Hero “Now · observed 6 a.m.”, hourly strip starts with “Now”, badge “Live”: they never disagree.',
    },
    {
      name: 'Forecast · Ottawa, only a 4-hour-old copy came back (badge says “Updated”, not “Live”)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', forecastOutput({ place: ottawa, raw: OTTAWA, alertFeatures: [], aqhi: OTTAWA_AQHI, lang, now: hoursAfter(NOW, 4) })),
      note: 'Live refetch failed: the hero says “Latest · observed …”, the hourly strip drops “Now”, and the badge is neutral.',
    },
    {
      name: 'Forecast · Winnipeg blizzard, a January afternoon (orange + yellow warnings, wind chill, sunset in the strip)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({
          place: placeById('mb-38', lang),
          raw: { ...WINNIPEG, currentConditions: { ...WINNIPEG.currentConditions, iconCode: { value: 40 } } },
          alertFeatures: [EXTREME_COLD, BLIZZARD],
          aqhi: aqhi('GBEIN', ['Winnipeg'], 2, 2.2, [['today', 3], ['tonight', 2], ['tomorrow', 3], ['tomorrowNight', 2]], { lang, now: WINTER_NOW, tz: 'America/Winnipeg' }),
          lang,
          now: WINTER_NOW,
        }),
      ),
    },
    {
      name: 'Forecast · Toronto heat, a July afternoon (humidex 41, yellow heat warning, AQHI 5)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({
          place: placeById('on-143', lang),
          raw: TORONTO_HEAT,
          alertFeatures: [HEAT],
          aqhi: aqhi('FEUZB', ['Toronto'], 0, 5.2, [['today', 6], ['tonight', 4], ['tomorrow', 6], ['tomorrowNight', 4]], { lang, now: HEAT_NOW }),
          lang,
          now: HEAT_NOW,
          focus: 'week',
        }),
      ),
      note: 'focus: week puts the 7-day list before the hourly strip.',
    },
    {
      name: 'Forecast · Kelowna in wildfire smoke, an August afternoon (orange air quality warning, AQHI 8)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({
          place: placeById('bc-48', lang),
          raw: KELOWNA_SMOKE,
          alertFeatures: [AIR_QUALITY],
          aqhi: aqhi('JAFUV', ['Central Okanagan', 'Okanagan - centre'], 0, 8.4, [['today', 8, 9], ['tonight', 7, 8], ['tomorrow', 7, 9], ['tomorrowNight', 5]], { lang, now: SMOKE_NOW, tz: 'America/Vancouver' }),
          lang,
          now: SMOKE_NOW,
        }),
      ),
    },
    {
      name: 'Forecast · Iqaluit, no current observation, forecast starts tonight',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', forecastOutput({ place: placeById('nu-21', lang), raw: IQALUIT, alertFeatures: [], aqhi: null, lang, now: hoursAfter(NOW, 11) })),
    },
    {
      // Castle Junction (NRCan geonames 51.2686, −115.9192) has no forecast page of its own; its nearest is Banff.
      name: 'Forecast · nearest location to a place that isn’t one (Castle Junction → Banff)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({ place: placeById('ab-49', lang, 'nearest', { query: 'Castle Junction', distanceKm: 26 }), raw: BANFF, alertFeatures: [], aqhi: null, lang, now: hoursAfter(NOW, 4) }),
      ),
      note: 'Banff’s own morning (Mountain time, real sunrise 7:40 a.m. and sunset 7:22 p.m.); checks the “nearest forecast” line.',
    },
    {
      name: 'Forecast · Windsor, ON picked, with Windsor, NS offered (July heat)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({ place: placeById('on-94', lang, 'name', { query: 'Windsor', others: lite(['ns-15'], lang) }), raw: TORONTO_HEAT, alertFeatures: [], aqhi: null, lang, now: HEAT_NOW }),
      ),
    },
    {
      name: 'Forecast · Québec in French (long strings, fog, 24 h clock)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({
          place: placeById('qc-133', 'fr'),
          raw: QUEBEC_FR,
          alertFeatures: [],
          aqhi: aqhi('EHTWR', ['Quebec', 'Québec'], 4, 2.1, [['today', 2], ['tonight', 2], ['tomorrow', 3], ['tomorrowNight', 2]], { lang: 'fr' }),
          lang: 'fr',
          now: NOW,
        }),
      ),
      note: 'Data text is French (lang: fr); view with ?lang=fr for the full French UI.',
    },
    {
      // As the live Québec answer on a calm night: no wind reading and no UV index, so four tiles remain.
      name: 'Forecast · Québec, calm with no UV reading (4 detail tiles lay out 2 + 2)',
      toolName: 'weatherForecast',
      part: part(
        'weatherForecast',
        'output-available',
        forecastOutput({
          place: placeById('qc-133', lang),
          raw: {
            ...QUEBEC_FR,
            currentConditions: { ...QUEBEC_FR.currentConditions, wind: undefined },
            forecastGroup: { ...QUEBEC_FR.forecastGroup, forecasts: QUEBEC_FR.forecastGroup?.forecasts?.map((f) => ({ ...f, uv: undefined })) },
          },
          alertFeatures: [],
          aqhi: aqhi('EHTWR', ['Quebec', 'Québec'], 4, 2.1, [['today', 2], ['tonight', 2], ['tomorrow', 3], ['tomorrowNight', 2]], { lang }),
          lang,
          now: NOW,
        }),
      ),
    },
    { name: 'Forecast · no place given (picker + use my location)', toolName: 'weatherForecast', part: part('weatherForecast', 'output-available', { status: 'need-location', popular: popularPlaces(lang), ...picker }) },
    { name: 'Forecast · place not found', toolName: 'weatherForecast', part: part('weatherForecast', 'output-available', { status: 'not-found', query: 'Nowhereville', popular: popularPlaces(lang), ...picker }) },
    {
      name: 'Forecast · ambiguous place (Campbellton)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', { status: 'ambiguous', query: 'Campbellton', options: lite(['nb-2', 'nl-2'], lang), ...picker }),
    },
    {
      name: 'Forecast · ambiguous town that isn’t a forecast location (Springfield, five provinces)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', {
        status: 'ambiguous',
        query: 'Springfield',
        options: optionsFor(
          {
            kind: 'many',
            points: [
              { name: 'Springfield', province: 'on', lat: 42.8266667, lon: -80.9333334 },
              { name: 'Springfield', province: 'ns', lat: 44.63555, lon: -64.872965 },
              { name: 'Springfield', province: 'nb', lat: 45.678163, lon: -65.812544 },
              { name: 'Springfield', province: 'pe', lat: 46.683333, lon: -64.366667 },
              { name: 'Springfield', province: 'mb', lat: 49.916667, lon: -96.75 },
            ],
          },
          lang,
        ),
        ...picker,
      }),
      note: 'Each choice names the forecast location that answers for it; picking one asks “Springfield, NS”.',
    },
    {
      name: 'Forecast · place lookup didn’t answer (not “not found”: try again)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', { status: 'lookup-unavailable', query: 'K1A 0B1', popular: popularPlaces(lang), ...picker }),
    },
    {
      name: 'Forecast · asked about tomorrow (7-day list first, tomorrow’s row open)',
      toolName: 'weatherForecast',
      part: part('weatherForecast', 'output-available', forecastOutput({ place: ottawa, raw: OTTAWA, alertFeatures: [], aqhi: OTTAWA_AQHI, lang, now: NOW, focus: 'tomorrow' })),
    },
    { name: 'Forecast · live feed unavailable', toolName: 'weatherForecast', part: part('weatherForecast', 'output-available', forecastOutput({ place: ottawa, raw: null, alertFeatures: null, aqhi: null, lang, now: NOW })) },
    { name: 'Forecast · error', toolName: 'weatherForecast', part: part('weatherForecast', 'output-error') },
  ];
}
