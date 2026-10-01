/** Lab fixtures for the `immigration` widget: every state and edge case, built with the tools' own functions. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { buildCrs, buildEligibility, buildEntry, buildPermits, buildTimes } from './build';
import { snapshotDraws, snapshotTimes } from './fallback';
import { SNAPSHOT_DATE } from './snapshot';
import type { Pinned } from './earlier';
import { normalizeProfile } from './crs';
import { profileFromText, profileQuestion } from './parse';
import { msg } from './scenario-copy/shared';

type Lang = 'en' | 'fr';
/**
 * Every output is built in both languages: English is the output itself and French rides along as `fr`. The
 * renderers (index.tsx) show the one that matches the lab page (?lang=fr), so source titles, URLs and round
 * names match the UI exactly like a real answer in that language, without reading the page here.
 */
const both = <O extends object>(build: (lang: Lang) => O) => ({ ...build('en'), fr: build('fr') });

/**
 * Fixtures are built from the snapshot (snapshot.ts), not from today's feeds. The ones that show the live state
 * stamp that snapshot as live, so their names say so: the numbers are those of SNAPSHOT_DATE, not current facts.
 */
const times = snapshotTimes();
const liveTimes: typeof times = { ...times, live: true, down: [] };
const snapDraws = (lang: Lang) => snapshotDraws(lang);
const liveDraws = (lang: Lang) => ({ ...snapshotDraws(lang), live: true });

