/** Lab fixtures for the `travel` widget: every tool, every state and the edge cases. See docs/WIDGET_GUIDE.md. */
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { countryByIso } from './countries';
import { computeExemption } from './exemption';
import { destinationUrl, helpProse } from './parse-advisory';
import { stampMs } from './select';
import { ADVISORY_SNAPSHOTS, WAITS_SNAPSHOT } from './snapshots';
import { POPULAR, SOURCES, fallbackWaitNotices, inBoth } from './sources';
import type { ToolSource } from '@/lib/widgets/types';
import type { AdvisoryFocus, AdvisoryOutput, BorderWaitsOutput, Crossing, DutyFreeOutput, EmergencyOutput, ExemptionInput, Lang } from './types';

let n = 0;
/** As build.ts: `sources` in the answer's language, plus both languages for the card's footer. */
const cited = (lang: Lang, list: (l: Lang) => ToolSource[]) => ({ sources: list(lang), sourcesIn: inBoth(list) });
/** A snapshot destination's page: the feed's own name and link in its language, ours in the other. */
const destinationSource = (c: { iso: string; name: string; url: string; updated: string }, lang: Lang, l: Lang) =>
  SOURCES.destination(l, (l === lang ? undefined : namesOf(c.iso)?.[l]) ?? c.name, (l === lang ? undefined : urlsOf(c.iso)?.[l]) ?? c.url, c.updated.slice(0, 10));
