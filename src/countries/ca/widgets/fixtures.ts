/**
 * Lab fixture registry for the Canada pack (lazy). PRE-STUBBED: widget agents never edit this file.
 */
import type { FixtureModule, WidgetCatalogModule } from '@/lib/widgets/types';

export const fixtures: Record<string, () => Promise<FixtureModule>> = {
  'benefits': () => import('./benefits/fixtures'),
  'passport': () => import('./passport/fixtures'),
  'immigration': () => import('./immigration/fixtures'),
  'citizenship': () => import('./citizenship/fixtures'),
  'jobs': () => import('./jobs/fixtures'),
  'taxes': () => import('./taxes/fixtures'),
  'weather': () => import('./weather/fixtures'),
  'travel': () => import('./travel/fixtures'),
  'offices': () => import('./offices/fixtures'),
  'life-events': () => import('./life-events/fixtures'),
  'dates': () => import('./dates/fixtures'),
  'health': () => import('./health/fixtures'),
  'parks': () => import('./parks/fixtures'),
  'business': () => import('./business/fixtures'),
  'documents': () => import('./documents/fixtures'),
  'contact': () => import('./contact/fixtures'),
  'civic': () => import('./civic/fixtures'),
  'money': () => import('./money/fixtures'),
  'veterans-defence': () => import('./veterans-defence/fixtures'),
  'transport': () => import('./transport/fixtures'),
};

/** Each widget's catalog (lazy), so the lab can title a page with the widget's own name (`title` key). */
export const catalogs: Record<string, () => Promise<WidgetCatalogModule>> = {
  'benefits': () => import('./benefits/messages'),
  'passport': () => import('./passport/messages'),
  'immigration': () => import('./immigration/messages'),
  'citizenship': () => import('./citizenship/messages'),
  'jobs': () => import('./jobs/messages'),
  'taxes': () => import('./taxes/messages'),
  'weather': () => import('./weather/messages'),
  'travel': () => import('./travel/messages'),
  'offices': () => import('./offices/messages'),
  'life-events': () => import('./life-events/messages'),
  'dates': () => import('./dates/messages'),
  'health': () => import('./health/messages'),
  'parks': () => import('./parks/messages'),
  'business': () => import('./business/messages'),
  'documents': () => import('./documents/messages'),
  'contact': () => import('./contact/messages'),
  'civic': () => import('./civic/messages'),
  'money': () => import('./money/messages'),
  'veterans-defence': () => import('./veterans-defence/messages'),
  'transport': () => import('./transport/messages'),
};
