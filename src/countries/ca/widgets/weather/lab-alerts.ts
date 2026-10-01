/** Lab fixtures for `weatherAlerts`: a place, a province and all of Canada, in every state. */
import type { Fixture } from '@/lib/widgets/types';
import { placeAlertsOutput, placeById, wideAlertsOutput } from './assemble';
import { CANADA_TODAY, RAIN_NS, WIND_NS, alertFeature } from './fixture-alerts';
import { NOW } from './fixture-city';
import { OTTAWA } from './fixture-data';
import type { Lang } from './data';
import { part } from './lab-kit';

export const alerts = (lang: Lang): Fixture[] => [
  { name: 'Alerts · running (skeleton)', toolName: 'weatherAlerts', part: part('weatherAlerts', 'input-available', undefined, { location: 'Halifax' }) },
  {
    name: 'Alerts · Halifax: orange wind + yellow rainfall warnings',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', placeAlertsOutput({ place: placeById('ns-19', lang), features: [RAIN_NS, WIND_NS], raw: null, lang, now: NOW })),
  },
  {
    name: 'Alerts · Ottawa: none in effect',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', placeAlertsOutput({ place: placeById('on-118', lang), features: [], raw: OTTAWA, lang, now: NOW })),
  },
  {
    name: 'Alerts · Trois-Rivières in French (live fog advisory text)',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', placeAlertsOutput({ place: placeById('qc-130', 'fr'), features: [CANADA_TODAY[9]], raw: null, lang: 'fr', now: NOW })),
  },
  {
    name: 'Alerts · across Canada (red, orange, yellow, statement; filter by province)',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', wideAlertsOutput({ features: CANADA_TODAY, lang, now: NOW })),
    note: 'Fog and storm surge alerts are today’s real ones; the tornado and wind warnings are examples for the full colour range. Ended alerts are dropped. The fog advisory spans Quebec (10 areas, until 11 a.m.) and Ontario (1 area, until 10 a.m.): the Ontario filter shows 1 area, Ontario, until 10 a.m.',
  },
  {
    name: 'Alerts · one province (Nova Scotia)',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', wideAlertsOutput({ features: CANADA_TODAY, province: 'ns', lang, now: NOW })),
  },
  {
    name: 'Alerts · none anywhere in Canada',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', wideAlertsOutput({ features: [alertFeature({ code: 'FTA', type: 'advisory', colour: 'yellow', name: ['frost advisory'], short: ['Frost (advisory)'], area: ['Cochrane'], prov: 'AB', status: 'ended' })], lang, now: NOW })),
  },
  {
    name: 'Alerts · no alerts, one special weather statement (not counted as an alert)',
    toolName: 'weatherAlerts',
    part: part('weatherAlerts', 'output-available', wideAlertsOutput({ features: CANADA_TODAY.slice(-1), lang, now: NOW })),
  },
  { name: 'Alerts · feed unavailable', toolName: 'weatherAlerts', part: part('weatherAlerts', 'output-available', wideAlertsOutput({ features: null, lang, now: NOW })) },
  { name: 'Alerts · error', toolName: 'weatherAlerts', part: part('weatherAlerts', 'output-error') },
];
