'use client';
/**
 * Renderers for the `benefits` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   benefitsFinder    questionnaire -> matched federal programs with estimated amounts
 *   benefitsEstimator CCB / EI / OAS / CPP estimators with sliders and animated numbers
 */
import type { Renderers } from '@/lib/widgets/types';
import { BenefitsEstimator } from './BenefitsEstimator';
import { BenefitsFinder } from './BenefitsFinder';

export const renderers: Renderers = {
  benefitsFinder: BenefitsFinder,
  benefitsEstimator: BenefitsEstimator,
};
export default renderers;
