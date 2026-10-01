'use client';
/**
 * Loading states for the four travel tools. Each one mirrors its widget's real layout (hero, sections,
 * rows, action bar, source footer) at the same breakpoints, so nothing jumps when the output arrives.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';

function Frame({
  icon,
  tone,
  title,
  subtitle,
  label,
  children,
  actions = 2,
  footnote,
}: {
  icon: LucideIcon;
  tone: WidgetTone;
  title: ReactNode;
  subtitle?: ReactNode;
  label: string;
  children: ReactNode;
  /** Buttons in the action bar (handoff, secondary). */
  actions?: 1 | 2;
  /** Height classes of the shell's footnote under the buttons, when the widget has one. */
  footnote?: string;
}) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {children}
      </div>
      {/* Action bar + source footer, as in WidgetShell. */}
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-12 w-full rounded-full sm:w-52" />
          {actions === 2 ? <Skeleton className="h-11 w-full rounded-full sm:w-48" /> : null}
          <SkeletonText lines={2} className="ms-auto w-full sm:w-[28ch] max-sm:ms-0" />
        </div>
        {footnote ? <Skeleton className={cn('mt-3 w-full rounded-[12px]', footnote)} /> : null}
      </div>
      {/* Source footer: the source link and the checked date (on its own line on phones, as WidgetShell wraps it). */}
      <div className="flex flex-col items-start justify-center gap-2 bg-paper-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6" aria-hidden>
        <div className="flex h-8 items-center gap-2.5">
          <Skeleton className="size-5 rounded-[6px]" />
          <Skeleton className="h-3 w-56 max-w-[60vw]" />
        </div>
        <Skeleton className="h-[19px] w-28" />
      </div>
    </Card>
  );
}

/** Section title bar (mono caps), like WidgetSection. */
const SectionHead = () => <Skeleton className="mb-3.5 h-3 w-40" />;

function Hero({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn('mx-3 overflow-hidden rounded-[22px] border border-hair px-5 py-5 sm:mx-4 sm:px-6', className)} aria-hidden>
      {children}
    </div>
  );
}

/** Rows with a hairline between them. */
function Rows({ count, className }: { count: number; className: string }) {
  return (
    <div className="grid gap-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('w-full rounded-[16px]', className)} />
      ))}
    </div>
  );
}

export function AdvisorySkeleton({ icon, title, subtitle, label }: { icon: LucideIcon; title: string; subtitle: string; label: string }) {
  return (
    <Frame icon={icon} tone="glacier" title={title} subtitle={subtitle} label={label}>
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-2 w-9 rounded-full sm:w-11" />
            ))}
          </div>
        </div>
        <Skeleton className="mt-4 h-9 w-48 @xl:h-11" />
        <Skeleton className="mt-3 h-5 w-72 max-w-full" />
        <Skeleton className="mt-2 h-5 w-24 @xl:hidden" />
        <SkeletonText lines={2} className="mt-3 max-w-[62ch]" />
        <SkeletonText lines={3} className="mt-4 max-w-[62ch] @xl:hidden" />
        <Skeleton className="mt-4 hidden h-3 w-64 max-w-full @xl:block" />
      </Hero>
      <div className="px-5 pt-5 sm:px-6">
        <SectionHead />
        <Rows count={2} className="h-[150px] @xl:h-[80px]" />
      </div>
      <div className="px-5 pt-5 sm:px-6" aria-hidden>
        <div className="flex h-11 gap-1 border-b border-hair">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid flex-1 place-items-center">
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
        <div className="pt-4">
          <Skeleton className="h-[180px] w-full rounded-[16px] @xl:h-[104px]" />
          <Skeleton className="mt-3 h-[290px] w-full rounded-[16px] @xl:h-[150px]" />
          <SkeletonText lines={3} className="mt-3" />
        </div>
      </div>
    </Frame>
  );
}

export function DutySkeleton({ icon, title, subtitle, label }: { icon: LucideIcon; title: string; subtitle: string; label: string }) {
  return (
    <Frame icon={icon} tone="glacier" title={title} subtitle={subtitle} label={label}>
      <Hero className="h-[236px] @xl:h-[212px]">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-8 w-56" />
        <SkeletonText lines={2} className="mt-3 max-w-[58ch]" />
        <Skeleton className="mt-6 h-3 w-full rounded-full" />
      </Hero>
      <div className="px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <Skeleton className="h-[68px] w-full rounded-[16px]" />
        <SkeletonText lines={2} className="mt-3" />
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <Skeleton className="h-10 w-full @xl:h-6" />
        <Skeleton className="mt-3 h-8 w-full rounded-full" />
        <Skeleton className="ms-auto mt-2 h-11 w-44" />
        <div className="mt-3 grid gap-2 @xl:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <div className="grid gap-3 @xl:grid-cols-2">
          {/* Stacked in a phone-width column (the tobacco card is the taller one); equal-height cells side by side. */}
          <Skeleton className="h-[280px] w-full rounded-[16px] @xl:h-[305px]" />
          <Skeleton className="h-[339px] w-full rounded-[16px] @xl:h-[305px]" />
        </div>
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <SkeletonText lines={5} />
        <SkeletonText lines={6} className="mt-2.5 @xl:hidden" />
        <Skeleton className="mt-5 h-[150px] w-full rounded-[16px] @xl:h-[84px]" />
        <Skeleton className="mt-2.5 h-[150px] w-full rounded-[16px] @xl:h-[84px]" />
      </div>
    </Frame>
  );
}

