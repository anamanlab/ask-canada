import type { FixtureModule, WidgetCatalogModule } from '@/lib/widgets/types';

export const fixtures: Record<string, () => Promise<FixtureModule>> = {
  holidays: () => import('./holidays/fixtures'),
};

export const catalogs: Record<string, () => Promise<WidgetCatalogModule>> = {
  holidays: () => import('./holidays/messages'),
};
