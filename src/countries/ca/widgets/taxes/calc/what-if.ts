/**
 * The "Try +$1,000" RRSP what-if: what the estimate was before the click, and how it moved after it.
 * The confirmation only holds while every other entry is what it was at the click (`key`): once the province,
 * an income or the tax deducted changes, the difference is no longer the RRSP's and nothing is said.
 *   const tried = startWhatIf(rrsp + 1000, whatIfKey(inputs), { balance, owed });
 *   whatIfDelta(tried, { rrsp, key: whatIfKey(inputs), balance, owed }) // → { kind: 'refund', amount: 297 } | null
 */
import type { ProvinceCode } from '../data';

type Figures = { balance: number | null; owed: number };
export type WhatIf = { rrsp: number; key: string; before: Figures };
export type WhatIfDelta = { kind: 'tax' | 'refund' | 'owe' | 'flip'; amount: number };

/** Every entry except the RRSP amount, as one comparable string. */
export function whatIfKey(i: { province: ProvinceCode; picked: boolean; emp: number | null; other: number | null; fhsa: number | null; deducted: number | null }): string {
  return [i.province, i.picked, i.emp ?? 0, i.other ?? 0, i.fhsa ?? 0, i.deducted ?? ''].join('|');
}

export function startWhatIf(rrsp: number, key: string, before: Figures): WhatIf {
  return { rrsp, key, before };
}

/** How the result moved since the click, or null once anything else has been edited. */
export function whatIfDelta(tried: WhatIf | null, now: Figures & { rrsp: number | null; key: string }): WhatIfDelta | null {
  if (!tried || tried.rrsp !== now.rrsp || tried.key !== now.key) return null;
  const b0 = tried.before.balance;
  if (now.balance == null || b0 == null) return { kind: 'tax', amount: Math.max(0, tried.before.owed - now.owed) };
  if (b0 < 0 && now.balance >= 0) return { kind: 'flip', amount: now.balance };
  return { kind: now.balance >= 0 ? 'refund' : 'owe', amount: Math.abs(now.balance - b0) };
}
