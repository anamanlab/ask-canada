'use client';
/**
 * Renderers for the `life-events` widget: { [toolName]: Component }.
 * lifeEventsChecklist: multi-department checklist for moving, a new baby, marriage or a name change, losing a
 * job, retiring, or the death of a loved one (see docs/WIDGET_GUIDE.md).
 */
import type { Renderers } from '@/lib/widgets/types';
import { LifeEventsChecklist } from './LifeEventsChecklist';

export const renderers: Renderers = {
  lifeEventsChecklist: LifeEventsChecklist,
};
export default renderers;
