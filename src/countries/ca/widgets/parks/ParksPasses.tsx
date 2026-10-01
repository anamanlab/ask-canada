'use client';
/**
 * Passes (tool `parksPasses`): the card's loading and error states. The calculator loads on demand.
 */
import { Suspense, lazy } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import { URLS } from './urls';
import { useLang, usePreload } from './hooks';
import type { PassesInput } from './live';
import messages from './messages';
import type { PassesOutput } from './pass-model';
import { PassesSkeleton } from './PassesSkeleton';

const load = () => import('./PassCalculator');
const PassCalculator = lazy(load);

/** Follows the answer's language (see AnswerLang), including while loading and on error. */
export function ParksPasses(props: WidgetProps<PassesInput, PassesOutput>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <ParksPassesBody {...props} />
    </AnswerLang>
  );
}

function ParksPassesBody({ part }: WidgetProps<PassesInput, PassesOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  usePreload(load);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.admission[lang], label: t('error.fallbackPasses') }} />;
  }
  const skeleton = <PassesSkeleton />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <PassCalculator data={part.output} />
    </Suspense>
  );
}
