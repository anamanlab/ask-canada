'use client';
/**
 * Live travel advisory for one destination (tool `travelAdvisory`): the official risk level as a meter,
 * regional advisories, entry requirements, emergency help (numbers, offices) and a before-you-go
 * checklist saved on this device, with the Registration of Canadians Abroad handoff.
 * This file handles the tool's states; the card (AdvisoryCard) and the no-advisory states (AdvisoryStart)
 * load as their own chunks.
 */
import { Suspense } from 'react';
import { Plane } from 'lucide-react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import { lazyPart } from './lazy';
import messages from './messages';
import { useUiLang } from './shared';
import { AdvisorySkeleton } from './skeletons';
import type { AdvisoryFocus, AdvisoryOutput, Lang } from './types';

type Input = { destination?: string; focus?: AdvisoryFocus; lang?: Lang };

const card = lazyPart(() => import('./AdvisoryCard').then((m) => m.AdvisoryCard));
const start = lazyPart(() => import('./AdvisoryStart').then((m) => m.AdvisoryStart));

export function TravelAdvisory({ part }: WidgetProps<Input, AdvisoryOutput>) {
  const t = useMessages(messages);
  const L = useUiLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.advisory')} fallback={{ href: URLS.advisories[L], label: t('error.advisoryLink') }} />;
  }
  // Only once the input is complete: while it streams, "Mex" would read as a destination.
  const dest = part.state === 'input-available' && typeof part.input?.destination === 'string' && part.input.destination.length < 40 ? part.input.destination.trim() : '';
  const skeleton = <AdvisorySkeleton icon={Plane} title={t('advisory.title')} subtitle={dest ? t('advisory.checking', { place: dest }) : t('advisory.loadingSub')} label={t('advisory.loading')} />;
  if (part.state !== 'output-available' || !part.output) {
    // The card's chunk loads while the tool is still working.
    card.preload();
    return skeleton;
  }
  const out = part.output;
  return <Suspense fallback={skeleton}>{out.kind === 'advisory' ? <card.Part out={out} /> : <start.Part out={out} />}</Suspense>;
}
