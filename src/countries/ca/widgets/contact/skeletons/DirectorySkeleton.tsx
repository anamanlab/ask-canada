'use client';
/**
 * Directory loading state: mirrors the real card for the topic in the tool input (same notices, chips, rows
 * or overview cards), so nothing jumps when the output arrives.
 */
import { Phone } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import { FEDERAL_HOLIDAYS } from '../../../data/holidays';
import { useLang, useViewerZone } from '../clock';
import { FILTERS, LINES, TOPIC_LINES, craLeads, type Line, type LineId, type Topic } from '../data';
import { URGENT } from '../urgent-data';
import { OTTAWA, regionOf, statusOf } from '../hours';
import messages from '../messages';
import { dayNotice, nextOpening, sameHours } from '../pick';
import { useWhenText } from '../status';
import { Frame, Ghost, NoticeGhost, ShellFooter } from './parts';

/**
 * The notices the card will open with, from the same inputs as the real card (the device's clock and zone, the
 * bundled holiday list, the same reopening time). Nothing is known on the server or while hydrating (`now` is 0).
 */
function Notices({ ids }: { ids: LineId[] }) {
  const t = useMessages(messages);
  const lang = useLang();
  const now = useNow(0);
  const tz = useViewerZone(OTTAWA);
  const whenText = useWhenText(tz);
  if (!now) return null;
  const viewer = { now, tz, holidays: FEDERAL_HOLIDAYS };
  const day = dayNotice(ids, viewer);
  const region = regionOf(tz);
  const abroad = region === 'intl';
  const us = region === 'us' && ids.some((id) => LINES[id].agents?.zone === 'local');
  if (!day && !abroad && !us) return null;
  const reopens = day?.kind === 'holiday' ? nextOpening(ids.map((id) => statusOf(LINES[id].number ? LINES[id].agents : undefined, now, tz, FEDERAL_HOLIDAYS))) : undefined;
  return (
    <div className="grid gap-2.5 px-5 sm:px-6">
      {day?.kind === 'holiday' ? (
        <NoticeGhost
          title={t('notice.holiday.title', { holiday: day.holiday.name[lang] })}
          body={reopens ? t('notice.holiday.body', { when: whenText(now, reopens) }) : t('notice.holiday.bodyNoDate')}
        />
      ) : day?.kind === 'weekend' ? (
        <NoticeGhost title={t('notice.weekend.title')} body={`${t('notice.weekend.body')} ${t('notice.weekend.link')}`} />
      ) : null}
      {abroad ? <NoticeGhost title={t('notice.abroad.title')} body={t('notice.abroad.body')} /> : us ? <NoticeGhost title={t('notice.us.title')} body={t('notice.us.body')} /> : null}
    </div>
  );
}

