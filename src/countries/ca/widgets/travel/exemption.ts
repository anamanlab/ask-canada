/**
 * Personal exemption when returning to Canada (CBSA "I Declare", see data.ts). Pure and isomorphic: the
 * tool computes the first answer, the widget recomputes as the person moves the controls.
 */
import { EXEMPTION } from './data';
import type { AbsenceTier, ExemptionInput, ExemptionResult } from './types';

export const TIERS: AbsenceTier[] = ['under24', 'h24', 'h48', 'd7'];

/** Length of absence → tier. Hours are counted from the time you left (CBSA's own examples). */
export function tierFromHours(hours: number): AbsenceTier {
  if (!Number.isFinite(hours) || hours < 24) return 'under24';
  if (hours < 48) return 'h24';
  return hours >= 7 * 24 ? 'd7' : 'h48';
}

export function computeExemption(input: ExemptionInput): ExemptionResult {
  const spent = Math.max(0, Math.round((Number.isFinite(input.spent) ? input.spent : 0) * 100) / 100);
  const allowance = EXEMPTION[input.tier];
  const alcoholTobaccoIncluded = input.tier === 'h48' || input.tier === 'd7';
  const canShipLater = input.tier === 'd7';
  let outcome: ExemptionResult['outcome'];
  let dutiable: number;
  if (input.tier === 'under24') {
    outcome = spent > 0 ? 'none' : 'free';
    dutiable = spent;
  } else if (spent <= allowance) {
    outcome = 'free';
    dutiable = 0;
  } else if (input.tier === 'h24') {
    // Over CAN$200 on a 24-hour trip: the exemption can't be claimed at all.
    outcome = 'cliff';
    dutiable = spent;
  } else {
    outcome = 'over';
    dutiable = Math.round((spent - allowance) * 100) / 100;
  }
  return { ...input, spent, allowance, dutiable, outcome, alcoholTobaccoIncluded, canShipLater };
}
