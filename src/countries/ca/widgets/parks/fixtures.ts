/**
 * Lab fixtures for the `parks` widget: every state and edge case, built with the same pure builders the
 * tools use (outputs.ts). Live values below were recorded from Parks Canada and CWFIS on 2026-09-30.
 */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { PARKS, parkById, type Park } from './data';
import { parkUrls } from './urls';
import type { Bulletin, ConditionsOutput, Danger, FireStatus, NationalRow } from './model';
import { CITIES } from './places';
import { campingOutput, finderOutput, nationalConditionsOutput, parkConditionsOutput, passesOutput } from './outputs';

const TODAY = '2026-09-30';
const AT = '2026-09-30T14:05:00.000Z';
let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-parks-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});
const P = (id: string) => parkById(id) as Park;
const fire = (danger: Danger | null, hotspots = 0, nearestKm: number | null = null, perims = 0, lastSeen: string | null = null): FireStatus => ({
  danger,
  hotspots: { count: hotspots, nearestKm },
  perimeters: { count: perims, nearestKm: null, lastSeen },
  radiusKm: 50,
  perimeterRadiusKm: 25,
});
const b = (park: Park, lang: 'en' | 'fr', id: string, title: string, date: string, kind: Bulletin['kind']): Bulletin => ({
  title,
  date,
  kind,
  url: `${parkUrls(park, lang).bulletins}/${id}`,
});

/* ------------------------------------------------------------------ recorded live data */

const JASPER_BULLETINS: Bulletin[] = [
  b(P('jasper'), 'en', 'AB00395D-6F8D-4C3E-B8BD-226F890956F0', 'Area Closure: Temporary area closure for wildlife in Jasper National Park - Opal Hills hiking area', '2026-09-25', 'closure'),
  b(P('jasper'), 'en', '11C5A76A-8D25-4442-91A7-8476A51CB55C', 'Restricted Activity: Authorization for entry and travel in Jasper National Park', '2026-09-08', 'restricted'),
  b(P('jasper'), 'en', 'F7EB5A69-1CD8-44E8-B0B6-DBBD1E0F8DC1', 'Warning: Bears frequenting area - Jasper Townsite', '2026-09-05', 'wildlife'),
  b(P('jasper'), 'en', '9B9E09EA-321F-472A-9F3E-58940EF8EF2F', 'Warning: The elk rutting season has begun', '2026-08-25', 'wildlife'),
  b(P('jasper'), 'en', '76ECAE58-8A63-480C-8304-DC903837EEFD', 'Area Closure: Jasper National Park, wildfire impacted area. August 14, 2026', '2026-08-13', 'fire'),
  b(P('jasper'), 'en', '02E20910-04AC-4E0E-BBAA-6D9446B83B15', 'Restricted Activity: Water activity zones and restrictions', '2026-07-31', 'restricted'),
];
const GRASSLANDS_BULLETINS: Bulletin[] = [
  b(P('grasslands'), 'en', 'E4663531-224D-4656-A54C-4847664F6D6A', 'Fire Ban in Effect', '2026-07-30', 'fireBan'),
  b(P('grasslands'), 'en', 'B9D19361-3E56-4234-A2D6-2BF1A8667FA3', 'Road Access Closure', '2026-09-22', 'closure'),
  b(P('grasslands'), 'en', 'B9548FC0-4CC1-45A5-9F06-57CB1D8E7373', 'Area closure - areas are closed to all household pets', '2026-05-20', 'closure'),
];
const GROS_MORNE_FR: Bulletin[] = [
  b(P('grosmorne'), 'fr', '315834C3-9857-485C-974D-9D46986F405E', 'Interdiction de feu', '2026-05-01', 'fireBan'),
  b(P('grosmorne'), 'fr', 'A933A40A-3191-4B99-BEE3-E93F3F48F89A', 'Dermatite du baigneur dans l’étang Trout River', '2026-08-21', 'info'),
  b(P('grosmorne'), 'fr', '42C3B4A5-6A60-4E95-9F52-51F29CE77AC1', 'Zone de fermeture', '2026-05-01', 'closure'),
];

