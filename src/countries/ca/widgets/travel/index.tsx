'use client';
/**
 * Renderers for the `travel` widget (travelling outside Canada and coming home). See docs/WIDGET_GUIDE.md.
 */
import type { Renderers } from '@/lib/widgets/types';
import { BorderWaits } from './BorderWaits';
import { DutyFree } from './DutyFree';
import { EmergencyHelp } from './EmergencyHelp';
import { TravelAdvisory } from './TravelAdvisory';

export const renderers: Renderers = {
  travelAdvisory: TravelAdvisory,
  travelDutyFree: DutyFree,
  travelBorderWaits: BorderWaits,
  travelEmergencyHelp: EmergencyHelp,
};
export default renderers;