/** An overview card (more than three lines on screen). */
function CardGhost({ line, className }: { line: Line; className?: string }) {
  const lang = useLang();
  return (
    <div className={cn('flex flex-col rounded-tile border border-hair px-4 py-3.5', className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[15px] font-semibold leading-snug">
            <Ghost>{line.name[lang]}</Ghost>
          </p>
          <p className="m-0 mt-0.5 text-[13px] leading-snug">
            <Ghost>{line.covers[lang]}</Ghost>
          </p>
        </div>
      </div>
      <Skeleton className="mt-2.5 h-6 w-28 rounded-full" />
      {line.number ? <Skeleton className="mt-1.5 h-3 w-44" /> : null}
      {line.automated ? <Skeleton className="mt-1.5 h-3.5 w-32" /> : null}
      <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
        <Skeleton className="h-6 w-40" />
        <span className="flex items-center gap-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="size-11" round />
        </span>
      </div>
    </div>
  );
}

/**
 * A full row (up to three lines on screen). `legend`: the card's first day bar also carries the legend. `same`:
 * the row keeps an earlier row's hours, so it shows one line of text instead of the hours and the day bar.
 */
function RowGhost({ line, first, legend, same }: { line: Line; first: boolean; legend: boolean; same?: string }) {
  const t = useMessages(messages);
  const lang = useLang();
  // Same rule as `LineMore`: other numbers, or a self-service route that isn't already on the card.
  const more = !!line.alt?.length || (!!line.selfServe && line.org !== 'cra' && line.org !== 'cafc');
  return (
    <div className={cn('px-5 py-5 sm:px-6', !first && 'border-t border-hair')}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3.5">
        <Skeleton className="size-9 rounded-[11px]" />
        <div className="min-w-0">
          <p className="m-0 text-[15.5px] font-semibold leading-snug">
            <Ghost>{line.name[lang]}</Ghost>
          </p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug">
            <Ghost>{line.covers[lang]}</Ghost>
          </p>
        </div>
        <div className="col-span-2 min-w-0 @lg:col-span-1 @lg:col-start-2">
          <Skeleton className="mt-2.5 h-6 w-52 rounded-full" />
          {line.number ? (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex min-h-11 items-center">
                  <Skeleton className={first ? 'h-9 w-60 @lg:w-64' : 'h-7 w-48'} />
                </span>
                <span className="flex gap-2 @xl:ms-auto">
                  <Skeleton className="h-11 w-[88px] rounded-full" />
                  <Skeleton className="size-11 rounded-full @sm:w-[92px]" />
                </span>
              </div>
              {same ? (
                <p className="m-0 mt-2 text-[13px] leading-snug">
                  <Ghost>{t('hours.same', { name: same })}</Ghost>
                </p>
              ) : (
                <>
                  {/* One 18px text line each: agents (Eastern-time lines wrap their "(… Eastern)" aside on phones), then automated. */}
                  <div className="mt-2">
                    <span className="flex h-[18px] items-center">
                      <Skeleton className="h-3.5 w-11/12 @lg:w-3/4" />
                    </span>
                    {line.agents?.zone === 'ET' ? (
                      <span className="flex h-[18px] items-center @lg:hidden">
                        <Skeleton className="h-3.5 w-1/3" />
                      </span>
                    ) : null}
                    {line.automated ? (
                      <span className="mt-1 flex h-[18px] items-center">
                        <Skeleton className="h-3.5 w-2/3 @lg:w-1/2" />
                      </span>
                    ) : null}
                  </div>
                  {/* The day bar: the "now" label's room, the track, the clock labels and (first bar) the legend. */}
                  <div className="mt-3 pb-1 pt-5">
                    <Skeleton className="h-2.5 w-full rounded-full" />
                    <span className="mt-1.5 flex h-4 items-center justify-between">
                      <Skeleton className="h-2.5 w-12" />
                      <Skeleton className="h-2.5 w-8" />
                      <Skeleton className="h-2.5 w-12" />
                    </span>
                    {legend ? (
                      <span className="mt-2 flex h-3 items-center gap-4">
                        <Skeleton className="h-2.5 w-16" />
                        {line.automated ? <Skeleton className="h-2.5 w-28" /> : null}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
              {/* "N more options", as the closed `Disclosure` draws it. */}
              {more ? (
                <div className="mt-3 border-t border-hair">
                  <span className="flex min-h-14 items-center justify-between gap-3">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="size-9 shrink-0" round />
                  </span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-11 w-60 rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" />
              <p className="m-0 w-full text-[13px] leading-snug">
                <Ghost>{t(`web.why.${line.org}`)}</Ghost>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DirectorySkeleton({ topic }: { topic?: Topic | 'all' }) {
  const t = useMessages(messages);
  const tp = topic && TOPIC_LINES[topic] ? topic : 'all';
  const ids = TOPIC_LINES[tp];
  const compact = ids.length > 3;
  const limited = compact && ids.length > 5;
  const phones = ids.filter((id) => LINES[id].number);
  const legendId = phones[0];
  const lang = useLang();
  /** The earlier row whose published hours this one repeats (the real card then says "Same hours as …"). */
  const sameAs = (id: LineId, i: number) => {
    const x = LINES[id];
    if (!x.number || !x.agents) return undefined;
    const twin = ids.slice(0, i).find((y) => LINES[y].number && sameHours(x.agents, LINES[y].agents) && (x.automated ? sameHours(x.automated, LINES[y].automated) : !LINES[y].automated));
    return twin ? LINES[twin].name[lang] : undefined;
  };
  const filters = tp === 'service-canada' ? ['all', 'service-canada', ...FILTERS.slice(1)] : FILTERS;

  return (
    <Frame icon={Phone} tone="pine" title={t('dir.title')} subtitle={t('dir.loadingSub')} label={t('dir.loading')}>
      {/* Phone-width windows: the open/closed badge leads the body (the header has no room for it). */}
      {phones.length > 1 || (phones.length === 1 && ids.length === 1) ? (
        <div className="-mt-1 mb-3 flex h-[26px] items-center px-5 sm:hidden">
          <Skeleton className="h-6 w-40 rounded-full" />
        </div>
      ) : null}

      <Notices ids={ids} />

      <div className="mt-3 flex gap-1 overflow-hidden px-5 sm:px-6">
        {filters.map((f) => (
          <span key={f} className="flex min-h-11 shrink-0 items-center">
            <span className={cn('inline-flex h-8 items-center whitespace-nowrap rounded-full border border-transparent px-[11px] text-[13px] font-medium text-transparent', f === tp ? 'bg-hair-2' : 'shimmer')}>
              {t(`topic.${f}`)}
            </span>
          </span>
        ))}
      </div>

      {craLeads(ids) ? (
        <div className="mt-1 px-5 sm:px-6">
          <span className="flex min-h-11 items-center gap-2.5 text-[13.5px] leading-snug">
            <Skeleton className="size-4 shrink-0" round />
            <span className="min-w-0">
              <Ghost>{t('tryFirst.title')}</Ghost>
            </span>
            <span className="size-3.5 shrink-0" />
          </span>
        </div>
      ) : null}

      {compact ? (
        <>
          <div className="mt-3 grid gap-2.5 px-5 sm:px-6 @xl:grid-cols-2">
            {ids.map((id, i) => (
              <CardGhost key={id} line={LINES[id]} className={limited && i >= 4 ? '@max-xl:hidden' : undefined} />
            ))}
          </div>
          {limited ? (
            <div className="mt-2 px-5 sm:px-6 @xl:hidden">
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-1">
          {ids.map((id, i) => (
            <RowGhost key={id} line={LINES[id]} first={i === 0} legend={id === legendId} same={sameAs(id, i)} />
          ))}
        </div>
      )}

      {/* The accessibility options, as the closed `Disclosure` draws them. */}
      <div className={cn('mx-5 border-t border-hair sm:mx-6', compact ? 'mt-4' : 'mt-1')}>
        <span className="flex min-h-14 items-center gap-3 py-2">
          <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-semibold leading-snug">
            <Skeleton className="size-4 shrink-0" round />
            <Ghost>{t('a11y.toggle')}</Ghost>
          </span>
          <Skeleton className="size-9 shrink-0" round />
        </span>
      </div>

      <div className="mx-5 mt-1 flex flex-wrap gap-x-6 text-[13.5px] leading-snug sm:mx-6">
        <span className="flex min-h-11 items-center gap-2">
          <Skeleton className="size-4" round />
          <Ghost>
            {t('urgentStrip.danger')} {URGENT['911'].number}
          </Ghost>
        </span>
        <span className="flex min-h-11 items-center gap-2">
          <Skeleton className="size-4" round />
          <Ghost>
            {t('urgentStrip.crisis')} {URGENT['988'].number}
          </Ghost>
        </span>
      </div>

      <ShellFooter quiet={t('dir.handoff')} />
    </Frame>
  );
}
