'use client';
/** The holidays list while it loads: same blocks, same heights, so the chat doesn't jump. */
import { CalendarHeart } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';

/**
 * Mirrors the loaded list block for block: the verdict when they asked about one holiday, the hero (date tile, name,
 * days-off strip), place + year, stats, ~10 holidays, disclosure, actions, sources.
 */
export function HolidaysSkeleton({ asked }: { asked?: boolean }) {
  const t = useMessages(messages);
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6">
        <WidgetIcon icon={CalendarHeart} tone="pine" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{t('hol.title')}</p>
          <SkeletonText lines={1} className="mt-1.5 w-28" />
        </div>
      </header>
      <span className="sr-only" role="status">
        {t('hol.loading')}
      </span>
      {asked ? (
        <div className="mx-3 mb-3 rounded-[22px] border border-hair bg-card px-5 py-4 sm:mx-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="mt-3 h-5 w-4/5" />
          <SkeletonText lines={1} className="mt-3 w-3/5" />
        </div>
      ) : null}
      <div className="mx-3 min-h-[372px] rounded-[22px] border border-hair bg-card px-4 py-4 sm:mx-4 sm:px-5 sm:py-5 @md:min-h-[261px]">
        <div className="flex items-center gap-4 sm:gap-5">
          <Skeleton className="h-[98px] w-[76px] shrink-0 rounded-[18px]" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-3 h-6 w-3/5" />
            <Skeleton className="mt-3 h-3.5 w-4/5" />
          </div>
        </div>
        <Skeleton className="mt-5 h-3.5 w-48" />
        <div className="mt-2.5 flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[52px] flex-1 rounded-[12px]" />
          ))}
        </div>
        <SkeletonText lines={1} className="mt-4 w-4/5 @md:hidden" />
      </div>
      <div className="grid items-end gap-3 px-5 pt-5 sm:px-6 @xl:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <SkeletonText lines={1} className="mb-2 w-40" />
          <Skeleton className="h-12 rounded-[14px]" />
        </div>
        <Skeleton className="h-12 rounded-[14px]" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 px-5 pt-4 sm:px-6 @xl:grid-cols-3">
        <Skeleton className="h-[118px] rounded-[16px]" />
        <Skeleton className="h-[118px] rounded-[16px]" />
        <Skeleton className="hidden h-[118px] rounded-[16px] @xl:block" />
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
        <SkeletonText lines={1} className="mb-4 w-36" />
        {/* The province's official list sits on its own line in a narrow column. */}
        <div className="flex h-10 items-start @md:hidden">
          <Skeleton className="h-4 w-44" />
        </div>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex min-h-[74px] items-center gap-3 border-t border-hair py-3 first:border-t-0">
            <Skeleton className="h-[50px] w-[46px] rounded-[12px]" />
            <SkeletonText lines={2} className="flex-1" />
          </div>
        ))}
        <Skeleton className="mt-4 h-14 rounded-[16px]" />
      </div>
      <div className="mt-5 flex min-h-[164px] flex-wrap content-start gap-3 border-t border-hair px-5 pb-5 pt-5 sm:px-6">
        <Skeleton className="h-12 w-full rounded-full sm:w-60" />
        <Skeleton className="h-12 w-full rounded-full sm:w-72" />
        <SkeletonText lines={2} className="mt-2 w-full" />
      </div>
      <div className="h-20 bg-paper-2" />
    </Card>
  );
}
