/**
 * Lab fixtures for the `jobs` widget: every state and edge case of the four tools. Search and wage
 * outputs use real Job Bank data captured on 2026-09-30 (./fixtures-data.json); matches and programs use
 * the same pure functions as the tools.
 */
import { z } from 'zod';
import type { Fixture, WidgetPart } from '@/lib/widgets/types';
import { PROVINCE_CODES, URLS, jobBankSearchUrl, outlookUrl, wagesUrl, type Lang, type Province, type SearchLocation } from './data';
import raw from './fixtures-data.json';
import { dedupePostings, normalizeLocation, parseSalary } from './jobbank';
import { knownTerms, scoreText, toMatches } from './match';
import { OCCUPATIONS, occupationNames } from './occupations';
import { careerSources, matchSources, programSources, searchSources, wageSources } from './sources';
import type { MatchOutput, ProgramsOutput, SearchOutput, WagesOutput } from './types';

// A counter, not a random id: the same fixture gets the same toolCallId on the server and in the browser.
let made = 0;
const id = () => `fx-jobs-${made++}`;

/* ---------------------------------------------------------------- the captured data, checked as it is read */

const ProvinceCode = z.enum(PROVINCE_CODES as [Province, ...Province[]]);
const Wage = z.object({ low: z.number().nullable(), median: z.number().nullable(), high: z.number().nullable() });
const Posting = z.object({
  id: z.string(),
  title: z.string(),
  employer: z.string(),
  location: z.string(),
  province: ProvinceCode.optional(),
  date: z.string().optional(),
  salary: z.object({ raw: z.string() }).optional(),
  workplace: z.enum(['onsite', 'remote', 'hybrid', 'road']).optional(),
  postedOnJobBank: z.boolean(),
  isNew: z.boolean(),
  directApply: z.boolean(),
  url: z.string(),
});
const Search = z.object({ total: z.number().nullable(), jobs: z.array(Posting), byProvince: z.array(z.object({ code: ProvinceCode, count: z.number() })) });
const Wages = z.object({
  national: Wage.optional(),
  provinces: z.array(Wage.extend({ code: ProvinceCode })),
  regions: z.array(Wage.extend({ name: z.string(), fr: z.string(), geo: z.string() })),
});
const CAPTURED = z
  .object({ searchEn: Search, searchFr: Search, searchToronto: Search, wagesCa: Wages, wagesOn: Wages, outlook: z.partialRecord(ProvinceCode, z.object({ stars: z.number(), label: z.string() })) })
  .parse(raw);

const part = (toolName: string, output: unknown, state: WidgetPart['state'] = 'output-available', input: unknown = {}, extra: Partial<WidgetPart> = {}): WidgetPart => ({
  type: `tool-${toolName}`,
  toolCallId: id(),
  state,
  input: input as WidgetPart['input'],
  output: state === 'output-available' ? output : undefined,
  ...extra,
});

/* ---------------------------------------------------------------- search */

type CapturedSearch = z.output<typeof Search>;
type SearchData = Pick<SearchOutput, 'total' | 'jobs' | 'duplicates' | 'byProvince'>;
// Salaries are re-read with today's parser, so its plausibility guard applies to the captured postings too.
// Places and duplicates go through the same clean-up as live results.
const reparse = (r: CapturedSearch, lang: Lang): SearchData => {
  const jobs = dedupePostings(r.jobs.map((j) => ({ ...j, location: normalizeLocation(j.location), salary: j.salary ? parseSalary(j.salary.raw, lang) : undefined })));
  return { ...r, jobs, duplicates: r.jobs.length - jobs.length };
};
const EN = reparse(CAPTURED.searchEn, 'en');
const FR = reparse(CAPTURED.searchFr, 'fr');
// A real “registered nurse” search in Toronto, ON (city id 22437), captured 2026-09-30.
const TORONTO = reparse(CAPTURED.searchToronto, 'en');
const nurse = OCCUPATIONS.find((o) => o.key === 'registered-nurse')!;

function search(lang: Lang, query: string, location: SearchLocation, r: SearchData | null, extra: Partial<SearchOutput> = {}): SearchOutput {
  const url = jobBankSearchUrl(lang, query, location);
  return {
    lang,
    query,
    location,
    filters: {},
    live: !!r,
    total: r?.total ?? null,
    jobs: r?.jobs ?? [],
    duplicates: r?.duplicates ?? 0,
    byProvince: location.kind === 'canada' ? (r?.byProvince ?? []) : [],
    searchUrl: url,
    occupation: { key: nurse.key, profileId: nurse.profileId, title: nurse.title[lang], median: nurse.wage.median, ...occupationNames(nurse) },
    fetchedAt: '2026-09-30T12:00:00Z',
    sources: searchSources(lang, url, !!r),
    ...extra,
  };
}

const toronto: SearchLocation = { kind: 'city', name: 'Toronto', province: 'ON', cityId: '22437' };

