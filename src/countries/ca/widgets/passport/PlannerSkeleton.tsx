'use client';
/**
 * Loading state for the passport planner.
 *
 * The input is known before the output, and the plan is a pure function of it, so the skeleton holds the
 * plan's room with the plan's own parts: it renders the real <Planner> for the input (same `planRenewal`,
 * same blocks, same strings), hidden and inert, and lays the shimmer over it. No measured heights to keep in
 * step with the copy: an expiry month, a trip that needs express pick-up or a fee question each load at the
 * height they will have. The one thing the input can't say is the live canada.ca notice; its room is the
 * shared NOTICE_SLOT the notice block itself keeps as a minimum.
 *
 * Until the reader's date is known (server HTML, the first paint of a restored chat) there is no stand-in
 * plan yet, and the shimmer stands alone.
 */
import { Card, Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { PassportCover } from './PassportCover';
import { FOCUSES, planRenewal } from './plan';
import { Planner } from './Planner';
import { NOTICE_SLOT } from './shared';
import type { PlannerInput } from './types';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH_OR_DAY = /^\d{4}-\d{2}(-\d{2})?$/;

/** The input as far as it has streamed: only complete, valid values count. */
function settled(input?: Partial<PlannerInput>): PlannerInput {
  return {
    expiry: input?.expiry && ISO_MONTH_OR_DAY.test(input.expiry) ? input.expiry : undefined,
    travelDate: input?.travelDate && ISO_DAY.test(input.travelDate) ? input.travelDate : undefined,
    focus: input?.focus && FOCUSES.includes(input.focus) ? input.focus : undefined,
    lang: input?.lang === 'fr' || input?.lang === 'en' ? input.lang : undefined,
    validityYears: input?.validityYears === 5 ? 5 : undefined,
    issuedAt16OrOlder: input?.issuedAt16OrOlder,
    issuedWithin15Years: input?.issuedWithin15Years,
    validFor5or10Years: input?.validFor5or10Years,
    sameDetails: input?.sameDetails,
    livesInCanada: input?.livesInCanada,
  };
}

const Row = () => (
  <div className="flex min-h-14 items-center gap-3 border-t border-hair py-2">
    <div className="flex-1">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-2 h-3 w-4/5 max-w-[420px]" />
    </div>
    <Skeleton className="size-9 shrink-0" round />
  </div>
);

export function PlannerSkeleton({ input }: { input?: Partial<PlannerInput> }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  // The reader's own date, as the plan will use; unknown ('') on the server and while hydrating.
  const today = useToday('');
  const known = settled(input);
  const standIn = today ? planRenewal(known, today) : null;
  // A fee, processing or online question: a short answer card with the planner folded under one row.
  const short = !!known.focus && !known.expiry && !(standIn?.trip && standIn.trip.option !== 'regular');
  return (
    <div className="relative" aria-busy="true">
      {standIn ? (
        // Keyed by the input: the stand-in plan starts over as the input streams in.
        <div key={JSON.stringify(known)} className="invisible" inert aria-hidden>
          <Planner initial={standIn} placeholder />
        </div>
      ) : null}
      <Card as="section" aurora className={cn('@container flex flex-col text-start', standIn && 'absolute inset-0')}>
        <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
          <span className="grid shrink-0 place-items-center">
            <PassportCover />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{t('title')}</p>
            <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{t('subtitle')}</p>
          </div>
        </header>
        <div role="status" className="flex min-h-0 flex-1 flex-col justify-between">
          <span className="sr-only">{t('loading')}</span>

          {/* The answer card */}
          <div className={cn('mx-3 rounded-card border border-hair px-5 py-5 sm:mx-4', short && 'pb-8')}>
            <div className="flex items-start gap-3.5">
              <Skeleton className="size-9 shrink-0" round />
              <div className="flex-1">
                <Skeleton className="h-7 w-4/5 max-w-[340px]" />
                <Skeleton className="mt-2.5 h-4 w-3/5" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2 @xl:hidden" />
                <Skeleton className="mt-2 h-4 w-2/5 @xl:hidden" />
              </div>
            </div>
            {short ? (
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Skeleton className="h-[76px] w-full rounded-tile" />
                <Skeleton className="h-[76px] w-full rounded-tile" />
                <SkeletonText lines={3} className="col-span-2 mt-3" />
              </div>
            ) : null}
          </div>

          {short ? null : (
            <>
              {/* Big number, then the track with its axis (wide) or the dated steps (phones) */}
              <div className="px-5 pt-7 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <Skeleton className="h-11 w-44" />
                  <Skeleton className="h-7 w-44" round />
                </div>
                <div className="mt-9 hidden @xl:block">
                  <Skeleton className="mt-4 h-7 w-full rounded-[10px]" />
                  <div className="mt-4 flex justify-between">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-2.5 w-8" />
                    ))}
                  </div>
                  <Skeleton className="mt-6 h-3 w-40" />
                </div>
                <div className="mt-6 flex flex-col gap-5 @xl:hidden">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3.5">
                      <Skeleton className="size-6 shrink-0" round />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="mt-2 h-3 w-3/5" />
                      </div>
                    </div>
                  ))}
                </div>
                <SkeletonText lines={3} className="mt-5" />
              </div>
              {/* Departure date row */}
              <div className="px-5 pt-5 sm:px-6">
                <Skeleton className="h-[62px] w-full rounded-tile" />
              </div>
              {/* How to apply: the three ways, then the three figures */}
              <div className="px-5 pt-5 sm:px-6">
                <Skeleton className="mb-3.5 h-3 w-28" />
                <Skeleton className="h-[54px] w-full rounded-field" />
                <div className="mt-3.5 grid grid-cols-2 gap-2.5 @xl:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className={cn('h-[132px] w-full rounded-tile', i === 0 && 'col-span-2 @xl:col-span-1')} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* The live notice's room. What the blocks leave of the plan's own height is shared out between them. */}
          <div className={cn('flex flex-col px-5 pt-5 sm:px-6', NOTICE_SLOT[known.lang ?? (locale === 'fr' ? 'fr' : 'en')])}>
            <Skeleton className="w-full flex-1 rounded-[16px]" />
          </div>

          {/* The rows to open: conditions, fine print, checklist (or the folded planner) */}
          <div className="mt-6 px-5 sm:px-6">
            <Row />
            {short ? null : (
              <>
                <Row />
                <Row />
              </>
            )}
          </div>
        </div>

        {/* Buttons, the device note and the source line close the card. */}
        <div className="mt-5 shrink-0">
          <div className="border-t border-hair px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <Skeleton className="h-12 w-52 max-sm:w-full" round />
              <Skeleton className="h-12 w-36 max-sm:w-full" round />
            </div>
            <Skeleton className="mt-4 h-3 w-3/4" />
          </div>
          <div className="h-14 bg-paper-2" />
        </div>
      </Card>
    </div>
  );
}
