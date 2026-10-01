'use client';
/** Loading state of the life-event checklist: the same frame and rough height as the output, so nothing jumps. */
import { LayoutGrid } from 'lucide-react';
import { Card, Skeleton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { TONES, type EventId } from './facts';
import messages from './messages';
import { DeviceBadge, EVENT_ICONS } from './parts';

/** Same frame and rough height as the output: a picker grid, or a hero plus the first group of steps. */
export function LifeEventsSkeleton({ event }: { event: EventId | null }) {
  const t = useMessages(messages);
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={event ? EVENT_ICONS[event] : LayoutGrid} tone={event ? TONES[event] : 'glacier'} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{event ? t(`event.${event}.title`) : t('title')}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{event ? t(`event.${event}.subtitle`) : t('subtitle')}</p>
        </div>
        {/* The same badge as the finished widget (WidgetShell shows it from `sm` up), so nothing pops in. */}
        <div className="hidden shrink-0 sm:block">
          <DeviceBadge />
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{t('loading')}</span>
        {event ? (
          <div aria-hidden>
            {/* Hero: the same grid as the real one (status and countdown, the ring beside them, then the date). */}
            <div className="px-5 pt-1 sm:px-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
                <div className="min-w-0">
                  <div className="mb-3 flex h-5 items-center @xl:mb-4">
                    <Skeleton className="h-3.5 w-44" />
                  </div>
                  <div className="flex items-center gap-4 @xl:gap-5">
                    <Skeleton className="h-[84px] w-[68px] rounded-[16px] @xl:h-[106px] @xl:w-[84px]" />
                    <div className="flex-1">
                      <Skeleton className="h-11 w-32 @xl:h-16 @xl:w-44" />
                      <Skeleton className="mt-2.5 h-3.5 w-40" />
                    </div>
                  </div>
                </div>
                <Skeleton className="size-14 self-start @md:size-[76px] @md:self-center" round />
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-t border-hair pt-4">
                <div className="min-w-0 flex-[1_1_14rem]">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-2 h-3 w-full max-w-44" />
                </div>
                <Skeleton className="h-[46px] w-[12.5rem] rounded-field" />
              </div>
            </div>
            {/* The first group open, then the three collapsed headers the output has (the last: no action needed). */}
            <div className="mt-4 px-5 sm:px-6">
              <div className="flex min-h-14 items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-10" />
              </div>
              {SKELETON_ROWS.map((lines, i) => (
                <div key={i} className="flex gap-2.5 border-t border-hair py-3">
                  <Skeleton className="ms-[7px] mt-[9px] size-[26px] shrink-0" round />
                  <div className="ms-1.5 min-w-0 flex-1 pt-[5px]">
                    <div className="flex h-5 items-center">
                      <Skeleton className="h-3 w-36" />
                    </div>
                    <div className="mt-1.5 flex h-[23px] items-center">
                      <Skeleton className="h-4 w-4/5 @md:w-3/5" />
                    </div>
                    <div className="flex h-[23px] items-center @md:hidden">
                      <Skeleton className="h-4 w-2/5" />
                    </div>
                    <div className="mt-1 flex h-[21px] items-center">
                      <Skeleton className={cn('h-3.5', lines > 1 ? 'w-full' : 'w-4/5')} />
                    </div>
                    {/* The next step shows its detail in full; the others keep two lines on a phone, one from @md up. */}
                    <div className={cn('flex h-[21px] items-center', lines === 1 && '@md:hidden')}>
                      <Skeleton className="h-3.5 w-3/5" />
                    </div>
                  </div>
                </div>
              ))}
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex min-h-[52px] items-center justify-between border-t border-hair">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
            {/* Other events: chips that wrap, as in the plan. */}
            <div className="mt-3 border-t border-hair px-5 pt-4 sm:px-6">
              <div className="mb-2.5 flex h-6 items-center">
                <Skeleton className="h-3.5 w-32" />
              </div>
              <div className="flex flex-wrap gap-2">
                {['w-28', 'w-48', 'w-32', 'w-24', 'w-40', 'w-36'].map((w) => (
                  <Skeleton key={w} className={cn('h-11 shrink-0 rounded-full', w)} />
                ))}
              </div>
            </div>
            <SkeletonActions secondary footnote />
            <Skeleton className="h-[81px] w-full rounded-none" />
          </div>
        ) : (
          <div aria-hidden>
            <div className="px-5 pt-1 sm:px-6">
              <Skeleton className="h-[29px] w-72 max-w-full" />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2.5 px-3 sm:px-4 @lg:grid-cols-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className={cn('h-[112px] w-full rounded-[18px]', i === 2 || i === 3 ? '@lg:h-[98px]' : '@lg:h-[117px]')} />
              ))}
            </div>
            <SkeletonActions />
            <Skeleton className="h-[81px] w-full rounded-none @xl:h-[55px]" />
          </div>
        )}
      </div>
    </Card>
  );
}

/** Detail lines per skeleton row: one, and two for the step that's up next (shown in full). */
const SKELETON_ROWS = [2, 1, 1, 1, 1];

/** The shell's action bar: the handoff, then "Copy list" and the footnote (a checklist) or the handoff note (the picker). */
function SkeletonActions({ secondary, footnote }: { secondary?: boolean; footnote?: boolean }) {
  return (
    <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-12 w-52 rounded-full max-sm:w-full" />
        {secondary ? <Skeleton className="h-11 w-32 rounded-full max-sm:w-full" /> : null}
        {secondary ? null : (
          <div className="ms-auto flex h-[35px] w-[28ch] flex-col items-end justify-center gap-2 max-sm:ms-0 max-sm:w-full max-sm:items-start">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )}
      </div>
      {footnote ? (
        <div className="mt-3 flex h-5 items-center">
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
      ) : null}
    </div>
  );
}
