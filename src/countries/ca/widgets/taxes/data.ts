/**
 * Personal income tax facts for the `taxes` widget, verified against canada.ca on 2026-09-30.
 * Isomorphic: used by the tools (server) and the widgets (client, for instant recalculation).
 * Each block names the page it came from and that page's "Date modified".
 *
 * Due dates (tax year 2026, return filed in 2027)
 * - Filing and payment due April 30; self-employed (or spouse/partner) file by June 15, but any balance
 *   is still due April 30. Weekend / CRA public holiday -> next business day is on time.
 *   filing-dates-tax-return.html (2026-01-20); important-dates-individuals.html (2026-09-17).
 *   canada.ca still lists the 2025 dates (Apr 30 / Jun 15, 2026); 2026 dates follow the same rule:
 *   Apr 30, 2027 is a Friday and Jun 15, 2027 a Tuesday, so no rollover applies.
 * - RRSP: contributions in the first 60 days of the next year count ("from March 4, 2025 to March 2, 2026
 *   qualify" for 2025, the 60th day, Mar 1 2026, being a Sunday). For 2026: Mar 1, 2027 (a Monday).
 *   contributions-affect-your-rrsp-prpp-deduction-limit.html (2026-01-29); important-dates-rrsp-rrif-rdsp.html (2026-01-29)
 * - FHSA: contributions made by December 31 are deductible for that year. important-dates-rrsp-rrif-rdsp.html
 * - Instalments for 2026: March 15, June 15, September 15, December 15. due-dates.html (2026-01-20)
 * - Late-filing penalty: 5% of the balance owing + 1% per full month late, up to 12 months.
 *   late-filing-penalty.html (2026-01-20)
 *
 * Rates and amounts for 2026 (the return filed in 2027)
 * - Federal brackets 14% / 20.5% / 26% / 29% / 33% at $58,523 / $117,045 / $181,440 / $258,482; all
 *   provincial / territorial brackets (Quebec: Revenu Québec). tax-rates-brackets/current-year.html (2026-06-25)
 * - Federal BPA $16,452 (net income ≤ $181,440), $14,829 (≥ $258,482), Canada employment amount $1,501.
 *   adjustment-personal-income-tax-benefit-amounts.html (2026-03-12)
 * - CPP 2026: YMPE $74,600, basic exemption $3,500, 5.95% (max $4,230.45); CPP2 4% to YAMPE $85,000 (max $416).
 *   cpp-contribution-rates-maximums-exemptions.html (2025-10-31); limits page (2025-12-01)
 * - EI 2026: max insurable $68,900, 1.63% (max $1,123.07). ei-premium-rates-maximums.html (2025-09-16)
 * - Provincial basic personal amounts, base-CPP credit share (4.95/5.95), first-enhanced deduction (1/5.95,
 *   max $711), Ontario surtax ($5,818 / $7,446) + tax reduction ($300) + health premium, BC tax reduction,
 *   Alberta supplemental credit, Manitoba BPA phase-out, Quebec abatement 16.5%, QPP 6.3% / QC EI 1.30% /
 *   QPIP: T4127 Payroll Deductions Formulas, 122nd ed. (Jan 2026) and 123rd ed. (effective July 1, 2026,
 *   t4127-jul.html 2026-06-03), which states the annual 2026 values behind its prorated July figures:
 *     BC lowest rate 5.60% and BC tax reduction $690 (phase-out 3.56% from $25,570 to $44,952);
 *     NL basic personal amount $13,094 (announced April 29, 2026, effective Jan 1, 2026);
 *     PE new 20% bracket above $200,000.
 *   Manitoba: T4127 says 2026 brackets are frozen at $47,000 / $100,000 while current-year.html lists
 *   $47,564 / $101,200. We follow current-year.html (the page for the 2026 return); the difference is under $15.
 *
 * Savings plans
 * - TFSA annual limits 2009–2026 ($7,000 in 2026); room accrues from the year you turn 18 (or become a
 *   resident). limits page (2025-12-01); calculate-room.html (2026-02-20); opening.html (2025-10-10)
 * - RRSP dollar limit $33,810 (2026) and $35,390 (2027); new room = 18% of the previous year's earned income.
 *   limits page; contributions-affect… (2026-01-29)
 * - FHSA: $8,000 room in the first year, carry forward up to $8,000 of unused room, $40,000 lifetime.
 *   contributing-your-fhsa.html (2026-09-17); first-home-savings-account.html (2026-02-02)
 * - FHSA eligibility (when opening): resident of Canada; 18 or older (19 where that is the age of majority);
 *   71 or younger on December 31 of that year; a first-time home buyer. opening-your-fhsas.html (2026-02-10)
 *
 * Filing for free
 * - Free tax clinics (CVITP; ITAVP in Quebec): suggested family income 1 person $40,000, 2 $55,000,
 *   3 $60,000, 4 $65,000, 5 $70,000, +$5,000 per extra person; simple situations only; walk-in, drop-off,
 *   by appointment (in person or virtual). need-a-hand-complete-your-tax-return.html (2026-01-27)
 * - Quebec (Revenu Québec, ITAVP): the same suggested limits: person living alone $40,000; couple, or one
 *   adult with one dependant, $55,000; + $5,000 for each additional dependant. Same simple-situation rules
 *   (interest under $1,200; self-employment income under $1,000 with no expenses). Read in a browser on
 *   2026-09-30 (the server gets a 403), EN + FR: are-you-eligible-for-the-income-tax-assistance-program/
 *   (page meta "lastupdate" 10-02-2022). So CLINIC_THRESHOLDS apply to Quebec as well.
 * - SimpleFile income limits for 2025 returns by province and age; invitations sent September 2026.
 *   "SimpleFile Digital: available to eligible individuals with or without an invitation. SimpleFile by Phone:
 *   available with an invitation only. SimpleFile by Paper: available with an invitation only."
 *   simplefile.html (2026-09-03), declarer-simplement.html ("avec ou sans invitation" / "sur invitation seulement")
 * - Starting March 2027 the CRA will invite 1 million eligible people to file a pre-filled return in their
 *   CRA account. how-file.html (2026-09-04)
 * - NETFILE / ReFILE open Feb 23, 2026 to Jan 29, 2027 for 2018–2025 returns; most certified software is free
 *   for a modest income. certified-software-netfile-program.html (2026-04-07)
 *
 * Refunds
 * - Service standards 2026–27: notice of assessment within 2 weeks for on-time digital returns (95% of the
 *   time); within 12 weeks for paper (85%). service-standards-2026-27.html (2026-05-11)
 * - Wait 12 weeks (16 outside Canada) before contacting the CRA; progress tracker in the CRA account;
 *   automated line 1-800-959-8281 option 4 (French: 1-800-959-7383 option 2), 6 a.m. to 3 a.m. ET, 7 days.
 *   refunds.html (2026-01-20) and remboursements.html
 */

