'use client';
import { FileSearch } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Loading state shaped like the finder: search field, count, one form card, the PDF tip and the chips. */
export function FormsSkeleton({ title, subtitle, label }: { title: string; subtitle: string; label: string }) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={FileSearch} tone="pine" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        <div aria-hidden>
          <div className="px-5 sm:px-6">
            <Skeleton className="mb-2 h-[18px] w-44" />
            <Skeleton className="h-11 w-full rounded-field" />
            <Skeleton className="mt-2.5 h-3 w-24" />
          </div>
          <div className="px-5 pt-5 sm:px-6">
            <div className="rounded-tile border border-hair bg-card p-4 shadow-sm">
              <div className="flex flex-col items-start gap-2.5 @md:flex-row @md:gap-3.5">
                <Skeleton className="h-8 w-16 shrink-0 rounded-field @md:h-9" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-2/5 @xl:hidden" />
                  <SkeletonText lines={2} className="mt-3 @xl:hidden" />
                  <SkeletonText lines={2} className="mt-3 hidden @xl:flex" />
                  <Skeleton className="mt-2.5 h-5 w-12 rounded-full" />
                </div>
              </div>
              <Skeleton className="mt-3 h-11 w-full rounded-field" />
              <div className="mt-3 flex flex-wrap gap-2">
                <Skeleton className="h-11 flex-[1_1_9rem] rounded-full @md:w-36 @md:flex-none" />
                <Skeleton className="h-11 flex-[1_1_9rem] rounded-full @md:w-32 @md:flex-none" />
              </div>
            </div>
          </div>
          <div className="px-5 pt-4 sm:px-6">
            <Skeleton className="h-[136px] w-full rounded-tile @xl:h-[92px]" />
          </div>
          <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
            <Skeleton className="mb-3.5 h-3 w-28" />
            <div className="flex flex-wrap gap-2">
              {['w-40', 'w-44', 'w-36'].map((w) => (
                <Skeleton key={w} className={cn('h-11 rounded-full', w)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="h-11 bg-paper-2" aria-hidden />
    </Card>
  );
}
