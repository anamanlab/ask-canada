/** Lab fixtures for the `civic` widget: every state and edge case of its four tools. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { isPausedStatus } from './build/bills';
import { TEASER_MAX, clip } from './build/text';
import { voterCheck } from './build/voter';
import { CHECKED, HOUSE, SENATE, SOURCES, URLS, livePage, vacantSources, type Lang } from './data';
import * as S from './snapshots';
import type { BillSummary, FindMpOutput, FindMpStatus, NewsOutput, ParliamentOutput, VoterInput } from './types';

let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-civic-${++n}`,
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

/* civicFindMp */
const mpState = (status: FindMpStatus, lang: Lang, postalCode?: string, extra: Partial<FindMpOutput> = {}): FindMpOutput => ({
  status,
  lang,
  ...(postalCode ? { postalCode } : {}),
  ridings: [],
  house: { seats: HOUSE.seats },
  live: false,
  checked: CHECKED,
  sources: [SOURCES.members(lang), SOURCES.findRiding(lang), SOURCES.standings(lang, { live: false })],
  ...extra,
});
const two: FindMpOutput = {
  ...S.K1A0B1_en,
  postalCode: 'K1S 1B5',
  ridings: [S.K1A0B1_en.ridings[0], S.south.ridings[0]],
};
const unconfirmed: FindMpOutput = {
  ...S.K1A0B1_en,
  live: false,
  house: { seats: HOUSE.seats },
  ridings: [{ ...S.K1A0B1_en.ridings[0], status: 'unconfirmed', mp: null }],
  sources: [SOURCES.members('en'), SOURCES.findRiding('en')],
};

const vacantFr: FindMpOutput = {
  ...S.H2X1Y4_en,
  lang: 'fr',
  city: 'Montréal',
  ridings: [{ ...S.H2X1Y4_en.ridings[0], provinceName: 'Québec' }],
  sources: vacantSources('fr', CHECKED),
};
// The snapshots predate the vacant-seat source order (the live seat list first, as buildFindMp returns now).
const vacant = (o: FindMpOutput): FindMpOutput => ({ ...o, sources: vacantSources(o.lang, CHECKED) });

/* civicVoterCheck (today can be pinned to show the Quebec notice before and after election day) */
const vote = (input: VoterInput, today?: string) => part('civicVoterCheck', input, voterCheck(input, today));

/* civicParliament */
// The snapshots predate `paused` (the builder sets it now): derive it from the status line the same way.
const park = (o: ParliamentOutput): ParliamentOutput => {
  const flag = (b: BillSummary): BillSummary => (!b.law && isPausedStatus(b.status) ? { ...b, paused: true } : b);
  return { ...o, bills: o.bills.map(flag), ...(o.focus ? { focus: flag(o.focus) } : {}) };
};
// Whenever LEGISinfo answered, it leads the sources (as buildParliament does live), so the lab's footer matches
// production and the header's "Live" badge. The snapshots predate that order.
const legisFirst = (o: ParliamentOutput): ParliamentOutput => {
  const legisinfo = o.sources.filter((s) => s.url === URLS.legisinfo[o.lang]);
  return { ...o, sources: [...legisinfo, ...o.sources.filter((s) => !legisinfo.includes(s))] };
};
const P = { parl: legisFirst(park(S.parl)), parlFr: legisFirst(park(S.parlFr)), bill: legisFirst(park(S.bill)), billFr: legisFirst(park(S.billFr)), topic: legisFirst(park(S.topic)) };
const parlOffline: ParliamentOutput = {
  lang: 'en',
  parliament: HOUSE.parliament,
  session: HOUSE.session,
  house: { seats: HOUSE.seats },
  senateSeats: SENATE.seats,
  bills: [],
  live: false,
  checked: CHECKED,
  sources: [SOURCES.legislativeProcess('en'), SOURCES.legisinfo('en', { live: false }), SOURCES.standings('en', { live: false }), SOURCES.senate('en')],
};
// A bill answer leads its sources with the bill's own LEGISinfo page (as buildParliament does live).
const withBill = (o: ParliamentOutput): ParliamentOutput =>
  o.focus
    ? { ...o, sources: [livePage(o.lang === 'fr' ? `Projet de loi ${o.focus.code} : ${o.focus.title}` : `Bill ${o.focus.code}: ${o.focus.title}`, o.focus.url, CHECKED), ...o.sources.filter((s) => s.url !== o.focus?.url)] }
    : o;
