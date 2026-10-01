'use client';
/**
 * Conditions (tool `parksConditions`): live wildfire status and Parks Canada bulletins for one park, or fire
 * danger across every national park. This file is the card's loading and error states; the two views load
 * on demand (only the national one carries the map).
 */
import { Suspense, lazy } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import { URLS } from './urls';
import { useLang, usePreload } from './hooks';
import type { ConditionsInput } from './live';
import messages from './messages';
import type { ConditionsOutput } from './model';
import { ConditionsSkeleton } from './ConditionsSkeleton';

const loadPark = () => import('./ParkConditions');
const loadNational = () => import('./NationalConditions');
const loadNothing = () => Promise.resolve();
const ParkConditions = lazy(loadPark);
const NationalConditions = lazy(loadNational);

/** Follows the answer's language (see AnswerLang), including while loading and on error. */
export function ParksConditions(props: WidgetProps<ConditionsInput, ConditionsOutput>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <ParksConditionsBody {...props} />
    </AnswerLang>
  );
}

function ParksConditionsBody({ part }: WidgetProps<ConditionsInput, ConditionsOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  // Which card this will be is known once a park is named, or the input is complete without one.
  usePreload(part.input?.park ? loadPark : part.state === 'input-streaming' ? loadNothing : loadNational);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.bulletins[lang], label: t('error.fallbackBulletins') }} />;
  }
  const skeleton = <ConditionsSkeleton input={part.input} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  const data = part.output;
  return (
    <Suspense fallback={skeleton}>{data.scope === 'park' && data.park ? <ParkConditions data={data} park={data.park} /> : <NationalConditions data={data} />}</Suspense>
  );
}
