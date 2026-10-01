/**
 * Lab fixtures for the `health` widget: every state and edge case of the 4 tools.
 * Live outputs come from snapshot.json (real responses captured from the official sources on 2026-09-30);
 * the dental checker is built with the same pure function the tool uses.
 */
import { addDays } from '@/lib/dates/business-days';
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import type { DentalInput } from './dental';
import { buildDental } from './dental-build';
import { productUrl, type DrugOutput, type DrugProduct } from './drugs';
import { drugLinks, otherLang, recallLinks, travelLinks } from './links';
import type { RecallCategory, RecallsOutput } from './recalls';
import SNAP from './snapshot.json';
import { CLINIC_LEAD_DAYS, type TravelOutput } from './travel';
import { findPlace } from './travel-parse';

/** A captured output: its links and sources (both languages) are rebuilt the way the tool builds them. */
type NoSrc<T> = Omit<T, 'sources' | 'alt'>;
const S = SNAP as unknown as {
  recent: NoSrc<RecallsOutput>;
  recentFr: NoSrc<RecallsOutput>;
  peanut: NoSrc<RecallsOutput>;
  sesame: NoSrc<RecallsOutput>;
  advilRecalls: NoSrc<RecallsOutput>;
  carSeat: NoSrc<RecallsOutput>;
  advil: NoSrc<DrugOutput>;
  ozempic: NoSrc<DrugOutput>;
  ozempicFr: NoSrc<DrugOutput>;
  cuba: NoSrc<TravelOutput>;
  cubaFr: NoSrc<TravelOutput>;
  drc: NoSrc<TravelOutput>;
  all: NoSrc<TravelOutput>;
};

let n = 0;
const part = (toolName: string, state: WidgetPart['state'], input: unknown, output?: unknown, extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-health-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

const recalls = (o: NoSrc<RecallsOutput>): RecallsOutput => ({
  ...o,
  ...recallLinks(o.lang, o.live, o.query, o.category, o.broadened?.any),
  alt: recallLinks(otherLang(o.lang), o.live, o.query, o.category, o.broadened?.any),
});
/** A category whose notice pages couldn't be read: its rows open the official notice, and a line says so. */
const without = (o: NoSrc<RecallsOutput>, category: RecallCategory): NoSrc<RecallsOutput> => ({
  ...o,
  items: o.items.map((it) => (it.category === category ? { ...it, details: undefined } : it)),
});
const drugs = (o: NoSrc<DrugOutput>): DrugOutput => ({ ...o, ...drugLinks(o.lang, o.live), alt: drugLinks(otherLang(o.lang), o.live) });
const travel = (o: NoSrc<TravelOutput>): TravelOutput => ({
  ...o,
  ...travelLinks(o.lang, o.live),
  alt: { ...travelLinks(otherLang(o.lang), o.live), destination: o.destination ? (findPlace(o.destination)?.[otherLang(o.lang)] ?? o.destination) : null },
});
const dental = (i: DentalInput) => part('healthDentalCheck', 'output-available', i, buildDental(i));

const emptySearch: RecallsOutput = recalls({
  ...S.peanut,
  query: 'dragon fruit gummies',
  total: 0,
  items: [],
});
const offlineRecalls: RecallsOutput = recalls({ ...S.recent, live: false, total: 0, items: [] });

const notFound: DrugOutput = drugs({ ...S.advil, query: 'Glowmax', total: 0, marketed: 0, products: [] });
// Real Drug Product Database records (API, 2026-09-30): brandname=zantac returns 12 human products, none marketed.
const zantac = (drugCode: number, din: string, strength: string, since: string): DrugProduct => ({
  drugCode,
  din,
  brand: 'ZANTAC',
  company: 'GLAXOSMITHKLINE INC',
  className: 'Human',
  status: 'inactive',
  statusLabel: 'Cancelled Post Market',
  statusCode: 4,
  statusDate: '2017-09-14',
  since,
  ingredients: [{ name: 'RANITIDINE (RANITIDINE HYDROCHLORIDE)', strength, unit: 'MG' }],
  forms: ['Tablet'],
  routes: ['Oral'],
  schedules: ['PRESCRIPTION'],
  access: 'rx',
  url: productUrl(drugCode, 'en'),
  ais: 1,
});
const inactiveOnly: DrugOutput = drugs({
  ...S.advil,
  query: 'Zantac',
  total: 12,
  marketed: 0,
  products: [zantac(43092, '02212331', '150', '1999-08-06'), zantac(43093, '02212358', '300', '1999-12-20')],
});
const offlineDrugs: DrugOutput = drugs({ ...S.advil, live: false, total: 0, marketed: 0, products: [] });

const withTrip = (o: NoSrc<TravelOutput>, trip: string, clinicBy: string): TravelOutput => travel({ ...o, travelDate: trip, clinicBy });
const unknownPlace: TravelOutput = travel({ ...S.all, query: 'Narnia', unknownDestination: true });
const offlineTravel: TravelOutput = travel({ ...S.cuba, live: false, offline: 'unreachable', notices: [], totalNotices: 0, highestLevel: 0 });
const unreadableTravel: TravelOutput = travel({ ...offlineTravel, offline: 'unreadable' });
// A destination travel.gc.ca lists that no notice names: only the notices for every destination apply.
const globalOnly = S.all.notices.filter((n) => n.global);
const mexico: TravelOutput = travel({ ...S.all, query: 'Mexico', destination: 'Mexico', notices: globalOnly, specific: 0, highestLevel: globalOnly[0]?.level ?? 0 });
const globalFr = S.cubaFr.notices.filter((n) => n.global);
const mexicoFr: TravelOutput = travel({ ...S.cubaFr, query: 'Mexique', destination: 'Mexique', notices: globalFr, specific: 0, highestLevel: globalFr[0]?.level ?? 0 });
/** Ten days from the day the lab is opened (the countdown counts from the reader's own today), so the name stays true. */
const SOON = addDays(new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), 10);

