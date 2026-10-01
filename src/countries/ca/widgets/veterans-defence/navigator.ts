/**
 * Veterans benefits navigator: pure, isomorphic logic (the tool runs it on the server, the widget re-runs
 * it on the device as answers change). A guide only: Veterans Affairs Canada decides eligibility.
 * Every program, amount and rule is from the page linked in data.ts (checked 2026-10-01). Building the
 * tool output (names, links, sources): navigator-build.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { UrlKey } from './data';
import { PHONES, RATES, type Lang, type Rates } from './facts';

export const STATUSES = ['veteran', 'releasing', 'serving', 'family', 'survivor', 'rcmp'] as const;
export type Status = (typeof STATUSES)[number];

export const NEEDS = ['money', 'health', 'mental', 'school', 'career', 'home', 'emergency'] as const;
export type Need = (typeof NEEDS)[number];

export type ServiceRelated = 'yes' | 'unsure' | 'no';
export type Service = 'under6' | '6to11' | '12plus' | 'unsure';

export type HowToGet = 'myvac' | 'no-application' | 'with-disability' | 'call' | 'referral' | 'transition-centre';

export type Program = {
  id: string;
  url: UrlKey;
  who: Status[];
  needs: Need[];
  /** Needs a service-related illness or injury (or a disability benefit that follows from one). */
  serviceRelated?: boolean;
  how: HowToGet;
  /** Number to call when `how` is 'call' (defaults to VAC's main line). */
  phone?: string;
  /** Headline figure shown on the card (message key + values), when the page gives one. */
  stat?: { key: string; values?: Record<string, number> };
  /** Programs that are only a "maybe" whatever the answers (narrow rules explained on the card). */
  narrow?: boolean;
  /**
   * The program has its own rules and its own official page for this audience (e.g. the Veterans Independence
   * Program for survivors). Copy follows through the `…Survivor` message keys (see `voiced` in ProgramCard).
   */
  variants?: Partial<Record<Status, { url: UrlKey; narrow?: boolean; serviceRelated?: boolean; reasons?: string[] }>>;
  order: number;
};

/** Key of a program's per-audience entry in the output's `urls` / `names` (e.g. `vip.survivor`). */
export const variantKey = (id: string, status: Status) => `${id}.${status}`;
/** A program's official page or name for this audience: the variant's when there is one. */
export const refFor = (map: Record<string, string> | undefined, id: string, status: Status) => map?.[variantKey(id, status)] ?? map?.[id];

