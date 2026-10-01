/**
 * Mortgage stress test: qualifying rate, GDS/TDS, minimum down payment, CMHC premium, highest price that passes.
 * Pure and isomorphic: the tool runs it on the server, the widget re-runs it as people change the numbers.
 */
import { MORTGAGE } from '../data';
import { clamp, num, round2 } from './util';

export type MortgageInput = {
  /** Gross yearly household income, in dollars. */
  income?: number;
  price?: number;
  downPayment?: number;
  /** Contract (negotiated) interest rate, in percent. */
  rate?: number;
  amortization?: 25 | 30;
  /** Yearly property tax, in dollars. */
  propertyTax?: number;
  /** Monthly heating, in dollars. */
  heating?: number;
  /** Monthly condo fees, in dollars. */
  condoFees?: number;
  /** Monthly payments on other debts (car, cards, lines of credit, student loans, support). */
  debts?: number;
  firstTimeBuyer?: boolean;
  newBuild?: boolean;
};

type MortgageMissing = 'rate' | 'propertyTax' | 'heating';
type MortgageReason = 'down' | 'uninsurable' | 'gds' | 'tds';

export type MortgageResult = {
  income: number;
  price: number;
  downPayment: number;
  /** No down payment was given: the minimum is used. */
  downIsMinimum: boolean;
  /** The contract rate, or null when it wasn't given (the test then uses the 5.25% floor, the lowest possible). */
  rate: number | null;
  rateMissing: boolean;
  amortization: 25 | 30;
  amortizationAdjusted: boolean;
  propertyTax: number;
  heating: number;
  condoFees: number;
  debts: number;
  costsMissing: boolean;
  /** Inputs that were left out. Each can only make the result worse, so a pass with any missing is a "maybe". */
  missing: MortgageMissing[];
  firstTimeBuyer: boolean;
  newBuild: boolean;
  minDown: number;
  downOk: boolean;
  /** Down payment as a share of the price, in percent, unrounded: show it with `downShare`. */
  downPct: number;
  insured: boolean;
  /** Insurance isn't available (price at or above the cap) but the down payment is under 20%. */
  uninsurable: boolean;
  premiumRate: number;
  premium: number;
  loan: number;
  qualifyingRate: number;
  bufferApplies: boolean;
  /** Monthly payment at the contract rate (null when the rate wasn't given). */
  payment: number | null;
  qualifyingPayment: number;
  housingMonthly: number;
  gds: number;
  tds: number;
  passGds: boolean;
  passTds: boolean;
  pass: boolean;
  /** Why it fails (null when it passes). */
  reason: MortgageReason | null;
  /**
   * pass  — passes with every input known.
   * maybe — passes, but only because the rate, property tax or heating is missing (a rough check, not a verdict).
   * fail  — fails; missing inputs could only make it worse.
   */
  verdict: 'pass' | 'maybe' | 'fail';
  /** Highest price that passes with the same down payment and costs (null when income is 0). An upper bound when inputs are missing. */
  maxPrice: number | null;
  /** Lowest income that passes for this price (null when down payment rules fail). */
  incomeNeeded: number | null;
  long30Allowed: boolean;
};

