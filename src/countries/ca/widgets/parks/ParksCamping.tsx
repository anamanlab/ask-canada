'use client';
/**
 * Camping (tool `parksCamping`): the card's loading and error states. The reservation helper loads on demand.
 */
import { Suspense, lazy } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import { URLS } from './urls';
import { useLang, usePreload } from './hooks';
import type { CampingInput } from './live';
import messages from './messages';
import type { CampingOutput } from './model';
import { CampingSkeleton } from './CampingSkeleton';

const load = () => import('./CampingPlanner');
const CampingPlanner = lazy(load);

/** Follows the answer's language (see AnswerLang), including while loading and on error. */
export function ParksCamping(props: WidgetProps<CampingInput, CampingOutput>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <ParksCampingBody {...props} />
    </AnswerLang>
  );
}

function ParksCampingBody({ part }: WidgetProps<CampingInput, CampingOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  usePreload(load);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.reserve[lang], label: t('error.fallbackReserve') }} />;
  }
  const skeleton = <CampingSkeleton input={part.input} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <CampingPlanner data={part.output} />
    </Suspense>
  );
}