let n = 0;
const part = (toolName: string, input: unknown, output: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-im-${++n}`,
  state,
  input,
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

/**
 * Every fixture is pinned: it neither feeds nor reads the conversation's memory (earlier.ts) or the device, so
 * each one stands alone on the lab page. `earlier` / `country` stand in for that memory where a fixture shows it.
 */
const crs = (input: Parameters<typeof buildCrs>[0], draws = liveDraws, pinned: Pinned = {}) => both((lang) => ({ ...buildCrs({ lang, ...input }, draws(lang)), pinned }));
const elig = (input: Parameters<typeof buildEligibility>[0], pinned: Pinned = {}) => both((lang) => ({ ...buildEligibility({ lang, ...input }), pinned }));
const timesOut = (input: Parameters<typeof buildTimes>[0], data = liveTimes, pinned: Pinned = {}) => both((lang) => ({ ...buildTimes({ lang, ...input }, data), pinned }));
const entry = (input: Parameters<typeof buildEntry>[0], data = liveTimes) => both((lang) => ({ ...buildEntry({ lang, ...input }, data), pinned: {} }));
const permits = (input: Parameters<typeof buildPermits>[0], data = liveTimes) => both((lang) => buildPermits({ lang, ...input }, data));

/**
 * Regression: the flagship question. Nothing about work outside Canada was said, so it must count 0 years
 * (age 110 + bachelor's 120 + CLB 9 124 + 1 year in Canada 40 + transferability 38 = 432), never 482.
 */
const FLAGSHIP = 'I’m 29 with a bachelor’s, CLB 9 and 1 year of work in Canada';
const flagship = crs({ ...profileFromText(FLAGSHIP), mode: 'score' });
if (flagship.score.total !== 432 || flagship.profile.foreignWork !== 0) {
  console.error(`[immigration fixtures] CRS regression: "${FLAGSHIP}" scored ${flagship.score.total} (expected 432)`);
}

/**
 * Regression: the hand-off. After “Try it: NCLC 7 in French” on the flagship score, “Check my eligibility with
 * these answers” must arrive with the French level (4 Federal Skilled Worker points), not “no French test”.
 */
const HANDOFF_GIVEN = { ...profileFromText(FLAGSHIP), secondClb: 7 };
const HANDOFF = profileQuestion((key, values) => msg('en', key, values), 'ask.eligibility', normalizeProfile(HANDOFF_GIVEN), Object.keys(HANDOFF_GIVEN) as (keyof typeof HANDOFF_GIVEN)[]);
const handoff = elig(profileFromText(HANDOFF));
if (handoff.profile.secondClb !== 7 || !handoff.given.includes('secondClb')) {
  console.error(`[immigration fixtures] hand-off regression: “${HANDOFF}” lost the second language`);
}

const list: Fixture[] = [
  /* ── CRS calculator ── */
  { name: 'CRS: streaming, few answers yet (skeleton: answers needed)', toolName: 'immigrationCrsCalculator', part: part('immigrationCrsCalculator', { age: 29 }, null, 'input-streaming') },
  {
    name: 'CRS: running, full profile (skeleton: score)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', { age: 29, education: 'bachelors', firstClb: 9, canadianWork: 1 }, null, 'input-available'),
  },
  { name: 'CRS: running, draws question (skeleton: rounds)', toolName: 'immigrationCrsCalculator', part: part('immigrationCrsCalculator', { mode: 'rounds' }, null, 'input-available') },
  {
    name: `CRS regression: “${FLAGSHIP}” → 432`,
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', profileFromText(FLAGSHIP), flagship),
    note: 'Work outside Canada was not given: counted as 0 and listed as assumed. Must read 432, 86 below the latest CEC cut-off of 518.',
  },
  {
    name: 'CRS: “What was the latest Express Entry draw?” (rounds mode)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', { mode: 'rounds' }, crs({ mode: 'rounds' })),
    note: 'Leads with the latest round; the estimate stays behind “Estimate my score” (answers needed inside).',
  },
  {
    name: 'CRS: “What’s my CRS score?” with no details (answers needed)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', { mode: 'score' }, crs({ mode: 'score' })),
  },
  {
    name: 'CRS: full profile incl. 3 years abroad (hero case)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', {}, crs({ age: 29, education: 'bachelors', firstClb: 9, secondClb: 0, canadianWork: 1, foreignWork: 3 })),
    note: 'Cut-offs as ee_rounds_123_en.json had them on the snapshot day; pool share from the official score distribution.',
  },
  {
    name: 'CRS: couple, master’s, French bonus, sibling (high score)',
    toolName: 'immigrationCrsCalculator',
    part: part(
      'immigrationCrsCalculator',
      {},
      crs({ age: 33, education: 'masters', firstClb: 10, secondClb: 7, canadianWork: 3, foreignWork: 3, spouse: true, spouseEducation: 'bachelors', spouseClb: 8, spouseCanadianWork: 1, canadianEducation: 'long', sibling: true }),
    ),
  },
  {
    name: 'CRS: provincial nomination (score beyond the 800 scale)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', {}, crs({ age: 31, education: 'two-year', firstClb: 7, canadianWork: 2, foreignWork: 0, nomination: true })),
  },
  {
    name: 'CRS: 44, high school, CLB 6, 5 years abroad (low score, some answers assumed)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', {}, crs({ age: 44, education: 'secondary', firstClb: 6, foreignWork: 5 })),
    note: 'Meets no program’s minimums (CLB 6, no Canadian work): no “X points below” a round they could not be invited in.',
  },
  {
    name: 'CRS: very low score (pool share under 1%)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', {}, crs({ age: 52, education: 'secondary', firstClb: 4, canadianWork: 0, foreignWork: 1 })),
    note: 'Reads “Fewer than 1%”, never a bare 0%.',
  },
  {
    name: 'CRS: French-first applicant, feed down (last known cut-offs)',
    toolName: 'immigrationCrsCalculator',
    part: part('immigrationCrsCalculator', {}, crs({ age: 27, education: 'bachelors', firstLanguage: 'fr', firstClb: 8, secondClb: 5, foreignWork: 2 }, snapDraws)),
    note: 'No Canadian work, so never compared with a CEC round: measured against the latest French-language round. A calm “Last known” line under the score at every width, no “Live” badge.',
  },
  { name: 'CRS: error', toolName: 'immigrationCrsCalculator', part: part('immigrationCrsCalculator', {}, null, 'output-error', { errorText: 'Upstream timeout' }) },

  /* ── Eligibility ── */
  { name: 'Eligibility: running, no details (skeleton: answers needed)', toolName: 'immigrationEligibility', part: part('immigrationEligibility', {}, null, 'input-available') },
  {
    name: 'Eligibility: running, full profile (skeleton: result)',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', { age: 29, education: 'bachelors', firstClb: 9, canadianWork: 1 }, null, 'input-available'),
  },
  {
    name: 'Eligibility: “Can I immigrate to Canada?” (no details: answers needed)',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig({})),
    note: 'No verdict from invented answers: the questions first, IRCC’s program finder for people still exploring, and Come to Canada once, as the primary action.',
  },
  {
    name: `Eligibility: “${FLAGSHIP}” (job type and work abroad assumed)`,
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig(profileFromText(FLAGSHIP))),
  },
  {
    name: 'Eligibility regression: hand-off from the score after “Try it: NCLC 7 in French”',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', profileFromText(HANDOFF), handoff),
    note: `Asked by the calculator’s button: “${HANDOFF}” The French level arrives with the other answers: the note under the verdict must not say “no French test”.`,
  },
  {
    name: 'Eligibility: CEC + FSW likely (everything given)',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig({ age: 29, education: 'bachelors', firstClb: 9, secondClb: 0, canadianWork: 1, foreignWork: 3, occupation: 'teer01' })),
  },
  {
    name: 'Eligibility: electrician with a certificate (Skilled Trades)',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig({ age: 38, education: 'secondary', firstClb: 5, secondClb: 0, canadianWork: 0, foreignWork: 4, occupation: 'trade', certificate: true, spouse: true, familySize: 4 })),
  },
  {
    name: 'Eligibility: not yet (CLB 5, no skilled work)',
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig({ age: 24, education: 'secondary', firstClb: 5, secondClb: 0, canadianWork: 0, foreignWork: 0, occupation: 'other' })),
  },
  {
    name: `Eligibility: follow-up chip after “${FLAGSHIP}” (earlier answers offered)`,
    toolName: 'immigrationEligibility',
    part: part('immigrationEligibility', {}, elig({}, { earlier: { profile: flagship.profile, given: flagship.given } })),
    note: 'The chip “Am I eligible for Express Entry?” carries no details: one button brings back what the person said a turn earlier.',
  },
  { name: 'Eligibility: error', toolName: 'immigrationEligibility', part: part('immigrationEligibility', {}, null, 'output-error', { errorText: 'boom' }) },

  /* ── Processing times ── */
  { name: 'Processing times: streaming (skeleton)', toolName: 'immigrationProcessingTimes', part: part('immigrationProcessingTimes', { program: 'cec' }, null, 'input-streaming') },
  { name: 'Processing times: parents, running (skeleton: paused)', toolName: 'immigrationProcessingTimes', part: part('immigrationProcessingTimes', { program: 'parents' }, null, 'input-available') },
  {
    name: 'Processing times: Canadian Experience Class',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'cec' })),
  },
  {
    name: 'Processing times: parents and grandparents (program paused)',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'parents' })),
  },
  {
    name: 'Processing times: spouse in Canada (with Quebec)',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'spouse-inside' })),
  },
  {
    name: 'Processing times: visitor visa from India',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'visitor', country: 'IN' })),
  },
  {
    name: 'Processing times: study permit, no country yet',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'study' })),
  },
  {
    name: 'Processing times: visitor visa after a visa check for Mexico (country offered)',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'visitor' }, liveTimes, { country: 'MX' })),
  },
  {
    name: 'Processing times: by-country feed down, the others live (visitor visa from India: last known)',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'visitor', country: 'IN' }, { ...liveTimes, down: ['country'] })),
    note: 'IRCC publishes 4 feeds. Only the application types served by the one that is down read “Last known”; pick Canadian Experience Class and the widget is live again.',
  },
  {
    name: 'Processing times: feeds down (last known), citizenship',
    toolName: 'immigrationProcessingTimes',
    part: part('immigrationProcessingTimes', {}, timesOut({ focus: 'citizenship' }, times)),
  },
  {
    name: 'Processing times: no estimate published',
    toolName: 'immigrationProcessingTimes',
    part: part(
      'immigrationProcessingTimes',
      {},
      timesOut({ focus: 'fsw' }, { ...liveTimes, rows: liveTimes.rows.map((r) => (r.key === 'fsw' ? { key: r.key, value: null } : r)) }),
    ),
  },
  { name: 'Processing times: error', toolName: 'immigrationProcessingTimes', part: part('immigrationProcessingTimes', {}, null, 'output-error', { errorText: 'boom' }) },

  /* ── Visa or eTA ── */
  { name: 'Visa check: running, Mexico (skeleton: visa, eTA route)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', { country: 'MX' }, null, 'input-available') },
  { name: 'Visa check: Mexico, no visa history (visa, eTA route)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'MX' })) },
  { name: 'Visa check: running, India (skeleton: visa)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', { country: 'IN' }, null, 'input-available') },
  { name: 'Visa check: running, France (skeleton: eTA)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', { country: 'FR' }, null, 'input-available') },
  { name: 'Visa check: running, no country (skeleton)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, null, 'input-available') },
  { name: 'Visa check: Brazil with a visa, arriving by land (visa)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'BR', hasVisaHistory: true, travel: 'land-sea' })) },
  { name: 'Visa check: India (visitor visa, live processing)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'IN' })) },
  { name: 'Visa check: France by air (eTA)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'FR' })) },
  { name: 'Visa check: Mexico with a US visa (conditional eTA)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'MX', hasVisaHistory: true })) },
  { name: 'Visa check: Brazil, no visa history (visa, eTA route shown)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'BR' })) },
  { name: 'Visa check: UK by car from the US (passport only)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'GB', travel: 'land-sea' })) },
  { name: 'Visa check: Israel (passport type note)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'IL' })) },
  { name: 'Visa check: Vatican City (passport note)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'VA' })) },
  { name: 'Visa check: US green card holder', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'PH', usPermanentResident: true })) },
  { name: 'Visa check: India, feeds down (last known processing time)', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({ country: 'IN' }, times)) },
  { name: 'Visa check: no country given', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, entry({}, times)) },
  { name: 'Visa check: error', toolName: 'immigrationVisaCheck', part: part('immigrationVisaCheck', {}, null, 'output-error', { errorText: 'boom' }) },

  /* ── Permits ── */
  { name: 'Permits: streaming (skeleton)', toolName: 'immigrationPermits', part: part('immigrationPermits', { focus: 'study' }, null, 'input-streaming') },
  { name: 'Permits: study permit from Nigeria, 2 people', toolName: 'immigrationPermits', part: part('immigrationPermits', {}, permits({ focus: 'study', country: 'NG', familySize: 2 })) },
  { name: 'Permits: study permit, no country', toolName: 'immigrationPermits', part: part('immigrationPermits', {}, permits({ focus: 'study' })) },
  { name: 'Permits: work permit from the Philippines', toolName: 'immigrationPermits', part: part('immigrationPermits', {}, permits({ focus: 'work', country: 'PH' })) },
  { name: 'Permits: work permit from the Philippines, feeds down (last known)', toolName: 'immigrationPermits', part: part('immigrationPermits', {}, permits({ focus: 'work', country: 'PH' }, times)) },
  { name: 'Permits: error', toolName: 'immigrationPermits', part: part('immigrationPermits', { focus: 'work' }, null, 'output-error', { errorText: 'boom' }) },
];

/** Outputs with IRCC numbers in them come from the snapshot: the name says which day's numbers they are. */
const SNAPSHOT_TOOLS = ['immigrationCrsCalculator', 'immigrationProcessingTimes', 'immigrationVisaCheck', 'immigrationPermits'];
const fixtures: Fixture[] = list.map((f) => (f.part.state === 'output-available' && SNAPSHOT_TOOLS.includes(f.toolName) ? { ...f, name: `${f.name} · snapshot of ${SNAPSHOT_DATE}` } : f));

export default fixtures;
