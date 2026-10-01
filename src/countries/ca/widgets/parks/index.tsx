'use client';
/**
 * Renderers for the `parks` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   parksFinder → ParksFinder · parksConditions → ParksConditions · parksPasses → ParksPasses · parksCamping → ParksCamping
 * Each renderer is the card's loading and error states; the card itself loads on demand (see ParksFinder.tsx).
 */
import type { Renderers } from '@/lib/widgets/types';
import { ParksCamping } from './ParksCamping';
import { ParksConditions } from './ParksConditions';
import { ParksFinder } from './ParksFinder';
import { ParksPasses } from './ParksPasses';

export const renderers: Renderers = {
  parksFinder: ParksFinder,
  parksConditions: ParksConditions,
  parksPasses: ParksPasses,
  parksCamping: ParksCamping,
};
export default renderers;
