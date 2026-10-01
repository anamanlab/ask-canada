'use client';
/**
 * Building blocks for the parks loading states (FinderSkeleton, ConditionsSkeleton, PassesSkeleton,
 * CampingSkeleton). Each skeleton mirrors the real layout it stands in for (hero, stat tiles, map, list rows,
 * footer), so nothing jumps when the output arrives.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';

/** A tool input while it streams: any field may be missing or half-typed. */
export type In = { park?: unknown; near?: unknown; province?: unknown; latitude?: unknown; longitude?: unknown } | undefined | null;
export const has = (v: unknown) => typeof v === 'string' && v.trim().length > 0;

export function Frame({ icon, tone, title, subtitle, label, second, footnote, children }: { icon: LucideIcon; tone: WidgetTone; title: string; subtitle: string; label: string; second?: boolean; footnote?: boolean; children: ReactNode }) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {children}
      </div>
      {/* Handoff row + sources footer, as in WidgetShell. */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hair px-5 py-5 sm:px-6">
        <Skeleton className="h-12 w-full rounded-full sm:w-64" />
        {second ? <Skeleton className="h-12 w-40 rounded-full" /> : null}
        {/* The handoff note: under the buttons on phones, or whenever there is a second button. */}
        <SkeletonText lines={2} className={cn('w-full', !second && 'sm:hidden')} />
        {footnote ? <Skeleton className="h-3.5 w-64" /> : null}
        {second ? null : <SkeletonText lines={2} className="ms-auto w-40 max-sm:hidden" />}
      </div>
      {/* Sources footer: source + checked date, on two lines in a phone-width column. */}
      <div className="border-t border-hair bg-paper-2/60 px-5 py-3.5 sm:px-6">
        <div className="flex h-8 items-center">
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="mt-3.5 h-3.5 w-1/3 @xl:hidden" />
      </div>
    </Card>
  );
}

export const Section = ({ title = true, className, children }: { title?: boolean; className?: string; children: ReactNode }) => (
  <div className={cn('px-5 pt-5 sm:px-6 [&+&]:mt-5 [&+&]:border-t [&+&]:border-hair', className)}>
    {title ? <Skeleton className="mb-3.5 h-3 w-40" /> : null}
    {children}
  </div>
);

export const Tiles = ({ n, h = 'h-[124px]', cols = '@xl:grid-cols-3' }: { n: number; h?: string; cols?: string }) => (
  <div className={cn('grid gap-2.5', cols)}>
    {Array.from({ length: n }, (_, i) => (
      <Skeleton key={i} className={cn('w-full rounded-tile', h)} />
    ))}
  </div>
);

export const Rows = ({ n, h = 'h-[60px]', cols = true }: { n: number; h?: string; cols?: boolean }) => (
  <div className={cn('grid gap-1.5', cols && '@xl:grid-cols-2')}>
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className={cn('flex items-center gap-3 rounded-field border border-hair px-3', h)}>
        <Skeleton className="size-9 rounded-[13px]" />
        <SkeletonText lines={2} className="flex-1" />
      </div>
    ))}
  </div>
);

/** Bulletin rows: round icon + two or three lines. */
export const Bulletins = ({ n }: { n: number }) => (
  <div className="grid gap-1">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="flex h-[106px] items-start gap-3 py-2.5 @xl:h-[66px]">
        <Skeleton className="size-7" round />
        <SkeletonText lines={3} className="flex-1 @xl:[&>*:nth-child(3)]:hidden" />
      </div>
    ))}
  </div>
);

export const Chips = ({ n, className }: { n: number; className?: string }) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    {Array.from({ length: n }, (_, i) => (
      <Skeleton key={i} className={cn('h-11 rounded-full', ['w-24', 'w-28', 'w-36', 'w-32', 'w-24', 'w-20', 'w-28'][i % 7])} />
    ))}
  </div>
);

/** Follow-up actions (ParkActions): a grouped list of rows on phones, a row of pills when wider. */
export const Actions = ({ n, className }: { n: number; className?: string }) => (
  <div className={className}>
    <div className="divide-y divide-hair overflow-hidden rounded-tile border border-hair @xl:hidden">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex h-[49px] items-center gap-3 px-4">
          <Skeleton className="size-[18px] rounded-[6px]" />
          <Skeleton className="h-3.5 w-40" />
        </div>
      ))}
    </div>
    <Chips n={n} className="hidden @xl:flex" />
  </div>
);

export const Hero = ({ h = 'h-[132px] @xl:h-[156px]' }: { h?: string }) => (
  <div className="px-5 sm:px-6">
    <Skeleton className={cn('w-full rounded-card', h)} />
  </div>
);

/** Two columns of icon + two lines ("What to know before you go", checklists). */
export const Tips = ({ n, lines = 3, short }: { n: number; lines?: number; /** One line fewer on wide containers. */ short?: boolean }) => (
  <div className="grid gap-x-5 gap-y-4 @xl:grid-cols-2">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="flex gap-3">
        <Skeleton className="size-8 rounded-[10px]" />
        <SkeletonText lines={lines} className={cn('flex-1', short && '@xl:[&>*:last-child]:hidden')} />
      </div>
    ))}
  </div>
);
