'use client';
/**
 * Service Canada office finder: renders the `officesFinder` tool part in every state. With a place it shows
 * the Finder (map, nearest offices, live status); without one it reuses the area searched earlier on this
 * page, or asks for a postal code.
 */
import { useState } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AskShell } from './AskShell';
import { URLS } from './data';
import { Finder, type FinderData } from './Finder';
import { FinderSkeleton } from './FinderSkeleton';
import messages from './messages';
import { nearest, passportFocus } from './search';
import { useEarlierSearch } from './searchStore';
import { useLang } from './shared';
import type { Need } from './types';

type Input = { location?: string; need?: Need; passportOffice?: boolean; lang?: 'en' | 'fr' };
type Output = FinderData;

export function OfficesFinder({ part }: WidgetProps<Input, Output>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.finder[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <FinderSkeleton title={t('title')} label={t('loading')} />;
  }
  const out = part.output;
  if (out.status === 'no-location') return <Reuse ask={out} asked={Boolean(part.input?.passportOffice)} />;
  if (out.status !== 'ok' || !out.origin) return <AskShell data={out} />;
  return <Finder data={out} origin={out.origin} />;
}

/**
 * "Near me" with no place in the message: if an area was searched earlier on this page, show its offices for
 * the new need straight away (the earlier answer already carries every filter's candidates), with one tap to
 * change the place. Otherwise ask for a postal code. Only searches made before this card was computed count: a
 * search made after it (often from this very card) never turns the form into results.
 */
function Reuse({ ask, asked }: { ask: Output; asked: boolean }) {
  const recent = useEarlierSearch(ask.asOf);
  const [change, setChange] = useState(false);
  if (change || !recent?.origin || !nearest(recent.offices, ask.need).length) return <AskShell data={ask} />;
  const data: Output = { ...recent, need: ask.need, focusId: passportFocus(recent.offices, ask.need, asked)?.id, sources: ask.sources };
  return <Finder key={recent.asOf} data={data} origin={recent.origin} onChangePlace={() => setChange(true)} />;
}