/** Canadian fixed-rate mortgages compound semi-annually (Interest Act). */
function monthlyPayment(principal: number, annualRatePct: number, years: number) {
  if (principal <= 0) return 0;
  const n = years * 12;
  const i = Math.pow(1 + annualRatePct / 100 / 2, 1 / 6) - 1;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

export function minDownPayment(price: number) {
  const d = MORTGAGE.down;
  if (price >= d.allPctFrom) return price * d.allPct;
  if (price <= d.firstTier) return price * d.firstPct;
  return d.firstTier * d.firstPct + (price - d.firstTier) * d.secondPct;
}

function premiumRateFor(ltv: number, amortization: number) {
  const band = MORTGAGE.premiums.find((p) => ltv <= p.ltv + 1e-9);
  if (!band) return 0;
  return band.rate + (amortization > 25 ? MORTGAGE.longAmortSurcharge : 0);
}

/** The minimum qualifying rate: the higher of the floor or the contract rate + the buffer. Unknown rate → the floor. */
function qualifyingRateFor(rate: number | null) {
  return rate == null ? MORTGAGE.floor : Math.max(MORTGAGE.floor, rate + MORTGAGE.buffer);
}

function assess(i: {
  income: number;
  price: number;
  down: number;
  rate: number | null;
  amort: 25 | 30;
  propertyTax: number;
  heating: number;
  condoFees: number;
  debts: number;
}) {
  const minDown = minDownPayment(i.price);
  const downOk = i.down + 0.005 >= minDown && i.down <= i.price;
  const base = Math.max(0, i.price - i.down);
  const ltv = i.price > 0 ? base / i.price : 0;
  const needsInsurance = i.down < i.price * MORTGAGE.conventionalDown;
  const insured = needsInsurance && i.price < MORTGAGE.insuredCap;
  const uninsurable = needsInsurance && i.price >= MORTGAGE.insuredCap;
  const premiumRate = insured ? premiumRateFor(ltv, i.amort) : 0;
  const premium = base * premiumRate;
  const loan = base + premium;
  const bufferApplies = i.rate != null && i.rate + MORTGAGE.buffer > MORTGAGE.floor;
  const qualifyingRate = qualifyingRateFor(i.rate);
  const payment = i.rate == null ? null : monthlyPayment(loan, i.rate, i.amort);
  const qualifyingPayment = monthlyPayment(loan, qualifyingRate, i.amort);
  const monthlyIncome = i.income / 12;
  const housingMonthly = qualifyingPayment + i.propertyTax / 12 + i.heating + i.condoFees * MORTGAGE.condoShare;
  const gds = monthlyIncome > 0 ? (housingMonthly / monthlyIncome) * 100 : Infinity;
  const tds = monthlyIncome > 0 ? ((housingMonthly + i.debts) / monthlyIncome) * 100 : Infinity;
  const passGds = gds <= MORTGAGE.gdsMax;
  const passTds = tds <= MORTGAGE.tdsMax;
  return {
    minDown,
    downOk,
    insured,
    uninsurable,
    premiumRate,
    premium,
    loan,
    qualifyingRate,
    bufferApplies,
    payment,
    qualifyingPayment,
    housingMonthly,
    gds,
    tds,
    passGds,
    passTds,
    pass: downOk && !uninsurable && passGds && passTds,
  };
}

/**
 * The down-payment share to display, to one decimal. Rounded once, here; a share under the minimum is rounded
 * down, so a down payment that falls short never reads as if it met the rule (4.96% is "4.9%", not "5%").
 */
export function downShare(r: Pick<MortgageResult, 'downPct' | 'downOk'>) {
  return r.downOk ? Math.round(r.downPct * 10) / 10 : Math.floor(r.downPct * 10 + 1e-9) / 10;
}

export function stressTest(input: MortgageInput): MortgageResult {
  const income = clamp(num(input.income, 0), 0, 10_000_000);
  const price = clamp(num(input.price, 0), 0, 20_000_000);
  const minDown0 = minDownPayment(price);
  const downPayment = clamp(num(input.downPayment, Math.ceil(minDown0)), 0, price || Infinity);
  const rateMissing = typeof input.rate !== 'number' || !Number.isFinite(input.rate);
  const rate = rateMissing ? null : clamp(input.rate as number, 0, 25);
  const firstTimeBuyer = input.firstTimeBuyer ?? false;
  const newBuild = input.newBuild ?? false;
  const insuredLikely = downPayment < price * MORTGAGE.conventionalDown;
  const long30Allowed = !insuredLikely || firstTimeBuyer || newBuild;
  let amortization: 25 | 30 = input.amortization === MORTGAGE.amortLong ? MORTGAGE.amortLong : MORTGAGE.amortDefault;
  let amortizationAdjusted = false;
  if (amortization === MORTGAGE.amortLong && !long30Allowed) {
    amortization = MORTGAGE.amortDefault;
    amortizationAdjusted = true;
  }
  const propertyTax = clamp(num(input.propertyTax, 0), 0, 1_000_000);
  const heating = clamp(num(input.heating, 0), 0, 100_000);
  const condoFees = clamp(num(input.condoFees, 0), 0, 100_000);
  const debts = clamp(num(input.debts, 0), 0, 1_000_000);
  const costs = { propertyTax, heating, condoFees, debts };
  const missing: MortgageMissing[] = [];
  if (rateMissing) missing.push('rate');
  if (propertyTax === 0) missing.push('propertyTax');
  if (heating === 0) missing.push('heating');

  const a = assess({ income, price, down: downPayment, rate, amort: amortization, ...costs });
  const reason: MortgageReason | null = !a.downOk ? 'down' : a.uninsurable ? 'uninsurable' : !a.passGds ? 'gds' : !a.passTds ? 'tds' : null;

  // Highest price that still passes, keeping the same down payment, rate and costs.
  let maxPrice: number | null = null;
  if (income > 0 && downPayment > 0) {
    const passes = (p: number) => {
      const am: 25 | 30 =
        amortization === MORTGAGE.amortLong && (downPayment >= p * MORTGAGE.conventionalDown || firstTimeBuyer || newBuild) ? MORTGAGE.amortLong : MORTGAGE.amortDefault;
      return assess({ income, price: p, down: downPayment, rate, amort: am, ...costs }).pass;
    };
    let lo = downPayment;
    let hi = Math.max(downPayment * 25, 5_000_000);
    if (passes(lo)) {
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        if (passes(mid)) lo = mid;
        else hi = mid;
      }
      maxPrice = Math.floor(lo / 1000) * 1000;
    } else maxPrice = 0;
  }

  // Lowest household income that passes this purchase (GDS and TDS both).
  let incomeNeeded: number | null = null;
  if (a.downOk && !a.uninsurable && price > 0) {
    const byGds = (a.housingMonthly * 12 * 100) / MORTGAGE.gdsMax;
    const byTds = ((a.housingMonthly + debts) * 12 * 100) / MORTGAGE.tdsMax;
    incomeNeeded = Math.ceil(Math.max(byGds, byTds) / 100) * 100;
  }

  return {
    income,
    price,
    downPayment,
    downIsMinimum: typeof input.downPayment !== 'number',
    rate,
    rateMissing,
    amortization,
    amortizationAdjusted,
    propertyTax,
    heating,
    condoFees,
    debts,
    costsMissing: propertyTax === 0 || heating === 0,
    missing,
    firstTimeBuyer,
    newBuild,
    minDown: round2(a.minDown),
    downOk: a.downOk,
    downPct: price > 0 ? (downPayment / price) * 100 : 0,
    insured: a.insured,
    uninsurable: a.uninsurable,
    premiumRate: a.premiumRate,
    premium: round2(a.premium),
    loan: round2(a.loan),
    qualifyingRate: round2(a.qualifyingRate),
    bufferApplies: a.bufferApplies,
    payment: a.payment == null ? null : round2(a.payment),
    qualifyingPayment: round2(a.qualifyingPayment),
    housingMonthly: round2(a.housingMonthly),
    gds: Number.isFinite(a.gds) ? round2(a.gds) : 999,
    tds: Number.isFinite(a.tds) ? round2(a.tds) : 999,
    passGds: a.passGds,
    passTds: a.passTds,
    pass: a.pass,
    reason,
    verdict: a.pass ? (missing.length ? 'maybe' : 'pass') : 'fail',
    maxPrice,
    incomeNeeded,
    long30Allowed,
  };
}
