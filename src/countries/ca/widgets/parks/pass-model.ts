/**
 * The Discovery Pass break-even calculator for the `parks` widget: the cheapest way to price a party for a
 * day and for a year, and the day the pass starts to pay. Pure and isomorphic (the tool and the calculator's
 * steppers run the same code).
 */
import { DISCOVERY, FAMILY_MAX, STRONG_PASS, TIERS, type Lang, type Tier } from './data';
import type { ParkLite } from './model';
import type { ParkSource } from './urls';

export type Party = { adults: number; seniors: number; youth: number };
/** How a party is priced: family/group rates (one per vehicle) plus individual adult and senior rates. */
export type Mix = { family: number; adults: number; seniors: number };
export type PassCalc = {
  /** Cheapest cost of one day at a park in this tier (family/group rates per vehicle, or per person). */
  dayCost: number;
  dayUsesFamily: boolean;
  dayMix: Mix;
  /** Cheapest Discovery Pass combination for the party. */
  passCost: number;
  passUsesFamily: boolean;
  passMix: Mix;
  /** Days of visits at which the pass costs less than paying daily. null if everyone is free. */
  breakEven: number | null;
  dailyTotal: number;
  /** Positive: the pass saves this much. Negative: paying daily is cheaper by this much. */
  savings: number;
  recommend: 'pass' | 'daily' | 'free';
  /** More than 7 people can't share one family/group rate: the party is priced as several vehicles. */
  overFamilyLimit: boolean;
  /** Vehicles the party needs (a family/group rate covers up to 7 people in one vehicle). */
  vehicles: number;
};

/** Most park days the calculator plans for (the tool's input, the model and the slider share it). */
export const MAX_DAYS = 60;
/** Most people in each age band of a group (the tool's input, the model and the steppers share it). */
export const MAX_PARTY = 12;

const clampInt = (n: unknown, lo: number, hi: number, dflt: number) => {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : dflt;
  return Math.max(lo, Math.min(hi, v));
};

export function normalizeParty(p: Partial<Party> | undefined): Party {
  const party = { adults: clampInt(p?.adults, 0, MAX_PARTY, 2), seniors: clampInt(p?.seniors, 0, MAX_PARTY, 0), youth: clampInt(p?.youth, 0, MAX_PARTY, 0) };
  if (party.adults + party.seniors + party.youth === 0) party.adults = 1;
  return party;
}

const NO_MIX: Mix = { family: 0, adults: 0, seniors: 0 };

/**
 * Cheapest way to price a party at the given rates. The party travels in the fewest vehicles that fit
 * (at most `FAMILY_MAX` people each, with an adult or senior in each when there are enough of them); each
 * vehicle pays the lower of one family/group rate or its adults' and seniors' individual rates. Youth are
 * always free, so they only take up seats. Exhaustive over splits (≤ 6 vehicles × 13 × 13 states).
 */
export function cheapestMix(party: Party, rates: { adult: number; senior: number; family: number }): { cost: number; mix: Mix; vehicles: number } {
  const paying = party.adults + party.seniors;
  const vehicles = Math.max(1, Math.ceil((paying + party.youth) / FAMILY_MAX));
  if (paying === 0) return { cost: 0, mix: NO_MIX, vehicles };
  const needDriver = paying >= vehicles;
  const cents = { a: Math.round(rates.adult * 100), s: Math.round(rates.senior * 100), f: Math.round(rates.family * 100) };
  type R = { cost: number; mix: Mix; items: number };
  const memo = new Map<string, R | null>();
  const go = (v: number, a: number, s: number): R | null => {
    if (v === vehicles) return a === 0 && s === 0 ? { cost: 0, mix: NO_MIX, items: 0 } : null;
    const key = `${v}:${a}:${s}`;
    if (memo.has(key)) return memo.get(key)!;
    let best: R | null = null;
    for (let ai = 0; ai <= Math.min(a, FAMILY_MAX); ai++) {
      for (let si = 0; si <= Math.min(s, FAMILY_MAX - ai); si++) {
        if (needDriver && ai + si === 0) continue;
        const rest = go(v + 1, a - ai, s - si);
        if (!rest) continue;
        const each = ai * cents.a + si * cents.s;
        const fam = ai + si > 0 && cents.f < each;
        const cost = rest.cost + (fam ? cents.f : each);
        const mix = fam ? { ...rest.mix, family: rest.mix.family + 1 } : { family: rest.mix.family, adults: rest.mix.adults + ai, seniors: rest.mix.seniors + si };
        const items = mix.family + mix.adults + mix.seniors;
        if (!best || cost < best.cost || (cost === best.cost && items < best.items)) best = { cost, mix, items };
      }
    }
    memo.set(key, best);
    return best;
  };
  const r = go(0, party.adults, party.seniors)!;
  return { cost: r.cost / 100, mix: r.mix, vehicles };
}

export const clampDays = (n: unknown) => clampInt(n, 1, MAX_DAYS, 5);

export function passCalc(partyIn: Partial<Party>, daysIn: number, tier: Tier): PassCalc {
  const party = normalizeParty(partyIn);
  const days = clampDays(daysIn);
  const paying = party.adults + party.seniors;
  const day = cheapestMix(party, TIERS[tier]);
  const pass = cheapestMix(party, DISCOVERY);
  const dailyTotal = round2(day.cost * days);
  const breakEven = day.cost > 0 ? Math.ceil(pass.cost / day.cost - 1e-9) : null;
  const savings = round2(dailyTotal - pass.cost);
  return {
    dayCost: round2(day.cost),
    dayUsesFamily: day.mix.family > 0,
    dayMix: day.mix,
    passCost: round2(pass.cost),
    passUsesFamily: pass.mix.family > 0,
    passMix: pass.mix,
    breakEven,
    dailyTotal,
    savings,
    recommend: paying === 0 ? 'free' : savings >= 0 ? 'pass' : 'daily',
    overFamilyLimit: party.adults + party.seniors + party.youth > FAMILY_MAX,
    vehicles: pass.vehicles,
  };
}
const round2 = (n: number) => Math.round(n * 100) / 100;

export type PassesOutput = {
  version: 1;
  lang: Lang;
  party: Party;
  days: number;
  tier: Tier;
  park: ParkLite | null;
  tiers: typeof TIERS;
  discovery: typeof DISCOVERY;
  calc: PassCalc;
  strongPass: typeof STRONG_PASS;
  familyMax: number;
  /** The person described the group as their family (wording only). */
  family?: boolean;
  sources: ParkSource[];
};