const fixtures: Fixture[] = [
  // ── Recalls ──
  { name: 'Recalls · streaming (skeleton)', toolName: 'healthRecalls', part: part('healthRecalls', 'input-streaming', { query: 'pea' }) },
  { name: 'Recalls · running (skeleton)', toolName: 'healthRecalls', part: part('healthRecalls', 'input-available', {}) },
  { name: 'Recalls · allergen search running (skeleton)', toolName: 'healthRecalls', part: part('healthRecalls', 'input-available', { query: 'peanut', allergen: true }) },
  {
    name: 'Recalls · latest (live, hero)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', {}, recalls(S.recent)),
    note: 'Newest notices grouped by day; category filters work on the device. As in production, the notices each filter leads with carry the summary (tap Vehicles or Food: cards, not bare links); rows further down open the official notice.',
  },
  {
    name: 'Recalls · allergen search “peanut” (allergen notices first, details closed)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { query: 'peanut' }, recalls(S.peanut)),
  },
  {
    name: 'Recalls · latest, first notice open (details, affected products and UPC codes)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { expand: true }, recalls({ ...S.recent, expand: true })),
    note: 'The opened state of a notice: product, issue, what to do, where it was sold and the affected sizes with their codes.',
  },
  {
    name: 'Recalls · French data, first notice open (détails et codes CUP)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { expand: true, lang: 'fr' }, recalls({ ...S.recentFr, expand: true })),
    note: 'View with ?lang=fr.',
  },
  {
    name: 'Recalls · allergen “sesame” (only undeclared-sesame notices under the chip; others under All)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { query: 'sesame', allergen: true }, recalls(S.sesame)),
    note: 'A sesame candy with undeclared peanut and vermicelli in sesame sauce with undeclared shrimp stay under All. The first notice lists 4 allergens: its issue line reads “Allergen · Wheat, Gluten, Mustard, Sesame seeds” (asserted in health.test.mjs).',
  },
  {
    name: 'Recalls · latest, food notices without a summary (tap Food: link-only rows, by design)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', {}, recalls(without(S.recent, 'food'))),
    note: 'When a category’s notice pages can’t be read, its filter shows no card: one line says each notice opens on the official site, and every row is a link.',
  },
  {
    name: 'Recalls · “Advil Caplets” broadened to “Advil” (the exact words found nothing)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { query: 'Advil Caplets' }, recalls({ ...S.advilRecalls, query: 'Advil', broadened: { from: 'Advil Caplets' } })),
    note: 'The Recalls site searches several words as an exact phrase. The tool retries with the brand word and the card says which search the notices come from.',
  },
  {
    name: 'Recalls · “Advil” (nothing in the past year: badge says so)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { query: 'Advil' }, recalls(S.advilRecalls)),
  },
  {
    name: 'Recalls · search “car seat” (Transport Canada tip, readable vehicle rows)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { query: 'car seat' }, recalls(S.carSeat)),
  },
  { name: 'Recalls · no match', toolName: 'healthRecalls', part: part('healthRecalls', 'output-available', { query: 'dragon fruit gummies' }, emptySearch) },
  {
    name: 'Recalls · French data (rappels récents)',
    toolName: 'healthRecalls',
    part: part('healthRecalls', 'output-available', { lang: 'fr' }, recalls(S.recentFr)),
    note: 'View with ?lang=fr.',
  },
  { name: 'Recalls · site unreachable (fallback)', toolName: 'healthRecalls', part: part('healthRecalls', 'output-available', {}, offlineRecalls) },
  { name: 'Recalls · error', toolName: 'healthRecalls', part: part('healthRecalls', 'output-error', {}, undefined, { errorText: 'Upstream timeout' }) },

  // ── Dental ──
  { name: 'Dental · running (skeleton)', toolName: 'healthDentalCheck', part: part('healthDentalCheck', 'input-available', {}) },
  { name: 'Dental · nothing known yet', toolName: 'healthDentalCheck', part: dental({}) },
  {
    name: 'Dental · likely, no co-payment ($62,000)',
    toolName: 'healthDentalCheck',
    part: dental({ familyIncome: 62_000, noPrivateCoverage: true, filedTaxes: true, residentForTax: true }),
  },
  { name: 'Dental · likely, 40% co-payment ($76,500)', toolName: 'healthDentalCheck', part: dental({ familyIncome: 76_500, noPrivateCoverage: true, filedTaxes: true, residentForTax: true }) },
  { name: 'Dental · has workplace insurance (not eligible)', toolName: 'healthDentalCheck', part: dental({ familyIncome: 54_000, noPrivateCoverage: false }) },
  { name: 'Dental · over the income limit ($95,000)', toolName: 'healthDentalCheck', part: dental({ familyIncome: 95_000, noPrivateCoverage: true }) },
  { name: 'Dental · summary, running (skeleton)', toolName: 'healthDentalCheck', part: part('healthDentalCheck', 'input-available', { view: 'summary' }) },
  {
    name: 'Dental · summary (follow-up “What does it cover?”)',
    toolName: 'healthDentalCheck',
    part: dental({ view: 'summary' }),
    note: 'Compact card for follow-ups. Answers saved by a checker on this device show up here as “You may qualify · from your answers”.',
  },
  { name: 'Dental · summary, 2 answers known ($76,500)', toolName: 'healthDentalCheck', part: dental({ view: 'summary', familyIncome: 76_500, noPrivateCoverage: true }) },
  { name: 'Dental · summary, has insurance (not eligible, income tile only “if you qualified”)', toolName: 'healthDentalCheck', part: dental({ view: 'summary', familyIncome: 76_500, noPrivateCoverage: false }) },
  { name: 'Dental · error', toolName: 'healthDentalCheck', part: part('healthDentalCheck', 'output-error', {}, undefined, { errorText: 'boom' }) },

  // ── Drugs ──
  { name: 'Drugs · running (skeleton)', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'input-available', { query: 'Advil' }) },
  { name: 'Drugs · DIN running (skeleton, 1 card)', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'input-available', { query: '02471469' }) },
  { name: 'Drugs · “Advil” (live, 4 shown + show more, 6 of 48)', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'output-available', { query: 'Advil' }, drugs(S.advil)) },
  {
    name: 'Drugs · “Ozempic” (concentration per mL, 2 pens)',
    toolName: 'healthDrugLookup',
    part: part('healthDrugLookup', 'output-available', { query: 'Ozempic' }, drugs(S.ozempic)),
    note: 'Strength is shown per mL (1.34 mg/mL), never as if it were the dose the pen dispenses.',
  },
  {
    name: 'Drugs · DIN 02471469 (French data, prescription)',
    toolName: 'healthDrugLookup',
    part: part('healthDrugLookup', 'output-available', { query: '02471469', lang: 'fr' }, drugs(S.ozempicFr)),
    note: 'View with ?lang=fr.',
  },
  { name: 'Drugs · no longer sold', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'output-available', { query: 'Zantac' }, inactiveOnly) },
  { name: 'Drugs · not found (natural health products tip)', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'output-available', { query: 'Glowmax' }, notFound) },
  { name: 'Drugs · database unreachable', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'output-available', { query: 'Advil' }, offlineDrugs) },
  { name: 'Drugs · error', toolName: 'healthDrugLookup', part: part('healthDrugLookup', 'output-error', { query: 'Advil' }, undefined, { errorText: 'boom' }) },

  // ── Travel ──
  { name: 'Travel · running (skeleton)', toolName: 'healthTravel', part: part('healthTravel', 'input-available', { destination: 'Cuba' }) },
  {
    name: 'Travel · Cuba, leaving Dec 20 (clinic countdown)',
    toolName: 'healthTravel',
    part: part('healthTravel', 'output-available', { destination: 'Cuba', travelDate: '2026-12-20' }, withTrip(S.cuba, '2026-12-20', '2026-11-08')),
  },
  { name: 'Travel · Cuba (no departure date yet)', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Cuba' }, travel(S.cuba)), note: 'What the loading state stands for: the level, the general 6-week advice and the notices.' },
  { name: 'Travel · Cuba (French data)', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Cuba', lang: 'fr' }, travel(S.cubaFr)), note: 'View with ?lang=fr.' },
  { name: 'Travel · DR Congo (level 3)', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Democratic Republic of Congo' }, travel(S.drc)) },
  { name: 'Travel · leaving in 10 days (see a clinic now)', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Cuba' }, withTrip(S.cuba, SOON, addDays(SOON, -CLINIC_LEAD_DAYS))) },
  {
    name: 'Travel · departure date already passed (field error)',
    toolName: 'healthTravel',
    part: part('healthTravel', 'output-available', { destination: 'Cuba', travelDate: '2026-08-15' }, travel({ ...S.cuba, travelDate: '2026-08-15' })),
    note: 'The date field says the date has passed; the countdown falls back to the general advice.',
  },
  { name: 'Travel · every current notice', toolName: 'healthTravel', part: part('healthTravel', 'output-available', {}, travel(S.all)) },
  { name: 'Travel · unknown destination', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Narnia' }, unknownPlace) },
  {
    name: 'Travel · Mexico (listed destination, no notice of its own)',
    toolName: 'healthTravel',
    part: part('healthTravel', 'output-available', { destination: 'Mexico' }, mexico),
    note: 'Mexico is a destination travel.gc.ca lists, but no notice names it: the notices for every destination are shown, with a line saying so.',
  },
  {
    name: 'Travel · Mexique (French data: one notice, read in English it is named, not woven into a sentence)',
    toolName: 'healthTravel',
    part: part('healthTravel', 'output-available', { destination: 'Mexique', lang: 'fr' }, mexicoFr),
    note: 'In English the level’s reason reads “Notice: Rougeole” and the title “Travel health: Mexico”; with ?lang=fr, « En raison de la rougeole. ».',
  },
  { name: 'Travel · travel.gc.ca unreachable', toolName: 'healthTravel', part: part('healthTravel', 'output-available', { destination: 'Cuba' }, offlineTravel) },
  {
    name: 'Travel · travel.gc.ca answered, notices unreadable',
    toolName: 'healthTravel',
    part: part('healthTravel', 'output-available', { destination: 'Cuba' }, unreadableTravel),
    note: 'The page was fetched but its table gave no notices (changed markup): different wording from “unreachable”.',
  },
  { name: 'Travel · error', toolName: 'healthTravel', part: part('healthTravel', 'output-error', {}, undefined, { errorText: 'boom' }) },
];

export default fixtures;
