'use client';
/**
 * Renderers for the `taxes` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 */
import type { Renderers } from '@/lib/widgets/types';
import { FreeFiling } from './FreeFiling';
import { RefundStatus } from './RefundStatus';
import { SavingsRoom } from './SavingsRoom';
import { TaxDeadlines } from './TaxDeadlines';
import { TaxEstimator } from './TaxEstimator';

export const renderers: Renderers = {
  taxesDeadlines: TaxDeadlines,
  taxesEstimator: TaxEstimator,
  taxesSavingsRoom: SavingsRoom,
  taxesFreeFiling: FreeFiling,
  taxesRefundStatus: RefundStatus,
};
export default renderers;
