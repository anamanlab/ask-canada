'use client';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useRovingFocus } from '@/lib/hooks';

/**
 * Choice cards (ARIA radio group) for options that need more room than a Segmented control. Keyboard: one tab stop
 * (the checked card); arrows move and select (RTL-aware), wrapping at the ends; Home/End jump to the first/last.
 */
export function ChoiceGrid<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  compact,
  stack,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; sub?: ReactNode; icon?: LucideIcon; srLabel?: string }[];
  className?: string;
  /** Smaller cards (icon + one line), for short choices like the kind of trip. */
  compact?: boolean;
  /** Compact cards with the icon above a one-word label while the column is narrow (four across on a phone); icon beside the label from `@xl`. */
  stack?: boolean;
}) {
  const roving = useRovingFocus({
    count: options.length,
    index: options.findIndex((o) => o.value === value),
    orientation: 'both',
    onMove: (i) => onChange(options[i].value),
  });
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-2', className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            {...roving.itemProps(i)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.srLabel}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex w-full items-center rounded-[14px] border transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
              stack
                ? 'min-h-12 flex-col gap-1.5 px-1 py-2.5 text-center @xl:flex-row @xl:gap-2.5 @xl:px-3 @xl:py-2 @xl:text-start'
                : compact
                  ? 'min-h-12 gap-2.5 px-3 py-2 text-start'
                  : 'min-h-[52px] gap-3 px-3.5 py-2.5 text-start',
              on ? 'border-ink bg-card shadow-sm' : 'border-hair bg-card hover:border-hair-2',
            )}
          >
            {Icon ? (
              <span className={cn('grid shrink-0 place-items-center rounded-[10px]', compact || stack ? 'size-7 rounded-[9px]' : 'size-8', on ? 'bg-ink text-card' : 'bg-paper-2 text-ink-2')} aria-hidden>
                <Icon className={compact || stack ? 'size-[15px]' : 'size-4'} strokeWidth={1.9} />
              </span>
            ) : (
              <span aria-hidden className={cn('grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]', on ? 'border-ink' : 'border-hair-2')}>
                <span className={cn('size-2.5 rounded-full', on ? 'bg-ink' : 'bg-transparent')} />
              </span>
            )}
            <span className="min-w-0">
              <span className={cn('block font-medium leading-snug text-ink', compact || stack ? 'text-[14px]' : 'text-[14.5px]')}>{o.label}</span>
              {o.sub ? <span className="block text-[12.5px] leading-snug text-ink-3">{o.sub}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
