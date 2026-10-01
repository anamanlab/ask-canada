'use client';
/**
 * Renderers for the `citizenship` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   citizenshipPresence       days in Canada toward 1,095, earliest date to apply, trips
 *   citizenshipPracticeTest   practice test from Discover Canada
 *   citizenshipSteps          steps, fees (live) and processing time (live)
 *   citizenshipCeremony       the oath (practice mode), what to bring, what comes after
 */
import type { Renderers } from '@/lib/widgets/types';
import { CitizenshipPresence } from './PresenceCalculator';
import { CitizenshipPracticeTest } from './PracticeTest';
import { CitizenshipSteps } from './CitizenshipSteps';
import { CitizenshipCeremony } from './CeremonyGuide';

export const renderers: Renderers = {
  citizenshipPresence: CitizenshipPresence,
  citizenshipPracticeTest: CitizenshipPracticeTest,
  citizenshipSteps: CitizenshipSteps,
  citizenshipCeremony: CitizenshipCeremony,
};
export default renderers;