/** The day these facts were last read on the official pages. */
export const CHECKED = '2026-09-30';
export type Lang = 'en' | 'fr';

/* ────────────────────────────── Rates (tax year 2026) ────────────────────────────── */

export const RATES_YEAR = 2026;

export type Bracket = { upTo: number; rate: number }; // upTo = Infinity for the top bracket
export type ProvinceCode = 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';
export const PROVINCES: ProvinceCode[] = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];

const b = (...pairs: [number, number][]): Bracket[] => pairs.map(([upTo, rate]) => ({ upTo, rate }));
const INF = Number.POSITIVE_INFINITY;

export const FEDERAL = {
  brackets: b([58_523, 0.14], [117_045, 0.205], [181_440, 0.26], [258_482, 0.29], [INF, 0.33]),
  bpaMax: 16_452,
  bpaMin: 14_829,
  bpaPhaseStart: 181_440,
  bpaPhaseEnd: 258_482,
  cea: 1_501,
  quebecAbatement: 0.165,
} as const;

export const PAYROLL = {
  cpp: { ympe: 74_600, exemption: 3_500, rate: 0.0595, baseRate: 0.0495, max: 4_230.45, baseMax: 3_519.45, enhancedMax: 711 },
  qpp: { rate: 0.063, baseRate: 0.053, max: 4_479.3, baseMax: 3_768.3, enhancedMax: 711 },
  cpp2: { yampe: 85_000, rate: 0.04, max: 416 },
  ei: { maxInsurable: 68_900, rate: 0.0163, max: 1_123.07 },
  eiQc: { rate: 0.013, max: 895.7 },
  qpip: { rate: 0.0043, max: 442.9 },
} as const;

type ProvinceRule = {
  brackets: Bracket[];
  /** Basic personal amount (flat); see `bpa` special cases in calc/estimate.ts for MB and YT. */
  bpa: number;
};

export const PROVINCIAL: Record<Exclude<ProvinceCode, 'QC'>, ProvinceRule> = {
  AB: { brackets: b([61_200, 0.08], [154_259, 0.1], [185_111, 0.12], [246_813, 0.13], [370_220, 0.14], [INF, 0.15]), bpa: 22_769 },
  BC: { brackets: b([50_363, 0.056], [100_728, 0.077], [115_648, 0.105], [140_430, 0.1229], [190_405, 0.147], [265_545, 0.168], [INF, 0.205]), bpa: 13_216 },
  MB: { brackets: b([47_564, 0.108], [101_200, 0.1275], [INF, 0.174]), bpa: 15_780 },
  NB: { brackets: b([52_333, 0.094], [104_666, 0.14], [193_861, 0.16], [INF, 0.195]), bpa: 13_664 },
  NL: {
    brackets: b([44_678, 0.087], [89_354, 0.145], [159_528, 0.158], [223_340, 0.178], [285_319, 0.198], [570_638, 0.208], [1_141_275, 0.213], [INF, 0.218]),
    bpa: 13_094,
  },
  NS: { brackets: b([30_995, 0.0879], [61_991, 0.1495], [97_417, 0.1667], [157_124, 0.175], [INF, 0.21]), bpa: 11_932 },
  NT: { brackets: b([53_003, 0.059], [106_009, 0.086], [172_346, 0.122], [INF, 0.1405]), bpa: 18_198 },
  NU: { brackets: b([55_801, 0.04], [111_602, 0.07], [181_439, 0.09], [INF, 0.115]), bpa: 19_659 },
  ON: { brackets: b([53_891, 0.0505], [107_785, 0.0915], [150_000, 0.1116], [220_000, 0.1216], [INF, 0.1316]), bpa: 12_989 },
  PE: { brackets: b([33_928, 0.095], [65_820, 0.1347], [106_890, 0.166], [142_520, 0.1762], [200_000, 0.19], [INF, 0.2]), bpa: 15_000 },
  SK: { brackets: b([54_532, 0.105], [155_805, 0.125], [INF, 0.145]), bpa: 20_381 },
  YT: { brackets: b([58_523, 0.064], [117_045, 0.09], [181_440, 0.109], [500_000, 0.128], [INF, 0.15]), bpa: 16_452 },
};

