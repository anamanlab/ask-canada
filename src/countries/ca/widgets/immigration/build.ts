/**
 * Tool outputs, built from inputs + data (live or snapshot). Pure and isomorphic: the tools call these after
 * fetching, the lab fixtures call them with the snapshot.
 */
import { crsScore, fswGrid, givenKeys, normalizeProfile, programs, type CrsResult, type Profile, type ProgramResult } from './crs';
import { EE_FUNDS, FEES, STUDY, STUDY_FUNDS, fundsFor, type Fees, type Lang } from './data';
import type { DrawsData } from './draws';
import type { Pinned } from './earlier';
import { checkEntry, type EntryInput, type EntryResult } from './entry';
import { source } from './sources';
import { isLive, TIME_META, updatedOf, type CountryTimes, type TimeKey, type TimesData } from './times';
import type { ToolSource } from '@/lib/widgets/types';

const L = (lang?: string): Lang => (lang === 'fr' ? 'fr' : 'en');

/* ─────────────── CRS calculator ─────────────── */

export type CrsMode = 'score' | 'rounds';
export type CrsOutput = {
  version: 1;
  lang: Lang;
  /** `rounds` leads with the latest round of invitations (someone asked about draws, not their score). */
  mode: CrsMode;
  profile: Profile;
  /** Which profile fields the person actually gave (the rest are conservative starting values to adjust). */
  given: (keyof Profile)[];
  score: CrsResult;
  draws: DrawsData;
  sources: ToolSource[];
  pinned?: Pinned;
};

export function buildCrs(input: Partial<Profile> & { lang?: string; mode?: CrsMode }, draws: DrawsData): CrsOutput {
  const lang = L(input.lang);
  const given = givenKeys(input);
  const profile = normalizeProfile(input);
  // A question about the draws leads with the rounds, not with a score nobody asked for.
  const mode: CrsMode = input.mode === 'rounds' ? 'rounds' : 'score';
  return {
    version: 1,
    lang,
    mode: mode === 'rounds' && !draws.draws.length ? 'score' : mode,
    profile,
    given,
    score: crsScore(profile),
    draws,
    // The footer shows the first source: the rounds page when the question was about rounds.
    sources: (() => {
      const rounds = source('rounds', lang, { live: draws.live, ...(draws.draws[0] ? { updated: draws.draws[0].date } : {}) });
      const criteria = source('crsCriteria', lang);
      return [...(mode === 'rounds' ? [rounds, criteria] : [criteria, rounds]), source('crsTool', lang), source('expressEntry', lang)];
    })(),
  };
}

/* ─────────────── Express Entry eligibility (Come to Canada) ─────────────── */

export type EligibilityOutput = {
  version: 1;
  lang: Lang;
  profile: Profile;
  given: (keyof Profile)[];
  programs: ProgramResult[];
  grid: ReturnType<typeof fswGrid>;
  familySize: number;
  funds: { amount: number; updated: string };
  fees: Pick<Fees, 'economicPr'>;
  sources: ToolSource[];
  pinned?: Pinned;
};

export function buildEligibility(input: Partial<Profile> & { lang?: string; familySize?: number }, fees: Fees = FEES): EligibilityOutput {
  const lang = L(input.lang);
  const given = givenKeys(input);
  const profile = normalizeProfile(input);
  const familySize = Math.max(1, Math.min(12, Math.round(input.familySize ?? (profile.spouse ? 2 : 1))));
  return {
    version: 1,
    lang,
    profile,
    given,
    programs: programs(profile),
    grid: fswGrid(profile),
    familySize,
    funds: { amount: fundsFor(EE_FUNDS, familySize), updated: EE_FUNDS.updated },
    fees: { economicPr: fees.economicPr },
    sources: [source('whoCanApply', lang), source('fsw', lang), source('cec', lang), source('fst', lang), source('eeFunds', lang), source('comeToCanada', lang)],
  };
}

/* ─────────────── Processing times ─────────────── */

export type TimesOutput = {
  version: 1;
  lang: Lang;
  focus: TimeKey | null;
  country: string | null;
  data: TimesData;
  sources: ToolSource[];
  pinned?: Pinned;
};

export function buildTimes(input: { focus?: TimeKey | null; country?: string | null; lang?: string }, data: TimesData): TimesOutput {
  const lang = L(input.lang);
  const focus = input.focus ?? null;
  const country = input.country && /^[A-Z]{2}$/.test(input.country) ? input.country : null;
  /** The application type the widget opens on (its default when none was asked about). */
  const shown: TimeKey = focus ?? 'cec';
  // Keep the payload small: the full country table only for the program in focus, one value for the others.
  // A paused parents program points to the super visa, so that table comes along.
  const byCountry = focus && TIME_META[focus].byCountry ? (focus as keyof TimesData['countries']) : focus === 'parents' ? 'supervisa' : 'visitor';
  const countries: TimesData['countries'] = {};
  for (const k of ['visitor', 'supervisa', 'study', 'work'] as const) {
    const map = data.countries[k];
    if (!map) continue;
    if (k === byCountry) countries[k] = map;
    else if (country && map[country]) countries[k] = { [country]: map[country] } as CountryTimes;
  }
  return {
    version: 1,
    lang,
    focus,
    country,
    data: { ...data, countries },
    sources: [
      // A paused program leads with the page that says so: the footer shows the first source.
      ...(focus === 'parents' ? [source('parents', lang)] : []),
      source('processing', lang, { live: isLive(data, shown), ...(updatedOf(data, shown) ? { updated: updatedOf(data, shown)! } : {}) }),
      source('status', lang),
      ...(focus === 'parents' ? [source('superVisa', lang)] : []),
    ],
  };
}

