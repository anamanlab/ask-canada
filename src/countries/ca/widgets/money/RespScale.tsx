'use client';
/**
 * The scale under a planner slider: what the two ends are, and optionally one mark on the way (the yearly
 * amount that collects the full grant). Decorative: the slider itself announces its value.
 */
import { Check } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/** Half of the slider thumb (24px in core's `.ac-range`): the thumb's centre travels between the two insets. */
const INSET = 12;

export function RespScale({ min, max, mark }: { min: string; max: string; mark?: { at: number; label: string; reached: boolean } }) {
  return (
    <div className="relative -mt-1.5 flex justify-between text-[11.5px] leading-4 text-ink-3 tabular-nums" aria-hidden>
      <bdi>{min}</bdi>
      {mark ? (
        <span
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center [inset-inline-start:calc(var(--inset)_+_(100%_-_2_*_var(--inset))_*_var(--at))] rtl:translate-x-1/2"
          style={{ '--inset': `${INSET}px`, '--at': mark.at } as CSSProperties}
        >
          <span className={cn('absolute -top-[7px] h-[5px] w-px', mark.reached ? 'bg-pine' : 'bg-ink-3')} />
          <span className={cn('inline-flex items-center gap-1 whitespace-nowrap', mark.reached && 'font-medium text-pine')}>
            {mark.reached ? <Check className="size-3" strokeWidth={2.6} /> : null}
            <bdi>{mark.label}</bdi>
          </span>
        </span>
      ) : null}
      <bdi>{max}</bdi>
    </div>
  );
}
