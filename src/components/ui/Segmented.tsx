/**
 * Segmented: single-choice control (ARIA radiogroup) with a sliding thumb.
 * <Segmented label="How to apply" value={m} onChange={setM}
 *   options={[{ value: 'online', label: 'Online', sub: 'Recommended' }, …]} size="md|sm" />
 * Arrow keys move the selection (direction-aware). Options may carry `sub` (second line) and `disabled`.
 * The group may be laid out as a row, a column or a grid (`className`); the thumb follows the chosen option.
 */
'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks/roving-focus';
import { useSlidingThumb } from '@/lib/hooks/thumb';

export type SegmentedOption<T extends string> = { value: T; label: ReactNode; sub?: ReactNode; disabled?: boolean };

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  size?: 'sm' | 'md';
  className?: string;
}) {
  const index = options.findIndex((o) => o.value === value);
  const { itemProps, getItem } = useRovingFocus({
    count: options.length,
    index,
    onMove: (i) => onChange(options[i].value),
    orientation: 'both',
    isDisabled: (i) => Boolean(options[i].disabled),
  });

  // The thumb is the group's ::before, slid over the chosen option; until it is measured (server HTML) the
  // chosen option paints its own background.
  const group = useSlidingThumb<HTMLDivElement>(index, getItem, options.length);

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      className={cn(
        'group/seg relative flex gap-[3px] rounded-[14px] bg-paper-2 p-1',
        'before:pointer-events-none before:absolute before:left-0 before:top-0 before:hidden before:h-[var(--thumb-h)] before:w-[var(--thumb-w)] before:bg-seg-on before:shadow-[var(--sh-sm),0_0_0_1px_var(--hair)] before:[transform:translate(var(--thumb-x),var(--thumb-y))] before:transition-[transform,width,height] before:duration-300 before:ease-spring data-[thumb]:before:block motion-reduce:before:transition-none',
        size === 'md' ? 'before:rounded-[11px]' : 'rounded-[11px] p-[3px] before:rounded-[9px]',
        className,
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            {...itemProps(i)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center justify-center rounded-[11px] px-2 text-center font-medium transition-colors duration-200 disabled:opacity-40',
              size === 'md' ? 'min-h-11 py-1.5 text-[14.5px]' : 'min-h-9 rounded-[9px] py-1 text-[13px]',
              on ? 'text-ink' : 'text-ink-2 hover:text-ink',
              on && 'bg-seg-on shadow-[var(--sh-sm),0_0_0_1px_var(--hair)] group-data-[thumb]/seg:bg-transparent group-data-[thumb]/seg:shadow-none',
            )}
          >
            <span className="relative leading-tight">{o.label}</span>
            {o.sub ? <span className="relative mt-0.5 font-mono text-[11px] font-normal leading-tight text-ink-3">{o.sub}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
