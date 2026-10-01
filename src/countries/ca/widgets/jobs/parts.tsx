'use client';
/** Small hooks and marks shared by the jobs renderers (all strings come from ./messages). */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { HOURS_PER_YEAR, PROVINCES, type Lang, type Province } from './data';
import messages from './messages';
import type { Salary } from './types';

/** Job Bank data is EN/FR; other interface languages see English names. */
export function useJobsLang(): Lang {
  const { locale } = useLocale();
  return locale === 'fr' ? 'fr' : 'en';
}

export function useProvinceName() {
  const lang = useJobsLang();
  return (code: Province) => PROVINCES[code][lang];
}

/**
 * "$33–$42 an hour", "$70 an hour", "$55,000 a year"; the amounts alone ("$26–$30") when the employer's
 * period can't be right; Job Bank's own words when we couldn't parse.
 */
export function usePay() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (s: Salary | undefined): string | null => {
    if (!s) return null;
    if (s.min == null) return s.raw || null;
    // Hourly pay keeps its cents ("$33.50"); yearly, weekly and monthly pay is shown in whole dollars.
    const money = (n: number) => fmt.money(n, { cents: s.period === 'hour' || !s.period ? 'auto' : 'never' });
    const amount = s.max ? t('pay.range', { min: money(s.min), max: money(s.max) }) : money(s.min);
    return s.period ? t('pay.per', { amount, period: s.period }) : amount;
  };
}

/**
 * A header subtitle that carries the status badge on phones. The shell shows its `badge` beside the title
 * from `sm` up and has no room for it below that, so there the badge wraps onto its own line here:
 * "Live from Job Bank" stays in the header at every width.
 */
export function SubtitleWithBadge({ children, badge }: { children: ReactNode; badge: ReactNode }) {
  return (
    <>
      {children}
      <span className="mt-2 block sm:hidden">{badge}</span>
    </>
  );
}

/** Hourly → estimated yearly (37.5 h × 52 weeks). */
export const yearly = (hourly: number) => Math.round((hourly * HOURS_PER_YEAR) / 100) * 100;

/** Whole days from an ISO date to today (never negative: a posting dated tomorrow reads as today). */
export const daysSince = (iso: string, today: string) => Math.max(0, diffDays(iso.slice(0, 10), today));

/** Five small bars for Job Bank's 0–5 outlook, with the label for screen readers and sighted users (`strong`: in the surrounding text style). */
export function OutlookMeter({ stars, label, compact, strong }: { stars: number; label?: string; compact?: boolean; strong?: boolean }) {
  const t = useMessages(messages);
  const text = label ?? t(`outlook.${stars}`);
  return (
    <span className="inline-flex items-center gap-2" title={text}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn('w-[5px] rounded-full transition-colors', i <= stars ? (stars >= 4 ? 'bg-pine' : stars === 3 ? 'bg-amber' : 'bg-maple') : 'bg-hair-2')}
            style={{ height: `${6 + i * 2.5}px` }}
          />
        ))}
      </span>
      <span className={cn(compact ? 'sr-only' : strong ? 'whitespace-nowrap' : 'text-[13px] font-medium text-ink-2')}>{text}</span>
    </span>
  );
}
