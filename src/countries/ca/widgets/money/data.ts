/**
 * Money & savings facts, verified on 2026-10-01 against the official pages below ("Date modified" in
 * brackets). Isomorphic: used by the tools (server) and the widgets (client, for instant recalculation).
 * The page URLs are in ./links (small, also used by the widgets); titles, dates and quotes for the Sources
 * list are in ./sources and stay on the server: the tool returns the sources in both official languages.
 *
 * RESP, Canada Education Savings Grant (CESG), Canada Learning Bond (CLB) — ESDC
 * - estimating-amounts.html [2026-08-10]: basic CESG "20% = $500" on the first $2,500 contributed each
 *   year; "up to $7,200 maximum per eligible child", "until the end of the calendar year that the beneficiary
 *   turns 17"; unused amounts accumulate, "a child could get up to $1,000 of the CESG in their RESP per
 *   calendar year if there are unused amounts from previous years". Additional CESG (2026) on the first $500:
 *   20% ($100) if adjusted family income is less than $58,523, 10% ($50) from $58,523 to $117,045, none above
 *   (Table 2: "Less than $58,523" / "Between $58,523 and $117,045" / "More than $117,045").
 *   Ages 16–17: eligible only if, before the end of the year they turn 15, at least $2,000 was contributed
 *   (and not withdrawn) or at least $100 a year in any 4 previous years.
 *   CLB: "$500 the first year … then another $100 each eligible year after that up to and including age 15,
 *   up to a lifetime maximum of $2,000"; born on or after January 1, 2004; retroactive; "The primary caregiver can request
 *   the CLB for an eligible child until the day before they turn 18"; from 18, beneficiaries request it
 *   themselves until the day before they turn 21. Income thresholds July 1, 2026 – June 30, 2027: 1–3 children
 *   ≤ $58,523; 4 children < $66,036; 5 children < $73,577.
 * - canada-learning-bond.html [2026-07-02]: no contribution needed for the CLB; automatic RESP opening
 *   starts April 2028 for eligible children born in 2024 or later.
 * - opening-plan.html [2025-10-16] (FR creer-plan.html [2026-08-19]): SIN for the beneficiary → choose a
 *   promoter ("Ask your promoter before opening your RESP what benefits they offer") → open the RESP and name
 *   the beneficiary → apply for benefits (the promoter applies) → contribute (needed for CESG, not CLB).
 *   Timing: "It may take several weeks before receiving the benefits. For example, the CESG will be deposited
 *   within 6 to 8 weeks of an eligible contribution, once the application has been processed." So the 6 to 8
 *   weeks is for the grant only and counts from a contribution, not from the application.
 * - paying-education.html [2025-10-16]: contributions come out tax-free; grants, bonds and earnings are paid
 *   as Educational Assistance Payments, taxed as the student's income.
 * - CRA resp-contributions.html [2026-02-27]: lifetime contribution limit $50,000 per beneficiary;
 *   contributions are not deductible.
 *
 * TFSA, RRSP, FHSA — CRA
 * - saving-future.html [2026-02-04]: side-by-side basics (deductible? taxed on withdrawal?).
 * - calculate-room.html [2026-02-20]: TFSA dollar limit for 2026 is $7,000; withdrawals are added back as
 *   room on January 1 of the following year.
 * - mp-rrsp-dpsp-tfsa-limits-ympe.html [2025-12-01]: RRSP dollar limit $33,810 (2026); TFSA $7,000 (2026).
 * - contributions-affect-your-rrsp-prpp-deduction-limit.html [2026-01-29]: new RRSP room = 18% of the
 *   previous year's earned income, up to the annual limit; 1%/month tax on excess over $2,000.
 * - first-home-savings-account.html [2026-02-02]: first-time home buyers; $8,000 a year, $40,000 lifetime;
 *   contributions deductible; qualifying withdrawals tax-free; open up to 15 years, close by age 71.
 *   opening-your-fhsas.html: 18 or older, or 19 where the legal age to enter a contract is 19.
 *   closing-your-fhsa.html [2026-02-02] (FR fermer-votre-celiapp.html): the participation period ends December 31 of the year of the
 *   earliest of the 15th anniversary of opening the first FHSA, turning 71, or the year after the first
 *   qualifying withdrawal; unused savings then move to an RRSP/RRIF or are taxed as income.
 * - tax-rates-brackets.html [2026-01-20]: federal and provincial/territorial rates (linked for "find my rate").
 *   CRA tax-free-savings-account/opening.html: 18 or older; "In some provinces and territories, you must be
 *   at least 19 years of age to enter a contract (such as a TFSA)".
 *   "First-time home buyer" (CRA definitions): you didn't live, in the part of the year before opening the
 *   account or in the previous 4 calendar years, in a home that you or your spouse or common-law partner owned.
 * - what-home-buyers-plan.html [2026-02-17]: HBP withdrawal limit $60,000; for first withdrawals in
 *   2026–2028 repayments start the fifth year after (e.g. a 2026 withdrawal → first repayment year 2031),
 *   then over 15 years.
 *   withdraw-funds-rrsp-s-under-home-buyers-plan.html [2026-01-20]: only amounts over $60,000 are reported
 *   as income (tax withheld); repay-funds-…-home-buyers-plan.html [2026-01-20]: a missed minimum repayment
 *   is included in income for that year.
 *
 * Mortgages — FCAC, Finance Canada, CMHC
 * - FCAC preparing-mortgage.html [2025-10-15]: stress test = the higher of 5.25% or your negotiated rate
 *   + 2%; GDS (mortgage payments, property taxes, heating, 50% of condo fees) ≤ 39% of gross household
 *   income; TDS (housing + all other debts) ≤ 44%.
 * - FCAC down-payment.html [2025-10-15] (re-checked 2026-09-30): minimum down payment 5% up to $500,000; 5% of
 *   the first $500,000 + 10% of the rest up to $1.5 million; 20% at $1.5 million or more; insurance usually
 *   needed under 20%. Its table uses the $1.5 million tiers, but the "isn't available if" list further down
 *   still says "$1 million or more", so the cap itself is taken from Finance Canada below.
 * - Finance Canada, "Boldest mortgage reforms in decades come into force today" [2024-12-15]: insured-mortgage
 *   price cap raised from $1 million to $1.5 million; 30-year amortizations for all first-time buyers and
 *   all buyers of new builds.
 * - No contract rate given → the widget tests at the 5.25% floor, the lowest qualifying rate there is, and
 *   calls the result a rough check ("maybe") unless it fails anyway. There is no invented "example rate".
 * - CMHC premium-information-for-homeowner-and-small-rental-loans: premium by loan-to-value 0.60% (≤65%),
 *   1.70% (≤75%), 2.40% (≤80%), 2.80% (≤85%), 3.10% (≤90%), 4.00% (≤95%); +0.20% for amortizations over
 *   25 years; "Some provinces (currently Ontario, Quebec and Saskatchewan) apply" provincial sales tax to
 *   the premium, which can't be added to the loan. Re-checked 2026-10-01.
 *   CONFLICT: FCAC down-payment.html (re-checked 2026-10-01, EN) says "Ontario, Manitoba and Quebec apply
 *   provincial sales tax to mortgage loan insurance premiums". The two official pages disagree and neither
 *   was settled against provincial law here, so the widget says "some provinces" and attributes the list to
 *   CMHC (the insurer that charges the premium) in the sentence itself.
 * - LIVE: Bank of Canada Valet series V80691335 (5-year conventional mortgage, posted, weekly), V39079
 *   (policy rate target), V80691311 (prime rate). Checked 2026-09-30: 6.09% (Sept 23), 2.25%, 4.45%.
 *
 * Budget — FCAC
 * - make-budget.html [2025-08-21] ("Making a budget"): list income, savings and expenses → review → next steps; the
 *   emergency fund "should provide you with enough money to cover your living expenses for 3 to 6 months".
 *   FCAC Budget Planner: itools-ioutils.fcac-acfc.gc.ca/BP-PB/budget-planner (FR: planificateur-budgetaire); the
 *   same page says it lets you "compare your budget with those of other Canadians like you" (handoff note).
 */
