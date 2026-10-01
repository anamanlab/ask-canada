'use client';
/**
 * Renderers for the `contact` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 */
import type { Renderers } from '@/lib/widgets/types';
import { ContactDirectory } from './ContactDirectory';
import { ContactUrgent } from './ContactUrgent';

export const renderers: Renderers = {
  contactDirectory: ContactDirectory,
  contactUrgent: ContactUrgent,
};
export default renderers;
