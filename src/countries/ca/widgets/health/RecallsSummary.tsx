'use client';
/**
 * The headline of a recalls result, as one supporting line above the notices themselves: the count in serif,
 * what it counts and, for the latest notices, the busiest day of the week in words ("6 on Friday, the busiest
 * day"). The newest notices under it are the focal point of the card, so this stays one line.
 */
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui';
import { addDays } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import type { RecallItem } from './recalls';
import type { DayLabel } from './shared';

export type Summary =
  | { mode: 'week'; count: number; plus: boolean }
  | { mode: 'latest'; count: number }
  | { mode: 'search'; count: number; shown: number; query: string; noneRecent: boolean };

/** The one day of the last 7 with the most notices (2 or more, and no tie): the fact a bar chart would show. */
function busiestDay(items: RecallItem[], today: string): { date: string; count: number } | null {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, -i);
    return { date, count: items.filter((it) => it.date === date).length };
  }).sort((a, b) => b.count - a.count);
  return days[0].count >= 2 && days[0].count > days[1].count ? days[0] : null;
}

export function RecallsSummary({
  summary,
  items,
  newest,
  today,
  day,
  featured,
}: {
  summary: Summary;
  items: RecallItem[];
  newest?: string;
  today: string;
  day: DayLabel;
  /** The newest notices are shown as cards right below, each with its date: "Newest · Sep 29" would repeat them. */
  featured: boolean;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const n = fmt.number(summary.count);
  const peak = summary.mode === 'week' ? busiestDay(items, today) : null;
  const noneRecent = summary.mode === 'search' && summary.noneRecent && newest;
  const aside = peak
    ? t('recalls.summary.peak', { count: peak.count, day: fmt.date(peak.date, { weekday: 'long' }) })
    : newest && !featured && !noneRecent
      ? t('recalls.summary.newest', { date: day(newest) })
      : null;
  return (
    <div className="px-5 sm:px-6">
      <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span className="font-serif text-[38px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_48]">
          <bdi dir="ltr">{summary.mode === 'week' && summary.plus ? t('recalls.summary.plus', { n }) : n}</bdi>
        </span>
        <span className="text-[16px] font-medium leading-snug text-ink">
          {/* Isolated: the phrase ends with the quoted search term, which a right-to-left page would otherwise reorder. */}
          <bdi>
            {summary.mode === 'search'
              ? t('recalls.summary.search', { count: summary.count, query: summary.query })
              : t(`recalls.summary.${summary.mode}`, { count: summary.count })}
          </bdi>
        </span>
        {aside ? (
          // Its own line on a phone (no separator starting a line); isolated, since it opens with a number.
          <span className="w-full text-[15px] leading-snug text-ink-2 @xl:w-auto">
            <span aria-hidden className="me-2.5 hidden text-ink-3 @xl:inline">
              {t('common.dot')}
            </span>
            <bdi>{aside}</bdi>
          </span>
        ) : null}
      </p>
      {summary.mode === 'search' && summary.count > summary.shown ? (
        <p className="m-0 mt-2 text-[14px] leading-snug text-ink-2">{t('recalls.summary.partial', { shown: summary.shown, total: summary.count })}</p>
      ) : null}
      {noneRecent ? (
        <Badge tone="ok" icon={Check} className="mt-3">
          {t('recalls.summary.noneRecent', { date: fmt.date(newest, { month: 'short', year: 'numeric' }) })}
        </Badge>
      ) : null}
    </div>
  );
}
