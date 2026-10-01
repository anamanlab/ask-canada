/**
 * Tool outputs, built from pure functions (isomorphic): the tools call these after reading live payment
 * dates, and the lab fixtures call them with the verified fallback dates.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { DEFAULT_PROFILE, assumedWork, ccbAnnual, childDisabilityAnnual, cppEstimate, eiEstimate, findBenefits, isSenior, oasEstimate, type Match, type Profile, type ProgramId } from './calc';
import { CCB, CPP, EI, OAS, URLS, programLinks, source, type Lang, type ProgramLinks, type SourceKey } from './data';
import { leadTitle, type LeadTitle } from './lead';
import type { PaymentDates } from './payments';

/** `children` = how many children when their ages weren't given (the widget then asks how many are under 6). */
export type FinderInput = Partial<Profile> & { children?: number };

export type FinderOutput = {
  today: string;
  lang: Lang;
  profile: Profile;
  /** Which answers came from the person (the rest are defaults the widget asks about). */
  answered: string[];
  /** True when we know their income, so the amounts are theirs: show results first. Otherwise the widget opens
   *  the questionnaire (with what they did say already set) and the amounts below are left out. */
  ready: boolean;
  /** They said how many children, but not how old: the widget asks how many are under 6. */
  kidsAgesUnknown: boolean;
  matches: Match[];
  total: number;
  monthlyTotal: number;
  payments: PaymentDates;
  links: ProgramLinks;
  handoff: { finder: string; craAccount: string; msca: string };
  note: string;
  sources: ToolSource[];
  /** Short names of the first source, for the widget's one-line source footer. */
  lead?: LeadTitle;
  /** Lab fixtures: keep "today" at `today` instead of following the device's clock. */
  pinned?: boolean;
};

/** The official page behind each program's card (and its amount). */
const PROGRAM_SOURCES: Record<ProgramId, SourceKey[]> = {
  ei: ['eiAmount'],
  ccb: ['ccbAmount'],
  childDisability: ['childDisability'],
  cgeb: ['cgeb'],
  cwb: ['cwbAmount'],
  cdcp: ['dentalQualify'],
  cdb: ['cdbAmount'],
  oas: ['oasPayments'],
  gis: ['oasPayments', 'gisTable'],
  cpp: ['cppAmount'],
  student: ['student'],
};

/**
 * Sources for the programs the widget shows (not every program it checked), led by the one its hero leads
 * with: EI when they lost their job, otherwise the biggest amount. The shell's footer cites the first one.
 */
function finderSources(matches: Match[], lang: Lang, live: boolean): { sources: ToolSource[]; lead?: LeadTitle } {
  const shown = matches.filter((m) => m.status !== 'no');
  const ei = shown.find((m) => m.id === 'ei' && m.status === 'apply');
  const ranked = [...shown].sort((a, b) => (b.annual ?? 0) - (a.annual ?? 0));
  const order = ei ? [ei, ...ranked.filter((m) => m !== ei)] : ranked;
  const keys = [...new Set(order.flatMap((m) => PROGRAM_SOURCES[m.id]))];
  if (!keys.length) keys.push('cgeb');
  return { sources: [...keys, 'calendar' as const].map((k) => source(k, lang, k === 'calendar' ? { live } : {})), lead: leadTitle(keys[0], lang) };
}

