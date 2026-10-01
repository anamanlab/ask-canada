/**
 * Lab fixtures for the `offices` widget: every state and the important edge cases.
 * Outputs are built with the same pure helpers the tool uses (candidatePool over a sample of the real
 * office list in fixtures-data.json). Clocks are pinned so "open now" is deterministic in the lab. The widget
 * shows its links and sources in the page language (?lang=fr), so the outputs here need no language of their own.
 */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import SAMPLE from './fixtures-data.json';
import { appointmentSources } from './data';
import { parseOffices } from './schema';
import { candidatePool, finderSources, passportFocus } from './search';
import type { AppointmentFocus, FinderOutput, LiveStatus, Need, Origin } from './types';

const OFFICES = parseOffices(SAMPLE);

const ORIGINS = {
  ottawa: { lat: 45.42364, lng: -75.70084, label: 'K1A', precision: 'fsa' },
  toronto: { lat: 43.642, lng: -79.398, label: 'M5V', precision: 'fsa' },
  surrey: { lat: 49.1044, lng: -122.8011, label: 'Surrey, BC', precision: 'place' },
  churchill: { lat: 58.7684, lng: -94.165, label: 'Churchill, MB', precision: 'place' },
  arnprior: { lat: 45.4338, lng: -76.3523, label: 'K7S', precision: 'fsa' },
  montreal: { lat: 45.5126, lng: -73.5676, label: 'H2X', precision: 'fsa' },
  kingston: { lat: 44.2312, lng: -76.486, label: 'K7L', precision: 'fsa' },
  charlottetown: { lat: 46.2382, lng: -63.1311, label: 'C1A', precision: 'fsa' },
  here: { lat: 45.35, lng: -75.76, label: '', precision: 'coords' },
} satisfies Record<string, Origin>;

/** A feed reading without its read time (set per fixture), plus the waits (minutes) of the nearest offices. */
type Feed = Omit<LiveStatus, 'at' | 'waitMin' | 'waitAt'> & { waits?: number[] };

let n = 0;
function finder(
  origin: Origin | null,
  need: Need,
  asOf: string,
  opts: { lang?: 'en' | 'fr'; live?: Feed; geocoded?: boolean; status?: FinderOutput['status']; query?: string; passportOffice?: boolean } = {},
): FinderOutput & { pinnedClock: boolean } {
  const lang = opts.lang ?? 'en';
  // The snapshot is read at the fixture's pinned time, as the tool would; the busiest office posts a wait.
  const { waits, ...feed } = opts.live ?? { closed: false, holiday: false, unexpected: false };
  const live = (i: number): LiveStatus | undefined => (opts.live && i < 8 ? { ...feed, waitMin: waits?.[i], waitAt: waits?.[i] ? '10:00' : undefined, at: asOf } : undefined);
  const offices = origin ? candidatePool(OFFICES, origin).map((o, i) => ({ ...o, live: live(i) })) : [];
  const focusId = passportFocus(offices, need, opts.passportOffice)?.id;
  return {
    status: opts.status ?? (origin ? 'ok' : 'no-location'),
    need,
    focusId,
    query: opts.query,
    origin,
    offices,
    asOf,
    live: Boolean(opts.live),
    geocoded: opts.geocoded ?? true,
    lang,
    sources: finderSources({ need, offices, focusId }, lang),
    pinnedClock: true,
  };
}

