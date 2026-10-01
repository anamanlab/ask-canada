'use client';
/**
 * Renderers for the `veterans-defence` widget (Veterans & Canadian Armed Forces). See docs/WIDGET_GUIDE.md.
 *   veteransDefenceCareers      → CareerMatcher (CAF career quiz, live forces.ca careers)
 *   veteransDefenceBenefits     → BenefitsNavigator (Veterans Affairs Canada programs)
 *   veteransDefenceMentalHealth → MentalHealthSupports (24/7 lines, peer support, care)
 */
import type { Renderers } from '@/lib/widgets/types';
import { BenefitsNavigator } from './BenefitsNavigator';
import { CareerMatcher } from './CareerMatcher';
import { MentalHealthSupports } from './MentalHealthSupports';

export const renderers: Renderers = {
  veteransDefenceCareers: CareerMatcher,
  veteransDefenceBenefits: BenefitsNavigator,
  veteransDefenceMentalHealth: MentalHealthSupports,
};
export default renderers;
