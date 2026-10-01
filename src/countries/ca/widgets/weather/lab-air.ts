/** Lab fixtures for `weatherAirQuality`: AQHI now and forecast, wildfire smoke, and the places without an AQHI. */
import type { Fixture } from '@/lib/widgets/types';
import { airOutput, pickerSources, placeById } from './assemble';
import type { Lang } from './data';
import { AIR_QUALITY, hotspotsAround } from './fixture-alerts';
import { HEAT_NOW, NOW, SMOKE_NOW } from './fixture-city';
import { KELOWNA_SMOKE, OTTAWA, TORONTO_HEAT } from './fixture-data';
import { aqhi, hoursAfter, minutesAfter, part } from './lab-kit';
import { summarizeHotspots } from './model';
import { popularPlaces } from './places';

export function air(lang: Lang): Fixture[] {
  const kelowna = placeById('bc-48', lang);
  const ottawa = placeById('on-118', lang);
  // As the live tool answers when it needs a place first: the same sources (assemble.ts `pickerSources`).
  const picker = { lang, fetchedAt: NOW.toISOString(), sources: pickerSources.air(lang) };
  return [
    { name: 'Air · wildfire smoke running (skeleton with the smoke blocks)', toolName: 'weatherAirQuality', part: part('weatherAirQuality', 'input-available', undefined, { location: 'Kelowna', focus: 'smoke' }) },
    { name: 'Air · running (skeleton)', toolName: 'weatherAirQuality', part: part('weatherAirQuality', 'input-available', undefined, { location: 'Kelowna' }) },
    {
      name: 'Air · Kelowna wildfire smoke, August (AQHI 8, in-smoke forecast, warning, hotspots)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({
          place: kelowna,
          aqhi: aqhi('JAFUV', ['Central Okanagan', 'Okanagan - centre'], 0, 8.4, [['today', 8, 9], ['tonight', 7, 8], ['tomorrow', 7, 9], ['tomorrowNight', 5]], { lang, now: SMOKE_NOW, tz: 'America/Vancouver' }),
          alertFeatures: [AIR_QUALITY],
          raw: KELOWNA_SMOKE,
          hotspots: summarizeHotspots(hotspotsAround(kelowna.lat, kelowna.lon, [38, 41, 44, 52, 57, 63, 71, 88, 95]), kelowna.lat, kelowna.lon, 100),
          focus: 'smoke',
          lang,
          now: SMOKE_NOW,
        }),
      ),
    },
    {
      // The live answer to "Is there wildfire smoke near Kelowna?" on a clear day: AQHI 1, no warning, no hotspots.
      name: 'Air · wildfire smoke asked, none found (calm all-clear, the smoke advice folded away)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({
          place: kelowna,
          aqhi: aqhi('JAFUV', ['Central Okanagan', 'Okanagan - centre'], 0, 1.3, [['today', 2], ['tonight', 2], ['tomorrow', 2], ['tomorrowNight', 2]], { lang, tz: 'America/Vancouver' }),
          alertFeatures: [],
          raw: OTTAWA,
          hotspots: { count: 0, nearestKm: null, radiusKm: 100 },
          focus: 'smoke',
          lang,
          now: NOW,
        }),
      ),
    },
    {
      name: 'Air · Toronto moderate, July (AQHI 5, advice toggle)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({
          place: placeById('on-143', lang),
          aqhi: aqhi('FEUZB', ['Toronto'], 0, 5.2, [['today', 6], ['tonight', 4], ['tomorrow', 6], ['tomorrowNight', 4]], { lang, now: HEAT_NOW }),
          alertFeatures: [],
          raw: TORONTO_HEAT,
          hotspots: { count: 0, nearestKm: null, radiusKm: 100 },
          lang,
          now: HEAT_NOW,
        }),
      ),
    },
    {
      name: 'Air · Ottawa low risk (forecast only, observation stale)',
      toolName: 'weatherAirQuality',
      part: part('weatherAirQuality', 'output-available', airOutput({ place: ottawa, aqhi: aqhi('FEVNT', ['Ottawa'], 3, null, [['today', 2], ['tonight', 1], ['tomorrow', 2], ['tomorrowNight', 2]], { lang }), alertFeatures: [], raw: OTTAWA, hotspots: { count: 0, nearestKm: null, radiusKm: 100 }, lang, now: NOW })),
    },
    {
      // AQHI readings are stamped on the hour and published later: 62 minutes on, the reading is still "now".
      name: 'Air · Ottawa, 62 minutes after the reading (still “Now” and “Live”)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({ place: ottawa, aqhi: aqhi('FEVNT', ['Ottawa'], 3, 2.2, [['today', 2], ['tonight', 2], ['tomorrow', 2], ['tomorrowNight', 3]], { lang }), alertFeatures: [], raw: OTTAWA, hotspots: { count: 0, nearestKm: null, radiusKm: 100 }, lang, now: minutesAfter(NOW, 2) }),
      ),
    },
    {
      // A missed cycle: the newest reading is three hours old, so it is "Latest" and the badge is a neutral "Checked".
      name: 'Air · Ottawa, reading 3 hours old (“Latest · observed …”, badge “Checked”, not “Live”)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({ place: ottawa, aqhi: aqhi('FEVNT', ['Ottawa'], 3, 2.2, [['today', 2], ['tonight', 2], ['tomorrow', 2], ['tomorrowNight', 3]], { lang }), alertFeatures: [], raw: OTTAWA, hotspots: { count: 0, nearestKm: null, radiusKm: 100 }, lang, now: hoursAfter(NOW, 2) }),
      ),
    },
    {
      // The 5 p.m. issuance ends with ECCC's "Day 3", shown as the weekday it stands for (Friday).
      name: 'Air · Ottawa, evening forecast (Tonight → Friday), live reading',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({
          place: ottawa,
          aqhi: aqhi('FEVNT', ['Ottawa'], 3, 2.2, [['tonight', 2], ['tomorrow', 3], ['tomorrowNight', 3], ['day3', 2]], { lang, now: hoursAfter(NOW, 11) }),
          alertFeatures: [],
          raw: OTTAWA,
          hotspots: { count: 0, nearestKm: null, radiusKm: 100 },
          lang,
          now: hoursAfter(NOW, 11),
        }),
      ),
    },
    {
      name: 'Air · very high (AQHI 11)',
      toolName: 'weatherAirQuality',
      part: part(
        'weatherAirQuality',
        'output-available',
        airOutput({ place: placeById('nt-24', lang), aqhi: aqhi('LBAMG', ['Yellowknife'], 1, 11.3, [['today', 10], ['tonight', 11, 12], ['tomorrow', 8, 10], ['tomorrowNight', 6]], { lang, now: hoursAfter(NOW, 4), tz: 'America/Edmonton' }), alertFeatures: [], raw: null, hotspots: null, focus: 'smoke', lang, now: hoursAfter(NOW, 4) }),
      ),
    },
    {
      name: 'Air · Rimouski, Quebec (Info-Smog)',
      toolName: 'weatherAirQuality',
      part: part('weatherAirQuality', 'output-available', airOutput({ place: placeById('qc-138', lang), aqhi: null, gap: 'far', nearest: { name: 'Edmundston', distanceKm: 121 }, alertFeatures: [], raw: null, hotspots: { count: 0, nearestKm: null, radiusKm: 100 }, lang, now: NOW })),
    },
    {
      name: 'Air · no AQHI community nearby (Tuktoyaktuk)',
      toolName: 'weatherAirQuality',
      part: part('weatherAirQuality', 'output-available', airOutput({ place: placeById('nt-20', lang), aqhi: null, gap: 'far', nearest: { name: 'Inuvik', distanceKm: 121 }, alertFeatures: [], raw: null, hotspots: null, lang, now: NOW })),
    },
    {
      name: 'Air · no place given',
      toolName: 'weatherAirQuality',
      part: part('weatherAirQuality', 'output-available', { status: 'need-location', popular: popularPlaces(lang), ...picker }),
      note: 'After “Save as my place” on a forecast, every picker leads with that place (“Winnipeg · your place”) as the primary choice.',
    },
    {
      name: 'Air · wildfire smoke asked, no place given (picking a place asks about smoke again)',
      toolName: 'weatherAirQuality',
      part: part('weatherAirQuality', 'output-available', { status: 'need-location', focus: 'smoke', popular: popularPlaces(lang), ...picker }, { focus: 'smoke' }),
    },
    { name: 'Air · error', toolName: 'weatherAirQuality', part: part('weatherAirQuality', 'output-error') },
  ];
}