const NATIONAL_DANGER: Record<string, Danger | null> = {
  banff: 2, jasper: 1, waterton: 2, elkisland: 2, yoho: 0, kootenay: 1, glacier: 0, revelstoke: 0, pacificrim: 0, gulf: 1, gwaiihaanas: 0, riding: 0,
  wapusk: 0, princealbert: 1, grasslands: 4, bruce: 1, georg: null, pelee: null, pukaskwa: 1, '1000': null, rouge: 1, mauricie: 0, forillon: 0,
  mingan: null, fundy: 0, kouchibouguac: 0, cbreton: 0, kejimkujik: 0, sable: 0, pei: null, grosmorne: 0, terranova: 1, torngats: null, mealy: 1,
  kluane: 0, ivvavik: null, vuntut: null, nahanni: 0, naatsihchoh: 0, woodbuffalo: 0, thaidene: 0, tuktutnogait: null, aulavik: null,
  auyuittuq: null, sirmilik: null, quttinirpaaq: null, ukkusiksalik: null, qausuittuq: null,
};
const NATIONAL: NationalRow[] = PARKS.map((p) => ({ id: p.id, danger: NATIONAL_DANGER[p.id] ?? null, hotspots: 0 }));
/** Illustrative mid-summer day: several parks at very high/extreme danger with hotspots nearby. */
const NATIONAL_SUMMER: NationalRow[] = NATIONAL.map((r) => {
  const hot: Record<string, [Danger, number]> = { jasper: [4, 12], woodbuffalo: [4, 31], princealbert: [3, 4], kootenay: [3, 0], banff: [3, 0], nahanni: [2, 6], kluane: [2, 0] };
  return hot[r.id] ? { ...r, danger: hot[r.id][0], hotspots: hot[r.id][1] } : r;
});

const cond = (park: Park, lang: 'en' | 'fr', f: FireStatus | null, bulletins: Bulletin[], live = true): ConditionsOutput =>
  parkConditionsOutput({ park, lang, fetchedAt: AT, fire: f, fireLive: !!f, bulletins, bulletinsLive: live, bulletinsUrl: parkUrls(park, lang).bulletins });

/** Jasper had 27 bulletins on 2026-09-30; the tool keeps the 6 most useful and reports the total. */
const jasper = (): ConditionsOutput => ({ ...cond(P('jasper'), 'en', fire(1), JASPER_BULLETINS), bulletinsTotal: 27 });

const calgary = CITIES.find((c) => c.names.includes('calgary'))!;
const halifax = CITIES.find((c) => c.names.includes('halifax'))!;

/* ------------------------------------------------------------------ fixtures */

