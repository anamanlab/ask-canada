'use client';
/**
 * Renderers for the `money` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   moneyRespPlanner · moneyAccountCompare · moneyMortgageStressTest · moneyBudgetPlanner
 * Each renderer is its own chunk with its own calculator (./calc/*): a budget answer doesn't download the
 * mortgage math (the chat shows its loading skeleton while a renderer arrives).
 */
import { lazy } from 'react';
import type { Renderers } from '@/lib/widgets/types';

export const renderers: Renderers = {
  moneyRespPlanner: lazy(() => import('./RespPlanner').then((m) => ({ default: m.RespPlanner }))),
  moneyAccountCompare: lazy(() => import('./AccountCompare').then((m) => ({ default: m.AccountCompare }))),
  moneyMortgageStressTest: lazy(() => import('./MortgageStressTest').then((m) => ({ default: m.MortgageStressTest }))),
  moneyBudgetPlanner: lazy(() => import('./BudgetPlanner').then((m) => ({ default: m.BudgetPlanner }))),
};
export default renderers;
