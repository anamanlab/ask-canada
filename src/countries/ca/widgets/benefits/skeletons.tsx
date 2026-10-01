'use client';
/**
 * Loading states that mirror the finished layouts block for block (hero, chips, cards, sliders, charts, actions,
 * sources), so the chat doesn't jump when the output arrives. Each block has the height of the real one, measured
 * against the lab fixtures at 390px and 1440px; `@max-md:` values are the phone layout.
 * Here: the shared shell and the finder. The estimators' are in ./estimator/skeleton.tsx.
 */
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';

export type Head = { title: string; subtitle?: string; icon: LucideIcon; tone: WidgetTone; label: string };

/** French runs ~20% longer: a few blocks wrap to one more line (measured the same way). */
export const useLong = () => useLocale().locale === 'fr';

function Header({ title, subtitle, icon, tone, badge }: Omit<Head, 'label'> & { badge?: boolean }) {
  return (
    <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
      <WidgetIcon icon={icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
        {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
      </div>
      {badge ? <Skeleton className="hidden h-[26px] w-40 shrink-0 sm:block" round /> : null}
    </header>
  );
}

/** One line of text: the line box at its real height, with a bar inside. */
export function Line({ h, w, className, bar = 'h-3' }: { h: string; w: string; className?: string; bar?: string }) {
  return (
    <span className={cn('flex items-center', h, className)}>
      <Skeleton className={cn(bar, w, 'max-w-full')} />
    </span>
  );
}

/** `long`: a footnote that runs to 3 lines on phones (the finder's, in French). */
export function Shell({ head, badge, children, source = 'wide', long = false }: { head: Head; badge?: boolean; children: React.ReactNode; source?: 'wide' | 'narrow'; long?: boolean }) {
  const { label, ...rest } = head;
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <Header {...rest} badge={badge} />
      <div role="status">
        <span className="sr-only">{label}</span>
      </div>
      <div aria-hidden>
        {children}
        <Actions long={long} />
        <Sources wide={source === 'wide'} />
      </div>
    </Card>
  );
}

/** Primary handoff + secondary action + note, then the footnote (full-width buttons on phones). */
function Actions({ long }: { long: boolean }) {
  return (
    <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <Skeleton className="h-12 w-full rounded-full sm:w-52" />
        <Skeleton className="h-12 w-full rounded-full sm:w-44" />
        <Line h="h-[18px]" w="w-48" className="ms-auto max-sm:ms-0 max-sm:w-full" />
      </div>
      <div className="mt-3">
        <Line h="h-5" w="w-full sm:w-96" />
        <Line h="h-5" w={long ? 'w-full' : 'w-24'} className="sm:hidden" />
        {long ? <Line h="h-5" w="w-24" className="sm:hidden" /> : null}
      </div>
    </div>
  );
}

/** The source footer: source link, then "Checked …" (on its own row unless the title is short). */
function Sources({ wide }: { wide: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-paper-2 px-5 py-3 sm:px-6">
      <span className={cn('flex h-8 max-w-full shrink-0 items-center gap-2.5', wide ? 'w-[30rem]' : 'w-[22rem]')}>
        <Skeleton className="size-5 shrink-0 rounded-[6px]" />
        <Skeleton className="h-3 min-w-0 flex-1" />
      </span>
      <Line h="h-[19px]" w="w-[14.5rem]" />
    </div>
  );
}

/* ------------------------------------------------------------------ finder */

const CHIPS = ['w-16', 'w-[3.625rem]', 'w-[4.0625rem]', 'w-20', 'w-[7.5rem]'];

/** A program card: icon + title (+ badge), reason, amount, then the footer with the actions. */
function ProgramCardSkeleton({ lines, phoneLines }: { lines: number; phoneLines: number }) {
  return (
    <div className="rounded-tile border border-hair px-4 py-4">
      <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-2 @md:grid-cols-[2.5rem_minmax(0,1fr)_auto] @md:gap-y-0">
        <Skeleton className="col-start-1 row-start-1 size-10 rounded-field @md:row-span-2" />
        <span className="col-start-2 row-start-1 flex min-h-10 items-center gap-2 @md:min-h-0">
          <Line h="h-[21px]" w="w-44" bar="h-3.5" />
          <Skeleton className="h-5 w-14" round />
        </span>
        <div className="col-span-2 col-start-1 row-start-2 @md:col-span-1 @md:col-start-2 @md:mt-1">
          {Array.from({ length: Math.max(lines, phoneLines) }, (_, i) => (
            <Line key={i} h="h-[19px]" w={i === Math.max(lines, phoneLines) - 1 ? 'w-3/5' : 'w-full'} className={i >= lines ? '@md:hidden' : i >= phoneLines ? '@max-md:hidden' : undefined} />
          ))}
        </div>
        <div className="col-span-2 col-start-1 row-start-3 @md:col-span-1 @md:col-start-3 @md:row-span-2 @md:row-start-1 @md:ps-3">
          <Line h="h-[25px]" w="w-28" bar="h-4" className="@md:justify-end" />
          <Line h="h-[19px]" w="w-20" className="mt-0.5 @md:justify-end" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hair pt-2 @md:ps-[3.375rem]">
        <Line h="h-[19px] @md:h-11" w="w-40" />
        <span className="flex items-center gap-1.5 @max-md:w-full @max-md:justify-between @md:ms-auto">
          <Skeleton className="h-9 w-28 rounded-chip" />
          <Line h="h-11" w="w-24" />
        </span>
      </div>
    </div>
  );
}

export function FinderSkeleton({ label, ...head }: Head) {
  const long = useLong();
  return (
    <Shell head={{ label, ...head }} badge long={long}>
      {/* Hero: total, per month, "plus", mix bar + legend, answer chips (a dashed assumed one + Edit), next payment. */}
      <div className="mx-3 rounded-card border border-hair px-5 py-5 @xl:mx-4">
        <Line h="h-[22px]" w="w-36" />
        <Skeleton className="mt-1 h-[46px] w-56" />
        <Line h="h-[22px]" w="w-60" className="mt-2" />
        <Line h="h-[22px]" w="w-72" className="mt-0.5" />
        {long ? <Line h="h-[22px]" w="w-40" /> : null}
        <Skeleton className="mt-4 h-2.5 w-full" round />
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          <Line h="h-[19px]" w="w-[11.25rem]" />
          <Line h="h-[19px]" w="w-[17.25rem]" />
          {long ? <Line h="h-[19px]" w="w-32" className="@md:hidden" /> : null}
        </div>
        <div className="mt-4 border-t border-hair pt-3.5">
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((w) => (
              <Skeleton key={w} className={cn('h-[27px]', w)} round />
            ))}
            <span className="h-[27px] w-48 rounded-chip border border-dashed border-hair-2" />
            <Skeleton className="h-7 w-[7.625rem]" round />
            {long ? <Skeleton className="h-[27px] w-36 @md:hidden" round /> : null}
          </div>
          <div className="pt-3">
            <Line h="h-5" w="w-80" />
            <Line h="h-5" w="w-32" className="@md:hidden" />
          </div>
        </div>
      </div>

      {/* Programs: heading + count, three cards, the tax-filing notice. */}
      <div className="px-5 pt-5 @xl:px-6">
        <div className="mb-3.5 flex justify-between">
          <Line h="h-[19px]" w="w-32" />
          <Line h="h-[19px]" w="w-16" />
        </div>
        <div className="mb-3 grid gap-2.5">
          <ProgramCardSkeleton lines={1} phoneLines={long ? 3 : 1} />
          <ProgramCardSkeleton lines={long ? 3 : 2} phoneLines={long ? 7 : 3} />
          <ProgramCardSkeleton lines={long ? 2 : 1} phoneLines={long ? 4 : 2} />
        </div>
        <Skeleton className={cn('h-[68px] w-full rounded-tile', long ? '@max-md:h-[108px]' : '@max-md:h-[88px]')} />
      </div>

      {/* Also checked: the collapsed disclosure (title, what's inside, the round toggle). */}
      <div className="mx-5 mt-5 flex min-h-14 items-center justify-between gap-3 border-t border-hair py-2 @xl:mx-6">
        <div className="min-w-0 flex-1">
          <Line h="h-[21px]" w="w-28" bar="h-3.5" />
          <Line h="h-[19px]" w="w-64" className="mt-0.5" />
          {long ? <Line h="h-[19px]" w="w-24" className="@md:hidden" /> : null}
        </div>
        <Skeleton className="size-9 shrink-0" round />
      </div>

      {/* The estimates / payment dates note. */}
      <div className="px-5 pt-4 @xl:px-6">
        {['w-full', 'w-full', 'w-full', ...(long ? ['w-full'] : []), 'w-2/3'].map((w, i) => (
          <Line key={i} h="h-[17px]" w={w} bar="h-2.5" className={i === 1 ? '@md:w-1/2' : i > 1 ? '@md:hidden' : undefined} />
        ))}
      </div>
    </Shell>
  );
}
