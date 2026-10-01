'use client';
/**
 * Canada as a grid of tiles, one per province and territory, tinted by median wage: the darker the tile, the
 * higher the pay. A tap puts that province in the headline (again: back to Canada). One Tab stop; arrow keys
 * move between tiles.
 */
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import type { Province } from './data';
import messages from './messages';
import { useProvinceName } from './parts';
import type { WageRow } from './types';

/** West to east, north on top: the territories over the provinces, Atlantic Canada tucked in at the right. */
const LAYOUT: (Province | null)[][] = [
  ['YT', 'NT', 'NU', null, null, null, 'NL'],
  ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'PE'],
  [null, null, null, null, null, 'NB', 'NS'],
];
const CELLS = LAYOUT.flatMap((row, y) => row.flatMap((code, x) => (code ? [{ code, x, y }] : [])));
/** Share of pine in the lowest and the highest tile (the rest is the card colour, so both themes keep ink text readable). */
const TINT = { min: 10, max: 50 };

type Row = WageRow & { code: Province };

export function ProvinceTiles({ rows, selected, onSelect, show, className }: { rows: Row[]; selected?: Province; onSelect: (p: Province | undefined) => void; show: (n: number | null) => string; className?: string }) {
  const t = useMessages(messages);
  const provinceName = useProvinceName();
  const medians = rows.flatMap((r) => (r.median == null ? [] : [r.median]));
  const min = Math.min(...medians);
  const max = Math.max(...medians);
  const medianOf = (code: Province) => rows.find((r) => r.code === code)?.median ?? null;
  const chosen = CELLS.findIndex((c) => c.code === selected);
  // The tile the keyboard is on; it follows the selection until an arrow key moves it.
  const [focus, setFocus] = useState<number | null>(null);
  const { itemProps } = useRovingFocus({ count: CELLS.length, index: focus ?? chosen, onMove: setFocus, orientation: 'both', isDisabled: (i) => medianOf(CELLS[i].code) == null });

  return (
    <div className={className}>
      <div role="group" aria-label={t('wages.mapLabel')} className="grid grid-cols-7 gap-1">
        {CELLS.map((c, i) => {
          const median = medianOf(c.code);
          const on = selected === c.code;
          const share = median == null ? 0 : TINT.min + (max > min ? (median - min) / (max - min) : 0.5) * (TINT.max - TINT.min);
          return (
            <button
              key={c.code}
              {...itemProps(i)}
              type="button"
              disabled={median == null}
              aria-pressed={on}
              aria-label={t('wages.tileAria', { province: provinceName(c.code), median: show(median) })}
              title={provinceName(c.code)}
              onClick={() => {
                setFocus(i);
                onSelect(on ? undefined : c.code);
              }}
              style={{ gridColumnStart: c.x + 1, gridRowStart: c.y + 1, backgroundColor: on || median == null ? undefined : `color-mix(in oklab, var(--pine) ${share.toFixed(1)}%, var(--card))` }}
              className={cn(
                'grid min-h-11 place-items-center rounded-[10px] text-[12px] font-semibold tracking-[.02em] transition-[transform,box-shadow,background-color] duration-200 ease-spring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none',
                on ? 'z-10 scale-110 bg-ink text-card shadow-md' : median == null ? 'border border-dashed border-hair-2 text-ink-3' : 'text-ink hover:scale-105 hover:shadow-sm',
              )}
            >
              {c.code}
            </button>
          );
        })}
      </div>
      <p className="m-0 mt-2 flex items-center gap-2 text-[12px] text-ink-2">
        <span className="flex gap-0.5" aria-hidden>
          {[TINT.min, (TINT.min + TINT.max) / 2, TINT.max].map((share) => (
            <i key={share} className="block size-2.5 rounded-[3px]" style={{ backgroundColor: `color-mix(in oklab, var(--pine) ${share}%, var(--card))` }} />
          ))}
        </span>
        {t('wages.mapHint')}
      </p>
    </div>
  );
}
