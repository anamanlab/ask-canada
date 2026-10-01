/**
 * Application journey, fees and processing time (citizenshipSteps), and the oath and ceremony guide
 * (citizenshipCeremony): pure builders shared by the tools (server) and the lab fixtures.
 * Live values (fees, processing time) are fetched by the tool and passed in; see tools/citizenship.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { FEES, OATH, PROCESSING_SNAPSHOT, RULES, TEST, URLS, ceremonySources, stepsSources, type Lang } from './data';

export type Fees = { adultTotal: number; adultProcessing: number; rightOfCitizenship: number; minor: number; live: boolean };
export type Processing = { text: string; waiting: string | null; updated: string | null; live: boolean };

export type StepsInput = { adults?: number; minors?: number; age?: number; lang?: Lang };

export type StepId = 'check' | 'apply' | 'aor' | 'test' | 'interview' | 'ceremony' | 'passport';

export type StepsOutput = {
  version: 1;
  lang: Lang;
  adults: number;
  minors: number;
  age: number | null;
  /** Language proof + knowledge test apply (ages 18-54 on the day you sign). null when age unknown. */
  needsTest: boolean | null;
  fees: Fees;
  processing: Processing;
  steps: StepId[];
  test: typeof TEST;
  rules: { requiredDays: number; taxYears: number; languageAges: readonly [number, number]; returnedAfterDays: number };
  links: Record<'applyOnline' | 'status' | 'processingTimes' | 'calculator' | 'study' | 'ceremony' | 'how', string>;
  sources: ToolSource[];
};

export const FALLBACK_FEES: Fees = { ...FEES, live: false };
export const fallbackProcessing = (lang: Lang): Processing => ({
  text: PROCESSING_SNAPSHOT[lang],
  waiting: PROCESSING_SNAPSHOT.waiting[lang],
  updated: PROCESSING_SNAPSHOT.updated,
  live: false,
});

const UNITS: Record<Lang, Record<'month' | 'week' | 'day', [string, string]>> = {
  en: { month: ['month', 'months'], week: ['week', 'weeks'], day: ['day', 'days'] },
  fr: { month: ['mois', 'mois'], week: ['semaine', 'semaines'], day: ['jour', 'jours'] },
};
const digits = (s: string) => Number(s.replace(/\D/g, ''));

/**
 * The processing time in the other official language ("About 12 months" <-> "Environ 12 mois"), for a
 * reader who switches language after the answer was written. Unrecognised wording is kept as is.
 */
export function translateProcessing(p: Processing, to: Lang): Processing {
  const from: Lang = to === 'fr' ? 'en' : 'fr';
  let text = p.text;
  const m = p.text.trim().match(/^(?:about|environ)\s+(\d[\d\s,.\u00a0\u202f]*?)\s+(months?|weeks?|days?|mois|semaines?|jours?)$/i);
  if (m) {
    const n = digits(m[1]);
    const unit = /^(month|mois)/i.test(m[2]) ? 'month' : /^(week|semaine)/i.test(m[2]) ? 'week' : 'day';
    text = `${to === 'fr' ? 'Environ' : 'About'} ${n} ${UNITS[to][unit][n === 1 ? 0 : 1]}`;
  } else if (p.text === PROCESSING_SNAPSHOT[from]) text = PROCESSING_SNAPSHOT[to];
  let waiting = p.waiting;
  const w = p.waiting?.match(/(\d[\d\s,.\u00a0\u202f]*\d|\d)\s+(people|personnes)/i);
  if (w) {
    const n = new Intl.NumberFormat(to === 'fr' ? 'fr-CA' : 'en-CA').format(digits(w[1]));
    waiting = to === 'fr' ? `Environ ${n} personnes sont en attente` : `About ${n} people waiting`;
  }
  return { ...p, text, waiting };
}

const clampInt = (n: unknown, min: number, max: number, dflt: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : dflt;

export function buildSteps(input: StepsInput, fees: Fees = FALLBACK_FEES, processing?: Processing): StepsOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const age = typeof input.age === 'number' && Number.isFinite(input.age) ? clampInt(input.age, 0, 120, 30) : null;
  const [lo, hi] = RULES.languageAges;
  const needsTest = age == null ? null : age >= lo && age <= hi;
  const minorOnly = age != null && age < 18;
  const adults = clampInt(input.adults, 0, 12, minorOnly ? 0 : 1);
  const minors = clampInt(input.minors, 0, 20, minorOnly ? 1 : 0);
  const steps: StepId[] = ['check', 'apply', 'aor'];
  if (needsTest !== false) steps.push('test');
  steps.push('interview', 'ceremony', 'passport');
  const proc = processing ?? fallbackProcessing(lang);
  return {
    version: 1,
    lang,
    adults,
    minors,
    age,
    needsTest,
    fees,
    processing: proc,
    steps,
    test: TEST,
    rules: { requiredDays: RULES.requiredDays, taxYears: RULES.taxYears, languageAges: RULES.languageAges, returnedAfterDays: RULES.returnedAfterDays },
    links: {
      applyOnline: URLS.applyOnline[lang],
      status: URLS.status[lang],
      processingTimes: URLS.processingTimes[lang],
      calculator: URLS.calculator[lang],
      study: URLS.study[lang],
      ceremony: URLS.ceremony[lang],
      how: URLS.how[lang],
    },
    sources: stepsSources(lang, { fees: fees.live, processing: proc.live }).map((s, i) =>
      i === 1 && proc.updated ? { ...s, updated: proc.updated } : s,
    ),
  };
}

// ——— Ceremony ———

export type CeremonyFormat = 'virtual' | 'in-person';
export type BringId = 'invitation' | 'prCard' | 'landing' | 'ids' | 'form' | 'seat' | 'scissors' | 'book';

export type CeremonyOutput = {
  version: 1;
  lang: Lang;
  format: CeremonyFormat | null;
  oath: typeof OATH;
  bring: Record<CeremonyFormat, BringId[]>;
  links: Record<'findCeremony' | 'when' | 'bring' | 'expect' | 'after' | 'status' | 'newPassport' | 'vote', string>;
  sources: ToolSource[];
};

export function buildCeremony(input: { format?: CeremonyFormat; lang?: Lang }): CeremonyOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  return {
    version: 1,
    lang,
    format: input.format === 'virtual' || input.format === 'in-person' ? input.format : null,
    oath: OATH,
    bring: {
      // bring.html (2025-09-11): the consent form is "(if applicable)" for virtual ceremonies.
      'in-person': ['invitation', 'prCard', 'landing', 'ids', 'form', 'book'],
      virtual: ['invitation', 'prCard', 'landing', 'ids', 'form', 'seat', 'scissors', 'book'],
    },
    links: {
      findCeremony: URLS.findCeremony[lang],
      when: URLS.when[lang],
      bring: URLS.bring[lang],
      expect: URLS.expect[lang],
      after: URLS.afterCeremony[lang],
      status: URLS.status[lang],
      newPassport: URLS.newPassport[lang],
      vote: URLS.vote[lang],
    },
    sources: ceremonySources(lang),
  };
}

/** The same steps output in the reader's language (links, sources, processing wording); numbers unchanged. */
export function localizeSteps(o: StepsOutput, lang: Lang): StepsOutput {
  if (o.lang === lang) return o;
  return buildSteps({ adults: o.adults, minors: o.minors, age: o.age ?? undefined, lang }, o.fees, translateProcessing(o.processing, lang));
}
