/**
 * Travelling with cannabis or a pet: pure, isomorphic rules and the public-possession equivalents. Output: build.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './constants';

export type TravelTopic = 'cannabis' | 'pets';
export type Trip = 'domestic-flight' | 'domestic-road' | 'leaving-canada' | 'entering-canada';
export const TRIPS: Trip[] = ['domestic-flight', 'domestic-road', 'entering-canada', 'leaving-canada'];
export type Pet = 'dog' | 'cat' | 'other';

/** Public possession limit: 30 g of dried cannabis or its equivalent. Grams of each form equal to 1 g dried. */
export const CANNABIS_LIMIT_G = 30;
const EQUIV = {
  dried: 1,
  fresh: 5,
  solids: 15,
  nonSolids: 70,
  concentrates: 0.25,
  beverages: 570,
  seeds: 1,
} as const;
export type CannabisForm = keyof typeof EQUIV;
export const FORMS = Object.keys(EQUIV) as CannabisForm[];

/** Dried-cannabis equivalent (g) of an amount of one form (grams; seeds: count). */
export const driedEquivalent = (form: CannabisForm, amount: number) => Math.max(0, amount) / EQUIV[form];
/** The most of one form an adult may carry in public. */
export const maxOf = (form: CannabisForm) => CANNABIS_LIMIT_G * EQUIV[form];

export type TravelInput = { topic?: TravelTopic | null; trip?: Trip | null; pet?: Pet | null; petAgeMonths?: number | null; lang?: Lang };

export type TravelOutput = {
  version: 1;
  lang: Lang;
  topic: TravelTopic;
  trip: Trip;
  pet: Pet;
  petAgeMonths: number | null;
  links: Record<'border' | 'penalties' | 'travel' | 'flights' | 'limit' | 'provinces' | 'pets' | 'petsImport' | 'petsUs' | 'petsTravel', string>;
  sources: ToolSource[];
  /** Cannabis: the sources for each kind of trip, so the footer follows the trip picked on the device. */
  sourcesByTrip?: Record<Trip, ToolSource[]>;
};

/** Cannabis verdict for a trip: crossing the border in either direction is a criminal offence. */
export const cannabisAllowed = (trip: Trip) => trip === 'domestic-flight' || trip === 'domestic-road';

/** Dogs and cats 3 months or older need a rabies vaccination certificate to enter Canada. */
export const needsRabiesCert = (pet: Pet, ageMonths: number | null) => pet !== 'other' && (ageMonths == null || ageMonths >= 3);
