/**
 * AQHI pieces: Environment Canada's official scale colours (data encodings, from the --wx-aqhi-* tokens with
 * light and dark values in tokens.tsx), the category text tones and the 11-step scale bar.
 */
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import type { AqhiCategory } from './data';

/** 1 → 10 and 10+: light blue → deep teal-blue → yellow → orange → reds → dark maroon. */
const AQHI_COLOURS = [
  'bg-(color:--wx-aqhi-1)',
  'bg-(color:--wx-aqhi-2)',
  'bg-(color:--wx-aqhi-3)',
  'bg-(color:--wx-aqhi-4)',
  'bg-(color:--wx-aqhi-5)',
  'bg-(color:--wx-aqhi-6)',
  'bg-(color:--wx-aqhi-7)',
  'bg-(color:--wx-aqhi-8)',
  'bg-(color:--wx-aqhi-9)',
  // The two burgundy steps sit close to a dark tile: a light hairline ring keeps the dot's edge visible there.
  'bg-(color:--wx-aqhi-10) dark:ring-1 dark:ring-white/40',
  'bg-(color:--wx-aqhi-11) dark:ring-1 dark:ring-white/40',
];
/** The step of the scale a reading falls on: 1 → 0 … 10 → 9, above 10 → 10 (the "10+" step). */
const aqhiStep = (v: number) => Math.min(10, Math.max(1, Math.round(v)) - 1 + (v > 10 ? 1 : 0));
export const aqhiColour = (v: number) => AQHI_COLOURS[aqhiStep(v)];
export const CATEGORY_TONE: Record<AqhiCategory, string> = {
  low: 'text-(color:--wx-aqhi-low-ink)',
  moderate: 'text-amber',
  high: 'text-maple-ink',
  'very-high': 'text-maple-ink',
};

/**
 * 11-step AQHI bar with a marker at the value. Like the 7-day temperature bars, the scale runs from the
 * inline start (low → high), so both scales flip together in right-to-left layouts.
 */
export function AqhiScale({ value, label, className }: { value: number | null; label: string; className?: string }) {
  const { fmt } = useLocale();
  const idx = value == null ? null : aqhiStep(value);
  return (
    <div className={className} role="img" aria-label={label}>
      {/* Segments and tick labels share one 11-column grid, so each label sits under its own colour. */}
      <div className="grid grid-cols-11 gap-[3px]">
        {AQHI_COLOURS.map((c, i) => (
          <div key={i} className="relative">
            {/* Dim the other steps on light cards only: on dark cards dimming turns the official yellows olive. */}
            <div className={cn('h-2.5 transition-[height,opacity]', c, idx != null && i !== idx && 'opacity-70 dark:opacity-100', i === 0 && 'rounded-s-full', i === 10 && 'rounded-e-full')} />
            {idx === i ? (
              <span
                className="absolute top-[-5px] size-5 -translate-x-1/2 rounded-full border-[3px] border-card bg-ink shadow-md rtl:translate-x-1/2"
                style={{ insetInlineStart: '50%' }}
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-11 gap-[3px] font-mono text-[11px] leading-none text-ink-3" aria-hidden>
        <span className="col-start-1 text-center">{fmt.number(1)}</span>
        <span className="col-start-4 text-center">{fmt.number(4)}</span>
        <span className="col-start-7 text-center">{fmt.number(7)}</span>
        <span className="col-start-11 whitespace-nowrap text-center" dir="ltr">
          {fmt.number(10)}+
        </span>
      </div>
    </div>
  );
}
