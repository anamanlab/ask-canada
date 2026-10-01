/**
 * Lab fixtures for the `weather` widget: every state and edge case, built through the live code path
 * (one file per tool). The Fixture API passes no locale, so the list holds both builds: first every fixture
 * with English data, then every answer again with French data (forecast text, alert names, periods and place
 * names, as a real French answer gets), named "Français · …" for `?lang=fr`. Nothing here reads the page.
 */
import type { Fixture } from '@/lib/widgets/types';
import type { Lang } from './data';
import { air } from './lab-air';
import { alerts } from './lab-alerts';
import { forecasts } from './lab-forecast';

const build = (lang: Lang) => [...forecasts(lang), ...alerts(lang), ...air(lang)];

/** The French set: answers only (skeletons and errors carry no data), minus the fixtures that are always French. */
const french = build('fr')
  .filter((f) => f.part.state === 'output-available' && !/ in French/.test(f.name))
  .map((f) => ({ ...f, name: `Français · ${f.name}` }));

const fixtures: Fixture[] = [...build('en'), ...french];
export default fixtures;
