'use client';
/**
 * civicNews renderer: live Government of Canada news (canada.ca news centre) with type filters, department,
 * time and the official link; empty and offline states fall back to the news centre.
 * Headlines come from canada.ca in English or French, so each one is a <bdi> and reads correctly in an RTL UI.
 */
import { useState } from 'react';
import { Newspaper, SearchX } from 'lucide-react';
import { Badge, Chip, EmptyState, LiveRegion, Notice, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useNow, useScrollEdges } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { NEWS_TYPES, URLS, type Lang, type NewsType } from './data';
import messages from './messages';
import { langOf } from './select';
import { CardArrow, CardLink, isolate } from './shared';
import { NewsSkeleton } from './skeletons/news';
import type { NewsItem, NewsOutput } from './types';

type NewsInput = { topic?: string; type?: NewsType; limit?: number; lang?: Lang };
type Filter = NewsType | 'all';

export function CivicNews({ part, locale }: WidgetProps<NewsInput, NewsOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('news.error.title')} message={t('news.error.body')} fallback={{ href: URLS.news[langOf(locale)], label: t('news.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <NewsSkeleton topic={part.input?.topic} />;
  return <NewsView data={part.output} />;
}

function NewsView({ data }: { data: NewsOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [filter, setFilter] = useState<Filter>('all');
  const types = NEWS_TYPES.filter((k) => data.items.some((i) => i.type === k));
  const options: Filter[] = ['all', ...types];
  const shown = filter === 'all' ? data.items : data.items.filter((i) => i.type === filter);
  // 0 until hydrated (absolute dates, the same on the server and the first client render); then the reader's
  // clock, shared by every row and refreshed each minute so "Today" rolls over.
  const now = useNow(0);

  return (
    <WidgetShell
      icon={Newspaper}
      tone="amber"
      title={t('news.title')}
      subtitle={<bdi>{data.query ? t('news.subtitleTopic', { topic: data.query }) : t('news.subtitle')}</bdi>}
      badge={data.live ? <Badge tone="live">{t('news.badge')}</Badge> : null}
      sources={data.sources}
      handoff={{ href: URLS.news[data.lang], label: t('news.handoff'), note: isolate(t('news.handoffNote')) }}
      footnote={data.items.length ? <bdi>{t('news.note')}</bdi> : undefined}
      className="@container"
    >
      {!data.live ? (
        <div className="px-5 sm:px-6">
          <Notice tone="info" title={t('news.offline.title')}>
            {t('news.offline.body')}
          </Notice>
        </div>
      ) : !data.items.length ? (
        <div className="px-5 sm:px-6">
          {/* The shell's handoff below already links to the news centre. */}
          <EmptyState icon={SearchX} title={t('news.empty.title', { topic: data.query ?? '' })}>
            {t('news.empty.body')}
          </EmptyState>
        </div>
      ) : (
        <>
          {types.length > 1 ? (
            <div className="px-5 sm:px-6">
              <TypeFilter
                label={t('news.filter.label')}
                value={filter}
                onChange={setFilter}
                options={options.map((k) => ({
                  value: k,
                  label: k === 'all' ? t('news.filter.all') : t(`news.typePlural.${k}`),
                  count: fmt.number(k === 'all' ? data.items.length : data.items.filter((i) => i.type === k).length),
                }))}
              />
            </div>
          ) : null}
          {/* Announce the filtered count, not every headline, when the filter changes. */}
          {types.length > 1 ? (
            <LiveRegion delay={300} text={t('news.showing', { label: filter === 'all' ? t('news.filter.all') : t(`news.typePlural.${filter}`), count: t('news.count', { count: shown.length }) })} />
          ) : null}
          <ol className="m-0 mt-2 list-none p-0" aria-label={t('news.list')}>
            {shown.map((item, i) => (
              <Item key={item.url} item={item} first={i === 0} now={now} />
            ))}
          </ol>
          {data.since ? <p className="m-0 px-5 pt-3 text-[12.5px] text-ink-2 sm:px-6">{t('news.since', { date: fmt.date(data.since, { month: 'long', day: 'numeric', year: 'numeric' }) })}</p> : null}
        </>
      )}
    </WidgetShell>
  );
}

/**
 * The type filter: core chips (toggle buttons, the chosen one pressed) on one line. On narrow widths the line
 * scrolls sideways and fades on the side that still has chips; from the wide layout on it wraps.
 */
function TypeFilter({ label, value, onChange, options }: { label: string; value: Filter; onChange: (v: Filter) => void; options: { value: Filter; label: string; count: string }[] }) {
  const { ref, maskStyle } = useScrollEdges<HTMLDivElement>();
  return (
    <div ref={ref} role="group" aria-label={label} style={maskStyle} className="-mx-1 flex scroll-px-6 gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] @xl:flex-wrap">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Chip
            key={o.value}
            selected={on}
            onClick={() => onChange(o.value)}
            className={cn('shrink-0 px-3.5 text-[13.5px] shadow-none hover:translate-y-0 hover:shadow-none', on ? 'border-ink bg-ink text-paper hover:bg-ink' : 'bg-card hover:border-ink-3')}
          >
            <bdi>{o.label}</bdi> <span className={cn('ms-0.5 font-mono text-[11px]', on ? 'text-paper/70' : 'text-ink-3')}>{o.count}</span>
          </Chip>
        );
      })}
    </div>
  );
}

