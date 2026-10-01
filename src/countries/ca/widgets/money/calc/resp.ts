/**
 * RESP projection: contributions, CESG (basic, additional, catch-up), Canada Learning Bond and assumed growth.
 * Pure and isomorphic: the tool runs it on the server, the widget re-runs it as people change the numbers.
 */
import { RESP } from '../data';
import { clamp, num, round2 } from './util';

export type IncomeTier = 'low' | 'middle' | 'high';
export type RespInput = {
  /** Child's age this year (0–17). */
  childAge?: number;
  /** What you plan to put in each year, in dollars. */
  annual?: number;
  /** Adjusted family net income, in dollars (sets the additional CESG and the CLB). */
  familyIncome?: number;
  /** Or just the tier, when the exact income isn't known. */
  incomeTier?: IncomeTier;
  /** Number of children in the family (the CLB threshold depends on it). */
  children?: number;
  /** Assumed yearly growth, in percent (illustration only). */
  growth?: number;
  /**
   * Only the income tier is known, the family has 4 or 5 children, and the person confirmed their income is
   * under the Canada Learning Bond limit for that many children ($66,036 / $73,577, above the "low" tier).
   */
  clbUnderLimit?: boolean;
};

type RespYear = {
  age: number;
  year: number;
  contribution: number;
  basic: number;
  additional: number;
  clb: number;
  growth: number;
  /** Balance at the end of the year. */
  balance: number;
  /** Cumulative split at the end of the year. */
  cum: { you: number; grants: number; clb: number; growth: number };
};

export type RespResult = {
  childAge: number;
  annual: number;
  growth: number;
  tier: IncomeTier;
  children: number;
  clbEligible: boolean;
  /** CESG at ages 16–17 depends on contributions made by the end of the year the child turns 15. */
  cesgAt16Ok: boolean;
  years: RespYear[];
  totals: { you: number; cesg: number; additional: number; clb: number; growth: number; balance: number; government: number };
  /** Unused basic CESG room carried into this year, assuming no grant was paid in past years (the catch-up tip says so). */
  unusedAtStart: number;
  /** CESG still left to claim under the lifetime maximum when the plan ends. */
  cesgLeftOnTable: number;
  /** Yearly amount that collects the full basic grant (2,500) or catches up (5,000) this year. */
  sweetSpot: number;
  capped: boolean;
  tooOld: boolean;
  /** Age at which the $7,200 lifetime grant maximum is reached (null if it isn't reached by 17). */
  capAge: number | null;
};

function tierOf(income: number | undefined, tier?: IncomeTier): IncomeTier {
  if (typeof income === 'number' && Number.isFinite(income)) {
    // ESDC Table 2: 20% for income *less than* $58,523; exactly $58,523 falls in the 10% band.
    if (income < RESP.additional.lowMax) return 'low';
    if (income <= RESP.additional.midMax) return 'middle';
    return 'high';
  }
  return tier ?? 'high';
}

/** CLB threshold by number of children (null = more than 5 children: ESDC asks families to call 1 800 O-Canada). */
export function clbThreshold(children: number): number | null {
  if (children <= 3) return RESP.clbThresholds.upTo3;
  if (children === 4) return RESP.clbThresholds.four;
  if (children === 5) return RESP.clbThresholds.five;
  return null;
}

function clbEligibleFor(income: number | undefined, tier: IncomeTier, children: number, underLimit: boolean): boolean {
  const th = clbThreshold(children);
  if (typeof income === 'number' && Number.isFinite(income)) {
    if (th == null) return false;
    return children <= 3 ? income <= th : income < th;
  }
  // Only the "low" tier (under $58,523) is certainly under every CLB threshold. With 4 or 5 children the limit
  // is higher, inside the "middle" tier, so there the person's own confirmation decides.
  return tier === 'low' || (tier === 'middle' && children > 3 && th != null && underLimit);
}

