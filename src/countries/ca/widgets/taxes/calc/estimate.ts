/**
 * Refund / balance-owing estimate: federal and provincial tax, credits, CPP/EI (T4127 formulas).
 * Pure and isomorphic (tools on the server, widgets on the device). Every constant comes from ../data.ts, where
 * each one is traced to its canada.ca page.
 */
import { EXTRAS, FEDERAL, FHSA, PAYROLL, PROVINCIAL, RATES_YEAR, type Bracket, type ProvinceCode } from '../data';

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export type EstimateInput = {
  province: ProvinceCode;
  employmentIncome: number;
  otherIncome: number;
  rrsp: number;
  fhsa: number;
  /** Income tax already deducted (T4 box 22), when known. */
  taxDeducted: number | null;
};

export type Estimate = {
  input: EstimateInput;
  year: number;
  netIncome: number;
  cpp: number;
  cppEnhanced: number;
  cpp2: number;
  ei: number;
  qpip: number;
  federal: number;
  /** Quebec abatement already subtracted from `federal`. */
  abatement: number;
  /** null for Quebec (Revenu Québec). */
  provincial: number | null;
  total: number;
  averageRate: number;
  marginalRate: number;
  /** Refund (> 0) or balance owing (< 0), in whole dollars like federal/provincial/total; null when tax deducted is unknown. */
  balance: number | null;
  /** Tax saved by a $1,000 RRSP contribution at this income. */
  rrspSavingPer1000: number;
  /** Federal-only figures (for Quebec, or before a province is chosen). */
  federalAverageRate: number;
  federalMarginalRate: number;
  rrspFederalSavingPer1000: number;
  /** Federal brackets filled by taxable income, for the chart. */
  fill: { from: number; to: number; rate: number; amount: number }[];
};

function bracketTax(income: number, brackets: readonly Bracket[]) {
  let tax = 0;
  let lo = 0;
  for (const br of brackets) {
    if (income <= lo) break;
    tax += (Math.min(income, br.upTo) - lo) * br.rate;
    lo = br.upTo;
  }
  return tax;
}

function federalBpa(net: number) {
  const { bpaMax, bpaMin, bpaPhaseStart, bpaPhaseEnd } = FEDERAL;
  if (net <= bpaPhaseStart) return bpaMax;
  if (net >= bpaPhaseEnd) return bpaMin;
  return bpaMax - ((net - bpaPhaseStart) * (bpaMax - bpaMin)) / (bpaPhaseEnd - bpaPhaseStart);
}

function payroll(province: ProvinceCode, emp: number) {
  const qc = province === 'QC';
  const pensionable = Math.max(0, Math.min(emp, PAYROLL.cpp.ympe) - PAYROLL.cpp.exemption);
  const plan = qc ? PAYROLL.qpp : PAYROLL.cpp;
  const contrib = Math.min(plan.max, pensionable * plan.rate);
  const base = Math.min(plan.baseMax, contrib * (plan.baseRate / plan.rate));
  const enhanced = Math.min(plan.enhancedMax, contrib - base);
  const cpp2 = clamp((Math.min(emp, PAYROLL.cpp2.yampe) - PAYROLL.cpp.ympe) * PAYROLL.cpp2.rate, 0, PAYROLL.cpp2.max);
  const eiRate = qc ? PAYROLL.eiQc.rate : PAYROLL.ei.rate;
  const eiMax = qc ? PAYROLL.eiQc.max : PAYROLL.ei.max;
  const ei = Math.min(eiMax, Math.min(emp, PAYROLL.ei.maxInsurable) * eiRate);
  const qpip = qc ? Math.min(PAYROLL.qpip.max, emp * PAYROLL.qpip.rate) : 0;
  return { contrib, base, enhanced, cpp2, ei, qpip };
}

function provincialTax(province: Exclude<ProvinceCode, 'QC'>, taxable: number, emp: number, creditBase: number) {
  const rule = PROVINCIAL[province];
  const low = rule.brackets[0].rate;
  let bpa = rule.bpa;
  if (province === 'YT') bpa = federalBpa(taxable);
  if (province === 'MB') {
    const { bpaPhaseStart: s, bpaPhaseEnd: e } = EXTRAS.MB;
    bpa = taxable <= s ? rule.bpa : taxable >= e ? 0 : rule.bpa - ((taxable - s) * rule.bpa) / (e - s);
  }
  let credits = low * (bpa + creditBase);
  if (province === 'YT') credits += low * Math.min(FEDERAL.cea, emp);
  if (province === 'AB') credits += Math.max(0, (credits - EXTRAS.AB.supplementalFloor) * EXTRAS.AB.supplementalRate);
  let tax = Math.max(0, bracketTax(taxable, rule.brackets) - credits);
  if (province === 'ON') {
    const { surtax1, surtax2, reductionBase } = EXTRAS.ON;
    const surtax = Math.max(0, tax - surtax1.over) * surtax1.rate + Math.max(0, tax - surtax2.over) * surtax2.rate;
    const withSurtax = tax + surtax;
    const reduction = clamp(2 * reductionBase - withSurtax, 0, withSurtax);
    tax = withSurtax - reduction + ontarioHealthPremium(taxable);
  }
  if (province === 'BC') {
    const { reduction, phaseStart, phaseRate } = EXTRAS.BC;
    const r = Math.max(0, reduction - Math.max(0, taxable - phaseStart) * phaseRate);
    tax = Math.max(0, tax - Math.min(tax, r));
  }
  return tax;
}