/** Province-specific extras (T4127, 2026 annual values). */
export const EXTRAS = {
  ON: { surtax1: { over: 5_818, rate: 0.2 }, surtax2: { over: 7_446, rate: 0.36 }, reductionBase: 300 },
  BC: { reduction: 690, phaseStart: 25_570, phaseRate: 0.0356 },
  AB: { supplementalFloor: 4_896, supplementalRate: 0.25 },
  MB: { bpaPhaseStart: 200_000, bpaPhaseEnd: 400_000 },
} as const;

/* ────────────────────────────── Savings plans ────────────────────────────── */

export const TFSA_LIMITS: Record<number, number> = {
  2009: 5_000, 2010: 5_000, 2011: 5_000, 2012: 5_000, 2013: 5_500, 2014: 5_500, 2015: 10_000, 2016: 5_500, 2017: 5_500,
  2018: 5_500, 2019: 6_000, 2020: 6_000, 2021: 6_000, 2022: 6_000, 2023: 6_500, 2024: 7_000, 2025: 7_000, 2026: 7_000,
};
export const TFSA_FIRST_YEAR = 2009;
export const TFSA_CURRENT_YEAR = 2026;
export const RRSP_LIMITS: Record<number, number> = { 2025: 32_490, 2026: 33_810, 2027: 35_390 };
export const RRSP_RATE = 0.18;
export const FHSA = { annual: 8_000, carryMax: 8_000, lifetime: 40_000, firstYear: 2023 } as const;

/* ────────────────────────────── Free filing ────────────────────────────── */

/** Suggested CVITP income thresholds by family size (1–5; +$5,000 per extra person). Revenu Québec's ITAVP uses the same. */
export const CLINIC_THRESHOLDS = [40_000, 55_000, 60_000, 65_000, 70_000] as const;
export const CLINIC_EXTRA_PERSON = 5_000;
export const CLINIC_INTEREST_MAX = 1_200;

/** SimpleFile income limits for 2025 returns: [15–64 no DTC, 15–64 DTC, 65+ no DTC, 65+ DTC]. */
export const SIMPLEFILE_2025: Record<ProvinceCode, [number, number, number, number]> = {
  AB: [16_129, 26_267, 25_157, 35_295],
  BC: [12_932, 22_631, 18_731, 28_430],
  MB: [15_780, 21_960, 19_508, 25_688],
  NB: [13_396, 23_406, 19_433, 29_443],
  NL: [11_067, 18_534, 18_131, 25_598],
  NT: [16_129, 26_267, 25_157, 35_295],
  NS: [11_744, 19_085, 17_478, 24_819],
  NU: [16_129, 26_267, 25_157, 35_295],
  ON: [12_747, 23_045, 18_970, 29_268],
  PE: [14_650, 21_540, 21_160, 28_050],
  QC: [16_129, 26_267, 25_157, 35_295],
  SK: [16_129, 26_267, 25_157, 35_295],
  YT: [16_129, 26_267, 25_157, 35_295],
};

export const NETFILE = { opened: '2026-02-23', closes: '2027-01-29', firstYear: 2018, lastYear: 2025 } as const;
export const PREFILLED = { starts: '2027-03', invitations: 1_000_000 } as const;

/* ────────────────────────────── Refunds ────────────────────────────── */

export const REFUND = {
  digitalWeeks: 2,
  digitalTarget: 95,
  paperWeeks: 12,
  paperTarget: 85,
  contactAfterWeeks: 12,
  contactAfterWeeksAbroad: 16,
  /** A refund of this many dollars or less isn't paid out ("a refund of $2 or less"). refunds.html (2026-01-20) */
  minimum: 2,
  /** Automated refund line (no wait time), 6 a.m. to 3 a.m. ET, 7 days: English and French service. */
  automated: { en: { line: '1-800-959-8281', option: 4 }, fr: { line: '1-800-959-7383', option: 2 } },
} as const;

export const PENALTY = { base: 5, perMonth: 1, maxMonths: 12 } as const;
