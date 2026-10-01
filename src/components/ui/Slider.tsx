/**
 * Slider: labelled range input with a filled track and formatted value.
 * <Slider label="Net family income" min={0} max={200000} step={1000} value={v} onChange={setV}
 *   format={(n) => fmt.currency(n)} />
 * Uses a native <input type="range"> (keyboard + screen reader support for free).
 */
'use client';
import { useId, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

const plain = (n: number) => String(n);

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  format = plain,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min || 1)) * 100;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        <output htmlFor={id} className="font-serif text-[22px] leading-none tracking-[-.02em] text-ink tabular-nums">
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ac-range h-11 w-full cursor-pointer appearance-none bg-transparent"
        style={{ '--pct': `${pct}%` } as CSSProperties}
      />
    </div>
  );
}
