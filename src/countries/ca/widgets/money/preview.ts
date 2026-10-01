/**
 * What each money widget will look like for the input it was called with, before the tool has answered:
 * the same output, built on the device with the same calculators. The loading state lays it out unseen and
 * takes its height from it, so nothing moves when the answer arrives, in any language and for any input
 * (see MoneySkeleton in ./shared).
 *
 * The input may still be streaming, so it is read as unknown: only fields of the right type are kept.
 * Stand-ins for what only the server knows: the sources (the cited pages, with the first one's real title,
 * which is what the footer shows) and the Bank of Canada rates (three values; a failed fetch is the rare case).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Goal } from './calc/accounts';
import { BUDGET_CATEGORIES, type BudgetInput } from './calc/budget';
import type { IncomeTier } from './calc/resp';
import { CHECKED } from './data';
import { CITED, LEAD_TITLES, URLS, type MoneyTool } from './links';
import { bothLangs, budgetOutput, compareOutput, mortgageOutput, respOutput } from './output';
import type { LiveRates } from './rates';

const fields = (x: unknown): Record<string, unknown> => (typeof x === 'object' && x !== null ? { ...x } : {});
const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);
const flag = (x: unknown) => (typeof x === 'boolean' ? x : undefined);
const oneOf = <T>(x: unknown, all: readonly T[]) => all.find((v) => v === x);

const TIERS: readonly IncomeTier[] = ['low', 'middle', 'high'];
const GOALS: readonly Goal[] = ['home', 'retirement', 'anything'];
const AMORTIZATIONS = [25, 30] as const;

const cited = (tool: MoneyTool) =>
  bothLangs((lang) => CITED[tool].map((key, i): ToolSource => ({ title: i === 0 ? LEAD_TITLES[tool][lang] : '', url: URLS[key][lang], checked: CHECKED })));

const RATES: LiveRates = { live: true, posted5y: { value: 0, date: CHECKED }, policy: { value: 0, date: CHECKED }, prime: { value: 0, date: CHECKED } };

export function respPreview(input: unknown, today: string) {
  const i = fields(input);
  return respOutput(
    { childAge: num(i.childAge), annual: num(i.annual), familyIncome: num(i.familyIncome), incomeTier: oneOf(i.incomeTier, TIERS), children: num(i.children), growth: num(i.growth) },
    today,
    cited('resp'),
  );
}

export function comparePreview(input: unknown) {
  const i = fields(input);
  return compareOutput(
    { goal: oneOf(i.goal, GOALS), firstHome: flag(i.firstHome), age: num(i.age), amount: num(i.amount), rateNow: num(i.rateNow), rateLater: num(i.rateLater), years: num(i.years) },
    cited('compare'),
  );
}

export function mortgagePreview(input: unknown) {
  const i = fields(input);
  return mortgageOutput(
    {
      income: num(i.income),
      price: num(i.price),
      downPayment: num(i.downPayment),
      rate: num(i.rate),
      amortization: oneOf(i.amortization, AMORTIZATIONS),
      propertyTax: num(i.propertyTax),
      heating: num(i.heating),
      condoFees: num(i.condoFees),
      debts: num(i.debts),
      firstTimeBuyer: flag(i.firstTimeBuyer),
      newBuild: flag(i.newBuild),
    },
    RATES,
    cited('mortgage'),
  );
}

export function budgetPreview(input: unknown) {
  const i = fields(input);
  const lines = fields(i.expenses);
  const expenses: BudgetInput['expenses'] = {};
  for (const c of BUDGET_CATEGORIES) expenses[c] = num(lines[c]);
  return budgetOutput({ income: num(i.income), expenses, savings: num(i.savings), emergencySaved: num(i.emergencySaved) }, cited('budget'));
}