const namesOf = (iso: string) => {
  const row = countryByIso(iso);
  return row ? { en: row[1], fr: row[2] } : undefined;
};
const urlsOf = (iso: string) => {
  const row = countryByIso(iso);
  return row ? { en: destinationUrl('en', row[3]), fr: destinationUrl('fr', row[4]) } : undefined;
};
const part = (toolName: string, input: unknown, output?: unknown, state: WidgetPart['state'] = 'output-available', extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: `fx-travel-${++n}`,
  state,
  input,
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

/* ---------- Advisory ---------- */

function advisory(key: keyof typeof ADVISORY_SNAPSHOTS, focus: AdvisoryFocus = 'safety'): AdvisoryOutput {
  const snap = ADVISORY_SNAPSHOTS[key];
  const lang: Lang = key.endsWith('_fr') ? 'fr' : 'en';
  const c = { ...snap.country, names: namesOf(snap.country.iso), urls: urlsOf(snap.country.iso) };
  return {
    kind: 'advisory',
    lang,
    live: true,
    focus,
    fetchedAt: snap.fetchedAt,
    country: c,
    ...cited(lang, (l) => [destinationSource(c, lang, l), SOURCES.explained(l), SOURCES.roca(l), SOURCES.emergency(l)]),
  };
}

/**
 * The notice travel.gc.ca put above every destination's passport rules on 2026-10-01, word for word in both
 * languages (the snapshots predate it), as parse-advisory.ts reads it from the live feed.
 */
const ENTRY_NOTICE = {
  en: 'Some countries have imposed measures in response to the Ebola disease outbreak. These can include restrictions on entry and health screening measures for travellers having recently visited an affected country. If you are suspected of having symptoms, you may be subject to isolation, quarantine and/or travel restrictions. Contact the authorities of the country you are travelling to for more details.',
  fr: "Certains pays ont mis en place des mesures en réponse à l'éclosion de maladie Ebola. Ces mesures peuvent inclure des restrictions d'entrée sur le territoire et des contrôles sanitaires pour les voyageurs ayant récemment séjourné dans un pays touché par l'éclosion. Si l'on soupçonne que vous présentez des symptômes, vous pourriez être placé en isolement, en quarantaine et/ou faire l'objet de restrictions de déplacement. Contactez les autorités du pays dans lequel vous vous rendez pour plus de détails.",
};
function withEntryNotice(out: AdvisoryOutput): AdvisoryOutput {
  if (out.kind !== 'advisory') return out;
  const c = out.country;
  const other = out.lang === 'fr' ? 'en' : 'fr';
  const prose = c.prose?.[other];
  return {
    ...out,
    country: {
      ...c,
      entry: { ...c.entry, notices: [{ body: [ENTRY_NOTICE[out.lang]] }] },
      ...(prose ? { prose: { ...c.prose, [other]: { ...prose, entry: { ...prose.entry, notices: [{ body: [ENTRY_NOTICE[other]] }] } } } } : {}),
    },
  };
}

const offline = (iso: string, lang: Lang = 'en'): AdvisoryOutput => {
  const row = countryByIso(iso)!;
  const name = lang === 'fr' ? row[2] : row[1];
  const url = destinationUrl(lang, lang === 'fr' ? row[4] : row[3]);
  return {
    kind: 'offline',
    lang,
    live: false,
    focus: 'safety',
    country: { iso, name, names: namesOf(iso), urls: urlsOf(iso), url },
    ...cited(lang, (l) => [SOURCES.destination(l, row[l === 'fr' ? 2 : 1], destinationUrl(l, l === 'fr' ? row[4] : row[3]), undefined, false), SOURCES.explained(l), SOURCES.roca(l), SOURCES.emergency(l)]),
  };
};

const popular = (lang: Lang) => POPULAR.slice(0, 6).map((iso) => ({ iso, name: countryByIso(iso)![lang === 'fr' ? 2 : 1], names: namesOf(iso) }));

const notFound: AdvisoryOutput = {
  kind: 'not-found',
  lang: 'en',
  live: false,
  focus: 'safety',
  query: 'Atlantis',
  suggestions: popular('en'),
  ...cited('en', (l) => [SOURCES.advisories(l), SOURCES.explained(l), SOURCES.roca(l)]),
};

/** No destination named (the same output the tool returns for "How do I register my trip?"). */
const start = (lang: Lang, focus: AdvisoryFocus): AdvisoryOutput => ({
  kind: 'start',
  lang,
  live: false,
  focus,
  suggestions: popular(lang),
  ...cited(lang, (l) => [SOURCES.roca(l), SOURCES.advisories(l), SOURCES.explained(l)]),
});

/* ---------- Duty-free ---------- */

const duty = (input: ExemptionInput, lang: Lang = 'en'): DutyFreeOutput => ({
  lang,
  result: computeExemption(input),
  ...cited(lang, (l) => [SOURCES.declare(l), SOURCES.bis(l), SOURCES.surtaxes(l), SOURCES.arrivecan(l)]),
});

/* ---------- Border waits ---------- */

/** The snapshot's crossings with their names in both official languages, as the tool returns them (`name` in `lang`). */
const rowsIn = (lang: Lang, rows: Crossing[] = WAITS_SNAPSHOT.en): Crossing[] =>
  rows.map((c) => {
    const fr = WAITS_SNAPSHOT.fr.find((f) => f.id === c.id)?.name ?? c.name;
    return { ...c, name: lang === 'fr' ? fr : c.name, names: { en: c.name, fr } };
  });

const waits = (lang: Lang, extra: Partial<Extract<BorderWaitsOutput, { live: true }>> = {}): BorderWaitsOutput => ({
  live: true,
  lang,
  // Four minutes after the newest estimate in the snapshot, as when the tool read the feed, and the board's
  // clock stays there (`pinned`), so the fixture always shows the board as it was at that moment.
  asOf: new Date(Math.max(...WAITS_SNAPSHOT[lang].map((c) => stampMs(c.updated))) + 4 * 60_000).toISOString(),
  pinned: true,
  province: null,
  highlight: null,
  crossings: rowsIn(lang),
  // The notice CBSA's page showed on 2026-09-30 (what the live parser returns; data.ts).
  notices: fallbackWaitNotices(lang, '2026-09-30'),
  ...cited(lang, (l) => [SOURCES.waits(l, true)]),
  ...extra,
});

/** A long-weekend Sunday evening, for the busy state (same crossings, heavier illustrative waits). */
const BUSY: Record<string, [number | null, number | null]> = {
  'peace-bridge': [55, 20],
  'rainbow-bridge': [70, null],
  'queenston-lewiston-bridge': [40, 15],
  'ambassador-bridge': [35, 25],
  'blue-water-bridge': [25, 10],
  'pacific-highway': [45, 30],
  douglas: [60, null],
  'st-bernard-de-lacolle': [50, 20],
  'abbotsford-huntingdon': [20, 5],
};
const busyRows = rowsIn('en').map((c) =>
  BUSY[c.id]
    ? {
        ...c,
        travellers: BUSY[c.id][0] == null ? c.travellers : { minutes: BUSY[c.id][0], label: 'minutes' as const },
        commercial: BUSY[c.id][1] == null ? c.commercial : { minutes: BUSY[c.id][1], label: 'minutes' as const },
      }
    : c,
);

/**
 * Three crossings that stopped posting the day before, as CBSA's CSV had them at 01:39 EDT on 2026-10-01
 * (Aldergrove still at "20 minutes" from 13:56 PDT): their old figures must not be the longest wait.
 */
const QUIET: Record<string, [number, string]> = {
  'abbotsford-huntingdon': [20, '2026-09-29 13:56 PDT'],
  'fort-frances-bridge': [0, '2026-09-29 05:15 CDT'],
  'lacolle-route-221': [0, '2026-09-29 18:15 EDT'],
};
const quietRows = rowsIn('en').map((c) =>
  QUIET[c.id] ? { ...c, updated: QUIET[c.id][1], travellers: QUIET[c.id][0] ? { minutes: QUIET[c.id][0], label: 'minutes' as const } : { minutes: 0, label: 'none' as const } } : c,
);

/* ---------- Emergency ---------- */

const sos = (key: keyof typeof ADVISORY_SNAPSHOTS | null, lang: Lang = 'en', missing?: string): EmergencyOutput => {
  const c = key ? ADVISORY_SNAPSHOTS[key].country : null;
  return {
    lang,
    country: c
      ? { iso: c.iso, name: c.name, names: namesOf(c.iso), urls: urlsOf(c.iso), url: c.url, emergency: c.help.emergency, tollFree: c.help.tollFree, offices: c.help.offices, prose: helpProse(c) }
      : null,
    // As build.ts answers when a recognised destination's feed can't be read.
    countryMissing: missing ? { query: missing, url: destinationUrl(lang, 'cuba'), names: namesOf('CU'), urls: urlsOf('CU') } : null,
    ...cited(lang, (l) => [SOURCES.emergency(l), ...(c ? [destinationSource(c, lang, l)] : []), SOURCES.roca(l)]),
  };
};

/**
 * Fixtures whose tool answered in French. The card follows the page's language, so on the English lab page
 * they show the same card as an English answer would, with the other side of the bilingual output; open
 * /lab/travel?lang=fr for the French strings.
 */
const FR_QUESTION = 'French question on an English page: the card’s words and the feed’s prose switch to the page’s language. See ?lang=fr for the French strings.';

const fixtures: Fixture[] = [
  // travelAdvisory
  { name: 'Advisory · streaming input (skeleton)', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Mex' }, undefined, 'input-streaming') },
  { name: 'Advisory · running (skeleton)', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Mexico' }, undefined, 'input-available') },
  {
    name: 'Mexico · level 2 with regional advisories (hero case)',
    toolName: 'travelAdvisory',
    part: part('travelAdvisory', { destination: 'Mexico' }, advisory('MX_en')),
    note: 'Live snapshot from data.international.gc.ca (2026-09-29): hurricane and organized-crime regional advisories, 10 Canadian offices.',
  },
  { name: 'Japan · level 1, entry tab with the page’s entry notice, numbers list', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Japan', focus: 'entry' }, withEntryNotice(advisory('JP_en', 'entry'))) },
  { name: 'Cuba · level 3 (formal advisory, insurance)', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Cuba' }, advisory('CU_en')) },
  {
    name: 'Israel and Palestine · level 3 with level-4 areas',
    toolName: 'travelAdvisory',
    part: part('travelAdvisory', { destination: 'Israel' }, advisory('IL_en')),
    note: 'Several national-level containers in the feed (Palestine, Jerusalem) become areas, most serious first.',
  },
  { name: 'Haiti · level 4, opens on emergency help', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Haiti', focus: 'help' }, advisory('HT_en', 'help')) },
  { name: 'Thailand · before-you-go checklist open', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Thailand', focus: 'prepare' }, advisory('TH_en', 'prepare')) },
  {
    name: 'Mexique · French question (long strings)',
    toolName: 'travelAdvisory',
    part: part('travelAdvisory', { destination: 'Mexique' }, advisory('MX_fr')),
    note: FR_QUESTION,
  },
  { name: 'Ukraine · French question, level 4 with key points', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Ukraine' }, advisory('UA_fr')), note: FR_QUESTION },
  {
    name: 'Register your trip (no destination named)',
    toolName: 'travelAdvisory',
    part: part('travelAdvisory', { focus: 'prepare' }, start('en', 'prepare')),
    note: 'What “How do I register my trip?” gets: the Registration of Canadians Abroad handoff, then popular destinations.',
  },
  { name: 'Advisory with no destination', toolName: 'travelAdvisory', part: part('travelAdvisory', {}, start('en', 'safety')) },
  { name: 'Destination not recognised', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Atlantis' }, notFound) },
  { name: 'Live feed down (fallback to travel.gc.ca)', toolName: 'travelAdvisory', part: part('travelAdvisory', { destination: 'Portugal' }, offline('PT')) },
  {
    name: 'Advisory · error',
    toolName: 'travelAdvisory',
    part: part('travelAdvisory', { destination: 'Mexico' }, undefined, 'output-error', { errorText: 'Upstream timeout' }),
  },

  // travelDutyFree
  { name: 'Duty-free · skeleton', toolName: 'travelDutyFree', part: part('travelDutyFree', { hoursAway: 72 }, undefined, 'input-available') },
  {
    name: 'Weekend away, no amount yet (invites input)',
    toolName: 'travelDutyFree',
    part: part('travelDutyFree', { hoursAway: 48 }, duty({ tier: 'h48', spent: 0, alcohol: false, tobacco: false })),
    note: 'What “How much can I bring back duty-free after a weekend?” gets: the allowance, no verdict on $0 of goods.',
  },
  { name: 'Weekend in the U.S., $450 spent (all duty-free)', toolName: 'travelDutyFree', part: part('travelDutyFree', { hoursAway: 50, spent: 450 }, duty({ tier: 'h48', spent: 450, alcohol: true, tobacco: false })) },
  { name: 'Overnight trip, $250: the 24-hour cliff', toolName: 'travelDutyFree', part: part('travelDutyFree', { hoursAway: 30, spent: 250 }, duty({ tier: 'h24', spent: 250, alcohol: true, tobacco: false })) },
  { name: 'Two weeks away, $1,340 (duty on the excess)', toolName: 'travelDutyFree', part: part('travelDutyFree', { daysAway: 14, spent: 1340 }, duty({ tier: 'd7', spent: 1340, alcohol: false, tobacco: true })) },
  { name: 'Same-day shopping trip', toolName: 'travelDutyFree', part: part('travelDutyFree', { hoursAway: 6, spent: 120 }, duty({ tier: 'under24', spent: 120, alcohol: false, tobacco: false })) },
  {
    name: 'Exemption personnelle · 7 jours, 950 $ (French question)',
    toolName: 'travelDutyFree',
    part: part('travelDutyFree', { daysAway: 8, spent: 950 }, duty({ tier: 'd7', spent: 950, alcohol: true, tobacco: false }, 'fr')),
    note: FR_QUESTION,
  },
  { name: 'Duty-free · error', toolName: 'travelDutyFree', part: part('travelDutyFree', {}, undefined, 'output-error', { errorText: 'Failed' }) },

  // travelBorderWaits
  { name: 'Border waits · skeleton', toolName: 'travelBorderWaits', part: part('travelBorderWaits', {}, undefined, 'input-streaming') },
  {
    name: 'Border waits · live, all crossings',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', {}, waits('en')),
    note: 'CBSA CSV snapshot from 2026-09-30 early morning, shown at that moment (the board’s clock is pinned).',
  },
  {
    name: 'Border waits · three crossings stopped reporting',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', {}, waits('en', { crossings: quietRows })),
    note: 'Estimates over 2 hours old are dimmed, labelled “Last reported”, listed after the current ones and left out of the tiles: the 20 minutes from the day before is not the longest wait.',
  },
  {
    name: 'Peace Bridge on a busy Sunday evening (Ontario first)',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', { crossing: 'Peace Bridge', province: 'ON' }, waits('en', { crossings: busyRows, province: 'ON', highlight: 'peace-bridge' })),
    note: 'Illustrative heavier waits to show the long-wait styling.',
  },
  {
    name: 'Temps d’attente · Québec (avis Lacolle, French question)',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', { province: 'QC' }, waits('fr', { province: 'QC' })),
    note: `${FR_QUESTION} Crossing names and CBSA’s notice stay in French, as published.`,
  },
  {
    name: 'Border waits · saved answer reopened later (no longer live)',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', {}, waits('en', { pinned: false })),
    note: 'The same snapshot on today’s clock: every estimate is old, so the badge reads “Last reported”, the tiles show no current wait and each row says when it last reported.',
  },
  {
    name: 'Border waits · CBSA feed down',
    toolName: 'travelBorderWaits',
    part: part('travelBorderWaits', {}, { live: false, lang: 'en', province: null, highlight: null, crossings: [], notices: [], ...cited('en', (l) => [SOURCES.waits(l, false)]) } satisfies BorderWaitsOutput),
  },
  { name: 'Border waits · error', toolName: 'travelBorderWaits', part: part('travelBorderWaits', {}, undefined, 'output-error', { errorText: 'Failed' }) },

  // travelEmergencyHelp
  { name: 'Emergency help · skeleton', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', { destination: 'Mexico' }, undefined, 'input-available') },
  { name: 'Emergency help in Mexico (toll-free line, 911, offices)', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', { destination: 'Mexico' }, sos('MX_en')) },
  { name: 'Emergency help in Japan (numbers list, no toll-free)', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', { destination: 'Japan' }, sos('JP_en')) },
  { name: 'Emergency help, no destination', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', {}, sos(null)) },
  { name: 'Emergency help · destination details unavailable', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', { destination: 'Cuba' }, sos(null, 'en', 'Cuba')) },
  { name: 'Emergency help · error', toolName: 'travelEmergencyHelp', part: part('travelEmergencyHelp', {}, undefined, 'output-error', { errorText: 'Failed' }) },
];

export default fixtures;
