/**
 * Benefit rates and thresholds: the numbers the calculations use. Small and isomorphic, so the finder and the
 * estimators can recalculate on the device without loading the catalogue of official pages (./data.ts, which
 * also documents where every figure here was verified).
 */
export type Lang = 'en' | 'fr';
export type PayKey = 'ccb' | 'cgeb' | 'cwb' | 'cpp' | 'oas' | 'cdb';

export const CGEB = {
  period: { from: '2026-07', to: '2027-06', baseYear: '2025' },
  individual: 445,
  spouse: 445,
  child: 234,
  firstChildSingleParent: 445,
  singleSupplement: 234,
  supplementPhaseIn: 11_564,
  supplementRate: 0.02,
  threshold: 46_432,
  rate: 0.05,
} as const;

export const CCB = {
  period: { from: '2026-07', to: '2027-06', baseYear: '2025' },
  under6: 8_157,
  age6to17: 6_883,
  t1: 38_237,
  t2: 82_847,
  /** [band-1 rate, amount at t2, rate over t2] by number of children (1, 2, 3, 4+). */
  rates: [
    [0.07, 3_123, 0.032],
    [0.135, 6_022, 0.057],
    [0.19, 8_476, 0.08],
    [0.23, 10_260, 0.095],
  ] as const,
  disability: { max: 3_480, threshold: 82_847, rate1: 0.032, rate2: 0.057 },
} as const;

export const CWB = {
  taxYear: '2025',
  max: { single: 1_633, family: 2_813 },
  phaseInBase: 3_000,
  phaseInRate: 0.27,
  threshold: { single: 26_855, family: 30_639 },
  rate: 0.15,
  disability: { max: 843, base: 1_150, threshold: { single: 37_740, family: 49_389 }, rate: 0.15, rateBothDtc: 0.075 },
  advancePortion: 0.5,
  /** Provinces/territories with their own CWB amounts. */
  different: ['QC', 'AB', 'NU'] as const,
} as const;

export const CDCP = { limit: 90_000, tiers: [{ below: 70_000, copay: 0 }, { below: 80_000, copay: 40 }, { below: 90_000, copay: 60 }] } as const;

export const OAS = {
  quarter: { from: '2026-10', to: '2026-12' },
  monthly65: 762.5,
  monthly75: 838.75,
  fullYears: 40,
  minYears: 10,
  deferralPerMonth: 0.006,
  maxDeferralMonths: 60,
  /**
   * Recovery tax: 15% of net income over the threshold, held back from the payments of one July-to-June period.
   * `threshold` is the one in force for the payments this quarter's rates apply to (July 2026 to June 2027, on 2025
   * income), so the finder, the estimator and the scripted answer all give the same pension. `next` starts July 2027.
   */
  recovery: { rate: 0.15, threshold: 93_454, incomeYear: '2025', next: { threshold: 95_323, incomeYear: '2026' } },
  gis: {
    /** Monthly: max − rate × income/12 − min(topUp, topUpRate × (income − topUpFrom)/12), income excluding OAS. */
    single: { max: 1_138.9, limit: 23_112, rate: 0.5, topUp: 176.41, topUpFrom: 2_000, topUpRate: 0.25 },
    /** Each partner when the other also gets OAS; income = the couple's combined income excluding OAS. */
    spouseOas: { max: 685.56, limit: 30_528, rate: 0.25, topUp: 49.99, topUpFrom: 4_000, topUpRate: 0.125 },
    spouseNoOas: { max: 1_138.9, limit: 55_392 },
    /** Employment and self-employment income not counted: the first $5,000, then 50% of the next $10,000. */
    workExempt: { full: 5_000, half: 10_000 },
  },
} as const;

export const CPP = {
  max65: 1_507.65,
  average65: 858.34,
  maxAsOf: '2026-01',
  averageAsOf: '2026-07',
  earlyPerMonth: 0.006,
  latePerMonth: 0.007,
  minAge: 60,
  maxAge: 70,
  /** Applying after 65: a start date as early as 11 months before the month the application is received. */
  retroMonths: 11,
} as const;

export const CDB = {
  period: { from: '2026-07', to: '2027-06', baseYear: '2025' },
  monthlyMax: 204.2,
  exemption: { single: 10_210, couple: 14_294 },
  threshold: { single: 23_000, couple: 32_500 },
  rate: 0.2,
  rateBoth: 0.1,
  minAge: 18,
  maxAge: 64,
} as const;

export const EI = {
  rate: 0.55,
  maxInsurable: 68_900,
  maxWeekly: 729,
  weeks: { min: 14, max: 45 },
  hours: { min: 420, max: 700 },
  familySupplement: { income: 25_921, rate: 0.8 },
  applyWithinWeeks: 4,
  year: '2026',
} as const;

export const STUDENT = {
  year: '2026–2027',
  maxYearly: 4_200,
  maxMonthly: 525,
  /** Family size 1..7+: [max-grant below, cut-off at or above]. */
  thresholds: [
    [38_474, 69_987],
    [54_412, 98_017],
    [66_641, 117_317],
    [76_952, 129_769],
    [86_033, 141_180],
    [94_245, 151_937],
    [101_797, 161_321],
  ] as const,
  notIn: ['QC', 'NT', 'NU'] as const,
} as const;

export const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] as const;
export type Province = (typeof PROVINCES)[number];
