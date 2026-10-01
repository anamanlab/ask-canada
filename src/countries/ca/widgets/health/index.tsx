'use client';
/**
 * Renderers for the `health` widget (Health & safety): { [toolName]: Component }.
 */
import type { Renderers } from '@/lib/widgets/types';
import { DentalChecker } from './DentalChecker';
import { DrugLookup } from './DrugLookup';
import { RecallsWidget } from './RecallsWidget';
import { TravelHealth } from './TravelHealth';

export const renderers: Renderers = {
  healthRecalls: RecallsWidget,
  healthDentalCheck: DentalChecker,
  healthDrugLookup: DrugLookup,
  healthTravel: TravelHealth,
};
export default renderers;
