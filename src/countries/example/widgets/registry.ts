import type { WidgetEntry } from '@/lib/widgets/types';

export const widgets: WidgetEntry[] = [{ id: 'holidays', prefix: 'holidays', load: () => import('./holidays') }];
