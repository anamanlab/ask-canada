'use client';
/**
 * Canadian Dental Care Plan (renders `healthDentalCheck`). Two views, each loaded only when it is the one
 * asked for: the full checker (./DentalCheck) and, for follow-up questions, a compact summary card
 * (./DentalSummary). Both read the answers kept on this device ('health:dental').
 */
import { lazy, Suspense } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import type { DentalInput, DentalOutput } from './dental';
import { DentalSkeleton, SummarySkeleton } from './DentalSkeletons';
import { inLang, OFFICIAL } from './facts';
import messages from './messages';
import { useLang } from './shared';

const DentalCheck = lazy(() => import('./DentalCheck'));
const DentalSummary = lazy(() => import('./DentalSummary'));

export function DentalChecker({ part }: WidgetProps<DentalInput, DentalOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('dental.error.title')} message={t('dental.error.body')} fallback={{ href: OFFICIAL.dentalQualify[lang], label: t('dental.error.fallback') }} />;
  }
  const summary = (part.output?.view ?? part.input?.view) === 'summary';
  const skeleton = summary ? <SummarySkeleton /> : <DentalSkeleton />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  const data = inLang(part.output, lang);
  return <Suspense fallback={skeleton}>{summary ? <DentalSummary data={data} /> : <DentalCheck data={data} />}</Suspense>;
}
