'use client';
/** The forecast's 7-day list. */
import { useId, useState, type CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import { WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { useTemp } from './format';
import { SkyIcon } from './icons';
import messages from './messages';
import type { Day } from './types';

/**
 * Temperature → a colour on the ramp from cold glacier blue to warm maple red (for the range bars): the
 * two neighbouring --wx-t-* token stops, mixed in OKLCH.
 */
const STOPS: [number, string][] = [
  [-25, '--wx-t-n25'],
  [-10, '--wx-t-n10'],
  [0, '--wx-t-0'],
  [10, '--wx-t-10'],
  [18, '--wx-t-18'],
  [25, '--wx-t-25'],
  [32, '--wx-t-32'],
];
const tempColour = (c: number) => {
  const x = Math.max(STOPS[0][0], Math.min(STOPS[STOPS.length - 1][0], c));
  const i = Math.max(0, STOPS.findIndex(([t]) => t >= x) - 1);
  const [t0, v0] = STOPS[i];
  const [t1, v1] = STOPS[Math.min(i + 1, STOPS.length - 1)];
  const f = t1 === t0 ? 0 : (x - t0) / (t1 - t0);
  return `color-mix(in oklch, var(${v0}) ${Math.round((1 - f) * 100)}%, var(${v1}))`;
};

/**
 * The 7-day list: one row per day, its temperature range drawn on a scale shared by the whole week. A row
 * opens Environment Canada's full wording for the day and the night (one row open at a time). A question
 * about tomorrow or the weekend arrives with that day's row already open (`openDay`).
 * The rows are an accordion whose trigger is the whole data row (a six-column grid with the range bar), which
 * the shared `Disclosure` (a title, an optional summary and its own chevron button) cannot express, so this is
 * the one bespoke disclosure in the widget; the alert text and area lists use `Disclosure`.
 */
export function Week({ days, currentTemp, openDay }: { days: Day[]; currentTemp: number | null; openDay?: string }) {
  const t = useMessages(messages);
  const temp = useTemp();
  const { fmt } = useLocale();
  const [open, setOpen] = useState<string | null>(openDay ?? null);
  const uid = useId();
  const all = days.flatMap((d) => [d.high, d.low]).filter((v): v is number => v != null);
  if (!days.length) return null;
  const min = Math.min(...all, currentTemp ?? Infinity);
  const max = Math.max(...all, currentTemp ?? -Infinity);
  const span = Math.max(1, max - min);
  const pos = (v: number) => ((v - min) / span) * 100;
  // A bar at least 4% wide that always stays on the track (a single value at the top of the range gets a
  // short pill ending at 100%, not a sliver hanging off the end).
  const bar = (lo: number, hi: number) => {
    const width = Math.max(4, pos(hi) - pos(lo));
    return { start: Math.min(Math.max(0, pos(lo) - (width - (pos(hi) - pos(lo))) / 2), 100 - width), width };
  };
  return (
    <WidgetSection title={<bdi>{t('week.title', { count: days.length })}</bdi>}>
      <ul className="m-0 list-none p-0">
        {days.map((d, i) => {
          const lo = d.low ?? d.high;
          const hi = d.high ?? d.low;
          const isOpen = open === d.key;
          const periods = [d.day, d.night].filter((p) => p != null);
          // The chance shown under the icon belongs to the same period as the icon (the day's, or tonight's when
          // only the night is left); the other period's chance is in its own wording when the row is opened.
          const lead = d.day ?? d.night;
          const pop = lead?.pop;
          return (
            <li key={d.key} className="border-t border-hair first:border-t-0">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${uid}-${i}`}
                onClick={() => setOpen(isOpen ? null : d.key)}
                // Phones: a narrower day column and a small chevron, so the range bar keeps its length and the row
                // still shows that it opens; both grow once the column has room.
                className="grid min-h-[52px] w-full grid-cols-[minmax(0,4.75rem)_2.25rem_2.25rem_minmax(0,1fr)_2.25rem_0.75rem] items-center gap-x-1.5 rounded-[12px] py-2 text-start transition-colors hover:bg-paper-2 @sm:grid-cols-[minmax(0,5.5rem)_2.25rem_2.25rem_minmax(0,1fr)_2.25rem_0.875rem] @xl:grid-cols-[9rem_3.25rem_2.75rem_minmax(0,1fr)_2.75rem_1rem] @xl:gap-x-3 @xl:px-1"
              >
                <span className="min-w-0 text-[14px] font-medium leading-tight text-ink [overflow-wrap:break-word] @sm:text-[15px]">{d.label}</span>
                <span className="flex flex-col items-center" aria-hidden>
                  <SkyIcon sky={lead?.sky ?? d.sky} night={!d.day} className="size-[22px]" />
                  {pop && pop >= 20 ? <span className="mt-0.5 whitespace-nowrap font-mono text-[10.5px] leading-none text-glacier">{t('unit.pct', { v: fmt.number(pop) })}</span> : null}
                </span>
                <span className="text-end font-serif text-[17px] text-ink-3" aria-hidden>{d.low != null ? temp(d.low) : null}</span>
                <span className="relative h-[6px] rounded-full bg-hair" aria-hidden>
                  {lo != null && hi != null ? (
                    <span
                      // Cold → warm runs from the inline start, so the gradient flips with the writing direction.
                      className="absolute inset-y-0 rounded-full bg-[linear-gradient(90deg,var(--lo),var(--hi))] rtl:bg-[linear-gradient(270deg,var(--lo),var(--hi))]"
                      style={
                        {
                          insetInlineStart: `${bar(lo, hi).start}%`,
                          width: `${bar(lo, hi).width}%`,
                          '--lo': tempColour(lo),
                          '--hi': tempColour(hi),
                        } as CSSProperties
                      }
                    />
                  ) : null}
                  {/* The "now" dot sits on today's daytime range; a night-only first row (Tonight) has no pill to sit on. */}
                  {i === 0 && d.day && currentTemp != null ? (
                    <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-ink rtl:translate-x-1/2" style={{ insetInlineStart: `${pos(currentTemp)}%` }} />
                  ) : null}
                </span>
                <span className="font-serif text-[17px] text-ink" aria-hidden>{d.high != null ? temp(d.high) : null}</span>
                <ChevronDown className={cn('size-3 justify-self-end text-ink-3 transition-transform duration-200 @sm:size-3.5 @xl:size-4', isOpen && 'rotate-180')} aria-hidden />
                <span className="sr-only">
                  {t('week.sr', {
                    summary: periods.map((p) => p.summary).join(', '),
                    hi: d.high != null ? temp(d.high) : '—',
                    lo: d.low != null ? temp(d.low) : '—',
                    pop: t('unit.pct', { v: fmt.number(pop ?? 0) }),
                  })}
                </span>
              </button>
              <div id={`${uid}-${i}`} hidden={!isOpen} className="mb-3 mt-1 rounded-[14px] [&>p+p]:mt-2 bg-paper-2 px-4 py-3 text-[14px] leading-[1.55] text-ink-2">
                {periods.map((p) => (
                  <p key={p.name} className="m-0">
                    <b className="font-semibold text-ink">{p.name}</b> {p.text}
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </WidgetSection>
  );
}
