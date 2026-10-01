'use client';
/**
 * The newest notices of a result as the card's focal point: what it is, what is wrong and what to do, readable
 * without opening anything. The affected sizes, UPC and lot codes are one tap away.
 *
 * Two cards sit side by side at the same height (the action line is clamped to the same number of lines, the
 * "Details" row is pinned to the bottom). Opening one stacks the pair, so the opened card gets the full width
 * for its details and product codes and the other keeps its own height.
 */
import { useState } from 'react';
import { Badge, Disclosure } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { RecallDetails } from './RecallDetails';
import { CatTile, hasBadge, Hazard, KIND_TONE, RecallRef } from './RecallRow';
import { rowText, type Merged } from './recall-titles';
import { useLang, type DayLabel } from './shared';

export function FeaturedNotices({ items, label, day, expand }: { items: Merged[]; label: string; day: DayLabel; expand: boolean }) {
  // Which cards are open, by notice URL. `expand` (the person asked for the affected codes) starts with the first one open.
  const [open, setOpen] = useState<string[]>(expand && items[0] ? [items[0].url] : []);
  const anyOpen = items.some((it) => open.includes(it.url));
  return (
    <section aria-label={label} className="mt-6 px-5 sm:px-6">
      <ul className={cn('m-0 grid list-none gap-3.5 p-0', items.length > 1 && !anyOpen && '@2xl:grid-cols-2')}>
        {items.map((it) => (
          <RecallFeature
            key={it.url}
            item={it}
            date={day(it.date, { sentenceStart: true })}
            day={day}
            open={open.includes(it.url)}
            onOpenChange={(on) => setOpen((cur) => (on ? [...cur, it.url] : cur.filter((u) => u !== it.url)))}
          />
        ))}
      </ul>
    </section>
  );
}

function RecallFeature({ item, date, day, open, onOpenChange }: { item: Merged; date: string; day: DayLabel; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useMessages(messages);
  const text = rowText(item, t('common.sep'), useLang());
  const d = item.details;
  const count = d?.affectedTotal ?? d?.affected?.length;
  // A vehicle notice has no "what to do" of its own: the models and years it covers are on the notice.
  const action = d?.whatToDo ?? (item.category === 'vehicles' ? t('recalls.feature.vehicle') : undefined);
  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-hair bg-card shadow-md transition-shadow duration-300 hover:shadow-lg motion-reduce:transition-none">
      <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
        {/* One line in every card (the short category name, as on the filter chips), so two cards' titles start level. */}
        <div className="flex items-center gap-3">
          <CatTile category={item.category} className="size-10" />
          <p className="m-0 min-w-0 flex-1 text-[14px] leading-snug text-ink-2">
            <span aria-hidden>{t(`recalls.chip.${item.category}`)}</span>
            <span className="sr-only">{t(`recalls.cat.${item.category}`)}</span>
            <span aria-hidden className="inline-block w-4 text-center">
              {t('common.dot')}
            </span>
            <span className="whitespace-nowrap">{date}</span>
          </p>
          {hasBadge(item) ? (
            <Badge tone={KIND_TONE[item.kind]} className="shrink-0">
              {t(`recalls.kind.${item.kind}`)}
            </Badge>
          ) : null}
        </div>
        <h5 className="m-0 mt-4 font-serif text-[23px] font-normal leading-[1.16] tracking-[-.018em] text-ink [font-variation-settings:'opsz'_36] [overflow-wrap:anywhere] [text-wrap:balance]">
          <bdi>{text.title}</bdi>
        </h5>
        <p className="m-0 mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-[15px] leading-snug text-ink-2">
          <Hazard item={item} text={text} />
          {text.ref ? <RecallRef value={text.ref} /> : null}
        </p>
        {/* Clamped while closed, so two cards line up; the whole sentence is in the details below. */}
        {action ? (
          <p className={cn('m-0 mt-2 text-[15px] leading-[1.45] text-ink-2', !open && 'line-clamp-3')}>
            <bdi>{action}</bdi>
          </p>
        ) : null}
        {item.earlier?.length ? <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-3">{t('recalls.earlier', { date: day(item.earlier[0].date) })}</p> : null}
      </div>
      {d ? (
        <Disclosure
          // One line on a phone: the short label, with the count pill carrying the number of affected products.
          title={
            d.affected?.length ? (
              <span className="text-[14.5px]">
                <span className="@md:hidden">{t('recalls.feature.details')}</span>
                <span className="hidden @md:inline">{t('recalls.feature.more')}</span>
              </span>
            ) : (
              <span className="text-[14.5px]">{t('recalls.feature.details')}</span>
            )
          }
          count={count && count > 1 ? count : undefined}
          open={open}
          onOpenChange={onOpenChange}
          lazy
          headingLevel={5}
          className="px-5"
        >
          <RecallDetails item={item} d={d} officialTitle={text.shortened ? item.title : undefined} day={day} className="mb-4" />
        </Disclosure>
      ) : null}
    </li>
  );
}
