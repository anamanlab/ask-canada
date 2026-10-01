/**
 * Lab fixtures for the `transport` widget: every state and edge case, built with the same pure functions the tools
 * use. Recall and EV data are real snapshots of Transport Canada's live sources (read 2026-09-30).
 */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import type { BoatInput } from './boating';
import type { Lang } from './constants';
import { buildBoat, buildDrone, buildEv, buildTravel, feesOn } from './build';
import type { DroneInput } from './drone';
import type { EvInput } from './ev';
import { EV_SNAPSHOT } from './ev-snapshot';
import type { RecallsInput } from './recalls';
import { parseList, parseSummary, recallsOutput, type ApiResult } from './recalls-parse';
import snap from './snapshot-recalls.json';
import type { TravelInput } from './travel';

const TODAY = '2026-09-30';
/**
 * Every fixture names its language in the tool input, as the model does, so each one renders whole in that language
 * whatever the lab's own (answer-lang.tsx): English by default, plus a French fixture for every tool.
 */
const EN: Lang = 'en';
/**
 * The recall lookups are "read" when the lab is opened, the way a fresh answer is: the widget compares the reading
 * with the reader's own date, so a fixed instant would show every lookup as "Checked <date>" and never as live.
 * Widgets mount in the browser only (LabFixtures), so this never reaches server-rendered markup. One fixture keeps
 * an older reading to show a reopened conversation.
 */
