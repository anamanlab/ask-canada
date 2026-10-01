'use client';
/**
 * Loading states shaped like the finished widgets (hero panel, hourly strip, day rows / alert cards /
 * AQHI scale), so nothing jumps when live data arrives.
 */
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon, type WidgetTone } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';

/**
 * The shell's header over a custom body. `WidgetSkeleton` from the kit draws generic rows; these bodies are
 * shaped like each finished weather card instead.
 */
function Frame({ icon, tone, title, subtitle, label, children }: { icon: LucideIcon; tone: WidgetTone; title: string; subtitle: string; label?: string; children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label ?? t('widget.loading')}</span>
        {children}
      </div>
    </Card>
  );
}

const Label = () => <Skeleton className="mb-3.5 h-3 w-28" />;

export function ForecastSkeleton(props: { icon: LucideIcon; title: string; subtitle: string; label?: string }) {
  return (
    <Frame tone="glacier" {...props}>
      <div className="mx-3 sm:mx-4">
        <Skeleton className="h-[236px] w-full rounded-[22px] @xl:h-[252px]" />
      </div>
      <div className="px-5 pt-5 sm:px-6">
        <Label />
        <div className="flex gap-1 overflow-hidden">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="flex w-[58px] shrink-0 flex-col items-center gap-2 py-2.5">
              <Skeleton className="h-3 w-9" />
              <Skeleton className="size-6" round />
              <span className="h-3" />
              <Skeleton className="h-5 w-8" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-hair px-5 pb-5 pt-5 sm:px-6">
        <Label />
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex min-h-[52px] items-center gap-3 border-t border-hair first:border-t-0">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="size-[22px]" round />
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-3.5 w-8" />
          </div>
        ))}
      </div>
      {/* Today in detail: six tiles, 2 × 3 on phones and 3 × 2 in a wide column. */}
      <div className="border-t border-hair px-5 pb-6 pt-5 sm:px-6">
        <Label />
        <div className="grid grid-cols-2 gap-2.5 @xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            // Phone-width tiles wrap their notes onto a second line, so they run a little taller.
            <Skeleton key={i} className="h-[104px] rounded-tile @xl:h-[92px]" />
          ))}
        </div>
      </div>
      <Footer />
    </Frame>
  );
}

/**
 * The shell's handoff row and source strip. The forecast has a secondary pill and a footnote; alerts and air
 * quality have one pill and its note.
 */
function Footer({ full = true, noteLines = 1, second = false }: { full?: boolean; noteLines?: 1 | 2; second?: boolean }) {
  return (
    <>
      <div className={full ? 'border-t border-hair px-5 pb-5 pt-6 sm:px-6' : 'mt-5 border-t border-hair px-5 py-5 sm:px-6'}>
        <div className="flex flex-col items-start gap-3 sm:flex-row">
          <Skeleton className="h-12 w-full rounded-full sm:w-40" />
          {full || second ? <Skeleton className="h-12 w-48 rounded-full" /> : null}
        </div>
        <Skeleton className="mt-4 h-3 w-72 max-w-full sm:hidden" />
        {noteLines === 2 && !full ? <Skeleton className="mt-2 h-3 w-48 max-w-full sm:hidden" /> : null}
        {full ? (
          <>
            <Skeleton className="mt-2 h-3 w-52 max-w-full sm:hidden" />
            <Skeleton className="mt-5 h-3 w-80 max-w-full" />
            <Skeleton className="mt-2 h-3 w-40 max-w-full sm:hidden" />
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-hair px-5 py-4 sm:px-6">
        <Skeleton className="size-5" round />
        <Skeleton className="h-3 w-56 max-w-full" />
        <Skeleton className="h-3 w-24 sm:hidden" />
      </div>
    </>
  );
}

export function AlertsSkeleton(props: { icon: LucideIcon; title: string; subtitle: string; label?: string }) {
  // Shaped like the shortest real answer ("no alerts in effect"): status panel, colour-legend row, handoff +
  // sources. Alert cards, when there are some, grow the card below the panel instead of jumping it.
  return (
    <Frame tone="amber" {...props}>
      <div className="mx-3 sm:mx-4">
        {/* The status sentence wraps to three lines in a phone-width column. */}
        <Skeleton className="h-[130px] w-full rounded-[22px] @xl:h-[104px]" />
      </div>
      <div className="mx-5 mt-5 flex h-14 items-center gap-2 border-t border-hair sm:mx-6">
        <Skeleton className="size-4" round />
        <Skeleton className="h-3.5 w-44 max-w-full" />
        <Skeleton className="ms-auto size-9" round />
      </div>
      <Footer full={false} noteLines={2} />
    </Frame>
  );
}

/**
 * `smoke`: the question was about wildfire smoke (the tool input's focus), so the Smoke section's blocks are
 * drawn too: the "no warning" line or alert card, the hotspot card, four tips, the symptoms notice.
 */
export function AirSkeleton({ smoke = false, ...props }: { icon: LucideIcon; title: string; subtitle: string; label?: string; smoke?: boolean }) {
  return (
    <Frame tone="pine" {...props}>
      <div className="mx-3 sm:mx-4">
        <Skeleton className="h-[174px] w-full rounded-[22px]" />
      </div>
      {/* Advice: the common low-risk answer is a sentence (moderate and higher add a 44px toggle above it). */}
      <div className="px-5 pt-5 sm:px-6">
        <Label />
        <SkeletonText lines={2} />
        <Skeleton className="mt-3 h-3 w-64 max-w-full" />
      </div>
      <div className="mt-5 border-t border-hair px-5 pb-6 pt-5 sm:px-6">
        <Label />
        <div className="grid grid-cols-2 gap-2.5 @xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-tile" />
          ))}
        </div>
        <Skeleton className="mt-3 h-3 w-56 max-w-full" />
      </div>
      {smoke ? (
        <div className="border-t border-hair px-5 pb-1 pt-5 sm:px-6">
          <Label />
          <Skeleton className="h-3.5 w-72 max-w-full" />
          <Skeleton className="mt-3 h-[152px] w-full rounded-tile @xl:h-[104px]" />
          <Skeleton className="mt-5 h-4 w-40" />
          <div className="mt-3 grid gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonText key={i} lines={2} className="@xl:[&>*:last-child]:hidden" />
            ))}
          </div>
          <Skeleton className="mt-4 h-[116px] w-full rounded-[16px] @xl:h-[68px]" />
          <Skeleton className="mt-3 h-3 w-64 max-w-full" />
        </div>
      ) : null}
      <Footer full={false} second={smoke} />
    </Frame>
  );
}
