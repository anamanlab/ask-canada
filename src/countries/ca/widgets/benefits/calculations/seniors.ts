/** Retirement programs: Old Age Security, the Guaranteed Income Supplement and the CPP retirement pension. */
import { CPP, OAS } from '../rates';
import type { Household } from './types';
import { pos, r2 } from './util';

/* ---------------------------------------------------------------- Old Age Security */

export type OasInput = { years: number; startAge: number; age75: boolean; income: number };

/**
 * The monthly pension at this quarter's rates, less the recovery tax held back from payments until June 2027
 * (15% of 2025 net income over `OAS.recovery.threshold`). One basis for the finder, the estimator and the answer.
 */
export function oasEstimate({ years, startAge, age75, income }: OasInput) {
  const y = Math.min(Math.max(years, 0), OAS.fullYears);
  const eligible = years >= OAS.minYears;
  const months = Math.min(Math.max(Math.round((startAge - 65) * 12), 0), OAS.maxDeferralMonths);
  const deferral = months * OAS.deferralPerMonth;
  const base = age75 ? OAS.monthly75 : OAS.monthly65;
  const gross = eligible ? base * (y / OAS.fullYears) * (1 + deferral) : 0;
  // Rounded to the cent first, so the breakdown always adds up: pension − recovery tax = what's left.
  const pension = r2(gross);
  const recovery = r2(Math.min(pension, (OAS.recovery.rate * pos(income - OAS.recovery.threshold)) / 12));
  const monthly = r2(pension - recovery);
  return { eligible, residency: y / OAS.fullYears, deferral, gross: pension, recovery, monthly, annual: r2(monthly * 12) };
}

/* ---------------------------------------------------------------- Guaranteed Income Supplement */

/**
 * Income as the GIS counts it: net income without the OAS pension, and without the first $5,000 of work income
 * and half of the next $10,000. `oas` is the OAS pension included in `net` (both partners' for a couple).
 */
export function gisIncome(net: number, oas: number, work: number): number {
  const w = pos(Math.min(work, net));
  const exempt = Math.min(w, OAS.gis.workExempt.full) + 0.5 * Math.min(pos(w - OAS.gis.workExempt.full), OAS.gis.workExempt.half);
  return pos(net - oas - exempt);
}

/** What a partial pensioner's OAS is short of the full pension, per month (0 with 40 years or more). */
export function oasShortfall(years: number, age75: boolean): number {
  const y = Math.min(Math.max(years, 0), OAS.fullYears);
  return r2((age75 ? OAS.monthly75 : OAS.monthly65) * (1 - y / OAS.fullYears));
}

/**
 * Monthly GIS (single, or each partner when both get OAS) from the official table's formula; 0 at or over the limit.
 * The tables are for a full OAS pension. With a partial pension the maximum goes up by `shortfall`, the gap between
 * the full pension and theirs (Old Age Security Act, s. 12(5): (maximum supplement + full pension − their pension) −
 * half of monthly income), so the income limit is higher too. Not paid while an immigration sponsorship is in effect.
 */
export function gisMonthly(household: Household, income: number, shortfall = 0): number {
  const g = household === 'couple' ? OAS.gis.spouseOas : OAS.gis.single;
  if (shortfall <= 0 && income >= g.limit) return 0;
  const m = g.max + pos(shortfall) - (g.rate * income) / 12 - Math.min(g.topUp, (g.topUpRate * pos(income - g.topUpFrom)) / 12);
  return r2(pos(m));
}

/* ---------------------------------------------------------------- CPP retirement pension */

export function cppFactor(startAge: number): number {
  const months = Math.round((Math.min(Math.max(startAge, CPP.minAge), CPP.maxAge) - 65) * 12);
  return months < 0 ? 1 + months * CPP.earlyPerMonth : 1 + months * CPP.latePerMonth;
}

export function cppEstimate(at65: number, startAge: number, horizon = 85) {
  const monthly = r2(at65 * cppFactor(startAge));
  const series = Array.from({ length: CPP.maxAge - CPP.minAge + 1 }, (_, i) => {
    const age = CPP.minAge + i;
    const m = at65 * cppFactor(age);
    return { age, monthly: r2(m), total: r2(m * 12 * pos(horizon - age)) };
  });
  return { monthly, pct: cppFactor(startAge) - 1, byHorizon: r2(monthly * 12 * pos(horizon - startAge)), horizon, series };
}
