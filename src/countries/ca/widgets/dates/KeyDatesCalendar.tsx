'use client';
/**
 * Key dates calendar (renders `datesCalendar`): the states of the tool call. The calendar itself is its own chunk
 * (./calendar/Calendar), fetched while the skeleton is on screen, so a chat that only shows the holidays list (or
 * another widget) never downloads it.
 */
import { Suspense, lazy } from 'react';
import { useChatActions } from '@/components/chat/actions';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { CalendarSkeleton } from './calendar/CalendarSkeleton';
import { URLS } from './data';
import { ErrorCard } from './ErrorCard';
import messages from './messages';
import type { CalendarInput, CalendarOutput } from './types';

const Calendar = lazy(() => import('./calendar/Calendar'));

export function KeyDates({ part }: WidgetProps<CalendarInput, CalendarOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const { send } = useChatActions();
  if (part.state === 'output-error') {
    const focus = part.input?.focus;
    return (
      <ErrorCard
        title={t('error.title')}
        message={t('error.body')}
        onRetry={() => send(t(focus === 'taxes' ? 'retry.taxes' : focus === 'payments' ? 'retry.payments' : 'retry.all'))}
        fallback={{ href: URLS.calendar[locale === 'fr' ? 'fr' : 'en'], label: t('error.fallback') }}
      />
    );
  }
  const skeleton = <CalendarSkeleton focus={part.input?.focus} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <Calendar o={part.output} />
    </Suspense>
  );
}