/**
 * "Today, 3:15 p.m." / "Yesterday, …" in the reader's time zone once their clock is known (`nowMs` > 0). Before
 * that, the feed's own calendar date (Eastern), which renders the same on the server and in any browser.
 */
function when(iso: string, nowMs: number, fmt: ReturnType<typeof useLocale>['fmt'], t: (k: string, v?: Record<string, string>) => string) {
  if (!nowMs) return fmt.date(iso.slice(0, 10), { month: 'short', day: 'numeric' });
  const d = new Date(iso);
  const now = new Date(nowMs);
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const time = fmt.date(d, { hour: 'numeric', minute: '2-digit' });
  if (key(d) === key(now)) return t('news.today', { time });
  if (key(d) === key(new Date(nowMs - 86_400_000))) return t('news.yesterday', { time });
  return fmt.date(d, { month: 'short', day: 'numeric', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) });
}

function Item({ item, first, now }: { item: NewsItem; first: boolean; now: number }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <li className={cn('px-5 sm:px-6', !first && 'border-t border-hair')}>
      <CardLink href={item.url} className="-mx-2 my-1.5 flex gap-3 rounded-field px-2 py-3 transition-colors hover:bg-paper-2">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            {item.type ? <span className="font-mono font-medium uppercase tracking-[.08em] text-amber">{t(`news.type.${item.type}`)}</span> : null}
            <span className="text-ink-2">
              <time dateTime={item.published}>
                <bdi>{when(item.published, now, fmt, t)}</bdi>
              </time>
            </span>
          </span>
          <span className="mt-1 block text-[15.5px] font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-hair-2 group-hover:underline-offset-[3px]">
            <bdi>{item.title}</bdi>
          </span>
          {/* The server clips teasers at a whole word (TEASER_MAX), short enough for these lines: the clamp is only a guard. */}
          {item.teaser ? (
            <span className="mt-1 text-[13.5px] leading-snug text-ink-2 line-clamp-4 @xl:line-clamp-2">
              <bdi>{item.teaser}</bdi>
            </span>
          ) : null}
          {item.department ? (
            <span className="mt-1.5 block text-[12.5px] font-medium text-ink-2">
              <bdi>{item.department}</bdi>
            </span>
          ) : null}
        </span>
        <CardArrow className="mt-1" />
        <span className="sr-only">{t('news.open')}</span>
      </CardLink>
    </li>
  );
}
