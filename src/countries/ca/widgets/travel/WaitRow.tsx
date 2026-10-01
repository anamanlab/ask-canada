'use client';
/**
 * One crossing on the border-waits board: its name, both sides of the border, the wait as a pill, the time
 * CBSA posted it and a bar scaled to the longest wait in view. An estimate older than two hours is dimmed
 * and labelled "Last reported", never styled as the wait right now.
 */
import type { Ref } from 'react';
import { ArrowLeftRight, CarFront, Truck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { stampMs, stampText } from './select';
import { REVEAL_FOCUS, nameIn, useUiLang } from './shared';
import type { Crossing } from './types';
import { DATED_MS, isStale, waitTone, type Lane } from './waits';

type Props = {
  c: Crossing;
  lane: Lane;
  /** Longest wait in view, for the bar's scale. */
  max: number;
  /** The reader's clock (epoch ms; 0 until it's known). */
  now: number;
  highlight: boolean;
  ref?: Ref<HTMLLIElement>;
  tabIndex?: number;
};

export function WaitRow({ c, lane, max, now, highlight, ref, tabIndex }: Props) {
  const t = useMessages(messages);
  const L = useUiLang();
  const LaneIcon = lane === 'commercial' ? Truck : CarFront;
  const w = c[lane];
  const m = w.minutes;
  const stale = m != null && isStale(c, now);
  const tone = waitTone(m, stale);
  const label = w.label === 'na' ? t('waits.na') : w.label === 'closed' ? t('waits.closed') : m == null ? t('waits.unknown') : m === 0 ? t('waits.none') : t('waits.min', { count: m });
  // An estimate from another part of the day carries its date ("Sep 30, 5:15 a.m. CDT").
  const time = stampText(c.updated, L, { date: stale && now - stampMs(c.updated) > DATED_MS });
  return (
    <li ref={ref} tabIndex={tabIndex} className={cn('py-3', REVEAL_FOCUS, highlight && '-mx-3 rounded-[16px] border-0 bg-glacier-wash px-3')}>
      {/* Name beside the pill, the time under the pill. A stale row's stamp is long ("Last reported Sep 30,
          3:40 a.m. PDT"): in a phone-width column it takes its own full-width line under the name instead of
          squeezing it. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3">
        <div className="row-span-2 min-w-0">
          <p className="m-0 flex flex-wrap items-center gap-x-2 text-[15px] font-semibold leading-snug text-ink">
            {nameIn(c, L)}
            {highlight ? <span className="font-mono text-[11px] font-medium uppercase tracking-[.08em] text-glacier">{t('waits.yours')}</span> : null}
          </p>
          <p className="m-0 mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[13px] leading-snug text-ink-3">
            <span className="whitespace-nowrap">{c.canada}</span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <ArrowLeftRight className="size-3 shrink-0 flip-rtl" aria-label={t('waits.and')} />
              {c.us}
            </span>
          </p>
        </div>
        <p
          className={cn(
            'm-0 inline-flex items-center gap-1.5 self-start justify-self-end rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none',
            tone === 'clear' && 'bg-pine-wash text-pine',
            tone === 'short' && 'bg-glacier-wash text-glacier',
            tone === 'mid' && 'bg-amber-wash text-amber',
            tone === 'long' && 'bg-maple-wash text-maple-ink',
            tone === 'na' && 'bg-paper-2 text-ink-3',
            stale && 'font-medium',
          )}
        >
          {tone !== 'na' ? <LaneIcon className="size-3.5" aria-hidden strokeWidth={2} /> : null}
          <bdi>{label}</bdi>
        </p>
        <p className={cn('m-0 mt-1 text-end font-mono text-[11px] text-ink-3', stale && '@max-xl:col-span-2 @max-xl:row-start-3 @max-xl:text-start')}>
          <bdi>{stale ? t('waits.lastReported', { time }) : time}</bdi>
        </p>
      </div>
      {m != null && m > 0 && !stale ? (
        // The fill is full width and slides in from the start edge: only `transform` animates when the lane or province changes.
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          <span
            className={cn(
              'block h-full w-full rounded-full transition-transform duration-500 motion-reduce:transition-none ltr:-translate-x-[calc(100%-var(--fill))] rtl:translate-x-[calc(100%-var(--fill))]',
              tone === 'short' && 'bg-glacier',
              tone === 'mid' && 'bg-amber',
              tone === 'long' && 'bg-maple',
            )}
            style={{ '--fill': `${Math.max(6, Math.min(100, (m / max) * 100))}%` } as React.CSSProperties}
          />
        </div>
      ) : null}
    </li>
  );
}
