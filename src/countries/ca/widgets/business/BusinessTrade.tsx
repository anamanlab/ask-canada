'use client';
/**
 * businessTrade: importing and exporting commercial goods (CBSA).
 *   Import (TradeImport): duty + GST estimate with the LIVE Bank of Canada rate, then the setup steps.
 *   Export (TradeExport): "Do I need an export declaration?" checker, reporting deadlines by mode, next steps.
 * What the person typed in either mode lives here, so switching modes and back never loses it.
 */
import { useState } from 'react';
import { Ship } from 'lucide-react';
import { Badge, Segmented, WidgetShell } from '@/components/ui';
import type { WidgetProps } from '@/lib/widgets/types';
import type { Direction, TradeInput, TradeOutput } from './build';
import { pickSources, type UrlKey } from './data';
import { BizError, useBiz } from './shared';
import { BizSkeleton } from './skeletons';
import { TradeExport, type ExportDraft } from './TradeExport';
import { TradeImport, type ImportDraft } from './TradeImport';

/** What the shell footer cites first, per mode (explicit, never guessed from URLs). */
const EXPORT_FIRST: UrlKey[] = ['exportGuide', 'tcs'];
const IMPORT_FIRST: UrlKey[] = ['importGuide', 'importSetup', 'importDuties', 'fx'];
/**
 * U.S. counter-tariffs only matter for goods made in the U.S., and only the person's own words say so
 * (`import.origin`): the invoice currency never does, since suppliers everywhere invoice in U.S. dollars.
 */
const TARIFFS_US: UrlKey[] = ['counterTariffs', 'tariffResponses'];
const TARIFFS_OTHER: UrlKey[] = ['tariffResponses', 'counterTariffs'];

export function BusinessTrade({ part }: WidgetProps<TradeInput, TradeOutput>) {
  const { t, href } = useBiz();
  if (part.state === 'output-error') return <BizError href={href('importGuide')} />;
  if (part.state !== 'output-available' || !part.output) {
    return <BizSkeleton kind={part.input?.direction === 'export' ? 'export' : 'import'} input={part.input} title={t('trade.title')} subtitle={t('trade.subtitle')} icon={Ship} tone="glacier" />;
  }
  return <Trade data={part.output} />;
}

function Trade({ data }: { data: TradeOutput }) {
  const { t, lang, href } = useBiz();
  const [dir, setDir] = useState<Direction>(data.direction);
  const [imp, setImp] = useState<ImportDraft>({ amount: data.import.amount, currency: data.import.currency, duty: data.import.dutyRate });
  const [exp, setExp] = useState<ExportDraft>(data.export);
  const live = Boolean(data.import.fx);
  const us = data.import.origin === 'us';
  const handoff =
    dir === 'import'
      ? { href: href('importGuide'), label: t('trade.handoff.import'), note: t('trade.handoff.importNote') }
      : { href: href('exportGuide'), label: t('trade.handoff.export'), note: t('trade.handoff.exportNote') };
  // The sources for the current mode lead (the shell footer shows the first one).
  const first = dir === 'import' ? [...IMPORT_FIRST, ...(us ? TARIFFS_US : TARIFFS_OTHER)] : EXPORT_FIRST;

  return (
    <WidgetShell
      icon={Ship}
      tone="glacier"
      title={t('trade.title')}
      subtitle={t('trade.subtitle')}
      badge={live && dir === 'import' ? <Badge tone="live">{t('trade.badge.live')}</Badge> : undefined}
      sources={pickSources(data, lang, first)}
      handoff={handoff}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <Segmented
          label={t('trade.mode')}
          value={dir}
          onChange={setDir}
          options={[
            { value: 'import', label: t('trade.mode.import'), sub: t('trade.mode.import.sub') },
            { value: 'export', label: t('trade.mode.export'), sub: t('trade.mode.export.sub') },
          ]}
        />
      </div>
      {dir === 'import' ? <TradeImport data={data} draft={imp} onChange={setImp} us={us} /> : <TradeExport draft={exp} onChange={setExp} />}
    </WidgetShell>
  );
}
