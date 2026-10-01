'use client';
/**
 * Renderers for the `passport` widget: { [toolName]: Component }.
 * Reference implementation of the widget contract (see docs/WIDGET_GUIDE.md).
 */
import type { Renderers } from '@/lib/widgets/types';
import { PassportPlanner } from './PassportPlanner';

export const renderers: Renderers = {
  passportPlanner: PassportPlanner,
};
export default renderers;