export function buildFinder(given: FinderInput, lang: Lang, today: string, payments: PaymentDates): FinderOutput {
  const { children, ...rest } = given;
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as Partial<Profile>;
  const answered = Object.keys(clean);
  const profile: Profile = { ...DEFAULT_PROFILE, ...clean };
  // Only a work figure: that's their income too.
  if (clean.income === undefined && clean.workIncome !== undefined) profile.income = clean.workIncome;
  // Someone who gave no work figure: assume their income is from work before 65, from pensions after (shown as assumed).
  if (clean.workIncome === undefined) profile.workIncome = assumedWork(profile.age, profile.income);
  if (profile.workIncome > profile.income) profile.workIncome = profile.income;
  // A count without ages: estimate at the 6-to-17 rate (the lower one) until they say how many are under 6.
  const kidsAgesUnknown = children != null && children > 0 && clean.childrenUnder6 === undefined && clean.children6to17 === undefined;
  if (kidsAgesUnknown) {
    profile.childrenUnder6 = 0;
    profile.children6to17 = children;
    answered.push('children');
  }
  const incomeKnown = clean.income !== undefined || clean.workIncome !== undefined;
  const workKnown = clean.workIncome !== undefined;
  const found = findBenefits(profile, { earningsKnown: incomeKnown, workKnown });
  // Without their income the finder estimates nothing (no `annual`, no `weekly`): only what each program is and
  // the most it pays, and the widget asks.
  const { matches } = found;
  return {
    today,
    lang,
    profile,
    answered,
    ready: incomeKnown,
    kidsAgesUnknown,
    matches,
    total: found.total,
    monthlyTotal: found.monthlyTotal,
    payments,
    links: programLinks(lang),
    handoff: { finder: URLS.finder[lang], craAccount: URLS.craAccount[lang], msca: URLS.msca[lang] },
    note: [
      incomeKnown
        ? 'Estimates only, from official rates for July 2026 to June 2027 (based on 2025 income). The CRA and Service Canada decide actual amounts. Most benefits need a tax return filed every year, even with no income.'
        : 'The person has not given their income, so no amounts are estimated yet: the widget asks for it. Do not state amounts for them.',
      kidsAgesUnknown ? 'Children’s ages were not given: the child benefit is estimated at the 6-to-17 rate, and the widget asks how many are under 6.' : '',
      incomeKnown && !workKnown ? 'How much of the income is from work was not given: the Canada workers benefit is shown as worth checking, not as an estimate.' : '',
      profile.jobLoss ? 'EI: tell them to apply within 4 weeks of their last day of work. EI is based on their own insurable earnings (55%, up to $729 a week), never on family income.' : '',
      isSenior(profile.age) && incomeKnown ? 'GIS is estimated from net income minus the OAS pension and the work-income exemption, using the official October–December 2026 table.' : '',
    ]
      .filter(Boolean)
      .join(' '),
    ...finderSources(found.matches, lang, payments.live),
  };
}

export type EstimatorInput = {
  program: 'ccb' | 'ei' | 'oas' | 'cpp';
  income?: number;
  childrenUnder6?: number;
  children6to17?: number;
  /** Children when their ages weren't given. */
  children?: number;
  childDisability?: number;
  earnings?: number;
  yearsInCanada?: number;
  startAge?: number;
  age75?: boolean;
  at65?: number;
};

/** `given`: which initial values came from the person; the rest are typical defaults the widget marks as such. */
type Base = { today: string; lang: Lang; payments: PaymentDates; sources: ToolSource[]; /** Short names of the first source, for the one-line footer. */ lead?: LeadTitle; given: string[]; /** Lab fixtures: keep "today" at `today`. */ pinned?: boolean };
export type CcbOutput = Base & {
  program: 'ccb';
  initial: { income: number; childrenUnder6: number; children6to17: number; childDisability: number };
  /** They said how many children but not how old: counted at the 6-to-17 rate until the widget's question is answered. */
  kidsAgesUnknown: boolean;
  estimate: { annual: number; monthly: number; childDisability: number };
  rates: { under6: number; age6to17: number; reducesAbove: number; period: string };
  links: { info: string; apply: string; calculator: string };
};
export type EiOutput = Base & {
  program: 'ei';
  initial: { earnings: number };
  estimate: ReturnType<typeof eiEstimate>;
  rates: { rate: number; maxWeekly: number; maxInsurable: number; weeks: { min: number; max: number }; hours: { min: number; max: number }; familySupplementIncome: number };
  links: { info: string; apply: string; eligibility: string; estimator: string };
};
export type OasOutput = Base & {
  program: 'oas';
  initial: { yearsInCanada: number; startAge: number; age75: boolean; income: number };
  estimate: ReturnType<typeof oasEstimate>;
  rates: { monthly65: number; monthly75: number; quarter: string; recoveryThreshold: number; gisSingleMax: number; gisSingleLimit: number };
  links: { info: string; apply: string; estimator: string; gis: string };
};
export type CppOutput = Base & {
  program: 'cpp';
  initial: { at65: number; startAge: number };
  estimate: { monthly: number; pct: number; byAge85: number };
  rates: { max65: number; average65: number; earlyPerMonth: number; latePerMonth: number };
  links: { info: string; apply: string; calculator: string; msca: string };
};
export type EstimatorOutput = CcbOutput | EiOutput | OasOutput | CppOutput;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

