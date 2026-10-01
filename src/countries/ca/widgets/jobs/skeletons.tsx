'use client';
/**
 * Loading states that mirror each jobs tool's real layout (hero, lists, action bar, source footer), so
 * nothing jumps when the output arrives. `ui/WidgetSkeleton` has one generic body; these keep its header and
 * card and swap the body per tool.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';

type SkeletonKind = 'search' | 'wages' | 'wagesRegions' | 'programs' | 'matchUpload' | 'match';

type Props = {
  kind: SkeletonKind;
  title: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  tone: WidgetTone;
  label: string;
  /** Search only: the question names a place, so the answer has no province chart. */
  located?: boolean;
};

/**
 * Heights track the typical output on a wide card. On a phone the search skeleton stops at about one screen
 * (hero and three postings): a city search or an empty result is short, and a tall grey column would collapse.
 */
export function JobsSkeleton({ kind, title, subtitle, icon, tone, label, located }: Props) {
  const wagesKind = kind === 'wages' || kind === 'wagesRegions';
  const rows = (n: number, cls: string) => Array.from({ length: n }, (_, i) => <Skeleton key={i} className={cls} />);
  return (
    <Card as="section" aurora aria-busy="true" className="text-start @container">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status" className="px-5 sm:px-6">
        <span className="sr-only">{label}</span>
        {kind === 'search' ? (
          <>
            <Skeleton className="h-[176px] w-full rounded-tile" />
            {located ? null : (
              <div className="hidden @md:block">
                <Skeleton className="mt-6 h-3 w-40" />
                <div className="mt-4 grid gap-1.5 @xl:grid-cols-2 @xl:gap-x-5">{rows(6, 'h-11 w-full rounded-field')}</div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-10 w-full rounded-full @md:w-[320px]" />
            </div>
            {/* As many chips as fit whole: three on a phone, five on a wide card (nothing cut off at the edge). */}
            <div className="mt-3 flex gap-2">{rows(5, 'h-11 w-24 shrink-0 rounded-chip @md:w-28 nth-[n+4]:hidden @md:nth-[n+4]:block')}</div>
            <div className="mt-3 grid gap-2.5">{rows(5, 'h-[150px] w-full rounded-tile @md:h-[118px] nth-[n+4]:hidden @md:nth-[n+4]:block')}</div>
            <Skeleton className="mx-auto mt-3 hidden h-11 w-36 rounded-full @md:block" />
          </>
        ) : null}
        {kind === 'wages' || kind === 'wagesRegions' ? (
          <>
            <Skeleton className="h-[770px] w-full rounded-tile @2xl:h-[480px]" />
            {/* Tabs when a province was asked about (its regions get the second one), else the section heading. */}
            {kind === 'wagesRegions' ? (
              <div className="mt-6 flex gap-6 border-b border-hair pb-3.5">{rows(2, 'h-4 w-28')}</div>
            ) : (
              <Skeleton className="mt-7 h-3 w-32" />
            )}
            <div className="mt-10 grid gap-1">{rows(5, 'h-[52px] w-full rounded-field @md:h-11')}</div>
            <Skeleton className="mx-auto mt-9 h-5 w-28 rounded-full" />
            <Skeleton className="mx-auto mb-1 mt-6 h-4 w-3/4" />
          </>
        ) : null}
        {kind === 'programs' ? (
          <>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-[92px] w-full rounded-field @lg:h-11" />
            <Skeleton className="mt-4 h-11 w-full" />
            <Skeleton className="mt-4 h-4 w-2/3" />
            <Skeleton className="mt-4 h-[132px] w-full rounded-tile" />
            <div className="mt-4 grid gap-2.5 @xl:grid-cols-2">{rows(6, 'h-[256px] w-full rounded-tile @xl:h-[236px]')}</div>
            <Skeleton className="mt-3 h-11 w-60 rounded-full" />
          </>
        ) : null}
        {kind === 'matchUpload' ? <Skeleton className="mt-1 h-[318px] w-full rounded-tile" /> : null}
        {kind === 'match' ? (
          <>
            <Skeleton className="h-3 w-32" />
            <div className="mt-3 flex flex-wrap gap-1.5">{rows(7, 'h-11 w-28 rounded-chip')}</div>
            <Skeleton className="mt-6 h-3 w-28" />
            <div className="mt-4 grid gap-2.5">{rows(4, 'h-[150px] w-full rounded-tile')}</div>
            <Skeleton className="mt-4 h-[72px] w-full rounded-tile" />
          </>
        ) : null}
      </div>
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-12 w-full rounded-full sm:w-60" />
          {wagesKind ? <Skeleton className="h-12 w-full rounded-full sm:w-40" /> : <Skeleton className="ms-auto h-8 w-48 max-sm:ms-0" />}
        </div>
        <Skeleton className={cn('mt-3 h-3.5 w-4/5', wagesKind && 'h-16 sm:h-8')} />
      </div>
      <div className={cn('h-11 bg-paper-2', wagesKind && 'max-sm:h-20')} />
    </Card>
  );
}