export const PROGRAMS: Program[] = [
  { id: 'transitionInterview', url: 'transitionInterview', who: ['releasing', 'serving'], needs: ['money', 'health', 'mental', 'school', 'career', 'home'], how: 'call', order: 1 },
  { id: 'disability', url: 'disability', who: ['veteran', 'releasing', 'serving', 'rcmp'], needs: ['money', 'health', 'mental'], serviceRelated: true, how: 'myvac', stat: { key: 'nav.stat.disability', values: { amount: RATES.pscLump100 } }, order: 2 },
  { id: 'mentalHealthBenefits', url: 'mentalHealthBenefits', who: ['veteran', 'releasing'], needs: ['mental', 'health'], serviceRelated: true, how: 'with-disability', stat: { key: 'nav.stat.mhb' }, order: 3 },
  { id: 'assistance', url: 'assistance', who: ['veteran', 'family', 'survivor', 'rcmp'], needs: ['mental'], how: 'call', phone: PHONES.assistance, stat: { key: 'nav.stat.assistance' }, order: 4 },
  { id: 'etb', url: 'etb', who: ['veteran', 'releasing'], needs: ['school', 'career'], how: 'myvac', stat: { key: 'nav.stat.etb', values: { six: RATES.etb6, twelve: RATES.etb12 } }, order: 5 },
  { id: 'cts', url: 'cts', who: ['veteran', 'releasing', 'serving', 'family', 'survivor'], needs: ['career', 'school'], how: 'myvac', stat: { key: 'nav.stat.cts' }, order: 6 },
  { id: 'rehab', url: 'rehab', who: ['veteran', 'releasing'], needs: ['health', 'mental', 'career'], serviceRelated: true, how: 'myvac', order: 7 },
  { id: 'irb', url: 'irb', who: ['veteran', 'releasing'], needs: ['money'], serviceRelated: true, how: 'myvac', stat: { key: 'nav.stat.irb', values: { amount: RATES.irbMin } }, order: 8 },
  { id: 'vef', url: 'vef', who: ['veteran', 'family', 'survivor'], needs: ['emergency', 'money'], how: 'myvac', stat: { key: 'nav.stat.vef' }, order: 9 },
  { id: 'treatment', url: 'treatment', who: ['veteran', 'rcmp'], needs: ['health'], serviceRelated: true, how: 'myvac', order: 10 },
  // For service-related mental health conditions. Serving members are not listed: the page describes the VAC
  // referral route only, and says DND runs its own clinics (operational trauma and stress support centres).
  { id: 'osiClinics', url: 'osiClinics', who: ['veteran', 'releasing', 'family', 'rcmp'], needs: ['mental'], serviceRelated: true, how: 'referral', order: 11 },
  { id: 'caseManagement', url: 'caseManagement', who: ['veteran', 'releasing', 'rcmp'], needs: ['health', 'mental', 'home', 'emergency'], how: 'call', order: 12 },
  {
    id: 'vip',
    url: 'vip',
    who: ['veteran', 'survivor'],
    needs: ['home'],
    serviceRelated: true,
    how: 'myvac',
    // Survivors: a separate program with its own rules, none of them about a service-related condition
    // (veterans.gc.ca, Veterans Independence Program for survivors). Always a "maybe".
    variants: { survivor: { url: 'vipSurvivors', narrow: true, serviceRelated: false, reasons: ['reason.vipSurvivorCare', 'reason.vipSurvivorIncome', 'reason.vipSurvivorCaregiver'] } },
    order: 13,
  },
  { id: 'crb', url: 'crb', who: ['veteran', 'family'], needs: ['home'], serviceRelated: true, narrow: true, how: 'myvac', stat: { key: 'nav.stat.crb', values: { amount: RATES.crbMonthly } }, order: 14 },
  {
    id: 'cfis',
    url: 'cfis',
    who: ['veteran', 'survivor'],
    needs: ['money'],
    narrow: true,
    how: 'myvac',
    stat: { key: 'nav.stat.cfis', values: { amount: RATES.cfisMax } },
    // Survivors qualify on their own rules, with a 6-month limit to apply after a death not related to service
    // (veterans.gc.ca, Canadian Forces Income Support - Survivors).
    variants: { survivor: { url: 'cfisSurvivors', reasons: ['reason.cfisSurvivorDeadline'] } },
    order: 15,
  },
  // Depends on a medical release, not on a service-related condition (veterans.gc.ca, Veteran Family Program).
  { id: 'vfp', url: 'vfp', who: ['releasing', 'veteran', 'family'], needs: ['mental', 'home', 'career'], narrow: true, how: 'no-application', order: 16 },
  { id: 'memberAssistance', url: 'memberAssistance', who: ['serving'], needs: ['mental'], how: 'call', phone: PHONES.assistance, stat: { key: 'nav.stat.assistance' }, order: 17 },
  { id: 'deathBenefit', url: 'deathBenefit', who: ['survivor'], needs: ['money', 'emergency'], narrow: true, how: 'myvac', stat: { key: 'nav.stat.death', values: { amount: RATES.deathBenefit } }, order: 18 },
];

export type NavAnswers = { status: Status; serviceRelated: ServiceRelated; needs: Need[]; service: Service };

export type Fit = 'likely' | 'maybe';
export type ProgramResult = { program: Program; fit: Fit; reasons: string[]; inNeeds: boolean };

/**
 * Programs that may fit: the leading program first, then likely fits before maybes. `reasons` are message keys the widget shows under a "maybe"
 * (e.g. "if your condition is related to your service").
 */
