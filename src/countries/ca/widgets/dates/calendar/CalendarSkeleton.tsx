'use client';
/** The key dates calendar while its dates load: same blocks, same heights, so the chat doesn't jump. */
import type { ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { cap } from '../parts';
import type { CalendarInput } from '../types';
import { TILES_FOLDED, TILE_GRID, tileClass, tileSpans } from './layout';

/**
 * Mirrors the loaded layout block for block (hero, next-for-each tiles, filters, month grid + 5-date agenda,
 * wait-time note, actions and source footer) so the chat doesn't jump when the dates arrive.
 */
export function CalendarSkeleton({ focus }: { focus?: CalendarInput['focus'] }) {
  const t = useMessages(messages);
  const payments = focus !== 'taxes' && focus !== 'holidays';
  // The same words the loaded header will carry: "Tax deadlines" for a taxes-only calendar.
  const subtitle = focus && focus !== 'all' ? cap(t(`cal.sub.${focus}`)) : t('cal.subtitle');
  // Eight tiles for the usual calendar (two full rows of four), the four tax deadlines for a taxes-only one.
  const tiles = payments ? 8 : focus === 'taxes' ? 4 : 3;
  const spans = tileSpans(tiles);
  // Same fold as the loaded chips: 4 programs + "N more" + taxes + holidays in a narrow column, all 11 when wide.
  const chipW = ['w-36', 'w-52', 'w-44', 'w-24', 'w-40', 'w-36', 'w-36', 'w-40', 'w-44', 'w-40', 'w-32'];
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6">
        <WidgetIcon icon={CalendarDays} tone="maple" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{t('title')}</p>
          <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div className="px-3 sm:px-4" role="status">
        <span className="sr-only">{t('cal.loading')}</span>
        <Skeleton className="h-[181px] w-full rounded-[22px] @md:h-[167px]" />
      </div>
      <div className="px-5 pt-4 sm:px-6">
        <SkeletonText lines={1} className="mb-3 w-28" />
        <div className={TILE_GRID}>
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} className={cn('h-[84px] rounded-[14px]', tileClass(spans, i), i >= TILES_FOLDED && '@max-md:hidden')} />
          ))}
        </div>
        {tiles > TILES_FOLDED ? <Skeleton className="mt-2 h-11 rounded-full @md:hidden" /> : null}
      </div>
      <div className="mt-5 border-t border-hair px-5 pb-1 pt-5 sm:px-6">
        {/* Phone width: the "Customize" row; wider: the chips and the province. */}
        <Skeleton className="h-14 rounded-[16px] @md:hidden" />
        <div className="@max-md:hidden">
        <SkeletonText lines={1} className="mb-4 w-32" />
        <div className="flex flex-wrap gap-2">
          {chipW.map((w, i) => (
            <Skeleton key={i} className={cn('h-11 shrink-0 rounded-full', w, i >= 7 && '@max-xl:hidden')} />
          ))}
        </div>
        <SkeletonText lines={1} className="mb-2 mt-5 w-40" />
        <Skeleton className="h-12 max-w-[340px] rounded-[14px]" />
        </div>
      </div>
      <div className="mt-5 grid gap-x-7 gap-y-5 border-t border-hair px-5 pt-5 sm:px-6 @xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <Skeleton className="h-[330px] rounded-[18px]" />
        <div>
          <SkeletonText lines={1} className="mb-4 mt-3 w-20" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex min-h-[76px] items-center gap-3 border-t border-hair py-2 first:border-t-0 @xl:min-h-[74px]">
              <Skeleton className="h-[50px] w-[46px] rounded-[12px]" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
          ))}
          <Skeleton className="mt-1 h-11 rounded-full" />
        </div>
      </div>
      <div className="grid gap-2.5 px-5 pt-5 sm:px-6">
        {/* Today's live CRA notice (the usual case while that alert is up) and the wait-time note, each shaped like
            the notice it stands for: icon, headline, lines and rows. */}
        {payments ? (
          <>
            <NoticeSkeleton className="min-h-[395px] @md:min-h-[215px]">
              <SkeletonText lines={1} className="w-40" />
              <Skeleton className="mt-3 h-4 w-3/5" />
              {[1, 2, 1].map((lines, i) => (
                <SkeletonText key={i} lines={lines} className="mt-3" />
              ))}
              <Skeleton className="mt-4 h-3.5 w-44" />
            </NoticeSkeleton>
            {/* "If a payment is late", closed. */}
            <NoticeSkeleton className="min-h-14 items-center py-3">
              <Skeleton className="h-4 w-48" />
            </NoticeSkeleton>
          </>
        ) : null}
        <SkeletonText lines={1} className="mt-1 w-3/4" />
      </div>
      <div className="mt-5 flex min-h-[245px] flex-wrap content-start gap-3 border-t border-hair px-5 pb-5 pt-5 sm:min-h-[167px] sm:px-6">
        <Skeleton className="h-12 w-full rounded-full sm:w-52" />
        <Skeleton className="h-12 w-full rounded-full sm:w-64" />
        <SkeletonText lines={2} className="mt-2 w-full" />
      </div>
      <div className="h-[83px] bg-paper-2 sm:h-14" />
    </Card>
  );
}

/** A notice-shaped placeholder: tinted card, round icon, then its lines. */
function NoticeSkeleton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex gap-3 rounded-[16px] border border-hair bg-card px-4 py-3.5', className)}>
      <Skeleton round className="size-[18px] shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
