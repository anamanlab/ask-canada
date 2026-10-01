/**
 * Pleasure Craft Operator Card (PCOC) and youth horsepower rules: pure, isomorphic. Output: build.ts.
 * Competency of Operators of Pleasure Craft Regulations, as explained on tc.canada.ca (see data.ts).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './constants';

export const HP = { under12: 10, under16: 40, kwUnder12: 7.5, kwUnder16: 30, supervisorAge: 16, pwcAge: 16, visitorDays: 45 };

export type BoatInput = {
  age?: number | null;
  horsepower?: number | null;
  pwc?: boolean | null;
  supervised?: boolean | null;
  north?: boolean | null;
  visitor?: boolean | null;
  /** The person lost (or damaged) their card and wants to replace it. */
  lost?: boolean | null;
  lang?: Lang;
};

type BoatVerdict =
  | 'ok' // may operate (with proof of competency when there is a motor)
  | 'no-motor' // no proof of competency needed
  | 'north' // NU/NWT: no proof of competency or youth limits
  | 'supervised' // may operate only with direct supervision
  | 'pwc-under16'; // can't operate a PWC, even supervised

export type BoatOutput = {
  version: 1;
  lang: Lang;
  age: number;
  horsepower: number;
  pwc: boolean;
  supervised: boolean;
  north: boolean;
  visitor: boolean;
  /** Replacing a lost or damaged card: the widget leads with the course provider lookup. */
  lost: boolean;
  /** True when the person gave an age (otherwise the widget starts at an adult). */
  ageKnown: boolean;
  links: { card: string; faq: string; providers: string; lookup: string };
  phone: string;
  sources: ToolSource[];
};

/** Horsepower limit for someone operating without direct supervision (Infinity = no youth limit). */
export const soloLimit = (age: number) => (age < 12 ? HP.under12 : age < 16 ? HP.under16 : Infinity);

export function boatVerdict({ age, horsepower, pwc, supervised, north }: { age: number; horsepower: number; pwc: boolean; supervised: boolean; north: boolean }): BoatVerdict {
  if (north) return 'north';
  if (pwc && age < HP.pwcAge) return 'pwc-under16';
  if (!pwc && horsepower <= 0) return 'no-motor';
  if (!pwc && horsepower > soloLimit(age) && !supervised) return 'supervised';
  return 'ok';
}
