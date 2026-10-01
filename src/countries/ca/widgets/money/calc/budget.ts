/**
 * Monthly budget: what is left, shares of pay, and the 3-to-6-month emergency fund target.
 * Pure and isomorphic: the tool runs it on the server, the widget re-runs it as people change the numbers.
 */
import { BUDGET } from '../data';
import { clamp, num, round2 } from './util';

export const BUDGET_CATEGORIES = ['housing', 'utilities', 'food', 'transport', 'childcare', 'debt', 'insurance', 'phone', 'personal', 'other'] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export type BudgetInput = {
  /** Monthly take-home pay (after tax and deductions), in dollars. */
  income?: number;
  expenses?: Partial<Record<BudgetCategory, number>>;
  /** Monthly amount already going to savings. */
  savings?: number;
  /** Money already set aside for emergencies. */
  emergencySaved?: number;
};

export type BudgetResult = {
  income: number;
  expenses: Record<BudgetCategory, number>;
  savings: number;
  emergencySaved: number;
  spend: number;
  left: number;
  /** Share of income, by category (0–100). */
  shares: Record<BudgetCategory, number>;
  savingsRate: number;
  emergency: { low: number; high: number; monthsCovered: number; monthsToLow: number | null };
  top: BudgetCategory | null;
  empty: boolean;
};

export function planBudget(input: BudgetInput): BudgetResult {
  const income = clamp(num(input.income, 0), 0, 10_000_000);
  const expenses = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, clamp(num(input.expenses?.[c], 0), 0, 10_000_000)])) as Record<BudgetCategory, number>;
  const savings = clamp(num(input.savings, 0), 0, 10_000_000);
  const emergencySaved = clamp(num(input.emergencySaved, 0), 0, 100_000_000);
  const spend = BUDGET_CATEGORIES.reduce((s, c) => s + expenses[c], 0);
  const left = income - spend - savings;
  const shares = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, income > 0 ? round2((expenses[c] / income) * 100) : 0])) as Record<BudgetCategory, number>;
  const [lowM, highM] = BUDGET.emergencyMonths;
  const low = spend * lowM;
  const high = spend * highM;
  // Money that can go to the emergency fund each month: what's saved plus any surplus.
  const monthly = savings + Math.max(0, left);
  const gap = Math.max(0, low - emergencySaved);
  const top = spend > 0 ? BUDGET_CATEGORIES.reduce((a, b) => (expenses[b] > expenses[a] ? b : a)) : null;
  return {
    income,
    expenses,
    savings,
    emergencySaved,
    spend: round2(spend),
    left: round2(left),
    shares,
    savingsRate: income > 0 ? round2((savings / income) * 100) : 0,
    emergency: {
      low: round2(low),
      high: round2(high),
      monthsCovered: spend > 0 ? round2(emergencySaved / spend) : 0,
      monthsToLow: gap === 0 ? 0 : monthly > 0 ? Math.ceil(gap / monthly) : null,
    },
    top,
    empty: income === 0 && spend === 0,
  };
}
