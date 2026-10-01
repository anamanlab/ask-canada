'use client';
/**
 * Loading state shaped like the appointment card: segmented choice, pine lead card, three step tiles, phone
 * list, chip, handoff and source footer. The lead and the steps are drawn from the card's own copy as
 * shimmering, transparent text, so every line wraps exactly where the loaded card's will (phones, desktop,
 * French) and nothing jumps when the output arrives. No aurora, like the loaded card.
 */
import { CalendarCheck } from 'lucide-react';
import { Card, Skeleton, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Text-shaped shimmer: one rounded bar per wrapped line, same metrics as the real text. */
function Bars({ children }: { children: string }) {
  return <span className="shimmer rounded-[6px] text-transparent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">{children}</span>;
}

/** A WidgetSection heading's line (12px mono caps). */
function SectionLabel({ className }: { className: string }) {
  return (
    <div className="mb-3.5 flex h-[18px] items-center">
      <Skeleton className={cn('h-3', className)} />
    </div>
  );
}

function Rows({ count }: { count: number }) {
  return (
    <div className="overflow-hidden rounded-tile border border-hair">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn('flex min-h-12 items-center gap-3 px-4 py-2.5', i > 0 && 'border-t border-hair')}>
          <Skeleton className="size-4" round />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 @md:flex-row @md:items-center @md:justify-between @md:gap-3">
            <span className="flex h-5 items-center">
              <Skeleton className="h-3 w-24" />
            </span>
            <span className="flex h-[22px] items-center">
              <Skeleton className="h-3.5 w-28" />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export type AppointmentSkeletonCopy = { lead: string; sub: string; steps: string[]; hint: string; programsHint?: string; programs?: number };

export function AppointmentSkeleton({ title, subtitle, label, copy }: { title: string; subtitle: string; label: string; copy: AppointmentSkeletonCopy }) {
  const programs = copy.programs ?? 0;
  return (
    <Card as="section" aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={CalendarCheck} tone="pine" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        <div aria-hidden>
          <div className="px-5 sm:px-6">
            <Skeleton className="h-[158px] w-full rounded-field @[320px]:h-14" />
          </div>
          <div className="mx-5 mt-4 rounded-card border border-pine/15 bg-pine-wash px-5 py-4 sm:mx-6">
            <div className="flex items-start gap-3.5">
              <Skeleton className="size-9 shrink-0" round />
              <div className="min-w-0">
                <p className="m-0 font-serif text-[22px] leading-[1.2] tracking-[-.015em]">
                  <Bars>{copy.lead}</Bars>
                </p>
                <p className="m-0 mt-1.5 text-[14.5px] leading-snug">
                  <Bars>{copy.sub}</Bars>
                </p>
              </div>
            </div>
          </div>
          <section className="px-5 pt-5 sm:px-6">
            <SectionLabel className="w-28" />
            <ul className="m-0 grid list-none gap-2 p-0">
              {copy.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 rounded-tile border border-hair px-3.5 py-3 text-[14.5px] leading-snug">
                  <Skeleton className="mt-0.5 size-4 shrink-0" round />
                  <span>
                    <Bars>{s}</Bars>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
            <SectionLabel className="w-32" />
            {copy.programsHint ? (
              <div className="mb-4">
                <Rows count={programs} />
                <p className="m-0 mt-2 text-[13px] leading-snug">
                  <Bars>{copy.programsHint}</Bars>
                </p>
              </div>
            ) : null}
            <Rows count={2} />
            <p className="m-0 mt-2 text-[13px]">
              <Bars>{copy.hint}</Bars>
            </p>
            <Skeleton className="mt-4 h-11 w-52 rounded-chip" />
          </section>
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-hair px-5 py-5 sm:px-6">
            <Skeleton className="h-12 w-full rounded-chip sm:w-60" />
            <div className="w-full sm:ms-auto sm:w-[28ch]">
              <Skeleton className="my-1 h-2.5 w-full" />
              <Skeleton className="my-1.5 h-2.5 w-2/3" />
            </div>
          </div>
          <div className="h-[83px] bg-paper-2" />
        </div>
      </div>
    </Card>
  );
}
