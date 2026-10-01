'use client';
/**
 * civicFindMp renderer: postal code → riding outline + the MP holding the seat now (live, House of Commons),
 * with contact actions (MpCard); or the postal code form (AskCard: ask / invalid / not found / lookup down).
 */
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AskCard } from './AskCard';
import { URLS, type Lang } from './data';
import messages from './messages';
import { MpCard } from './MpCard';
import { langOf } from './select';
import { FindMpSkeleton } from './skeletons/mp';
import type { FindMpOutput } from './types';

type FindMpInput = { postalCode?: string; lang?: Lang };

export function CivicFindMp({ part, locale }: WidgetProps<FindMpInput, FindMpOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('mp.error.title')} message={t('mp.error.body')} fallback={{ href: URLS.membersSearch[langOf(locale)], label: t('mp.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <FindMpSkeleton withPostal={!!part.input?.postalCode} />;
  return part.output.status === 'ok' && part.output.ridings.length ? <MpCard data={part.output} /> : <AskCard data={part.output} />;
}
