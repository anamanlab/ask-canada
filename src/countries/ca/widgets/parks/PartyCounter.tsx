'use client';
/**
 * One row of the group: a label with its age range and a − / + stepper.
 *
 * Why not the shared `NumberInput`: it is a typed text field (label above, keyboard entry, locale parsing)
 * with no stepper buttons, and three of them would turn a three-tap choice of 0 to 12 people into three
 * keyboard fields. This row keeps the compact list style and 44px buttons. The count is plain text, not a
 * live region: the calculator's one debounced `LiveRegion` announces the group and the verdict after a tap,
 * so nothing is announced twice.
 */
import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Badge, IconButton } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { MAX_PARTY } from './pass-model';

export function PartyCounter({ label, hint, value, onChange, free }: { label: string; hint: string; value: number; onChange: (v: number) => void; free?: boolean }) {
  const t = useMessages(messages);
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2" role="group" aria-labelledby={id}>
      <div className="min-w-0">
        <p id={id} className="m-0 text-[15px] font-semibold leading-snug text-ink">
          {label}
          {free ? (
            <Badge tone="ok" className="ms-2 align-[1px]">
              {t('pass.free')}
            </Badge>
          ) : null}
        </p>
        <p className="m-0 text-[13px] leading-snug text-ink-3">
          {/* Isolated so "18 to 64" keeps its order in right-to-left layouts. */}
          <bdi>{hint}</bdi>
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <IconButton label={t('pass.less', { who: label })} icon={Minus} onClick={() => onChange(value - 1)} disabled={value <= 0} />
        <span className="w-7 text-center font-serif text-[22px] tabular-nums text-ink">{value}</span>
        <IconButton label={t('pass.more', { who: label })} icon={Plus} onClick={() => onChange(value + 1)} disabled={value >= MAX_PARTY} />
      </div>
    </div>
  );
}