export function navigate(a: NavAnswers): ProgramResult[] {
  const out: ProgramResult[] = [];
  for (const p of PROGRAMS) {
    if (!p.who.includes(a.status)) continue;
    const variant = p.variants?.[a.status];
    const serviceRelated = variant?.serviceRelated ?? p.serviceRelated;
    const narrow = variant?.narrow ?? p.narrow;
    if (serviceRelated && a.serviceRelated === 'no') continue;
    if (p.id === 'etb' && a.service === 'under6') continue;
    const reasons: string[] = [];
    let fit: Fit = 'likely';
    if (serviceRelated && a.serviceRelated === 'unsure') {
      fit = 'maybe';
      reasons.push('reason.serviceRelated');
    }
    if (p.id === 'etb' && a.service === 'unsure') {
      fit = 'maybe';
      reasons.push('reason.sixYears');
    }
    // The 10-year window to apply (and the 1 April 2028 deadline for 2006–2018 releases): veterans.gc.ca ETB page.
    if (p.id === 'etb') reasons.push(a.status === 'releasing' ? 'reason.etbWindowReleasing' : 'reason.etbWindow');
    if (p.id === 'irb') reasons.push('reason.rehab');
    if (narrow) {
      fit = 'maybe';
      reasons.push(`reason.${p.id}`);
    }
    if (variant?.reasons) reasons.push(...variant.reasons);
    if (p.id === 'vef' && a.status !== 'veteran') reasons.push('reason.vefFamily');
    // The VAC Assistance Service lists former RCMP members only; serving members have the Employee Assistance Program (rcmp.ca).
    if (p.id === 'assistance' && a.status === 'rcmp') reasons.push('reason.assistanceRcmp');
    const inNeeds = !a.needs.length || p.needs.some((n) => a.needs.includes(n));
    out.push({ program: p, fit, reasons: [...new Set(reasons)], inNeeds });
  }
  // Order: what the person asked for, then the one program that leads (see `lead`), then "Looks like a fit"
  // before "Might fit" for every audience, then how closely it matches the needs, then the catalogue order.
  const rank = (r: ProgramResult) => {
    const needHits = a.needs.length ? r.program.needs.filter((n) => a.needs.includes(n)).length : 0;
    // The transition interview is the official first step for anyone leaving. Going back to school is what the
    // Education and Training Benefit is for, even as a "maybe". The widget sets the leading program apart as its
    // featured card, so the list under it stays grouped by fit.
    const lead = a.status === 'releasing' ? r.program.id === 'transitionInterview' : r.program.id === 'etb' && a.needs.includes('school');
    // Within a fit group, an emergency outranks everything else the person picked.
    const urgent = a.needs.includes('emergency') && r.program.needs.includes('emergency') ? -150 : 0;
    return (r.inNeeds ? 0 : 10000) + (lead ? -2000 : 0) + (r.fit === 'likely' ? 0 : 400) + urgent - needHits * 20 + r.program.order;
  };
  return out.sort((x, y) => rank(x) - rank(y));
}

export type BenefitsInput = {
  status?: Status;
  serviceRelated?: ServiceRelated;
  needs?: Need[];
  yearsOfService?: number;
  lang?: Lang;
};

/** Everything in the output that depends on the language. */
export type BenefitsRefs = {
  lang: Lang;
  links: { myVacSignIn: string; myVac: string; contact: string; navigator: string; transitionCentres: string; rates: string };
  urls: Record<string, string>;
  names: Record<string, string>;
  sources: ToolSource[];
};

export type BenefitsOutput = {
  lang: Lang;
  answers: NavAnswers;
  /** The conversation already told us who this is for: the widget shows a summary of the answers first. */
  known?: boolean;
  phones: typeof PHONES;
  /** Current rates. The card reads the quarterly Canadian Forces Income Support figure from here, not from `PROGRAMS`. */
  rates: Rates;
  links: BenefitsRefs['links'];
  /** Official page of each program, by program id (and by `variantKey` where an audience has its own page). */
  urls: Record<string, string>;
  /** Official name of each program, by program id (and by `variantKey` where an audience has its own program). */
  names: Record<string, string>;
  sources: ToolSource[];
  /** The same links, names and sources in the other official language (see `inLanguage`). */
  alt?: BenefitsRefs;
};
