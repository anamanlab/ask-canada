'use client';
/** The small supplier meter of businessRegistration: decorative (the widget states the total in text). */
import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { Quarter } from './calc';
import { useBiz } from './shared';

const SWATCH = ['bg-pine/35', 'bg-pine/55', 'bg-pine/75', 'bg-pine'];
/** The tint of quarter `i` (oldest to newest), shared by the bar and the field labels. */
export const swatch = (i: number) => SWATCH[i] ?? 'bg-pine';

/**
 * Every moving part is a full-width layer placed with a transform (`--x` = where it starts, `--w` = its share
 * of the bar, both fractions of the bar's width), so typing a figure animates on the compositor only: no
 * `width` is ever animated. Mirrored in RTL; instant when the person prefers reduced motion.
 */
const LAYER = 'absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none';
const SEGMENT = cn(LAYER, 'origin-left [transform:translateX(calc(var(--x)_*_100%))_scaleX(var(--w))] rtl:origin-right rtl:[transform:translateX(calc(var(--x)_*_-100%))_scaleX(var(--w))]');
/** The gap after a segment: a 2px line at the layer's inline-end edge, slid to where the segment ends. */
const DIVIDER = cn(LAYER, 'border-e-2 border-card [transform:translateX(calc((var(--x)_-_1)_*_100%))] rtl:[transform:translateX(calc((1_-_var(--x))_*_100%))]');
const at = (x: number, w?: number) => ({ '--x': x, ...(w == null ? {} : { '--w': w }) }) as CSSProperties;

/**
 * Stacked bar of the four quarters against the small supplier limit. The quarters stay green up to the limit
 * line; only the part of the total past it turns red, labelled with the amount over ("+$2,300"). The red part
 * grows out of the limit line as the total crosses it.
 */
export function RegistrationMeter({ quarters, threshold, label, muted }: { quarters: Quarter[]; threshold: number; label: (q: Quarter) => string; muted?: boolean }) {
  const { t, dollars } = useBiz();
  const total = quarters.reduce((a, q) => a + q.amount, 0);
  const max = Math.max(threshold * 1.3, total * 1.06);
  const limitAt = (threshold / max) * 100;
  const over = Math.max(0, total - threshold);
  // Where each quarter starts, as a fraction of the bar.
  const starts = quarters.map((_, i) => quarters.slice(0, i).reduce((a, q) => a + q.amount, 0) / max);
  // The limit's label sits before the line, leaving the space after it for the amount over; far past the
  // limit the line is near the start, so the label moves after it and the amount over goes to the bar's end.
  const before = limitAt > 35;
  return (
    <div aria-hidden className={cn('pt-7 transition-opacity duration-300', muted && 'opacity-50 saturate-50')}>
      <div className="relative">
        <div className="relative h-11 overflow-hidden rounded-field bg-paper-2">
          {quarters.map((q, i) => (
            <span key={q.start} style={at(starts[i], q.amount / max)} className={cn(SEGMENT, swatch(i))} title={`${label(q)} · ${dollars(q.amount)}`} />
          ))}
          <span style={at(threshold / max, over / max)} className={cn(SEGMENT, 'bg-maple')} />
          {quarters.map((q, i) => (i < quarters.length - 1 && q.amount > 0 ? <span key={q.start} style={at(starts[i] + q.amount / max)} className={DIVIDER} /> : null))}
        </div>
        <span className="absolute -top-1.5 bottom-[-6px] w-0.5 rounded-full bg-ink" style={{ insetInlineStart: `${limitAt}%` }} />
        <span className={cn('absolute -top-7 whitespace-nowrap text-[12.5px] font-semibold text-ink', before ? 'pe-2' : 'ps-2')} style={before ? { insetInlineEnd: `${100 - limitAt}%` } : { insetInlineStart: `${limitAt}%` }}>
          <bdi>{t('reg.meter.threshold', { amount: dollars(threshold) })}</bdi>
        </span>
        <span
          className={cn('absolute -top-7 whitespace-nowrap text-[12.5px] font-semibold tabular-nums text-maple-ink transition-opacity duration-300 motion-reduce:transition-none', over > 0 ? 'opacity-100' : 'opacity-0', before && 'ps-2')}
          style={before ? { insetInlineStart: `${limitAt}%` } : { insetInlineEnd: 0 }}
        >
          <bdi>+{dollars(over)}</bdi>
        </span>
      </div>
    </div>
  );
}