/** Ontario Health Premium (T4127 factor V2). */
function ontarioHealthPremium(a: number) {
  if (a <= 20_000) return 0;
  if (a <= 36_000) return Math.min(300, 0.06 * (a - 20_000));
  if (a <= 48_000) return Math.min(450, 300 + 0.06 * (a - 36_000));
  if (a <= 72_000) return Math.min(600, 450 + 0.25 * (a - 48_000));
  if (a <= 200_000) return Math.min(750, 600 + 0.25 * (a - 72_000));
  return Math.min(900, 750 + 0.25 * (a - 200_000));
}

function taxFor(i: EstimateInput) {
  const emp = Math.max(0, i.employmentIncome);
  const p = payroll(i.province, emp);
  const net = Math.max(0, emp + Math.max(0, i.otherIncome) - Math.max(0, i.rrsp) - Math.max(0, i.fhsa) - p.enhanced - p.cpp2);
  const creditBase = p.base + p.ei + p.qpip;
  const fedCredits = FEDERAL.brackets[0].rate * (federalBpa(net) + Math.min(FEDERAL.cea, emp) + creditBase);
  let federal = Math.max(0, bracketTax(net, FEDERAL.brackets) - fedCredits);
  let abatement = 0;
  if (i.province === 'QC') {
    abatement = federal * FEDERAL.quebecAbatement;
    federal -= abatement;
  }
  const provincial = i.province === 'QC' ? null : provincialTax(i.province, net, emp, creditBase);
  return { p, net, federal, abatement, provincial, total: federal + (provincial ?? 0) };
}

export function estimate(input: EstimateInput): Estimate {
  const i: EstimateInput = {
    ...input,
    employmentIncome: Math.max(0, input.employmentIncome || 0),
    otherIncome: Math.max(0, input.otherIncome || 0),
    rrsp: Math.max(0, input.rrsp || 0),
    fhsa: Math.min(FHSA.annual + FHSA.carryMax, Math.max(0, input.fhsa || 0)),
  };
  const r = taxFor(i);
  const bump = taxFor({ ...i, otherIncome: i.otherIncome + 100 });
  const rrspMore = taxFor({ ...i, rrsp: i.rrsp + 1000 });
  const gross = i.employmentIncome + i.otherIncome;
  const fill: Estimate['fill'] = [];
  let lo = 0;
  for (const br of FEDERAL.brackets) {
    if (r.net <= lo) break;
    const to = Math.min(r.net, br.upTo);
    fill.push({ from: lo, to, rate: br.rate, amount: round2((to - lo) * br.rate) });
    lo = br.upTo;
  }
  // Whole dollars first, so every displayed triple adds up: deducted − tax = refund (or owing), and
  // federal + provincial = total. Rounding each figure separately could leave them $1 apart.
  const federal = Math.round(r.federal);
  const provincial = r.provincial == null ? null : Math.round(r.provincial);
  const total = federal + (provincial ?? 0);
  return {
    input: i,
    year: RATES_YEAR,
    netIncome: round2(r.net),
    cpp: round2(r.p.contrib),
    cppEnhanced: round2(r.p.enhanced),
    cpp2: round2(r.p.cpp2),
    ei: round2(r.p.ei),
    qpip: round2(r.p.qpip),
    federal,
    abatement: round2(r.abatement),
    provincial,
    total,
    averageRate: gross > 0 ? r.total / gross : 0,
    marginalRate: Math.max(0, (bump.total - r.total) / 100),
    balance: i.taxDeducted == null ? null : Math.round(i.taxDeducted) - (i.province === 'QC' ? federal : total),
    rrspSavingPer1000: round2(Math.max(0, r.total - rrspMore.total)),
    federalAverageRate: gross > 0 ? r.federal / gross : 0,
    federalMarginalRate: Math.max(0, (bump.federal - r.federal) / 100),
    rrspFederalSavingPer1000: round2(Math.max(0, r.federal - rrspMore.federal)),
    fill,
  };
}
