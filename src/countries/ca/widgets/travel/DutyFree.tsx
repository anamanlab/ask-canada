'use client';
/**
 * Personal exemption calculator for coming home to Canada (tool `travelDutyFree`). This file handles the
 * tool's states; the calculator (DutyCalculator) loads as its own chunk.
 */
import { Suspense } from 'react';
import { ShoppingBag } from 'lucide-react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import { lazyPart } from './lazy';
import messages from './messages';
import { useUiLang } from './shared';
import { DutySkeleton } from './skeletons';
import type { DutyFreeOutput } from './types';

const calculator = lazyPart(() => import('./DutyCalculator').then((m) => m.DutyCalculator));

export function DutyFree({ part }: WidgetProps<Record<string, unknown>, DutyFreeOutput>) {
  const t = useMessages(messages);
  const L = useUiLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.duty')} fallback={{ href: URLS.declare[L], label: t('error.dutyLink') }} />;
  }
  const skeleton = <DutySkeleton icon={ShoppingBag} title={t('duty.title')} subtitle={t('duty.subtitle')} label={t('duty.loading')} />;
  if (part.state !== 'output-available' || !part.output) {
    // The calculator's chunk loads while the tool is still working.
    calculator.preload();
    return skeleton;
  }
  return (
    <Suspense fallback={skeleton}>
      <calculator.Part initial={part.output} />
    </Suspense>
  );
}
