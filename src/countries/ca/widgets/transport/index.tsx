'use client';
/**
 * Renderers for the `transport` widget (Transport & vehicles): { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 * Each one is its own chunk and follows the language of the answer it belongs to (see answer-lang.tsx).
 */
import type { Renderers } from '@/lib/widgets/types';
import { inAnswerLang } from './answer-lang';

export const renderers: Renderers = {
  transportRecalls: inAnswerLang('RecallLookup', () => import('./RecallLookup').then((m) => m.RecallLookup)),
  transportDrone: inAnswerLang('DronePath', () => import('./DronePath').then((m) => m.DronePath)),
  transportBoating: inAnswerLang('BoatCheck', () => import('./BoatCheck').then((m) => m.BoatCheck)),
  transportTravelRules: inAnswerLang('TravelRules', () => import('./TravelRules').then((m) => m.TravelRules)),
  transportEvIncentive: inAnswerLang('EvIncentive', () => import('./EvIncentive').then((m) => m.EvIncentive)),
};
export default renderers;
