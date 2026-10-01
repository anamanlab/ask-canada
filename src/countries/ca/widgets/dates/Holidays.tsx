'use client';
/**
 * Statutory holidays by province or territory (renders `datesHolidays`): the states of the tool call. The list itself
 * is its own chunk (./holidays/HolidayList), fetched while the skeleton is on screen.
 */
import { Suspense, lazy } from 'react';
import { useChatActions } from '@/components/chat/actions';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS, isProvince } from './data';
import { PROVINCE_SOURCES } from './sources';
import { HolidaysSkeleton } from './holidays/HolidaysSkeleton';
import { ErrorCard } from './ErrorCard';
import messages from './messages';
import { cap } from './parts';
import type { HolidaysInput, HolidaysOutput } from './types';

const HolidayList = lazy(() => import('./holidays/HolidayList'));

export function Holidays({ part }: WidgetProps<HolidaysInput, HolidaysOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const { send } = useChatActions();
  if (part.state === 'output-error') {
    const lang = locale === 'fr' ? 'fr' : 'en';
    const p = isProvince(part.input?.province) ? part.input.province : null;
    const name = typeof part.input?.holiday === 'string' ? part.input.holiday : '';
    // Ask again the way they asked: one holiday, a province, or all of Canada.
    const again = name
      ? p
        ? t('hol.retry.holiday', { name, placeIn: t(`provIn.${p}`) })
        : t('hol.retry.holidayFederal', { name })
      : p
        ? t('hol.retry.province', { placeIn: t(`provIn.${p}`) })
        : t('hol.retry.federal');
    return (
      <ErrorCard
        title={t('hol.error.title')}
        message={p ? cap(t('hol.error.bodyProvince', { placeOf: t(`provOf.${p}`) })) : t('hol.error.bodyFederal')}
        onRetry={() => send(again)}
        fallback={p ? { href: PROVINCE_SOURCES[p][lang].url, label: t('hol.handoff', { placeOf: t(`provOf.${p}`) }) } : { href: URLS.federalHolidays[lang], label: t('hol.error.fallback') }}
      />
    );
  }
  const skeleton = <HolidaysSkeleton asked={typeof part.input?.holiday === 'string' && part.input.holiday.length > 0} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <HolidayList o={part.output} />
    </Suspense>
  );
}