export function buildEstimator(input: EstimatorInput, lang: Lang, today: string, payments: PaymentDates): EstimatorOutput {
  const given = Object.entries(input)
    .filter(([k, v]) => k !== 'program' && v !== undefined && v !== null)
    .map(([k]) => (k === 'earnings' ? 'income' : k));
  const base = { today, lang, payments, given };
  const cal = source('calendar', lang, { live: payments.live });
  switch (input.program) {
    case 'ccb': {
      const agesGiven = input.childrenUnder6 != null || input.children6to17 != null;
      const count = !agesGiven && input.children ? input.children : undefined;
      const u6 = input.childrenUnder6 ?? (count != null || input.children6to17 ? 0 : 1);
      const o6 = input.children6to17 ?? count ?? (input.childrenUnder6 != null ? 0 : 1);
      const initial = { income: input.income ?? 60_000, childrenUnder6: u6, children6to17: o6, childDisability: Math.min(input.childDisability ?? 0, u6 + o6) };
      const annual = ccbAnnual(initial.income, u6, o6);
      return {
        ...base,
        program: 'ccb',
        initial,
        kidsAgesUnknown: count != null && count > 0,
        estimate: { annual, monthly: Math.round((annual / 12) * 100) / 100, childDisability: childDisabilityAnnual(initial.income, initial.childDisability) },
        rates: { under6: CCB.under6, age6to17: CCB.age6to17, reducesAbove: CCB.t1, period: 'July 2026 to June 2027, based on 2025 income' },
        links: { info: URLS.ccbAmount[lang], apply: URLS.ccbApply[lang], calculator: URLS.calculator[lang] },
        sources: [source('ccbAmount', lang), source('childDisability', lang), source('ccbWho', lang), cal],
        lead: leadTitle('ccbAmount', lang),
      };
    }
    case 'ei': {
      const initial = { earnings: input.earnings ?? input.income ?? 52_000 };
      return {
        ...base,
        program: 'ei',
        initial,
        estimate: eiEstimate(initial.earnings),
        rates: { rate: EI.rate, maxWeekly: EI.maxWeekly, maxInsurable: EI.maxInsurable, weeks: { ...EI.weeks }, hours: { ...EI.hours }, familySupplementIncome: EI.familySupplement.income },
        links: { info: URLS.eiAmount[lang], apply: URLS.eiApply[lang], eligibility: URLS.eiElig[lang], estimator: URLS.eiEstimator[lang] },
        sources: [source('eiAmount', lang), source('eiApply', lang), source('eiElig', lang)],
        lead: leadTitle('eiAmount', lang),
      };
    }
    case 'oas': {
      const initial = { yearsInCanada: clamp(input.yearsInCanada ?? 40, 0, 60), startAge: clamp(input.startAge ?? 65, 65, 70), age75: input.age75 ?? false, income: input.income ?? 40_000 };
      return {
        ...base,
        program: 'oas',
        initial,
        estimate: oasEstimate({ years: initial.yearsInCanada, startAge: initial.startAge, age75: initial.age75, income: initial.income }),
        rates: { monthly65: OAS.monthly65, monthly75: OAS.monthly75, quarter: 'October to December 2026', recoveryThreshold: OAS.recovery.threshold, gisSingleMax: OAS.gis.single.max, gisSingleLimit: OAS.gis.single.limit },
        links: { info: URLS.oasAmount[lang], apply: URLS.oasApply[lang], estimator: URLS.oasEstimator[lang], gis: URLS.gisElig[lang] },
        sources: [source('oasPayments', lang), source('oasAmount', lang), source('oasWhen', lang), source('oasRecovery', lang), source('gisElig', lang), source('oasQuarterly', lang), cal],
        lead: leadTitle('oasPayments', lang),
      };
    }
    case 'cpp': {
      const initial = { at65: clamp(input.at65 ?? CPP.average65, 0, CPP.max65), startAge: Math.round(clamp(input.startAge ?? 65, CPP.minAge, CPP.maxAge)) };
      const e = cppEstimate(initial.at65, initial.startAge);
      return {
        ...base,
        program: 'cpp',
        initial,
        estimate: { monthly: e.monthly, pct: e.pct, byAge85: e.byHorizon },
        rates: { max65: CPP.max65, average65: CPP.average65, earlyPerMonth: CPP.earlyPerMonth, latePerMonth: CPP.latePerMonth },
        links: { info: URLS.cppAmount[lang], apply: URLS.cppApply[lang], calculator: URLS.retirementCalc[lang], msca: URLS.msca[lang] },
        sources: [source('cppAmount', lang), source('cppWhen', lang), cal],
        lead: leadTitle('cppAmount', lang),
      };
    }
  }
}
