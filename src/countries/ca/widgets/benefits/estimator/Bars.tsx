'use client';
/**
 * Bars by start age. With a mouse, or where each bar is wide enough to tap (44px), the bars are also the control:
 * each is a radio that picks that start age (arrow keys move the choice, direction-aware), mirroring the slider
 * above. On touch screens with narrow bars (11 on a phone) they are a picture only and the slider is the control. The sr-only sentence sums
 * up the whole chart either way.
 */
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { useElementSize, useMediaQuery, useRovingFocus } from '@/lib/hooks';

type Item = { key: number; value: number; label: string };

const GAP = 5;
const MIN_TARGET = 44;

export function Bars({ items, selected, onPick, label, sr, itemLabel }: { items: Item[]; selected: number; onPick: (k: number) => void; label: string; sr: string; itemLabel: (it: Item) => string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const roving = useRovingFocus({ count: items.length, index: Math.max(0, items.findIndex((it) => it.key === selected)), onMove: (i) => onPick(items[i].key), orientation: 'both', loop: false });
  const labelId = useId();
  const [ref, { w }] = useElementSize<HTMLDivElement>();
  // Before the first measurement (and on the server) the bars are a picture; they become radios once each is a
  // full touch target, or when the pointer is a mouse (which doesn't need one).
  const mouse = useMediaQuery('(hover: hover) and (pointer: fine)');
  const pickable = mouse || (w - GAP * (items.length - 1)) / items.length >= MIN_TARGET;
  return (
    <figure className="m-0">
      <figcaption id={labelId} className="mb-2 text-[13px] font-medium text-ink-2">
        <bdi>{label}</bdi>
      </figcaption>
      <div ref={ref} role={pickable ? 'radiogroup' : undefined} aria-labelledby={pickable ? labelId : undefined} aria-hidden={pickable ? undefined : true} className="flex h-[132px] items-end" style={{ gap: GAP }}>
        {items.map((it, i) => {
          const on = it.key === selected;
          const height = Math.max(4, (it.value / max) * 100);
          const bar = (
            <>
              {/* The bar is full height and slides up from below its clipped track: only `transform` animates. */}
              <span className="block min-h-0 w-full flex-1 overflow-hidden rounded-b-[3px]">
                <span
                  className={cn(
                    'block size-full rounded-t-[7px] transition-[translate,background-color] duration-500 ease-spring motion-reduce:transition-none',
                    on ? 'bg-pine' : 'bg-hair-2 group-hover:bg-ink-3/40',
                  )}
                  style={{ translate: `0 ${100 - height}%` }}
                />
              </span>
              <span className={cn('font-mono text-[11px] tabular-nums', on ? 'font-semibold text-ink' : 'text-ink-3')}>{it.label}</span>
            </>
          );
          const box = 'flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5';
          return pickable ? (
            <button
              key={it.key}
              {...roving.itemProps(i)}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={itemLabel(it)}
              onClick={() => onPick(it.key)}
              className={cn(box, 'group rounded-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink')}
            >
              {bar}
            </button>
          ) : (
            <span key={it.key} className={box}>
              {bar}
            </span>
          );
        })}
      </div>
      <p className="sr-only">{sr}</p>
    </figure>
  );
}
