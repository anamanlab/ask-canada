/**
 * Stat + NumberTicker.
 * <Stat label="Fee" value={<NumberTicker value={163.5} format={fmt.currency} />} note="10-year adult passport" />
 * <Stat label="Ready by" value="Oct 29" size="lg" />
 * NumberTicker springs between values (respects prefers-reduced-motion) and announces the final value.
 */
'use client';
import { useEffectEvent, useLayoutEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/hooks/media';

const rounded = (n: number) => String(Math.round(n));

/** The ticker's spring (unit mass): slightly underdamped, so it settles in about 0.6s with no visible bounce. */
const STIFFNESS = 140;
const DAMPING = 22;
const DECAY = DAMPING / 2;
const FREQ = Math.sqrt(STIFFNESS - DECAY * DECAY);
/** The spring is at rest once what's left of the travel is below this fraction of it. */
const REST = 0.001;

/** Runs a spring from `from` to `to` on animation frames, calling `onUpdate` each frame. Returns a stop function. */
function spring(from: number, to: number, onUpdate: (n: number) => void) {
  const travel = to - from;
  let start: number | undefined;
  let frame = requestAnimationFrame(function tick(now) {
    start ??= now;
    const t = (now - start) / 1000;
    const envelope = Math.exp(-DECAY * t);
    if (envelope < REST) {
      onUpdate(to);
      return;
    }
    onUpdate(to - travel * envelope * (Math.cos(FREQ * t) + (DECAY / FREQ) * Math.sin(FREQ * t)));
    frame = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(frame);
}

export function NumberTicker({ value, format = rounded, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)');
  const node = useRef<HTMLSpanElement>(null);
  // The number on screen right now, so a change mid-flight carries on from there.
  const shown = useRef(value);
  // Frames are written straight to the text node: a ticking number never re-renders its widget.
  const show = useEffectEvent((n: number) => {
    shown.current = n;
    if (node.current) node.current.textContent = format(n);
  });
  useLayoutEffect(() => {
    if (reduce || shown.current === value) {
      show(value);
      return;
    }
    // React has just rendered the new value: put the old one back before paint, then spring to the new one.
    show(shown.current);
    return spring(shown.current, value, (n) => show(n));
  }, [value, reduce]);
  return (
    <span className={cn('tabular-nums', className)}>
      <span ref={node} aria-hidden>
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

export function Stat({
  label,
  value,
  unit,
  note,
  size = 'md',
  tone,
  className,
  children,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'ok' | 'danger';
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('min-w-0 rounded-tile border border-hair bg-paper-2 px-4 py-3.5', className)}>
      <div className="flex items-center justify-between gap-2 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">
        {label}
        {children}
      </div>
      <div
        className={cn(
          'mt-1.5 font-serif leading-[1.05] tracking-[-.03em] [font-variation-settings:"opsz"_48]',
          size === 'sm' && 'text-[24px]',
          size === 'md' && 'text-[30px]',
          size === 'lg' && 'text-[40px]',
          tone === 'ok' && 'text-pine',
          tone === 'danger' && 'text-maple-ink',
        )}
      >
        {value}
        {unit ? <span className="ms-1.5 font-sans text-[13.5px] font-medium tracking-normal text-ink-3">{unit}</span> : null}
      </div>
      {note ? <p className="m-0 mt-1 text-[12.5px] leading-snug text-ink-3">{note}</p> : null}
    </div>
  );
}
