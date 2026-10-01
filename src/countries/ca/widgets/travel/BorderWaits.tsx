'use client';
/**
 * Live CBSA border wait times, entering Canada by land (tool `travelBorderWaits`). This file handles the
 * tool's states; the board itself (WaitsBoard) loads as its own chunk.
 */
import { Suspense } from 'react';
import { Timer } from 'lucide-react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import { lazyPart } from './lazy';
import messages from './messages';
import { useUiLang } from './shared';
import { WaitsSkeleton } from './skeletons';
import type { BorderWaitsOutput } from './types';

const board = lazyPart(() => import('./WaitsBoard').then((m) => m.WaitsBoard));

export function BorderWaits({ part }: WidgetProps<Record<string, unknown>, BorderWaitsOutput>) {
  const t = useMessages(messages);
  const L = useUiLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.waits')} fallback={{ href: URLS.waits[L], label: t('error.waitsLink') }} />;
  }
  const skeleton = <WaitsSkeleton icon={Timer} title={t('waits.title')} subtitle={t('waits.subtitle')} label={t('waits.loading')} />;
  if (part.state !== 'output-available' || !part.output) {
    // The board's chunk loads while the tool is still working.
    board.preload();
    return skeleton;
  }
  return (
    <Suspense fallback={skeleton}>
      <board.Part out={part.output} />
    </Suspense>
  );
}
