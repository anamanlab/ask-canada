import type { FixtureModule, WidgetCatalogModule } from '@/lib/widgets/types';

export const fixtures: Record<string, () => Promise<FixtureModule>> = {
  holidays: () => import('./holidays/fixtures'),
  economia: () => import('./economia/fixtures'),
  ibge: () => import('./ibge/fixtures'),
  servico: () => import('./servico/fixtures'),
  camara: () => import('./camara/fixtures'),
};

export const catalogs: Record<string, () => Promise<WidgetCatalogModule>> = {
  holidays: () => import('./holidays/messages'),
  economia: () => import('./economia/messages'),
  ibge: () => import('./ibge/messages'),
  servico: () => import('./servico/messages'),
  camara: () => import('./camara/messages'),
};
