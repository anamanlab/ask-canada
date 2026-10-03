import type { WidgetEntry } from '@/lib/widgets/types';

/** Widgets in Menu/Lab order. Every tool in `tools/<id>.ts` must be routed here by its `<id>` prefix. */
export const widgets: WidgetEntry[] = [
  { id: 'holidays', prefix: 'holidays', load: () => import('./holidays') },
  { id: 'economia', prefix: 'economia', load: () => import('./economia') },
  { id: 'ibge', prefix: 'ibge', load: () => import('./ibge') },
  { id: 'servico', prefix: 'servico', load: () => import('./servico') },
  { id: 'camara', prefix: 'camara', load: () => import('./camara') },
  { id: 'cnes', prefix: 'cnes', load: () => import('./cnes') },
  { id: 'anvisa', prefix: 'anvisa', load: () => import('./anvisa') },
];
