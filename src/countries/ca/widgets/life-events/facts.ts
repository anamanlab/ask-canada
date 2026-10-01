/**
 * Life events: the small constants and types the checklist needs at first render (ids, verified numbers, phone
 * numbers and the two official links shown before any plan exists). Everything here was verified with the pages
 * listed in data.ts, which re-exports this module and holds the heavy part (pages, quotes, checklist structure).
 */
export type Lang = 'en' | 'fr';

const CA = 'https://www.canada.ca';

/** Official pages the widget links to without a plan (the picker's handoff, the error fallback, grief support). */
export const LINKS = {
  lifeEvents: { en: `${CA}/en/services/life-events.html`, fr: `${CA}/fr/services/evenements-vie.html` },
  mentalHealth: {
    en: `${CA}/en/public-health/services/mental-health-services/mental-health-get-help.html`,
    fr: `${CA}/fr/sante-publique/services/services-sante-mentale/sante-mentale-obtenir-aide.html`,
  },
} as const;

/* ------------------------------------------------------------------ checklist structure */

export const EVENTS = ['moving', 'baby', 'marriage', 'job-loss', 'retiring', 'death'] as const;
export type EventId = (typeof EVENTS)[number];
export const isEvent = (x: unknown): x is EventId => typeof x === 'string' && (EVENTS as readonly string[]).includes(x);

/** Each event's accent (the shell's icon tile, the picker's tiles, the skeleton): the one place it's decided. */
export type Tone = 'maple' | 'pine' | 'glacier' | 'amber';
export const TONES: Record<EventId, Tone> = {
  moving: 'glacier',
  baby: 'pine',
  marriage: 'maple',
  'job-loss': 'amber',
  retiring: 'amber',
  death: 'glacier',
};

export type Agency = 'cra' | 'sc' | 'ircc' | 'passport' | 'elections' | 'province' | 'jobbank' | 'federal' | 'bank';
/**
 * Named federal organizations: the ones counted in "N federal organizations" (the catch-all buckets aren't).
 * Job Bank is a Service Canada / ESDC service, and the Passport Program is run by IRCC, so neither is counted on
 * its own (`countAgencies` in model.ts folds the Passport Program into IRCC).
 */
export const COUNTED_AGENCIES: readonly Agency[] = ['cra', 'sc', 'ircc', 'elections'];
export type Channel = 'online' | 'phone' | 'mail' | 'in-person' | 'kitchen-table';
/** now = do first, next = soon after, later = when the time comes, auto = handled for you (no action). */
export type Phase = 'now' | 'next' | 'later' | 'auto';

/** What an event's optional date means (messages: `event.<id>.date`, `count.anchor.<kind>`, `count.todayLabel.<kind>`). */
export type DateKind = 'move' | 'birth' | 'change' | 'last-day' | 'cpp-start' | 'death';

/** Deadline rules, each tied to a verified sentence above. */
export type DueRule =
  | 'ei-4-weeks' // last day of work + 4 weeks: "may lose benefits"
  | 'maternity-12-weeks' // due date − 12 weeks: earliest maternity start
  | 'marital-next-month' // end of the month after the change
  | 'cpp-death-60-days' // executor should apply within 60 days
  | 'final-return' // CRA final return due date (with weekend/holiday rollover)
  | 'cpp-apply-12-months'; // can apply up to 12 months before the chosen start

/** Missed deadlines with their own hero headline (`count.passed.<rule>`): the "by" rules. Others show the chip's sentence. */
export const PASSED_HEADLINE: ReadonlySet<DueRule> = new Set<DueRule>(['ei-4-weeks', 'marital-next-month', 'cpp-death-60-days', 'final-return']);

/** Provinces and territories (two-letter codes). */
export const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK'] as const;
export const TERRITORIES = ['NT', 'NU', 'YT'] as const;
export type Region = (typeof PROVINCES)[number] | (typeof TERRITORIES)[number];
export const isRegion = (x: unknown): x is Region =>
  typeof x === 'string' && ([...PROVINCES, ...TERRITORIES] as string[]).includes(x.toUpperCase());

/** Phone numbers shown in task details (verified on the pages cited by those tasks). */
export const PHONES = {
  craIndividual: '1-800-959-8281',
  cppOas: '1-800-277-9914',
} as const;

/** Numbers shown in task details (verified; see header). */
export const FACTS = {
  eiWeeks: 4,
  maternityWeeksBefore: 12,
  parentalStandardWeeks: 35,
  parentalStandardShared: 40,
  parentalStandardMax: 729,
  parentalExtendedWeeks: 61,
  parentalExtendedShared: 69,
  parentalExtendedMax: 437,
  childPassportYears: 5,
  commonLawMonths: 12,
  movingKm: 40,
  cppDeathBasic: 2500,
  cppDeathTopUp: 2500,
  cppDeathDays: 60,
  cppEarliest: 60,
  cppLatest: 70,
  cppStandard: 65,
  cppEarlyPct: 0.6,
  cppLatePct: 0.7,
  cppApplyMonths: 12,
  rrspAge: 71,
  survivorAllowanceMin: 60,
  survivorAllowanceMax: 64,
  passportAddressPage: 4,
  sinOnlineDays: 5,
} as const;
