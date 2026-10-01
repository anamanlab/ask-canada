'use client';
/** "When does your passport expire?": already expired, the next 12 months, or later (pick a year, then a month). */
import { useId, useState } from 'react';
import { Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addMonths } from '@/lib/dates/business-days';
import { useRovingFocus } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { Fit, focusOnMount, isolate, nb } from './shared';

type Range = 'past' | 'soon' | 'later';
type Cell = { key: string; label: string; onClick: () => void; on?: boolean };
const CELL =
  'min-h-11 w-full rounded-field border px-2 text-[14px] font-medium tabular-nums shadow-sm transition hover:-translate-y-px hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0';
type Slot = { kind: 'month'; ym: string } | { kind: 'year'; year: number; from: string } | { kind: 'back' };

/**
 * What the grid offers for a range: the 12 months before this one, the 12 from this one, or (later) nine years
 * to choose from, then that year's months from 12 months out, plus a way back to the years.
 */
function cellsFor(range: Range, year: number | null, today: string): Slot[] {
  /** The month `offset` months from this one, as YYYY-MM. */
  const ym = (offset: number) => addMonths(`${today.slice(0, 7)}-01`, offset).slice(0, 7);
  const months = (first: number): Slot[] => Array.from({ length: 12 }, (_, i) => ({ kind: 'month', ym: ym(first + i) }));
  if (range === 'past') return months(-12);
  if (range === 'soon') return months(0);
  const from = ym(12);
  if (year == null) return Array.from({ length: 9 }, (_, i) => ({ kind: 'year', year: Number(from.slice(0, 4)) + i, from }));
  const inYear = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`).filter((v) => v >= from);
  return [...inYear.map((v): Slot => ({ kind: 'month', ym: v })), { kind: 'back' }];
}

export function ExpiryPicker({
  today,
  current,
  onPick,
  onKeep,
  autoFocus,
}: {
  today: string;
  current?: string;
  onPick: (ym: string) => void;
  onKeep: () => void;
  autoFocus?: boolean;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const headId = useId();
  const [range, setRange] = useState<Range>(() => (current && current < today.slice(0, 7) ? 'past' : current && current >= addMonths(today, 12).slice(0, 7) ? 'later' : 'soon'));
  const [year, setYear] = useState<number | null>(null);
  const month = (v: string): Cell => ({ key: v, label: fmt.date(`${v}-15`, { month: 'short', year: 'numeric' }), onClick: () => onPick(v), on: v === current });
  const slots = cellsFor(range, year, today);
  // The months (or years) are one single-choice group; "All years" is a plain button after it.
  const cells = slots.flatMap((c): Cell[] =>
    c.kind === 'month'
      ? [month(c.ym)]
      : c.kind === 'year'
        ? [{ key: String(c.year), label: String(c.year), onClick: () => setYear(c.year), on: !!current && current >= c.from && current.startsWith(String(c.year)) }]
        : [],
  );
  // One Tab stop for the whole grid: the chosen cell (else the first), then wherever the arrow keys went.
  // Arrows only move focus; a month is chosen with Space, Enter or a tap, because choosing closes the picker.
  const scope = `${range}:${year ?? ''}`;
  const [moved, setMoved] = useState<{ scope: string; i: number } | null>(null);
  const roving = useRovingFocus({
    count: cells.length,
    index: moved?.scope === scope ? moved.i : cells.findIndex((c) => c.on),
    onMove: (i) => setMoved({ scope, i }),
    orientation: 'both',
  });
  return (
    <div className="px-5 pt-6 sm:px-6">
      {/* Wide: the question, with "Keep March 2027" held at the end edge however long the sentence runs. Narrow:
          the button sits under the question, its text on the same start edge as the heading and the months. */}
      <div className="grid items-start gap-x-4 gap-y-1 @xl:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          {/* Opened by the person ("Change expiry month", "Pick expiry month"): the control they used is gone, so focus moves to the question. */}
          <p id={headId} ref={autoFocus ? focusOnMount : undefined} tabIndex={-1} className="m-0 text-balance font-serif text-[22px] leading-tight tracking-[-.02em] text-ink outline-none">
            {isolate(t('picker.title'))}
          </p>
          <p className="m-0 mt-1 text-[14px] text-ink-3">{isolate(t('picker.sub'))}</p>
        </div>
        {current ? (
          <button
            type="button"
            onClick={onKeep}
            className="-ms-3 min-h-11 justify-self-start rounded-chip px-3 text-[13.5px] @xl:-me-3 @xl:ms-0 @xl:justify-self-end font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink"
          >
            {t('timeline.keep', { date: nb(fmt.date(current.length === 7 ? `${current}-15` : current, { month: 'short', year: 'numeric' })) })}
          </button>
        ) : null}
      </div>
      <Segmented
        className="mt-4"
        label={t('picker.range')}
        value={range}
        onChange={(r) => {
          setRange(r);
          setYear(null);
        }}
        // Phones get the short labels, so each pill stays on one line ("Already expired" wraps at 390px).
        options={[
          { value: 'past', label: <Fit short={t('picker.pastShort')} full={t('picker.past')} /> },
          { value: 'soon', label: <Fit short={t('picker.soonShort')} full={t('picker.soon')} /> },
          { value: 'later', label: t('picker.later') },
        ]}
      />
      {range === 'later' && year == null ? <p className="m-0 mt-3 text-[14px] text-ink-2">{isolate(t('picker.years'))}</p> : null}
      <div className={cn('mt-3 grid grid-cols-3 gap-2', range === 'later' && year == null ? '@xl:grid-cols-9' : '@xl:grid-cols-6')}>
        {/* `contents`: the radios are the grid's own cells, and "All years" sits in the same grid after them. */}
        <div role="radiogroup" aria-labelledby={headId} className="contents">
          {cells.map((c, i) => (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={!!c.on}
              onClick={c.onClick}
              {...roving.itemProps(i)}
              className={cn(CELL, c.on ? 'border-pine bg-pine-wash text-ink' : 'border-hair bg-card text-ink hover:border-hair-2')}
            >
              {c.label}
            </button>
          ))}
        </div>
        {slots.some((c) => c.kind === 'back') ? (
          <button type="button" onClick={() => setYear(null)} className={cn(CELL, 'border-dashed border-hair-2 bg-transparent text-ink-2 shadow-none')}>
            {t('picker.backToYears')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