const part = (toolName: string, output: unknown, input: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-offices-${++n}`,
  state,
  input,
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

// Live feed as it really read on 2026-09-30 (a public holiday): every office closed, no wait times.
const HOLIDAY_FEED: Feed = { closed: true, holiday: true, unexpected: false, updated: '2026-09-30' };
// 2026-10-01: open, with waits as the feed posts them (seconds upstream: 5400, 900, 60).
const OPEN_FEED: Feed = { closed: false, holiday: false, unexpected: false, updated: '2026-10-01', waits: [90, 15, 1] };


const appt = (focus: AppointmentFocus, lang: 'en' | 'fr' = 'en') => ({ focus, lang, sources: appointmentSources(lang, focus) });

const fixtures: Fixture[] = [
  { name: 'Finder · streaming input (skeleton)', toolName: 'officesFinder', part: part('officesFinder', null, { location: 'K1A' }, 'input-streaming') },
  { name: 'Finder · running (skeleton)', toolName: 'officesFinder', part: part('officesFinder', null, { location: 'K1A 0B1', need: 'any' }, 'input-available') },
  {
    name: 'Ottawa K1A on a public holiday (live feed: closed)',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.ottawa, 'any', '2026-09-30T15:10:00.000Z', { live: HOLIDAY_FEED }), { location: 'K1A 0B1' }),
    note: 'Sept 30 is the National Day for Truth and Reconciliation: every office is closed. The banner says when the nearest reopens.',
  },
  {
    name: 'Ottawa K1A, Thursday 10:15 a.m.: open now',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.ottawa, 'any', '2026-10-01T14:15:00.000Z', { live: OPEN_FEED }), { location: 'K1A 0B1' }),
  },
  {
    name: 'Ottawa K1A, Thursday 10:15 a.m.: the feed still carries yesterday’s holiday closure (posted hours win)',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.ottawa, 'any', '2026-10-01T14:15:00.000Z', { live: HOLIDAY_FEED }), { location: 'K1A 0B1' }),
    note: 'The feed says "closed", dated Sept 30. It is Oct 1 and the posted hours say open, so the offices read as open and no wait is shown.',
  },
  {
    name: 'Toronto M5V, urgent passport, 3:40 p.m.: closing soon',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.toronto, 'passport-urgent', '2026-10-01T19:40:00.000Z'), { location: 'M5V', need: 'passport-urgent' }),
    note: 'Only passport offices with urgent pick-up. Rows show the passport service levels.',
  },
  {
    name: 'Toronto M5V · "passport office": the true passport office opens first, the closer centre stays #1',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.toronto, 'passport', '2026-10-01T14:30:00.000Z', { live: OPEN_FEED, passportOffice: true }), { location: 'M5V 2T6', need: 'passport', passportOffice: true }),
    note: 'College Street (1.9 km) only mails passports in 20 business days; the Toronto passport office (2.1 km) does pick-up, urgent and express, so it is selected.',
  },
  {
    name: 'Charlottetown C1A · express passport: 3 to 9 business days at this office',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.charlottetown, 'passport-express', '2026-10-01T14:00:00.000Z', { live: OPEN_FEED }), { location: 'C1A', need: 'passport-express' }),
    note: 'IRCC: express pick-up takes 3 to 9 business days in Charlottetown (4 to 9 in Kelowna and Pointe-Claire), not the usual 2 to 9.',
  },
  {
    name: 'Arnprior K7S at 12:10 p.m.: temporary closure + lunch break nearby',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.arnprior, 'any', '2026-10-05T16:10:00.000Z'), { location: 'K7S' }),
    note: 'Arnprior has been temporarily closed since June 17 (posted on its office page). Renfrew is on its lunch break.',
  },
  {
    name: 'Surrey, BC · biometrics, Friday evening (closed, opens Monday)',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.surrey, 'biometrics', '2026-10-03T01:30:00.000Z'), { location: 'Surrey, BC', need: 'biometrics' }),
  },
  {
    name: 'Churchill, MB · remote: nearest centre 400 km, outreach site with no visits scheduled',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.churchill, 'any', '2026-10-01T15:00:00.000Z'), { location: 'Churchill' }),
  },
  {
    name: 'Montréal H2X · Thanksgiving Monday (French)',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.montreal, 'passport', '2026-10-12T14:00:00.000Z', { lang: 'fr' }), { location: 'H2X 1Y4', need: 'passport', lang: 'fr' }),
    note: 'View with ?lang=fr for long French strings.',
  },
  {
    name: 'Kingston K7L · appointment-only centre (no walk-ins)',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.kingston, 'any', '2026-10-01T15:00:00.000Z'), { location: 'K7L' }),
    note: 'Kingston’s office page says it is appointment based only; the row and detail show the number to call.',
  },
  {
    name: 'Shared location (rounded to 2 decimals), Friday 9:05 p.m.: closed for the day',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(ORIGINS.here, 'passport', '2026-10-03T01:05:00.000Z'), { latitude: 45.35, longitude: -75.76, need: 'passport' }),
  },
  {
    name: 'Locator unreachable: offline fallback from the office list',
    toolName: 'officesFinder',
    part: part('officesFinder', finder({ ...ORIGINS.toronto, precision: 'region' }, 'any', '2026-10-01T15:00:00.000Z', { geocoded: false }), { location: 'M5V 2T6' }),
  },
  {
    name: 'No location given: asks for a postal code',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(null, 'passport', '2026-10-01T15:00:00.000Z'), { need: 'passport' }),
  },
  {
    name: 'Place not found',
    toolName: 'officesFinder',
    part: part('officesFinder', finder(null, 'any', '2026-10-01T15:00:00.000Z', { status: 'not-found', query: 'Springfield' }), { location: 'Springfield' }),
  },
  {
    name: 'Finder · error',
    toolName: 'officesFinder',
    part: part('officesFinder', null, { location: 'K1A' }, 'output-error', { errorText: 'Upstream timeout' }),
  },

  { name: 'Appointment · running (skeleton)', toolName: 'officesAppointment', part: part('officesAppointment', null, { focus: 'passport' }, 'input-available') },
  { name: 'Appointment · passport', toolName: 'officesAppointment', part: part('officesAppointment', appt('passport'), { focus: 'passport' }) },
  { name: 'Appointment · biometrics', toolName: 'officesAppointment', part: part('officesAppointment', appt('biometrics'), { focus: 'biometrics' }) },
  { name: 'Appointment · something else (walk in, call back or call the program)', toolName: 'officesAppointment', part: part('officesAppointment', appt('other'), { focus: 'other' }) },
  {
    name: 'Appointment · error',
    toolName: 'officesAppointment',
    part: part('officesAppointment', null, { focus: 'other' }, 'output-error', { errorText: 'Upstream timeout' }),
  },
];

export default fixtures;