export function planResp(input: RespInput, currentYear: number): RespResult {
  const childAge = clamp(Math.round(num(input.childAge, 0)), 0, 17);
  const annual = clamp(num(input.annual, RESP.cesgMatchedPerYear), 0, RESP.lifetimeContribution);
  const growth = clamp(num(input.growth, 3), 0, 10);
  const children = clamp(Math.round(num(input.children, 1)), 1, 15);
  const tier = tierOf(input.familyIncome, input.incomeTier);
  const clbEligible = clbEligibleFor(input.familyIncome, tier, children, input.clbUnderLimit === true) && currentYear - childAge >= RESP.clb.bornFrom;
  const addRate = tier === 'low' ? RESP.additional.lowRate : tier === 'middle' ? RESP.additional.midRate : 0;
  const g = growth / 100;

  // Basic CESG room builds by $500 a year from the year of birth; assume nothing was claimed yet.
  let unused = RESP.cesgBasicPerYear * childAge;
  const unusedAtStart = unused;
  let cesgTotal = 0;
  let addTotal = 0;
  let clbTotal = 0;
  let you = 0;
  let balance = 0;
  let growthTotal = 0;
  let capped = false;
  let yearsWith100 = 0;
  let cesgAt16Ok = childAge <= 15;
  let capAge: number | null = null;
  const years: RespYear[] = [];

  for (let age = childAge; age <= RESP.cesgLastAge; age++) {
    const year = currentYear + (age - childAge);
    const room = RESP.lifetimeContribution - you;
    const contribution = Math.max(0, Math.min(annual, room));
    if (contribution < annual) capped = true;

    // Ages 16–17 need $2,000 in, or $100+ in any 4 years, by the end of the year the child turns 15.
    if (age === 16 && childAge <= 15) cesgAt16Ok = you >= RESP.age16.total || yearsWith100 >= RESP.age16.years;
    const grantable = age <= 15 || cesgAt16Ok;

    let basic = 0;
    let additional = 0;
    const entitlement = unused + RESP.cesgBasicPerYear;
    if (grantable) {
      basic = Math.min(RESP.cesgRate * contribution, RESP.cesgMaxPerYear, entitlement);
      additional = addRate * Math.min(contribution, RESP.additional.on);
      const left = RESP.cesgLifetime - cesgTotal - addTotal;
      if (basic + additional > left) {
        // Lifetime maximum reached: the basic grant absorbs the cut first.
        const over = basic + additional - left;
        const cutBasic = Math.min(basic, over);
        basic -= cutBasic;
        additional -= over - cutBasic;
      }
    }
    unused = Math.max(0, entitlement - basic);

    let clb = 0;
    if (clbEligible && age <= RESP.clb.lastAge) {
      // Retroactive: the first year pays $500 plus $100 for every earlier year of eligibility.
      clb = age === childAge ? RESP.clb.first + RESP.clb.yearly * age : RESP.clb.yearly;
      clb = Math.min(clb, RESP.clb.lifetime - clbTotal);
    } else if (clbEligible && age === childAge && age > RESP.clb.lastAge) {
      // 16 or 17 now: past years can still be claimed (before 21).
      clb = RESP.clb.lifetime;
    }

    const earned = balance * g;
    balance = balance + earned + contribution + basic + additional + clb;
    you += contribution;
    cesgTotal += basic;
    addTotal += additional;
    clbTotal += clb;
    growthTotal += earned;
    if (contribution >= RESP.age16.yearly) yearsWith100++;
    if (capAge == null && cesgTotal + addTotal >= RESP.cesgLifetime - 0.005) capAge = age;

    years.push({
      age,
      year,
      contribution: round2(contribution),
      basic: round2(basic),
      additional: round2(additional),
      clb: round2(clb),
      growth: round2(earned),
      balance: round2(balance),
      cum: { you: round2(you), grants: round2(cesgTotal + addTotal), clb: round2(clbTotal), growth: round2(growthTotal) },
    });
  }

  const government = cesgTotal + addTotal + clbTotal;
  return {
    childAge,
    annual,
    growth,
    tier,
    children,
    clbEligible,
    cesgAt16Ok,
    years,
    totals: {
      you: round2(you),
      cesg: round2(cesgTotal),
      additional: round2(addTotal),
      clb: round2(clbTotal),
      growth: round2(growthTotal),
      balance: round2(balance),
      government: round2(government),
    },
    unusedAtStart,
    cesgLeftOnTable: round2(Math.max(0, RESP.cesgLifetime - cesgTotal - addTotal)),
    sweetSpot: unusedAtStart > 0 ? RESP.cesgMaxPerYear / RESP.cesgRate : RESP.cesgMatchedPerYear,
    capped,
    tooOld: childAge >= 16,
    capAge,
  };
}