const fixtures: Fixture[] = [
  // parksFinder
  { name: 'Finder · streaming, a place (skeleton)', toolName: 'parksFinder', part: part('parksFinder', { near: 'Calg' }, null, 'input-streaming') },
  { name: 'Finder · input ready, a park (skeleton)', toolName: 'parksFinder', part: part('parksFinder', { park: 'Jasper' }, null, 'input-available') },
  { name: 'Finder · input ready, all parks (skeleton)', toolName: 'parksFinder', part: part('parksFinder', {}, null, 'input-available') },
  {
    name: 'Finder · “Tell me about Jasper” (park card with live alerts)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Jasper' }, finderOutput({ lang: 'en', matched: P('jasper'), filters: {}, origin: null, conditions: jasper() })),
    note: 'Fire danger Moderate and 27 bulletins, as recorded on 2026-09-30.',
  },
  {
    name: 'Finder · parks near Calgary',
    toolName: 'parksFinder',
    part: part('parksFinder', { near: 'Calgary' }, finderOutput({ lang: 'en', matched: null, filters: {}, origin: { label: calgary.label.en, lat: calgary.lat, lng: calgary.lng }, conditions: null })),
  },
  {
    name: 'Finder · all parks (no filters)',
    toolName: 'parksFinder',
    part: part('parksFinder', {}, finderOutput({ lang: 'en', matched: null, filters: {}, origin: null, conditions: null })),
  },
  {
    name: 'Finder · Nova Scotia, camping only',
    toolName: 'parksFinder',
    part: part('parksFinder', { province: 'ns', camping: true }, finderOutput({ lang: 'en', matched: null, filters: { province: 'ns', camping: true }, origin: null, conditions: null })),
  },
  {
    name: 'Finder · Grasslands: extreme fire danger + fire ban',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Grasslands' }, finderOutput({ lang: 'en', matched: P('grasslands'), filters: {}, origin: null, conditions: cond(P('grasslands'), 'en', fire(4), GRASSLANDS_BULLETINS) })),
  },
  {
    name: 'Finder · Arctic park with no rating and no daily fee (Auyuittuq)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Auyuittuq' }, finderOutput({ lang: 'en', matched: P('auyuittuq'), filters: {}, origin: null, conditions: cond(P('auyuittuq'), 'en', fire(null), []) })),
  },
  {
    name: 'Finder · park with no fees page and no reservations (Torngat Mountains)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Torngat Mountains' }, finderOutput({ lang: 'en', matched: P('torngats'), filters: {}, origin: null, conditions: cond(P('torngats'), 'en', fire(null), []) })),
    note: 'No "All fees" action and no fees source: the park has no fees page (404 on parks.canada.ca).',
  },
  {
    name: 'Finder · oTENTik and backcountry reservations only (Pukaskwa)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Pukaskwa' }, finderOutput({ lang: 'en', matched: P('pukaskwa'), filters: {}, origin: null, conditions: cond(P('pukaskwa'), 'en', fire(0), []) })),
  },
  {
    name: 'Finder · live data unavailable (fallback)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Banff' }, finderOutput({ lang: 'en', matched: P('banff'), filters: {}, origin: null, conditions: cond(P('banff'), 'en', null, [], false) })),
    note: 'Both CWFIS and parks.canada.ca timed out: the card says so and links the official pages.',
  },
  {
    name: 'Finder · not a national park (“Algonquin”)',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Algonquin' }, finderOutput({ lang: 'en', matched: null, filters: {}, origin: null, unknown: 'Algonquin', conditions: null })),
  },
  {
    name: 'Finder · FR · Gros-Morne, interdiction de feu',
    toolName: 'parksFinder',
    part: part('parksFinder', { park: 'Gros-Morne', lang: 'fr' }, finderOutput({ lang: 'fr', matched: P('grosmorne'), filters: {}, origin: null, conditions: cond(P('grosmorne'), 'fr', fire(0), GROS_MORNE_FR) })),
  },
  { name: 'Finder · error', toolName: 'parksFinder', part: part('parksFinder', { park: 'Banff' }, null, 'output-error', { errorText: 'Upstream timeout' }) },

  // parksConditions
  { name: 'Conditions · input ready, a park (skeleton)', toolName: 'parksConditions', part: part('parksConditions', { park: 'Jasper' }, null, 'input-available') },
  { name: 'Conditions · input ready, national (skeleton)', toolName: 'parksConditions', part: part('parksConditions', {}, null, 'input-available') },
  { name: 'Conditions · Jasper (moderate, 27 bulletins)', toolName: 'parksConditions', part: part('parksConditions', { park: 'Jasper' }, jasper()) },
  { name: 'Conditions · Grasslands (extreme + fire ban)', toolName: 'parksConditions', part: part('parksConditions', { park: 'Grasslands' }, cond(P('grasslands'), 'en', fire(4), GRASSLANDS_BULLETINS)) },
  {
    name: 'Conditions · active fire nearby (illustrative)',
    toolName: 'parksConditions',
    part: part('parksConditions', { park: 'Wood Buffalo' }, cond(P('woodbuffalo'), 'en', fire(4, 31, 12, 3, '2026-09-29'), [])),
    note: 'Illustrative values for a summer fire day: hotspots within 50 km and perimeters within 25 km.',
  },
  { name: 'Conditions · national (recorded 2026-09-30)', toolName: 'parksConditions', part: part('parksConditions', {}, nationalConditionsOutput({ lang: 'en', fetchedAt: AT, rows: NATIONAL, live: true })) },
  {
    name: 'Conditions · national, high-danger day (illustrative)',
    toolName: 'parksConditions',
    part: part('parksConditions', {}, nationalConditionsOutput({ lang: 'en', fetchedAt: AT, rows: NATIONAL_SUMMER, live: true })),
  },
  {
    name: 'Conditions · national, live data down',
    toolName: 'parksConditions',
    part: part('parksConditions', {}, nationalConditionsOutput({ lang: 'en', fetchedAt: AT, rows: PARKS.map((p) => ({ id: p.id, danger: null, hotspots: 0 })), live: false })),
    note: 'CWFIS timed out: no ratings, no map; the card links the interactive fire map instead.',
  },
  {
    name: 'Conditions · not a national park (“Algonquin”), national picture with live data',
    toolName: 'parksConditions',
    part: part('parksConditions', { park: 'Algonquin' }, nationalConditionsOutput({ lang: 'en', fetchedAt: AT, rows: NATIONAL, live: true, unknown: 'Algonquin' })),
  },
  { name: 'Conditions · FR · Gros-Morne', toolName: 'parksConditions', part: part('parksConditions', { park: 'Gros-Morne', lang: 'fr' }, cond(P('grosmorne'), 'fr', fire(0), GROS_MORNE_FR)) },
  { name: 'Conditions · error', toolName: 'parksConditions', part: part('parksConditions', { park: 'Jasper' }, null, 'output-error', { errorText: 'Upstream timeout' }) },

  // parksPasses
  { name: 'Passes · streaming (skeleton)', toolName: 'parksPasses', part: part('parksPasses', { adults: 2 }, null, 'input-streaming') },
  { name: 'Passes · family of 4, 8 days, Banff (pass wins)', toolName: 'parksPasses', part: part('parksPasses', { park: 'Banff', adults: 2, youth: 2, days: 8 }, passesOutput({ park: 'Banff', adults: 2, youth: 2, days: 8, family: true, lang: 'en' })) },
  { name: 'Passes · one senior, 3 days (pay daily)', toolName: 'parksPasses', part: part('parksPasses', { seniors: 1, days: 3 }, passesOutput({ adults: 0, seniors: 1, days: 3, lang: 'en', park: 'Fundy' })) },
  { name: 'Passes · youth only (free)', toolName: 'parksPasses', part: part('parksPasses', { adults: 0, youth: 2 }, passesOutput({ adults: 0, youth: 2, days: 4, lang: 'en' })) },
  { name: 'Passes · group of 9 (over the family limit: 2 vehicles)', toolName: 'parksPasses', part: part('parksPasses', { adults: 6, seniors: 1, youth: 2 }, passesOutput({ adults: 6, seniors: 1, youth: 2, days: 10, lang: 'en' })) },
  { name: 'Passes · two adults, 45 days (long plan: slider and chart reach 60)', toolName: 'parksPasses', part: part('parksPasses', { adults: 2, days: 45 }, passesOutput({ adults: 2, days: 45, lang: 'en', park: 'Kejimkujik' })) },
  { name: 'Passes · FR · deux adultes, Kejimkujik', toolName: 'parksPasses', part: part('parksPasses', { park: 'Kejimkujik', lang: 'fr' }, passesOutput({ park: 'Kejimkujik', adults: 2, days: 12, lang: 'fr' })) },
  { name: 'Passes · error', toolName: 'parksPasses', part: part('parksPasses', {}, null, 'output-error', { errorText: 'bad input' }) },

  // parksCamping
  { name: 'Camping · input ready, a park (skeleton)', toolName: 'parksCamping', part: part('parksCamping', { park: 'Banff' }, null, 'input-available') },
  { name: 'Camping · input ready, no park (skeleton)', toolName: 'parksCamping', part: part('parksCamping', { near: 'Halifax' }, null, 'input-available') },
  { name: 'Camping · Banff', toolName: 'parksCamping', part: part('parksCamping', { park: 'Banff' }, campingOutput({ lang: 'en', today: TODAY, park: P('banff'), origin: null })) },
  { name: 'Camping · Gros Morne (8:30 am in NL)', toolName: 'parksCamping', part: part('parksCamping', { park: 'Gros Morne' }, campingOutput({ lang: 'en', today: TODAY, park: P('grosmorne'), origin: null })) },
  {
    name: 'Camping · no park named, near Halifax',
    toolName: 'parksCamping',
    part: part('parksCamping', { near: 'Halifax' }, campingOutput({ lang: 'en', today: TODAY, park: null, origin: { label: halifax.label.en, lat: halifax.lat, lng: halifax.lng } })),
  },
  { name: 'Camping · two launch days (Terra Nova)', toolName: 'parksCamping', part: part('parksCamping', { park: 'Terra Nova' }, campingOutput({ lang: 'en', today: TODAY, park: P('terranova'), origin: null })) },
  {
    name: 'Camping · oTENTik and backcountry only, campground first come first served (Pukaskwa)',
    toolName: 'parksCamping',
    part: part('parksCamping', { park: 'Pukaskwa' }, campingOutput({ lang: 'en', today: TODAY, park: P('pukaskwa'), origin: null })),
  },
  { name: 'Camping · FR · Archipel-de-Mingan (7 emplacements)', toolName: 'parksCamping', part: part('parksCamping', { park: 'Mingan', lang: 'fr' }, campingOutput({ lang: 'fr', today: TODAY, park: P('mingan'), origin: null })) },
  { name: 'Camping · park without reservable camping (Wapusk)', toolName: 'parksCamping', part: part('parksCamping', { park: 'Wapusk' }, campingOutput({ lang: 'en', today: TODAY, park: P('wapusk'), origin: null })) },
  { name: 'Camping · FR · Forillon', toolName: 'parksCamping', part: part('parksCamping', { park: 'Forillon', lang: 'fr' }, campingOutput({ lang: 'fr', today: TODAY, park: P('forillon'), origin: null })) },
  { name: 'Camping · error', toolName: 'parksCamping', part: part('parksCamping', { park: 'Banff' }, null, 'output-error', { errorText: 'Upstream timeout' }) },
];

export default fixtures;
