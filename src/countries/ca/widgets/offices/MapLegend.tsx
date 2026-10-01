'use client';
/** The map's legend: one mark per office kind on the map (by pin shape), then "your area". Visual only. */
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { KIND_SHAPE, LEGEND_CLS, type PinShape } from './shared';
import type { OfficeKind } from './types';

/** Legend order and wording for each pin shape. */
const LEGEND: { shape: PinShape; key: string }[] = [
  { shape: 'square', key: 'legend.passport' },
  { shape: 'circle', key: 'legend.scc' },
  { shape: 'ring', key: 'legend.outreach' },
];

export function MapLegend({ kinds, you }: { kinds: OfficeKind[]; you: string }) {
  const t = useMessages(messages);
  return (
    <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] text-ink-2" aria-hidden>
      {LEGEND.filter(({ shape }) => kinds.some((k) => KIND_SHAPE[k] === shape)).map(({ shape, key }) => (
        <li key={shape} className="inline-flex items-center gap-1.5">
          <span className={cn('size-2.5', LEGEND_CLS[shape])} />
          {t(key)}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border-2 border-card bg-ink shadow-[0_0_0_1px_var(--hair-2)]" />
        {you}
      </li>
    </ul>
  );
}
