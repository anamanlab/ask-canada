'use client';
/**
 * Loading state shaped like the finder: header (with the live badge on phones), filter, map and legend, three
 * rows + "show more", the "good to know" line, the outlined handoff and the source footer. Each text line is a box at the
 * loaded text's line height, so the card keeps its height when the output arrives. The nearest office's
 * details are open, as in the finder: its address under the name, then the services and actions.
 */
import { MapPin } from 'lucide-react';
import { Card, Skeleton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';

/** One line of text: a box `box` tall (the line height) holding a shimmer bar. */
function Line({ w, box = 'h-[19px]', bar = 'h-3', className }: { w: string; box?: string; bar?: string; className?: string }) {
  return (
    <span className={cn('flex items-center', box, className)}>
      <Skeleton className={cn(bar, w)} />
    </span>
  );
}

function Row({ open, first, services = true }: { open?: boolean; first?: boolean; services?: boolean }) {
  return (
    <div className={cn(!first && 'border-t border-hair')}>
      <div className="flex items-start gap-3 px-3 py-4">
        <Skeleton className="mt-px size-7 shrink-0" round />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <Line w="w-2/5" box="h-6" bar="h-4" className="flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Line w="w-4/5" className="mt-1" />
          {open ? (
            <div className="mt-1.5">
              <Line w="w-1/3" box="h-[21px]" />
              <Line w="w-1/4" box="h-[21px]" />
            </div>
          ) : (
            <Line w="w-1/2" className="@xl:hidden" />
          )}
          <Line w="w-1/3" className="mt-2" />
          {services && !open ? <Line w="w-40" box="h-[18px]" bar="h-2.5" className="mt-1.5" /> : null}
        </div>
      </div>
      {open ? (
        <div className="px-3 pb-4 @md:ps-[52px]">
          <Line w="w-36" box="h-[18px]" />
          <div className="mt-2 grid gap-1.5 @xl:grid-cols-2">
            <Skeleton className="h-[62px] rounded-tile" />
            <Skeleton className="h-[62px] rounded-tile" />
          </div>
          <div className="mt-3 flex h-14 items-center justify-between border-t border-hair">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="size-9" round />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Skeleton className="h-11 w-full rounded-chip @md:w-60" />
            <Skeleton className="h-11 w-28 rounded-chip" />
            <Skeleton className="h-11 w-20 rounded-chip" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FinderSkeleton({ title, label }: { title: string; label: string }) {
  return (
    <Card as="section" aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={MapPin} tone="maple" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          <Line w="w-48" className="mt-0.5" />
          <Skeleton className="mt-1.5 h-[22px] w-28 rounded-chip sm:hidden" />
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        <div aria-hidden>
          <div className="px-5 sm:px-6">
            <Skeleton className="h-[99px] w-full rounded-field @md:h-[52px] @xl:h-14" />
          </div>
          <div className="px-5 pt-4 sm:px-6">
            <Skeleton className="h-[272px] w-full rounded-tile @xl:h-[320px]" />
            <div className="mt-2.5">
              <Line w="w-4/5 @xl:w-1/2" box="h-[22px]" />
              <Line w="w-1/4" box="h-[22px]" className="@xl:hidden" />
            </div>
          </div>
          <div className="px-5 pt-3 sm:px-6">
            <Row first open />
            <Row />
            <Row services={false} />
            <div className="mt-1 flex min-h-11 items-center gap-2.5 border-t border-hair px-3 py-2.5">
              <Skeleton className="size-7" round />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <div className="flex h-14 items-center justify-between border-t border-hair">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="size-9" round />
            </div>
          </div>
          <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-12 w-full rounded-chip sm:w-60" />
              <div className="w-full sm:ms-auto sm:w-[28ch]">
                <Line w="w-full" box="h-[18px]" bar="h-2.5" />
              </div>
            </div>
            <div className="mt-3">
              <Line w="w-3/4" box="h-5" />
              <Line w="w-1/3" box="h-5" className="@md:hidden" />
            </div>
          </div>
          <div className="h-[83px] bg-paper-2" />
        </div>
      </div>
    </Card>
  );
}