const billSenate: ParliamentOutput = withBill({ ...P.parl, focus: P.parl.bills[0], bills: P.parl.bills.slice(1) });
const parlNone: ParliamentOutput = { ...P.parl, query: 'daylight saving time', bills: [] };
// A House bill voted down at second reading (LEGISinfo's status line is "Bill defeated"): the track stops there.
const lost = (b: BillSummary): BillSummary => ({
  ...b,
  defeated: true,
  paused: undefined,
  status: 'Bill defeated',
  at: 1,
  track: b.track.map((s, i) => (i === 0 ? s : { chamber: s.chamber, ...(s.stage ? { stage: s.stage } : {}), done: false })),
});
const billDefeated: ParliamentOutput = withBill({ ...P.parl, focus: lost(P.parl.bills[2]), bills: P.parl.bills.filter((_, i) => i !== 2).slice(0, 3) });
const parlMissing: ParliamentOutput = { ...P.parl, focus: null, notFound: 'C-999', bills: P.parl.bills.slice(0, 3) };

/* civicNews */
// The snapshots predate the shorter teaser (buildNews clips to TEASER_MAX now): clip them the same way.
const teased = (o: NewsOutput): NewsOutput => ({ ...o, items: o.items.map((i) => ({ ...i, teaser: clip(i.teaser, TEASER_MAX) })) });
const N = { news: teased(S.news), newsFr: teased(S.newsFr), newsTopic: teased(S.newsTopic) };
const newsEmpty: NewsOutput = { ...N.newsTopic, query: 'lighthouse keepers', items: [] };
const newsOffline: NewsOutput = { lang: 'en', items: [], live: false, checked: CHECKED, sources: [SOURCES.news('en', { live: false })] };

