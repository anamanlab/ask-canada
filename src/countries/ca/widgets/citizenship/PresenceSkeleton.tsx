'use client';
/** Loading states for the days calculator: the full calculator and the first-run "when did you become a PR?" card. */
import { Skeleton, SkeletonText } from '@/components/ui';
import { FieldBlock, Pad } from './skeleton-parts';

/** What the streamed input already tells us about the final layout. */
export type ShapeHints = { trips?: number; temp?: boolean };

/** A closed disclosure: title, one-line summary, chevron. */
const Fold = () => (
  <div className="flex min-h-14 items-center gap-3 border-t border-hair py-2 @max-md:min-h-[76px]">
    <div className="min-w-0 flex-1">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-3/5" />
    </div>
    <Skeleton className="size-9 shrink-0" round />
  </div>
);

/**
 * Sized from the streamed input: one row per trip (up to 4) and the legend entries the answer will have.
 * Each block mirrors the rendered one (hero, timeline with its legend, trip group, the two folded sections).
 */
export function Presence({ trips = 0, temp = false }: ShapeHints) {
  const legend = 2 + (temp ? 1 : 0) + (trips ? 1 : 0);
  return (
    <>
      <div className="mx-3 rounded-card border border-hair px-5 py-6 sm:mx-4 @md:px-7 @md:py-7">
        <div className="flex flex-col items-center gap-4 @md:flex-row @md:gap-6">
          <Skeleton className="size-[112px] shrink-0 @md:size-[128px]" round />
          <div className="flex min-w-0 flex-col items-center @md:flex-1 @md:items-start">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-3 h-9 w-56 @md:h-11 @md:w-72" />
            <Skeleton className="mt-3.5 h-[22px] w-24 rounded-full" />
          </div>
        </div>
        <div className="mt-5 flex flex-col items-center @md:items-start">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-2 h-4 w-1/2 @xl:hidden" />
          {/* IRCC's advice to apply with a margin, under the earliest date. */}
          <Skeleton className="mt-3 h-3.5 w-3/4" />
          <Skeleton className="mt-2 h-3.5 w-2/3 @xl:hidden" />
          <Skeleton className="mt-2 h-3.5 w-1/3 @md:hidden" />
        </div>
      </div>
      <Pad className="pt-7">
        <div className="flex h-[18px] items-center">
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="relative mt-2.5 h-[68px]">
          <Skeleton className="absolute inset-x-0 top-[18px] h-[30px] w-full rounded-field" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 @xl:grid-cols-4">
          {Array.from({ length: legend }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="mt-2.5 h-6 w-14" />
            </div>
          ))}
        </div>
      </Pad>
      <Pad className="mt-7 border-t border-hair pt-5">
        <Skeleton className="mb-4 h-3 w-40" />
        <Skeleton className="-mt-1 mb-3 h-3 w-32 @md:hidden" />
        {trips > 0 ? (
          <div className="divide-y divide-hair rounded-tile border border-hair">
            {Array.from({ length: Math.min(trips, 4) }, (_, i) => (
              <div key={i} className="flex h-[68px] items-center gap-3 px-3.5 @md:h-[52px]">
                <Skeleton className="size-4 shrink-0" round />
                <Skeleton className="h-3.5 w-2/5" />
              </div>
            ))}
          </div>
        ) : (
          <Skeleton className="h-[106px] w-full rounded-tile @md:h-[68px]" />
        )}
        <div className="mt-4 grid gap-2.5 @md:grid-cols-[1fr_1fr_auto] @md:items-end">
          <FieldBlock />
          <FieldBlock />
          <Skeleton className="h-11 w-full rounded-full @md:w-32" />
        </div>
      </Pad>
      <Pad className="mt-6">
        <Fold />
        <Fold />
      </Pad>
    </>
  );
}

export function PresenceSetup() {
  return (
    <>
      <Pad className="pt-2">
        <div className="rounded-card border border-hair p-5">
          <Skeleton className="h-7 w-3/4" />
          <SkeletonText lines={2} className="mt-3" />
          <div className="mt-5 @md:max-w-[320px]">
            <FieldBlock />
          </div>
          <Skeleton className="mt-5 h-12 w-full" />
          <Skeleton className="mt-5 h-11 w-full rounded-full @md:w-36" />
        </div>
      </Pad>
      <Pad className="mt-6">
        <Fold />
      </Pad>
    </>
  );
}