export const CHECKED = '2026-10-01';
export type Lang = 'en' | 'fr';

export const RESP = {
  cesgRate: 0.2,
  cesgMatchedPerYear: 2_500,
  cesgBasicPerYear: 500,
  cesgMaxPerYear: 1_000,
  cesgLifetime: 7_200,
  cesgLastAge: 17,
  additional: { on: 500, lowRate: 0.2, midRate: 0.1, lowMax: 58_523, midMax: 117_045, year: 2026 },
  age16: { total: 2_000, yearly: 100, years: 4 },
  clb: { first: 500, yearly: 100, lastAge: 15, lifetime: 2_000, bornFrom: 2004, caregiverBeforeAge: 18, claimBeforeAge: 21 },
  /** CLB adjusted family income thresholds, July 1, 2026 – June 30, 2027 (by number of children). */
  clbThresholds: { upTo3: 58_523, four: 66_036, five: 73_577, period: '2026-07-01/2027-06-30' },
  lifetimeContribution: 50_000,
} as const;

export const ACCOUNTS = {
  year: 2026,
  /** contractAge: the legal age to sign a contract in some provinces and territories (then 19, not 18). */
  tfsa: { annual: 7_000, minAge: 18, contractAge: 19 },
  rrsp: { rate: 0.18, max: 33_810, closeAge: 71, excessBuffer: 2_000, excessTaxMonthly: 0.01 },
  fhsa: { annual: 8_000, carry: 8_000, lifetime: 40_000, years: 15, minAge: 18, contractAge: 19, closeAge: 71, notOwnedYears: 4 },
  hbp: { max: 60_000, repayYears: 15 },
} as const;

export const MORTGAGE = {
  floor: 5.25,
  buffer: 2,
  gdsMax: 39,
  tdsMax: 44,
  condoShare: 0.5,
  /** At or above this share of the price down, no mortgage loan insurance is needed. */
  conventionalDown: 0.2,
  down: { firstTier: 500_000, firstPct: 0.05, secondPct: 0.1, allPctFrom: 1_500_000, allPct: 0.2 },
  insuredCap: 1_500_000,
  /** CMHC premium on the total loan, by loan-to-value upper bound. */
  premiums: [
    { ltv: 0.65, rate: 0.006 },
    { ltv: 0.75, rate: 0.017 },
    { ltv: 0.8, rate: 0.024 },
    { ltv: 0.85, rate: 0.028 },
    { ltv: 0.9, rate: 0.031 },
    { ltv: 0.95, rate: 0.04 },
  ],
  longAmortSurcharge: 0.002,
  pstProvinces: ['QC', 'ON', 'SK'],
  amortDefault: 25,
  amortLong: 30,
} as const;

export const BUDGET = { emergencyMonths: [3, 6] as const };
