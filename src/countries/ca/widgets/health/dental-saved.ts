'use client';
/**
 * The dental checker's answers on this device ('health:dental'): never an identifier, only yes/no answers and
 * an income estimate. The checker writes them; a later checker or summary card opens where the person left off.
 */
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import { checkDental, REQS, type DentalInput } from './dental';
import messages from './messages';

const KEY = 'health:dental';
/** The top of the income slider. */
export const INCOME_MAX = 120_000;

export type Saved = Pick<DentalInput, 'noPrivateCoverage' | 'filedTaxes' | 'residentForTax' | 'familyIncome'>;
/** Changes made in this checker: a value, or null for "cleared". */
export type Edits = { [K in keyof Saved]?: Saved[K] | null };

/** "2026-2027" that never breaks at its hyphen (word joiners on both sides keep the hyphen glyph of the font). */
export const nbPeriod = (p: string) => p.replace(/-/g, '⁠-⁠');

/**
 * The answers to show: what the person said in this question wins, then what they answered before on this
 * device; edits made in the checker win over both.
 */
export function answersOf(input: DentalInput, saved: Saved | undefined, edits: Edits = {}): Saved {
  const a = {
    noPrivateCoverage: input.noPrivateCoverage ?? saved?.noPrivateCoverage,
    filedTaxes: input.filedTaxes ?? saved?.filedTaxes,
    residentForTax: input.residentForTax ?? saved?.residentForTax,
    familyIncome: input.familyIncome ?? saved?.familyIncome,
    ...edits,
  };
  return {
    noPrivateCoverage: a.noPrivateCoverage ?? undefined,
    filedTaxes: a.filedTaxes ?? undefined,
    residentForTax: a.residentForTax ?? undefined,
    familyIncome: a.familyIncome ?? undefined,
  };
}

export const hasAnswers = (a: Saved) => a.noPrivateCoverage != null || a.filedTaxes != null || a.residentForTax != null || a.familyIncome != null;

/** The saved answers, with a store function that also writes a readable detail for the privacy card. */
export function useSavedAnswers() {
  const t = useMessages(messages);
  const [saved, save, clear] = useDeviceItem<Saved>(KEY, { label: t('dental.saved.label'), kind: 'plan' });
  const store = (next: Saved) => {
    if (!hasAnswers(next)) return clear();
    const r = checkDental(next);
    save(next, { detail: t('dental.saved.detail', { verdict: t(`dental.verdict.${r.verdict}`), done: REQS.length - r.unknown.length, total: REQS.length }) });
  };
  return [saved, store] as const;
}