export function WaitsSkeleton({ icon, title, subtitle, label }: { icon: LucideIcon; title: string; subtitle: string; label: string }) {
  return (
    <Frame icon={icon} tone="glacier" title={title} subtitle={subtitle} label={label} actions={1} footnote="h-10 max-sm:h-[60px]">
      <div className="grid grid-cols-2 gap-2.5 px-5 sm:px-6 @xl:grid-cols-3" aria-hidden>
        <Skeleton className="h-[129px] w-full rounded-[16px] @xl:h-[112px]" />
        <Skeleton className="h-[129px] w-full rounded-[16px] @xl:h-[112px]" />
        <Skeleton className="hidden h-[112px] w-full rounded-[16px] @xl:block" />
      </div>
      <div className="px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <Skeleton className="h-[52px] w-full rounded-[14px] @xl:w-[340px]" />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-12 rounded-full" />
          ))}
        </div>
        <SkeletonText lines={2} className="mt-2.5 @xl:hidden" />
        {/* The CBSA notice. */}
        <Skeleton className="mt-3 h-[116px] w-full rounded-[16px] @xl:h-[76px]" />
        {/* Eight crossings, the busiest with their wait bar. */}
        <div className="mt-3 divide-y divide-hair">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className={cn('py-3', i < 4 ? 'h-[86px]' : 'h-[72px]')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2.5 h-3 w-52 max-w-full" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
              {i < 4 ? <Skeleton className="mt-2.5 h-1.5 w-full rounded-full" /> : null}
            </div>
          ))}
        </div>
        <Skeleton className="mt-1 h-11 w-28 rounded-full" />
      </div>
    </Frame>
  );
}

/**
 * Emergency help. The channel grid follows the real one: the main line across the row, pairs below, and
 * TTY across the last row (with a destination there's usually one more line: the toll-free number).
 */
export function EmergencySkeleton({ icon, title, subtitle, label, withPlace }: { icon: LucideIcon; title: string; subtitle: ReactNode; label: string; withPlace: boolean }) {
  const pairs = 3;
  return (
    <Frame icon={icon} tone="maple" title={title} subtitle={subtitle} label={label}>
      <Hero className={withPlace ? 'h-[300px] @xl:h-[210px]' : 'h-[190px] @xl:h-[150px]'}>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-3 h-7 w-72 max-w-full" />
        <Skeleton className="mt-4 h-9 w-24" />
        {withPlace ? (
          // Where the local numbers land (police, ambulance…), so the fixed-height hero never looks hollow.
          <div className="mt-3 grid gap-2 @xl:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className={cn('h-11 w-full rounded-[14px]', i === 2 && '@xl:hidden')} />
            ))}
          </div>
        ) : null}
      </Hero>
      <div className="px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <SkeletonText lines={2} className="mb-3" />
        <div className="grid gap-2 @xl:grid-cols-2">
          <Skeleton className="h-[100px] w-full rounded-[16px] @xl:col-span-2 @xl:h-[91px]" />
          {Array.from({ length: pairs * 2 + (withPlace ? 1 : 0) }, (_, i) => (
            <Skeleton key={i} className={cn('h-[80px] w-full rounded-[16px] @xl:h-[88px]', i >= pairs * 2 && '@xl:hidden')} />
          ))}
          <Skeleton className="h-[140px] w-full rounded-[16px] @xl:col-span-2 @xl:h-[88px]" />
        </div>
        <Skeleton className="mt-3 h-3 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2 @xl:hidden" />
      </div>
      {withPlace ? (
        // Canadian offices: two cards, then "Show all".
        <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6" aria-hidden>
          <SectionHead />
          <Rows count={2} className="h-[190px] @xl:h-[152px]" />
          <Skeleton className="mt-2 h-11 w-36 rounded-full" />
        </div>
      ) : null}
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6" aria-hidden>
        <SectionHead />
        <div className="grid gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-[12px] @xl:h-[39px]" />
          ))}
        </div>
        <div className="mt-1 flex flex-col items-start @xl:flex-row @xl:gap-x-6">
          <Skeleton className="h-11 w-56 max-w-full rounded-full" />
          {withPlace ? <Skeleton className="h-11 w-64 max-w-full rounded-full" /> : null}
        </div>
      </div>
    </Frame>
  );
}
