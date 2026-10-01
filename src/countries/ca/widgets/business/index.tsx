'use client';
/**
 * Renderers for the `business` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 */
import type { Renderers } from '@/lib/widgets/types';
import { BusinessFunding } from './BusinessFunding';
import { BusinessIncorporate } from './BusinessIncorporate';
import { BusinessRegistration } from './BusinessRegistration';
import { BusinessStructure } from './BusinessStructure';
import { BusinessTrade } from './BusinessTrade';

export const renderers: Renderers = {
  businessStructure: BusinessStructure,
  businessIncorporate: BusinessIncorporate,
  businessRegistration: BusinessRegistration,
  businessFunding: BusinessFunding,
  businessTrade: BusinessTrade,
};
export default renderers;