const NOW = new Date();
const EARLIER = new Date('2026-09-26T14:00:00Z');
let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-transport-${++n}`,
  state,
  input: (input && typeof input === 'object' ? { lang: EN, ...input } : input) as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

type Snap = { list: ApiResult; summaries: Record<string, ApiResult> };
function recallsFrom(s: Snap, input: RecallsInput, keep?: number, at = NOW) {
  const lang = input.lang ?? EN;
  const entries = parseList(s.list).slice(0, keep);
  const recalls = entries.map((e) => parseSummary(s.summaries[e.id], lang, e));
  return recallsOutput(input, { status: 'found', total: entries.length, truncated: keep != null, recalls, live: true }, at);
}
const S = snap as unknown as { civic2016: Snap; f1502018: Snap; rav4Years: { years: { year: number; count: number }[] } };

const civic: RecallsInput = { make: 'Honda', model: 'Civic', year: 2016, lang: EN };
const f150: RecallsInput = { make: 'Ford', model: 'F-150', year: 2018, lang: EN };

const recalls: Fixture[] = [
  { name: 'Recalls · streaming input (skeleton)', toolName: 'transportRecalls', part: part('transportRecalls', { make: 'Honda' }, null, 'input-streaming') },
  { name: 'Recalls · running (skeleton)', toolName: 'transportRecalls', part: part('transportRecalls', civic, null, 'input-available') },
  {
    name: 'Recalls · 2016 Honda Civic (live snapshot, incl. a 2026 recall)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', civic, recallsFrom(S.civic2016, civic)),
    note: 'Real data from data.tc.gc.ca. Newest recall is flagged “New” (within 12 months). Handoff goes to Honda’s VIN lookup from Transport Canada’s list.',
  },
  {
    name: 'Recalls · 2018 Ford F-150 (17 recalls, collapsed list)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', f150, recallsFrom(S.f1502018, f150)),
  },
  {
    name: 'Recalls · list cut short by the API (“12+ recalls”)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', f150, recallsFrom(S.f1502018, f150, 12)),
    note: 'Simulated from the 2018 F-150 snapshot: the database’s /count is higher than the rows it returned, so the hero says “12+” and a notice links to the full database.',
  },
  {
    name: 'Recalls · conversation reopened days later (“Checked Sep 26”)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', civic, recallsFrom(S.civic2016, civic, undefined, EARLIER)),
    note: 'The database was read on an earlier day: the Live badge becomes “Checked <date>”, the freshness line names the day, and “New” counts back from today.',
  },
  {
    name: 'Recalls · French (Civic 2016)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', { ...civic, lang: 'fr' }, recallsFrom(S.civic2016, { ...civic, lang: 'fr' })),
    note: 'Uses the database’s own French recall text. View with ?lang=fr.',
  },
  {
    name: 'Recalls · no year given (per-year chart)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', { make: 'Toyota', model: 'RAV4' }, recallsOutput({ make: 'Toyota', model: 'RAV4', lang: EN }, { status: 'need-year', years: S.rav4Years.years, live: true }, NOW)),
    note: 'Each bar sends “Recalls for a 2019 Toyota RAV4” as a follow-up.',
  },
  {
    name: 'Recalls · French: année non précisée (per-year chart)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', { make: 'Toyota', model: 'RAV4', lang: 'fr' }, recallsOutput({ make: 'Toyota', model: 'RAV4', lang: 'fr' }, { status: 'need-year', years: S.rav4Years.years, live: true }, NOW)),
  },
  {
    name: 'Recalls · nothing on record',
    toolName: 'transportRecalls',
    part: part('transportRecalls', { make: 'Kia', model: 'EV3', year: 2027 }, recallsOutput({ make: 'Kia', model: 'EV3', year: 2027, lang: EN }, { status: 'none', total: 0, live: true }, NOW)),
  },
  {
    name: 'Recalls · vehicle not given',
    toolName: 'transportRecalls',
    part: part('transportRecalls', {}, recallsOutput({ lang: EN }, { status: 'need-vehicle', live: true }, NOW)),
  },
  {
    name: 'Recalls · live database down (fallback)',
    toolName: 'transportRecalls',
    part: part('transportRecalls', civic, recallsOutput(civic, { status: 'unavailable', live: false }, NOW)),
  },
  { name: 'Recalls · error', toolName: 'transportRecalls', part: part('transportRecalls', civic, null, 'output-error', { errorText: 'Upstream timeout' }) },
];

const fees = feesOn(TODAY);
const drone = (input: DroneInput, live = true) => buildDrone({ lang: EN, ...input }, TODAY, fees, live);
const drones: Fixture[] = [
  { name: 'Drone · running (skeleton)', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 895 }, null, 'input-available') },
  { name: 'Drone · 895 g camera drone → Basic', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 895 }, drone({ weightGrams: 895 })), note: 'Fees as read live from api.tc.canada.ca (indexed April 1, 2026).' },
  { name: 'Drone · 249 g mini → microdrone', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 249 }, drone({ weightGrams: 249 })) },
  { name: 'Drone · filming near people → Advanced', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 900, operation: 'near-people' }, drone({ weightGrams: 900, operation: 'near-people' })) },
  { name: 'Drone · beyond visual line-of-sight → Level 1 Complex', toolName: 'transportDrone', part: part('transportDrone', { size: 'small', operation: 'bvlos' }, drone({ size: 'small', operation: 'bvlos' })) },
  { name: 'Drone · advertised event → SFOC', toolName: 'transportDrone', part: part('transportDrone', { operation: 'event' }, drone({ operation: 'event' })) },
  { name: 'Drone · 12-year-old, 570 g → only with a certified pilot supervising (fees offline)', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 570, age: 12 }, drone({ weightGrams: 570, age: 12 }, false)) },
  { name: 'Drone · 15-year-old filming near people (Advanced, supervised)', toolName: 'transportDrone', part: part('transportDrone', { weightGrams: 900, operation: 'near-people', age: 15 }, drone({ weightGrams: 900, operation: 'near-people', age: 15 })) },
  {
    name: 'Drone · French: 12 ans, 570 g (supervised path)',
    toolName: 'transportDrone',
    part: part('transportDrone', { weightGrams: 570, age: 12, lang: 'fr' }, drone({ weightGrams: 570, age: 12, lang: 'fr' })),
    note: 'View with ?lang=fr: French sources, URLs and steps.',
  },
  { name: 'Drone · error', toolName: 'transportDrone', part: part('transportDrone', {}, null, 'output-error', { errorText: 'Fee service timeout' }) },
];

const boat = (input: BoatInput) => buildBoat({ lang: EN, ...input });
const boats: Fixture[] = [
  { name: 'Boating · running (skeleton)', toolName: 'transportBoating', part: part('transportBoating', {}, null, 'input-available') },
  { name: 'Boating · adult, 25 hp outboard', toolName: 'transportBoating', part: part('transportBoating', {}, boat({})) },
  { name: 'Boating · 13-year-old, 90 hp → supervision needed', toolName: 'transportBoating', part: part('transportBoating', { age: 13, horsepower: 90 }, boat({ age: 13, horsepower: 90 })) },
  { name: 'Boating · 13-year-old, engine not given (limit shown)', toolName: 'transportBoating', part: part('transportBoating', { age: 13 }, boat({ age: 13 })) },
  { name: 'Boating · 14-year-old on a Sea-Doo → not allowed', toolName: 'transportBoating', part: part('transportBoating', { age: 14, pwc: true, supervised: true }, boat({ age: 14, pwc: true, supervised: true })) },
  { name: 'Boating · Nunavut / NWT', toolName: 'transportBoating', part: part('transportBoating', { age: 10, horsepower: 60, north: true }, boat({ age: 10, horsepower: 60, north: true })) },
  { name: 'Boating · canoe, no motor', toolName: 'transportBoating', part: part('transportBoating', { horsepower: 0 }, boat({ horsepower: 0 })) },
  {
    name: 'Boating · lost card → replacement by the course provider',
    toolName: 'transportBoating',
    part: part('transportBoating', { lost: true }, boat({ lost: true })),
    note: 'From “I lost my boating card”: leads with the Course Provider Lookup (PCOC FAQ).',
  },
  { name: 'Boating · French: carte perdue', toolName: 'transportBoating', part: part('transportBoating', { lost: true, lang: 'fr' }, boat({ lost: true, lang: 'fr' })) },
  {
    name: 'Boating · French: 14 ans, motomarine',
    toolName: 'transportBoating',
    part: part('transportBoating', { age: 14, pwc: true, lang: 'fr' }, boat({ age: 14, pwc: true, lang: 'fr' })),
  },
  { name: 'Boating · error', toolName: 'transportBoating', part: part('transportBoating', {}, null, 'output-error') },
];

const travel = (input: TravelInput) => buildTravel({ lang: EN, ...input });
const trips: Fixture[] = [
  { name: 'Cannabis · streaming (skeleton)', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'cannabis' }, null, 'input-streaming') },
  { name: 'Cannabis · domestic flight (with calculator)', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'cannabis', trip: 'domestic-flight' }, travel({ topic: 'cannabis', trip: 'domestic-flight' })) },
  { name: 'Cannabis · road trip in Canada (Health Canada limit handoff)', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'cannabis', trip: 'domestic-road' }, travel({ topic: 'cannabis', trip: 'domestic-road' })) },
  { name: 'Cannabis · leaving Canada (illegal)', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'cannabis', trip: 'leaving-canada' }, travel({ topic: 'cannabis', trip: 'leaving-canada' })) },
  { name: 'Pets · running (skeleton)', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets', pet: 'dog' }, null, 'input-available') },
  { name: 'Pets · bringing a dog back into Canada', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets', pet: 'dog', trip: 'entering-canada' }, travel({ topic: 'pets', pet: 'dog', trip: 'entering-canada' })) },
  { name: 'Pets · 2-month-old kitten entering', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets', pet: 'cat', petAgeMonths: 2 }, travel({ topic: 'pets', pet: 'cat', petAgeMonths: 2, trip: 'entering-canada' })) },
  { name: 'Pets · dog leaving for the U.S.', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets', pet: 'dog', trip: 'leaving-canada' }, travel({ topic: 'pets', pet: 'dog', trip: 'leaving-canada' })) },
  { name: 'Pets · flying with a cat in Canada', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets', pet: 'cat', trip: 'domestic-flight' }, travel({ topic: 'pets', pet: 'cat', trip: 'domestic-flight' })) },
  {
    name: 'Cannabis · French: vol au Canada',
    toolName: 'transportTravelRules',
    part: part('transportTravelRules', { topic: 'cannabis', trip: 'domestic-flight', lang: 'fr' }, travel({ topic: 'cannabis', trip: 'domestic-flight', lang: 'fr' })),
  },
  {
    name: 'Pets · French: revenir au Canada avec un chien',
    toolName: 'transportTravelRules',
    part: part('transportTravelRules', { topic: 'pets', pet: 'dog', trip: 'entering-canada', lang: 'fr' }, travel({ topic: 'pets', pet: 'dog', trip: 'entering-canada', lang: 'fr' })),
  },
  { name: 'Travel rules · error', toolName: 'transportTravelRules', part: part('transportTravelRules', { topic: 'pets' }, null, 'output-error') },
];

const ev = (input: EvInput, live = true) =>
  buildEv({ lang: EN, ...input }, TODAY, { vehicles: EV_SNAPSHOT, listLive: live, funds: { remaining: 2_000_000_000, asOf: '2026-09-01' }, fundsLive: live });
const evs: Fixture[] = [
  { name: 'EV · running (skeleton)', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { query: 'Equinox EV' }, null, 'input-available') },
  { name: 'EV · “Does the Equinox EV qualify?”', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { query: 'Equinox EV' }, ev({ query: 'Equinox EV' })) },
  { name: 'EV · plug-in hybrid on a 24-month lease', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { fuel: 'PHEV', leaseMonths: 24, price: 42_000 }, ev({ fuel: 'PHEV', leaseMonths: 24, price: 42_000 })) },
  { name: 'EV · $62,000 import → over the cap', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { price: 62_000 }, ev({ price: 62_000 })) },
  { name: 'EV · Canadian-made Charger at $70,000 (no cap)', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { query: 'Charger', price: 70_000 }, ev({ query: 'Charger', price: 70_000 })) },
  { name: 'EV · model not on the list, live list offline', toolName: 'transportEvIncentive', part: part('transportEvIncentive', { query: 'Rivian R2' }, ev({ query: 'Rivian R2' }, false)) },
  {
    name: 'EV · French: l’Equinox EV',
    toolName: 'transportEvIncentive',
    part: part('transportEvIncentive', { query: 'Equinox EV', lang: 'fr' }, ev({ query: 'Equinox EV', lang: 'fr' })),
  },
  { name: 'EV · error', toolName: 'transportEvIncentive', part: part('transportEvIncentive', {}, null, 'output-error') },
];

const fixtures: Fixture[] = [...recalls, ...drones, ...boats, ...trips, ...evs];
export default fixtures;
