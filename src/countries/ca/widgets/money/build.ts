/**
 * Tool outputs for the `money` widget, with their real sources (the tools call these on the server, the lab
 * fixtures call them directly). The shape and the assembly are in ./output; the source tables in ./sources
 * never ship with the widgets, which import ./output only.
 */
import type { CompareInput } from './calc/accounts';
import type { BudgetInput } from './calc/budget';
import type { MortgageInput } from './calc/mortgage';
import type { RespInput } from './calc/resp';
import { bothLangs, budgetOutput, compareOutput, mortgageOutput, respOutput } from './output';
import { NO_RATES, type LiveRates } from './rates';
import { budgetSources, compareSources, mortgageSources, respSources } from './sources';

export const buildResp = (input: RespInput & { lang?: string }, today: string) => respOutput(input, today, bothLangs(respSources));
export const buildCompare = (input: CompareInput & { lang?: string }) => compareOutput(input, bothLangs(compareSources));
export const buildMortgage = (input: MortgageInput & { lang?: string }, rates: LiveRates = NO_RATES) => mortgageOutput(input, rates, bothLangs((l) => mortgageSources(l, rates)));
export const buildBudget = (input: BudgetInput & { lang?: string }) => budgetOutput(input, bothLangs(budgetSources));
