'use client';
/**
 * Recalls per model year, for a make and model asked without a year. Each bar asks about its year; the count sits on
 * the bar. From `@md` the twelve years share one baseline, so the trend reads as one chart. In a narrower card (a
 * phone) twelve columns would be 27px tap targets, so the chart shows the newest six (about 52px each) and a toggle
 * brings back the earlier years as a row above them.
 */
import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useChatActions } from '@/components/chat/actions';
import { WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { RecallsOutput } from './recalls';
import { SLOT, rich } from './shared';

/** Tallest bar, and the room for the count above a bar (line + gap), in px. */
const BAR_MAX = 96;
const COUNT_H = 20;
/** Years a narrow card shows before "Show earlier years". */
const RECENT = 6;
/** One year's column: the same box whether it is a button (recalls to show) or a plain label (none on record). */
const COLUMN = 'flex min-h-11 w-full flex-col items-center gap-1.5 rounded-[12px] px-0.5 pb-1.5 pt-1';

export function Years({ data }: { data: RecallsOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const { send } = useChatActions();
  const reduce = useReducedMotion();
  const [earlier, setEarlier] = useState(false);
  const years = [...data.years].sort((a, b) => a.year - b.year);
  const max = Math.max(1, ...years.map((y) => y.count));
  const vehicle = [data.make, data.model].filter(Boolean).join(' ');
  const hidden = Math.max(0, years.length - RECENT);
  return (
    <>
      <div className="px-5 pt-2 sm:px-6">
        <p className="m-0 font-serif text-[24px] leading-tight tracking-[-.02em] text-ink sm:text-[26px]">{t('recalls.years.title', { vehicle })}</p>
        <p className="m-0 mt-1 text-[14.5px] text-ink-3">{t('recalls.years.sub')}</p>
      </div>
      <WidgetSection title={t('recalls.years.chart')}>
        <ol className="m-0 grid list-none grid-cols-6 items-end gap-x-1 gap-y-3 p-0 @md:grid-cols-12 @md:gap-x-1.5" aria-label={t('recalls.years.chart')}>
          {years.map((y, i) => {
            const unknown = y.count < 0;
            const h = unknown ? 6 : Math.max(6, (y.count / max) * BAR_MAX);
            const column = (
              <>
                {/* The count rides on its bar. The bar is laid out at its final height and only slides up into a clipped slot, so nothing reflows while it grows. */}
                <span className="flex w-full flex-col items-center justify-end gap-1" style={{ height: h + COUNT_H }}>
                  <span className="font-mono text-[12px] font-medium leading-4 tabular-nums text-ink-2">{unknown ? '–' : fmt.number(y.count)}</span>
                  <span className="block w-[70%] max-w-7 shrink-0 overflow-hidden rounded-b-[3px]" style={{ height: h }}>
                    <motion.span
                      initial={reduce ? false : { y: '100%' }}
                      animate={{ y: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 26, delay: reduce ? 0 : i * 0.03 }}
                      className={cn('block size-full rounded-t-[7px]', y.count > 0 ? 'bg-maple/80 group-hover:bg-maple' : 'bg-hair-2')}
                    />
                  </span>
                </span>
                <span className="font-mono text-[11.5px] leading-4 tabular-nums text-ink-3">
                  <bdi dir="ltr">
                    <span className="@md:hidden">{y.year}</span>
                    <span className="hidden @md:inline">{String(y.year).slice(0, 2) === '20' ? `’${String(y.year).slice(2)}` : y.year}</span>
                  </bdi>
                </span>
              </>
            );
            return (
              <li key={y.year} className={cn(i < hidden && !earlier && 'hidden @md:block')}>
                {y.count === 0 ? (
                  // Nothing to show for this year, so it is a label, not a button that could only answer "none".
                  <div className={COLUMN}>
                    <span className="sr-only">{t('recalls.years.srNone', { year: String(y.year) })}</span>
                    <span className="contents" aria-hidden>
                      {column}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => send(t('recalls.years.ask', { year: String(y.year), vehicle }))}
                    aria-label={unknown ? t('recalls.years.srUnknown', { year: String(y.year) }) : t('recalls.years.sr', { year: String(y.year), count: y.count })}
                    className={cn(COLUMN, 'group hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-ink')}
                  >
                    {column}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
        {hidden > 0 ? (
          <button
            type="button"
            onClick={() => setEarlier((v) => !v)}
            aria-expanded={earlier}
            className="mt-2 min-h-11 rounded-full px-2 text-[14px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink focus-visible:outline-2 focus-visible:outline-ink @md:hidden"
          >
            {earlier ? t('recalls.years.recent') : rich(t('recalls.years.earlier', { years: SLOT }), <bdi dir="ltr">{`${years[0].year}–${years[hidden - 1].year}`}</bdi>)}
          </button>
        ) : null}
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t('recalls.years.note')}</p>
      </WidgetSection>
    </>
  );
}
