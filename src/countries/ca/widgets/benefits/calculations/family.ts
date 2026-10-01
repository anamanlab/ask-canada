/** Working-age and family programs: child benefit, groceries benefit, workers benefit, disability, dental, EI, student grant. */
import { CCB, CDB, CDCP, CGEB, CWB, EI, STUDENT } from '../rates';
import type { Household, Profile } from './types';
import { kidsOf, pos, r2 } from './util';

/* ---------------------------------------------------------------- Canada child benefit */

export function ccbAnnual(income: number, under6: number, age6to17: number): number {
  const n = under6 + age6to17;
  if (n <= 0) return 0;
  const max = under6 * CCB.under6 + age6to17 * CCB.age6to17;
  const [rate1, atT2, rate2] = CCB.rates[Math.min(n, 4) - 1];
  const reduction = income <= CCB.t1 ? 0 : income <= CCB.t2 ? rate1 * (income - CCB.t1) : atT2 + rate2 * (income - CCB.t2);
  return r2(pos(max - reduction));
}

export function childDisabilityAnnual(income: number, children: number): number {
  if (children <= 0) return 0;
  const rate = children === 1 ? CCB.disability.rate1 : CCB.disability.rate2;
  return r2(pos(children * CCB.disability.max - rate * pos(income - CCB.disability.threshold)));
}

/* ---------------------------------------------------------------- Groceries and Essentials Benefit */

export function cgebAnnual(household: Household, children: number, income: number): number {
  let base: number;
  if (household === 'couple') base = CGEB.individual + CGEB.spouse + CGEB.child * children;
  else if (children > 0) base = CGEB.individual + CGEB.firstChildSingleParent + CGEB.singleSupplement + CGEB.child * (children - 1);
  else base = CGEB.individual + Math.min(CGEB.singleSupplement, CGEB.supplementRate * pos(income - CGEB.supplementPhaseIn));
  return r2(pos(base - CGEB.rate * pos(income - CGEB.threshold)));
}

/** The most the benefit pays for this household (before any reduction for income): a ceiling, not an estimate. */
export function cgebMax(household: Household, children: number): number {
  if (household === 'couple') return CGEB.individual + CGEB.spouse + CGEB.child * children;
  if (children > 0) return CGEB.individual + CGEB.firstChildSingleParent + CGEB.singleSupplement + CGEB.child * (children - 1);
  return CGEB.individual + CGEB.singleSupplement;
}

/* ---------------------------------------------------------------- Canada workers benefit */

export function cwbAnnual(p: Pick<Profile, 'household' | 'income' | 'workIncome' | 'disability' | 'childrenUnder6' | 'children6to17'>) {
  const family = p.household === 'couple' || kidsOf(p) > 0;
  const kind = family ? 'family' : 'single';
  const basic =
    p.workIncome > CWB.phaseInBase
      ? pos(Math.min(CWB.max[kind], CWB.phaseInRate * (p.workIncome - CWB.phaseInBase)) - CWB.rate * pos(p.income - CWB.threshold[kind]))
      : 0;
  const d = CWB.disability;
  const supplement =
    p.disability && p.workIncome > d.base ? pos(Math.min(d.max, CWB.phaseInRate * (p.workIncome - d.base)) - d.rate * pos(p.income - d.threshold[kind])) : 0;
  return { basic: r2(basic), supplement: r2(supplement), total: r2(basic + supplement) };
}

/* ---------------------------------------------------------------- Canada Disability Benefit */

export function cdbAnnual(household: Household, income: number, workIncome: number): number {
  const k = household === 'couple' ? 'couple' : 'single';
  const counted = income - Math.min(pos(workIncome), CDB.exemption[k]);
  return r2(pos(CDB.monthlyMax * 12 - CDB.rate * pos(counted - CDB.threshold[k])));
}

/* ---------------------------------------------------------------- Dental */

export function cdcpCopay(income: number): number | null {
  const tier = CDCP.tiers.find((t) => income < t.below);
  return tier ? tier.copay : null;
}

/* ---------------------------------------------------------------- EI regular benefits */

export function eiEstimate(annualEarnings: number) {
  const insurable = Math.min(pos(annualEarnings), EI.maxInsurable);
  const raw = (insurable / 52) * EI.rate;
  const weekly = Math.min(EI.maxWeekly, Math.round(raw));
  return {
    weekly,
    capped: annualEarnings >= EI.maxInsurable,
    minTotal: weekly * EI.weeks.min,
    maxTotal: weekly * EI.weeks.max,
    averageWeekly: Math.round(insurable / 52),
  };
}

/* ---------------------------------------------------------------- Student grant */

export function studentGrant(familySize: number, income: number): 'full' | 'partial' | 'none' {
  const [full, cut] = STUDENT.thresholds[Math.min(Math.max(familySize, 1), 7) - 1];
  return income < full ? 'full' : income < cut ? 'partial' : 'none';
}
