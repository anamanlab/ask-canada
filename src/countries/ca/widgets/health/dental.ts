/**
 * Canadian Dental Care Plan eligibility (pure, isomorphic). The tool builds the first answer on the server
 * (./dental-build.ts); the checker re-runs `checkDental` on the device every time the person changes an answer
 * or the income. Rules and tiers: ./facts.ts (verified on canada.ca 2026-09-30, record in ./data.ts).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CDCP, type Lang } from './facts';

export type Req = 'coverage' | 'taxes' | 'income' | 'resident';
export const REQS: Req[] = ['coverage', 'taxes', 'income', 'resident'];

export type DentalInput = {
  /** True when the family has NO access to private dental insurance/coverage (requirement 1). */
  noPrivateCoverage?: boolean;
  /** You (and your partner) filed your tax returns in Canada for last year. */
  filedTaxes?: boolean;
  /** Adjusted family net income in dollars. */
  familyIncome?: number;
  /** You (and your partner) are Canadian residents for tax purposes. */
  residentForTax?: boolean;
  hasPartner?: boolean;
  /** 'checker' (default): the 4 questions and the income slider. 'summary': a compact card with the co-payment tiers. */
  view?: DentalView;
  lang?: Lang;
};

export type DentalView = 'checker' | 'summary';

export type ReqState = 'pass' | 'fail' | 'unknown';
export type DentalVerdict = 'likely' | 'not' | 'maybe';

export type DentalResult = {
  verdict: DentalVerdict;
  reqs: Record<Req, ReqState>;
  /** Co-payment % of CDCP fees for the given income, or null when unknown/over the limit. */
  copay: number | null;
  /** Share of CDCP fees the plan covers (100 - copay). */
  covered: number | null;
  failed: Req[];
  unknown: Req[];
};

/** The links and sources that change with the language. */
export type DentalLinks = {
  applyUrl: string;
  qualifyUrl: string;
  coverageUrl: string;
  contactUrl: string;
  providersUrl: string;
  nihbUrl: string;
  sources: ToolSource[];
};

export type DentalOutput = DentalResult &
  DentalLinks & {
  input: DentalInput;
  view: DentalView;
  lang: Lang;
  limit: number;
  tiers: { below: number; copay: number }[];
  phone: string;
  tty: string;
  benefitPeriod: string;
  /** The same links and sources in the other official language. */
  alt?: DentalLinks;
};

function copayFor(income: number | undefined): number | null {
  if (income == null || !Number.isFinite(income) || income < 0) return null;
  const tier = CDCP.tiers.find((t) => income < t.below);
  return tier ? tier.copay : null;
}

const tri = (v: boolean | undefined): ReqState => (v == null ? 'unknown' : v ? 'pass' : 'fail');

export function checkDental(input: DentalInput): DentalResult {
  const income = input.familyIncome;
  const reqs: Record<Req, ReqState> = {
    coverage: tri(input.noPrivateCoverage),
    taxes: tri(input.filedTaxes),
    income: income == null || !Number.isFinite(income) ? 'unknown' : income < CDCP.incomeLimit ? 'pass' : 'fail',
    resident: tri(input.residentForTax),
  };
  const failed = REQS.filter((r) => reqs[r] === 'fail');
  const unknown = REQS.filter((r) => reqs[r] === 'unknown');
  const verdict: DentalVerdict = failed.length ? 'not' : unknown.length ? 'maybe' : 'likely';
  const copay = reqs.income === 'pass' ? copayFor(income) : null;
  return { verdict, reqs, copay, covered: copay == null ? null : 100 - copay, failed, unknown };
}
