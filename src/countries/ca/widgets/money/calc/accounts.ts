/**
 * TFSA vs RRSP vs FHSA: the same pre-tax pay followed into each account.
 * Pure and isomorphic: the tool runs it on the server, the widget re-runs it as people change the numbers.
 */
import { ACCOUNTS } from '../data';
import { clamp, num, round2 } from './util';

export type Goal = 'home' | 'retirement' | 'anything';
export type AccountId = 'tfsa' | 'rrsp' | 'fhsa';
export type CompareInput = {
  goal?: Goal;
  /** Pre-tax pay set aside, in dollars (illustration). */
  amount?: number;
  /** Tax rate on your last dollar of income today, in percent. */
  rateNow?: number;
  /** Tax rate expected when the money comes out, in percent. */
  rateLater?: number;
  years?: number;
  growth?: number;
  age?: number;
  /** First-time home buyer (no home you or your spouse owned and lived in this year or the previous 4). */
  firstHome?: boolean;
};

export type CompareResult = {
  goal: Goal;
  amount: number;
  rateNow: number;
  rateLater: number;
  years: number;
  growth: number;
  age: number | null;
  firstHome: boolean | null;
  /** Neither tax rate was given: both use the same example rate, so the TFSA and RRSP come out equal. */
  exampleRates: boolean;
  eligible: Record<AccountId, boolean | null>;
  /** What reaches you, after tax, from the same pre-tax pay. */
  outcome: Record<AccountId, number>;
  /** Tax refund from the deduction today (RRSP/FHSA). */
  refund: number;
  /** Accounts that fit the goal, best outcome first. */
  ranking: AccountId[];
  best: AccountId;
  /** Every account that ties with the best outcome (two or more means "they come out equal"). */
  tied: AccountId[];
  /**
   * Goal is a first home and the RRSP money comes out through the Home Buyers' Plan: not taxed (up to the
   * HBP limit) but it must be repaid over 15 years.
   */
  hbp: boolean;
  /** Goal is a first home, but the years are longer than an FHSA can stay open (15). */
  fhsaTooLong: boolean;
};

/** Example marginal rate used for both "now" and "later" when the person gave neither (a tie, not a verdict). */
const EXAMPLE_TAX_RATE = 30;

export function compareAccounts(input: CompareInput): CompareResult {
  const goal: Goal = input.goal ?? (input.firstHome ? 'home' : 'retirement');
  const amount = clamp(num(input.amount, 1_000), 0, 1_000_000);
  // No rate given: use the same example rate now and later, so the illustration doesn't pick a winner for them.
  const exampleRates = typeof input.rateNow !== 'number' && typeof input.rateLater !== 'number';
  const rateNow = clamp(num(input.rateNow, num(input.rateLater, EXAMPLE_TAX_RATE)), 0, 60);
  const rateLater = clamp(num(input.rateLater, rateNow), 0, 60);
  const years = clamp(Math.round(num(input.years, goal === 'home' ? 5 : 25)), 0, 60);
  const growth = clamp(num(input.growth, 4), 0, 10);
  const age = typeof input.age === 'number' ? clamp(Math.round(input.age), 0, 120) : null;
  const firstHome = typeof input.firstHome === 'boolean' ? input.firstHome : null;
  const f = Math.pow(1 + growth / 100, years);

  const eligible: Record<AccountId, boolean | null> = {
    tfsa: age == null ? null : age >= ACCOUNTS.tfsa.minAge,
    // Anyone can hold an RRSP until the end of the year they turn 71; new room comes from earned income.
    rrsp: age != null && age > ACCOUNTS.rrsp.closeAge ? false : true,
    fhsa:
      firstHome === false || (age != null && (age < ACCOUNTS.fhsa.minAge || age > ACCOUNTS.fhsa.closeAge))
        ? false
        : firstHome == null || age == null
          ? null
          : true,
  };

  // First home: RRSP money comes out through the Home Buyers' Plan, untaxed up to the HBP limit (repaid later).
  const hbp = goal === 'home' && firstHome !== false && eligible.rrsp !== false;
  const grown = amount * f;
  const hbpPart = hbp ? Math.min(grown, ACCOUNTS.hbp.max) : 0;
  // An FHSA must close by the end of the year of its 15th anniversary: a longer horizon can't be a tax-free home withdrawal.
  const fhsaTooLong = goal === 'home' && years > ACCOUNTS.fhsa.years;

  const outcome: Record<AccountId, number> = {
    tfsa: round2(amount * (1 - rateNow / 100) * f),
    rrsp: round2(hbpPart + (grown - hbpPart) * (1 - rateLater / 100)),
    // Qualifying withdrawal for a first home: deducted going in, tax-free coming out.
    fhsa: round2(amount * f),
  };

  const fits: AccountId[] = goal === 'home' ? ['fhsa', 'tfsa', 'rrsp'] : goal === 'retirement' ? ['rrsp', 'tfsa'] : ['tfsa', 'rrsp'];
  const ranking = fits
    .filter((a) => eligible[a] !== false && !(a === 'fhsa' && fhsaTooLong))
    .sort((a, b) => outcome[b] - outcome[a] || fits.indexOf(a) - fits.indexOf(b));
  const best = ranking[0] ?? 'tfsa';
  // An HBP withdrawal matches the FHSA today but has to be paid back, so it never ties with the FHSA.
  const tied = ranking.filter((a) => Math.abs(outcome[a] - outcome[best]) < 0.5 && !(best === 'fhsa' && a === 'rrsp' && hbp));
  return {
    goal,
    amount,
    rateNow,
    rateLater,
    years,
    growth,
    age,
    firstHome,
    exampleRates,
    eligible,
    outcome,
    refund: round2((amount * rateNow) / 100),
    ranking,
    best,
    tied,
    hbp,
    fhsaTooLong,
  };
}