const fixtures: Fixture[] = [
  // ── Find your MP ──
  { name: 'Find MP · streaming input (skeleton)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K1A' }, null, 'input-streaming') },
  { name: 'Find MP · running (skeleton)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K1A 0B1' }, null, 'input-available') },
  {
    name: 'Find MP · Ottawa Centre (hero case)',
    toolName: 'civicFindMp',
    part: part('civicFindMp', { postalCode: 'K1A 0B1' }, S.K1A0B1_en),
    note: 'Live data captured 2026-09-30: riding from Represent (2023 Representation Order), MP, roles, portrait and offices from the House of Commons.',
  },
  { name: 'Find MP · minister, in French (Oakville-Est)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'L6J 1G7', lang: 'fr' }, S.L6J1G7_fr) },
  {
    name: 'Find MP · by-election winner (Beaches—East York, Aug 31, 2026)',
    toolName: 'civicFindMp',
    part: part('civicFindMp', { postalCode: 'M4E 1A1' }, S.M4E1A1_en),
    note: 'The riding API still lists the previous MP; the House of Commons list wins.',
  },
  { name: 'Find MP · vacant seat (Laurier—Sainte-Marie)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'H2X 1Y4' }, vacant(S.H2X1Y4_en)) },
  { name: 'Find MP · vacant seat, in French (Montréal)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'H2X 1Y4', lang: 'fr' }, vacantFr) },
  {
    name: 'Find MP · renamed riding, vacant (Brantford—Brant South)',
    toolName: 'civicFindMp',
    part: part('civicFindMp', { postalCode: 'N3T 2J6' }, vacant(S.N3T2J6_en)),
    note: 'Riding renamed in 2026; matched to the House of Commons seat by province + name.',
  },
  { name: 'Find MP · postal code on a riding boundary (two ridings)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K1S 1B5' }, two) },
  { name: 'Find MP · House of Commons list unreachable (riding only)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K1A 0B1' }, unconfirmed) },
  { name: 'Find MP · no postal code yet (ask)', toolName: 'civicFindMp', part: part('civicFindMp', {}, mpState('ask', 'en')) },
  { name: 'Find MP · invalid postal code', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: '90210' }, mpState('invalid', 'en', '90210')) },
  { name: 'Find MP · postal code not found (French)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K0K 9Z9', lang: 'fr' }, mpState('not-found', 'fr', 'K0K 9Z9', { province: 'ON' })) },
  { name: 'Find MP · riding lookup down (live fallback)', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'V6B 4Y8' }, mpState('unavailable', 'en', 'V6B 4Y8', { province: 'BC' })) },
  { name: 'Find MP · error', toolName: 'civicFindMp', part: part('civicFindMp', { postalCode: 'K1A 0B1' }, null, 'output-error', { errorText: 'Timeout' }) },

  // ── Voting ──
  { name: 'Vote · running (skeleton)', toolName: 'civicVoterCheck', part: part('civicVoterCheck', {}, null, 'input-available') },
  { name: 'Vote · "Am I registered?" (nothing known yet)', toolName: 'civicVoterCheck', part: vote({}) },
  { name: 'Vote · eligible adult citizen (register)', toolName: 'civicVoterCheck', part: vote({ age: 34, citizen: true }) },
  { name: 'Vote · what ID do I need?', toolName: 'civicVoterCheck', part: vote({ citizen: true, age: 22, focus: 'id' }) },
  { name: 'Vote · ways to vote (French)', toolName: 'civicVoterCheck', part: vote({ citizen: true, age: 40, focus: 'ways', lang: 'fr' }) },
  { name: 'Vote · 16-year-old (future elector)', toolName: 'civicVoterCheck', part: vote({ age: 16, citizen: true }) },
  { name: 'Vote · 12-year-old (too young for the register)', toolName: 'civicVoterCheck', part: vote({ age: 12, citizen: true }) },
  {
    name: 'Vote · 16-year-old living abroad',
    toolName: 'civicVoterCheck',
    part: vote({ age: 16, citizen: true, livesAbroad: true }),
    note: 'The Register of Future Electors is only for 14-to-17-year-olds living in Canada (elections.ca, reg/fut).',
  },
  { name: 'Vote · permanent resident (not a citizen)', toolName: 'civicVoterCheck', part: vote({ citizen: false, age: 30 }) },
  { name: 'Vote · living abroad', toolName: 'civicVoterCheck', part: vote({ citizen: true, age: 45, livesAbroad: true }) },
  { name: 'Vote · Quebec before election day (French)', toolName: 'civicVoterCheck', part: vote({ citizen: true, age: 28, province: 'QC', lang: 'fr' }, '2026-09-30') },
  { name: 'Vote · Quebec after election day (generic notice)', toolName: 'civicVoterCheck', part: vote({ citizen: true, age: 28, province: 'QC' }, '2026-10-06') },
  { name: 'Vote · error', toolName: 'civicVoterCheck', part: part('civicVoterCheck', {}, null, 'output-error', { errorText: 'Failed' }) },

  // ── Parliament ──
  { name: 'Parliament · running (skeleton)', toolName: 'civicParliament', part: part('civicParliament', {}, null, 'input-available') },
  {
    name: 'Parliament · how it works + latest bills (live)',
    toolName: 'civicParliament',
    part: part('civicParliament', {}, P.parl),
    note: 'Seat counts from the House of Commons (6 vacant on 2026-09-30); bills from LEGISinfo, most recent movement first.',
  },
  { name: 'Parliament · bill C-25 (became law)', toolName: 'civicParliament', part: part('civicParliament', { bill: 'C-25' }, withBill(P.bill)) },
  { name: 'Parliament · bill C-38 in committee (French)', toolName: 'civicParliament', part: part('civicParliament', { bill: 'C-38', lang: 'fr' }, withBill(P.billFr)) },
  { name: 'Parliament · bill C-10 at second reading in the Senate', toolName: 'civicParliament', part: part('civicParliament', { bill: 'C-10' }, billSenate) },
  {
    name: 'Parliament · bill defeated at second reading',
    toolName: 'civicParliament',
    part: part('civicParliament', { bill: P.parl.bills[2].code }, billDefeated),
    note: 'Lab only: the focus bill’s status is overridden to show the defeated state. The list rows keep their captured statuses.',
  },
  { name: 'Parliament · bill question (skeleton)', toolName: 'civicParliament', part: part('civicParliament', { bill: 'C-38' }, null, 'input-available') },
  { name: 'Parliament · bills about housing', toolName: 'civicParliament', part: part('civicParliament', { topic: 'housing' }, P.topic) },
  { name: 'Parliament · French overview', toolName: 'civicParliament', part: part('civicParliament', { lang: 'fr' }, P.parlFr) },
  { name: 'Parliament · no bills match a topic', toolName: 'civicParliament', part: part('civicParliament', { topic: 'daylight saving time' }, parlNone) },
  { name: 'Parliament · bill number not found', toolName: 'civicParliament', part: part('civicParliament', { bill: 'C-999' }, parlMissing) },
  { name: 'Parliament · LEGISinfo unreachable (fallback)', toolName: 'civicParliament', part: part('civicParliament', {}, parlOffline) },
  { name: 'Parliament · error', toolName: 'civicParliament', part: part('civicParliament', {}, null, 'output-error', { errorText: 'Failed' }) },

  // ── News ──
  { name: 'News · running (skeleton)', toolName: 'civicNews', part: part('civicNews', {}, null, 'input-available') },
  { name: 'News · latest (live)', toolName: 'civicNews', part: part('civicNews', {}, N.news) },
  { name: 'News · latest in French', toolName: 'civicNews', part: part('civicNews', { lang: 'fr' }, N.newsFr) },
  { name: 'News · topic: wildfire', toolName: 'civicNews', part: part('civicNews', { topic: 'wildfire' }, N.newsTopic) },
  { name: 'News · topic with no matches', toolName: 'civicNews', part: part('civicNews', { topic: 'lighthouse keepers' }, newsEmpty) },
  { name: 'News · feed unreachable (fallback)', toolName: 'civicNews', part: part('civicNews', {}, newsOffline) },
  { name: 'News · error', toolName: 'civicNews', part: part('civicNews', {}, null, 'output-error', { errorText: 'Failed' }) },
];

export default fixtures;