/* ---------------------------------------------------------------- wages */

const { wagesCa: W_CA, wagesOn: W_ON, outlook: OUT } = CAPTURED;

function wages(lang: Lang, province: Province | undefined, live = true): WagesOutput {
  const geo = province ?? 'ca';
  return {
    lang,
    status: 'ok',
    query: lang === 'fr' ? 'infirmière' : 'registered nurse',
    occupation: { profileId: nurse.profileId, noc: nurse.noc, title: nurse.title[lang], ...occupationNames(nurse) },
    province,
    unit: 'hour',
    live,
    updated: '2025-11-19',
    refPeriod: '2023-2024',
    national: live ? W_CA.national : { ...nurse.wage },
    provinces: live ? W_CA.provinces.map((p) => ({ ...p, outlook: OUT[p.code] })) : [],
    // Region names as Job Bank publishes them in each language (guichetemplois.gc.ca for French).
    regions: live && province === 'ON' ? W_ON.regions.map(({ fr, ...r }) => ({ ...r, name: lang === 'fr' ? fr : r.name, names: { en: r.name, fr } })) : [],
    links: { wages: wagesUrl(lang, nurse.profileId, geo), outlook: outlookUrl(lang, nurse.profileId, geo), jobs: jobBankSearchUrl(lang, nurse.search[lang]) },
    suggestions: [],
    sources: wageSources(lang, nurse.profileId, geo, live),
  };
}

const notFound: WagesOutput = {
  lang: 'en',
  status: 'not-found',
  query: 'chief vibes officer',
  unit: 'hour',
  live: false,
  provinces: [],
  regions: [],
  links: { wages: URLS.trendAnalysis.en, outlook: URLS.trendAnalysis.en, jobs: jobBankSearchUrl('en', 'chief vibes officer') },
  suggestions: OCCUPATIONS.filter((o) => ['registered-nurse', 'electrician', 'software-developer', 'truck-driver', 'administrative-assistant', 'early-childhood-educator'].includes(o.key)).map((o) => ({ key: o.key, title: o.title.en, titles: o.title })),
  sources: careerSources('en'),
};

/* ---------------------------------------------------------------- match */

function match(lang: Lang, skills: string[], titles: string[], province?: Province, years?: number): MatchOutput {
  const signals = { years, named: skills };
  const raw = scoreText([...titles, ...skills].join(' | '), signals);
  return {
    lang,
    province,
    given: { skills, titles, years, known: knownTerms([...titles, ...skills], raw) },
    matches: toMatches(raw, lang, province, 5, signals),
    links: { resumeBuilder: URLS.resumeBuilder[lang], signUp: URLS.jobBankSignUp[lang], findAJob: URLS.jobBankFind[lang] },
    sources: matchSources(lang),
  };
}

/* ---------------------------------------------------------------- programs */

const programs = (lang: Lang, extra: Partial<ProgramsOutput> = {}): ProgramsOutput => ({ lang, interest: 'any', month: 9, sources: programSources(lang), ...extra });

/** Lab only: in the chat the answer and the interface are always in the same language. */
const FR_NOTE = 'A French answer: view with ?lang=fr. The widget follows the interface language; the source title and links in the footer follow the answer language.';

