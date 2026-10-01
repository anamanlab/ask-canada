'use client';
/**
 * Renderers for the `offices` widget: { [toolName]: Component }.
 *   officesFinder      — map + nearest Service Canada / passport offices with live open-now status
 *   officesAppointment — book a passport/biometrics appointment or request a call back
 */
import type { Renderers } from '@/lib/widgets/types';
import { OfficesAppointment } from './OfficesAppointment';
import { OfficesFinder } from './OfficesFinder';

export const renderers: Renderers = {
  officesFinder: OfficesFinder,
  officesAppointment: OfficesAppointment,
};
export default renderers;