/* ─────────────── Visa or eTA ─────────────── */

export type EntryOutput = {
  version: 1;
  lang: Lang;
  input: EntryInput;
  result: EntryResult;
  fees: Pick<Fees, 'eta' | 'visitorVisa' | 'biometrics'>;
  /** Visitor visa processing times by country the person applies from (historical, live when the feed answers). */
  visitorTimes: CountryTimes;
  updated: string | null;
  live: boolean;
  sources: ToolSource[];
  pinned?: Pinned;
};

export function buildEntry(input: EntryInput & { lang?: string }, times: TimesData, fees: Fees = FEES, feesLive = false): EntryOutput {
  const lang = L(input.lang);
  const result = checkEntry(input);
  const key = result.kind === 'eta' || result.kind === 'eta-conditional' ? 'eta' : 'visitorVisa';
  return {
    version: 1,
    lang,
    input: { country: result.country ?? undefined, travel: result.travel, hasVisaHistory: !!input.hasVisaHistory, usPermanentResident: !!input.usPermanentResident },
    result,
    fees: { eta: fees.eta, visitorVisa: fees.visitorVisa, biometrics: fees.biometrics },
    visitorTimes: times.countries.visitor ?? {},
    updated: times.updated.tr,
    live: isLive(times, 'visitor'),
    sources: [
      source('checkVisaEta', lang),
      source('entryByCountry', lang),
      ...(result.conditional ? [source('etaX', lang)] : []),
      source(key === 'eta' ? 'etaFacts' : 'visitorVisa', lang),
      source('processing', lang, { live: isLive(times, 'visitor') }),
      source('fees', lang, { live: feesLive }),
    ],
  };
}

/* ─────────────── Study and work permits ─────────────── */

export type PermitFocus = 'study' | 'work';
export type PermitsOutput = {
  version: 1;
  lang: Lang;
  focus: PermitFocus;
  country: string | null;
  familySize: number;
  fees: Pick<Fees, 'studyPermit' | 'workPermit' | 'openWorkPermitHolder' | 'biometrics' | 'iec'>;
  studyFunds: typeof STUDY_FUNDS;
  study: typeof STUDY;
  /** Processing from outside Canada by country (full table for the focus, one value for the other). */
  countryTimes: { study?: CountryTimes; work?: CountryTimes };
  /** Extensions inside Canada (forward-looking) and IEC. */
  times: { studyExtension: string | null; workExtension: string | null; iec: string | null };
  updated: string | null;
  live: boolean;
  sources: ToolSource[];
};

export function buildPermits(
  input: { focus?: PermitFocus; country?: string | null; familySize?: number; lang?: string },
  times: TimesData,
  fees: Fees = FEES,
): PermitsOutput {
  const lang = L(input.lang);
  const focus: PermitFocus = input.focus === 'work' ? 'work' : 'study';
  const country = input.country && /^[A-Z]{2}$/.test(input.country) ? input.country : null;
  const row = (k: TimeKey) => {
    const v = times.rows.find((r) => r.key === k)?.value;
    return v ? `${v.n}${v.unit === 'minute' ? 'i' : v.unit[0]}` : null;
  };
  const studySources = [source('studyPermit', lang), source('studyDocs', lang), source('studyFunds', lang), source('offCampus', lang), source('pgwp', lang), source('studyTool', lang)];
  const workSources = [source('workCanada', lang), source('needWorkPermit', lang), source('pgwp', lang)];
  return {
    version: 1,
    lang,
    focus,
    country,
    familySize: Math.max(1, Math.min(10, Math.round(input.familySize ?? 1))),
    fees: { studyPermit: fees.studyPermit, workPermit: fees.workPermit, openWorkPermitHolder: fees.openWorkPermitHolder, biometrics: fees.biometrics, iec: fees.iec },
    studyFunds: STUDY_FUNDS,
    study: STUDY,
    countryTimes: {
      [focus]: times.countries[focus] ?? {},
      ...(country && times.countries[focus === 'study' ? 'work' : 'study']?.[country]
        ? { [focus === 'study' ? 'work' : 'study']: { [country]: times.countries[focus === 'study' ? 'work' : 'study']![country] } }
        : {}),
    },
    times: {
      studyExtension: row('study-extension'),
      workExtension: row('work-extension'),
      iec: row('iec'),
    },
    updated: times.updated.tr,
    live: isLive(times, focus),
    sources: [...(focus === 'study' ? studySources : workSources), source('processing', lang, { live: isLive(times, focus) }), source('fees', lang)],
  };
}
