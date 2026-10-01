/**
 * The shape of each money tool's output, and the one place it is put together. An output carries the inputs
 * it was built from, so the widget can recompute instantly on the device as people change them, and its
 * sources in both official languages (`sourcesByLang`), so the widget follows the page language.
 * Client-safe: the sources are passed in. ./build adds the real ones (server, lab); ./preview stands in for
 * them while the answer is on its way.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { compareAccounts, type CompareInput, type CompareResult } from './calc/accounts';
import { planBudget, type BudgetInput, type BudgetResult } from './calc/budget';
import { stressTest, type MortgageInput, type MortgageResult } from './calc/mortgage';
import { planResp, type RespInput, type RespResult } from './calc/resp';
import { ACCOUNTS, RESP, type Lang } from './data';
import { budgetLinks, compareLinks, L, mortgageLinks, respLinks } from './links';
import type { LiveRates } from './rates';

export type SourcesByLang = Record<Lang, ToolSource[]>;

/** Both official languages, so the widget can follow the page language. */
export const bothLangs = (of: (lang: Lang) => ToolSource[]): SourcesByLang => ({ en: of('en'), fr: of('fr') });

type Output<Kind extends string, Input, Result, Urls> = {
  kind: Kind;
  /** Language of the answer; `urls` and `sources` are in it. */
  lang: Lang;
  input: Input;
  result: Result;
  urls: Urls;
  sources: ToolSource[];
  sourcesByLang: SourcesByLang;
};

/** Splits the answer language off the tool input. */
function split<T extends { lang?: string }>(input: T): { lang: Lang; rest: Omit<T, 'lang'> } {
  const { lang, ...rest } = input;
  return { lang: L(lang), rest };
}

export type RespOutput = Output<'resp', RespInput, RespResult, ReturnType<typeof respLinks>> & {
  year: number;
  /** The date the projection was computed for (`YYYY-MM-DD`); absent in answers saved before it was returned. */
  today?: string;
  clbThresholds: typeof RESP.clbThresholds;
};

export function respOutput(input: RespInput & { lang?: string }, today: string, sourcesByLang: SourcesByLang): RespOutput {
  const { lang, rest } = split(input);
  const year = Number(today.slice(0, 4));
  return { kind: 'resp', lang, year, today, input: rest, result: planResp(rest, year), clbThresholds: RESP.clbThresholds, urls: respLinks(lang), sources: sourcesByLang[lang], sourcesByLang };
}

export type CompareOutput = Output<'compare', CompareInput, CompareResult, ReturnType<typeof compareLinks>> & { facts: typeof ACCOUNTS };

export function compareOutput(input: CompareInput & { lang?: string }, sourcesByLang: SourcesByLang): CompareOutput {
  const { lang, rest } = split(input);
  return { kind: 'compare', lang, input: rest, result: compareAccounts(rest), facts: ACCOUNTS, urls: compareLinks(lang), sources: sourcesByLang[lang], sourcesByLang };
}

export type MortgageOutput = Output<'mortgage', MortgageInput, MortgageResult, ReturnType<typeof mortgageLinks>> & { rates: LiveRates };

export function mortgageOutput(input: MortgageInput & { lang?: string }, rates: LiveRates, sourcesByLang: SourcesByLang): MortgageOutput {
  const { lang, rest } = split(input);
  return { kind: 'mortgage', lang, input: rest, result: stressTest(rest), rates, urls: mortgageLinks(lang), sources: sourcesByLang[lang], sourcesByLang };
}

export type BudgetOutput = Output<'budget', BudgetInput, BudgetResult, ReturnType<typeof budgetLinks>>;

export function budgetOutput(input: BudgetInput & { lang?: string }, sourcesByLang: SourcesByLang): BudgetOutput {
  const { lang, rest } = split(input);
  return { kind: 'budget', lang, input: rest, result: planBudget(rest), urls: budgetLinks(lang), sources: sourcesByLang[lang], sourcesByLang };
}