const fixtures: Fixture[] = [
  // Search
  { name: 'Search · streaming (skeleton)', toolName: 'jobsSearch', part: part('jobsSearch', null, 'input-streaming', { query: 'nur' }) },
  { name: 'Search · running (skeleton)', toolName: 'jobsSearch', part: part('jobsSearch', null, 'input-available', { query: 'nurse' }) },
  {
    name: 'Search · “nurse” across Canada (hero)',
    toolName: 'jobsSearch',
    part: part('jobsSearch', search('en', 'nurse', { kind: 'canada' }, EN)),
    note: 'Live Job Bank data: count, province breakdown (tap → asks for that province), filters and sort run on the 25 newest postings on the device.',
  },
  { name: 'Search · city (Toronto), no province chart', toolName: 'jobsSearch', part: part('jobsSearch', search('en', 'registered nurse', toronto, TORONTO)) },
  {
    name: 'Search · French (infirmière, partout au Canada)',
    toolName: 'jobsSearch',
    part: part('jobsSearch', search('fr', 'infirmière', { kind: 'canada' }, FR)),
    note: FR_NOTE,
  },
  {
    name: 'Search · no postings',
    toolName: 'jobsSearch',
    part: part('jobsSearch', search('en', 'lighthouse keeper', { kind: 'city', name: 'Iqaluit', province: 'NU', cityId: '0' }, { total: 0, jobs: [], byProvince: [] }, { occupation: undefined })),
  },
  {
    name: 'Search · place not found (searched Canada-wide)',
    toolName: 'jobsSearch',
    part: part('jobsSearch', search('en', 'nurse', { kind: 'canada' }, EN, { unresolvedLocation: 'Springfield' })),
  },
  {
    name: 'Search · Job Bank unreachable (fallback link)',
    toolName: 'jobsSearch',
    part: part('jobsSearch', search('en', 'welder', { kind: 'province', province: 'AB' }, null, { occupation: undefined })),
  },
  { name: 'Search · error', toolName: 'jobsSearch', part: part('jobsSearch', null, 'output-error', { query: 'nurse' }, { errorText: 'Upstream timeout' }) },

  // Wages
  { name: 'Wages · running (skeleton)', toolName: 'jobsWages', part: part('jobsWages', null, 'input-available', { occupation: 'registered nurse', province: 'ON' }) },
  {
    name: 'Wages · registered nurse in Ontario (hero)',
    toolName: 'jobsWages',
    part: part('jobsWages', wages('en', 'ON')),
    note: 'Pick a province (or tap its row) to update the headline; hourly ⇄ yearly estimate; regions shown for the province asked about.',
  },
  { name: 'Wages · Canada overview', toolName: 'jobsWages', part: part('jobsWages', wages('en', undefined)) },
  { name: 'Wages · French (Ontario)', toolName: 'jobsWages', part: part('jobsWages', wages('fr', 'ON')), note: FR_NOTE },
  { name: 'Wages · Job Bank unreachable (saved national figures)', toolName: 'jobsWages', part: part('jobsWages', wages('en', undefined, false)) },
  { name: 'Wages · occupation not found', toolName: 'jobsWages', part: part('jobsWages', notFound) },
  { name: 'Wages · error', toolName: 'jobsWages', part: part('jobsWages', null, 'output-error', { occupation: 'welder' }, { errorText: 'Upstream timeout' }) },

  // Career match
  { name: 'Match · running (skeleton)', toolName: 'jobsResumeMatch', part: part('jobsResumeMatch', null, 'input-available', { skills: ['customer service', 'Excel'], titles: ['cashier'] }) },
  {
    name: 'Match · upload card (no skills yet)',
    toolName: 'jobsResumeMatch',
    part: part('jobsResumeMatch', match('en', [], [])),
    note: 'Drop a PDF, .docx or text resume: it is read in the browser only (DecompressionStream), never uploaded.',
  },
  {
    name: 'Match · career change (3 years of retail + Excel)',
    toolName: 'jobsResumeMatch',
    part: part('jobsResumeMatch', match('en', ['Excel'], ['retail'], undefined, 3)),
    note: '“I worked retail for 3 years and know Excel.” The years make retail a held job; Excel keeps a path outside retail.',
  },
  {
    name: 'Match · from the conversation (retail → ?)',
    toolName: 'jobsResumeMatch',
    part: part('jobsResumeMatch', match('en', ['customer service', 'cash handling', 'scheduling', 'inventory', 'Excel', 'visual merchandising', 'team leadership'], ['retail sales associate', 'shift supervisor'], 'MB')),
  },
  {
    name: 'Match · French (électricien)',
    toolName: 'jobsResumeMatch',
    part: part('jobsResumeMatch', match('fr', ['câblage', 'lecture de plans', 'dépannage', 'SIMDUT', 'travail en hauteur', 'cadenassage'], ['apprenti électricien'], 'QC')),
    note: FR_NOTE,
  },
  {
    name: 'Match · nothing recognised',
    toolName: 'jobsResumeMatch',
    part: part('jobsResumeMatch', match('en', ['juggling', 'origami'], [])),
  },
  { name: 'Match · error', toolName: 'jobsResumeMatch', part: part('jobsResumeMatch', null, 'output-error', {}, { errorText: 'Upstream timeout' }) },

  // Programs
  { name: 'Programs · running (skeleton)', toolName: 'jobsPrograms', part: part('jobsPrograms', null, 'input-available') },
  {
    name: 'Programs · university student, 19, government (hero)',
    toolName: 'jobsPrograms',
    part: part('jobsPrograms', programs('en', { age: 19, stage: 'post-secondary', interest: 'government' })),
    note: 'Stage and age re-rank the cards instantly. The Canada Summer Jobs reminder is saved on the device.',
  },
  { name: 'Programs · nothing known yet', toolName: 'jobsPrograms', part: part('jobsPrograms', programs('en')) },
  { name: 'Programs · high school, 16, summer (French)', toolName: 'jobsPrograms', part: part('jobsPrograms', programs('fr', { age: 16, stage: 'high-school', interest: 'summer' })), note: FR_NOTE },
  { name: 'Programs · 33, not in school (few fits)', toolName: 'jobsPrograms', part: part('jobsPrograms', programs('en', { age: 33, stage: 'not-student', month: 5 })) },
  { name: 'Programs · error', toolName: 'jobsPrograms', part: part('jobsPrograms', null, 'output-error', {}, { errorText: 'Upstream timeout' }) },
];

export default fixtures;
