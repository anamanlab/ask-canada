'use client';
/**
 * Park finder (tool `parksFinder`): the card's loading and error states. The finder itself (map, filters,
 * list and park card) loads on demand, so its base map stays out of the cards that have none.
 */
import { Suspense, lazy } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import { URLS } from './urls';
import { useLang, usePreload } from './hooks';
import type { FinderInput } from './live';
import messages from './messages';
import type { FinderOutput } from './model';
import { FinderSkeleton } from './FinderSkeleton';

const load = () => import('./Finder');
const Finder = lazy(load);

/** Follows the answer's language (see AnswerLang), including while loading and on error. */
export function ParksFinder(props: WidgetProps<FinderInput, FinderOutput>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <ParksFinderBody {...props} />
    </AnswerLang>
  );
}

function ParksFinderBody({ part }: WidgetProps<FinderInput, FinderOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  usePreload(load);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.parksSearch[lang], label: t('error.fallback') }} />;
  }
  const skeleton = <FinderSkeleton input={part.input} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <Finder data={part.output} />
    </Suspense>
  );
}
