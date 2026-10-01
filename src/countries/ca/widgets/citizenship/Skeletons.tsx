'use client';
/**
 * Loading states shaped like each citizenship renderer (hero, meter, lists, forms, actions), so the
 * card is close to its final height before the output arrives and nothing jumps. Same header and frame
 * as the shell's own WidgetSkeleton.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';
import { Presence, PresenceSetup, type ShapeHints } from './PresenceSkeleton';
import { Pad, Row, Section, Steps } from './skeleton-parts';

type SkeletonKind = 'presence' | 'presence-setup' | 'test' | 'steps' | 'ceremony';

function Test() {
  return (
    <Pad>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
      <Skeleton className="mt-6 h-3 w-24" />
      <Skeleton className="mt-3 h-6 w-full" />
      <Skeleton className="mt-2 h-6 w-2/3" />
      <div className="mt-5 grid gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Row key={i} h="h-[52px]" />
        ))}
      </div>
      <Skeleton className="mt-4 h-3 w-1/2" />
      {/* The real test's facts under their label: one line when there is room, a 2x2 grid on phones. */}
      <Skeleton className="mt-7 h-3 w-24" />
      <Skeleton className="mt-3 h-3.5 w-3/4" />
      <Skeleton className="mt-2.5 h-3.5 w-3/4 @2xl:hidden" />
    </Pad>
  );
}

function StepsBody() {
  return (
    <>
      {/* One card of three rows on phones, three tiles from @xl (like Figure). */}
      <Pad>
        <div className="grid rounded-tile border border-hair px-4 @xl:grid-cols-3 @xl:gap-2.5 @xl:border-0 @xl:px-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3 @max-xl:not-first:border-t @max-xl:not-first:border-hair @xl:grid-cols-1 @xl:rounded-tile @xl:border @xl:border-hair @xl:px-4 @xl:pb-4 @xl:pt-4"
            >
              <Skeleton className="col-start-1 row-start-1 h-3 w-24" />
              <Skeleton className="col-start-2 row-span-2 row-start-1 h-7 w-20 @xl:col-start-1 @xl:row-span-1 @xl:row-start-2 @xl:mt-3.5 @xl:h-9 @xl:w-28" />
              <div className="col-start-1 row-start-2 @xl:row-start-3">
                <Skeleton className="mt-2.5 h-3 w-4/5" />
                <Skeleton className="mt-1.5 h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </Pad>
      <Section rule>
        <div className="grid gap-2 @xl:grid-cols-2">
          <Row />
          <Row />
        </div>
        <Skeleton className="mt-3 h-[64px] w-full rounded-tile" />
        <SkeletonText lines={2} className="mt-3" />
      </Section>
      <Section rule>
        <Skeleton className="mb-3 h-3.5 w-44" />
        <Skeleton className="mb-6 h-[54px] w-full rounded-field" />
        <Steps n={7} />
        {/* What the age means, the "already a citizen?" notice and the returned-application line. */}
        <SkeletonText lines={2} className="mt-4" />
        <Skeleton className="mt-4 h-[64px] w-full rounded-tile @max-xl:h-[120px]" />
      </Section>
    </>
  );
}

function Ceremony() {
  return (
    <>
      <Pad>
        <div className="flex flex-wrap gap-2.5">
          <Skeleton className="h-[52px] min-w-[228px] flex-1 rounded-field @xl:flex-none" />
          <Skeleton className="h-[52px] min-w-[220px] flex-1 rounded-field @xl:flex-none" />
        </div>
        <div className="mt-3 rounded-card border border-hair px-5 pb-5 pt-6">
          <Skeleton className="mb-4 h-3 w-44" />
          <div className="grid gap-3">
            {Array.from({ length: 19 }, (_, i) => (
              <Skeleton key={i} className={cn('h-5', ['w-1/3', 'w-2/5', 'w-1/2', 'w-1/4'][i % 4], i === 18 && '@max-xl:hidden')} />
            ))}
          </div>
        </div>
        <Skeleton className="mt-3 h-11 w-48 rounded-full" />
        <SkeletonText lines={2} className="mt-4" />
      </Pad>
      <Section rule>
        <Skeleton className="mb-5 h-11 w-full rounded-field" />
        <Steps n={3} />
      </Section>
      <Section rule>
        <div className="grid gap-2">
          {/* The in-person checklist: 6 items. */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Row key={i} />
          ))}
        </div>
      </Section>
      <Section rule>
        <div className="grid gap-2.5 @xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-tile border border-hair px-4 py-3.5">
              <Skeleton className="size-9" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <SkeletonText lines={4} className="mt-2" />
              <Skeleton className="mt-2 hidden h-3 w-2/3 @xl:block" />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

const BODY: Record<SkeletonKind, (h: ShapeHints) => ReactNode> = {
  presence: Presence,
  'presence-setup': PresenceSetup,
  test: Test,
  steps: StepsBody,
  ceremony: Ceremony,
};

export function CzSkeleton({
  kind,
  title,
  subtitle,
  icon,
  tone,
  label,
  hints = {},
}: {
  kind: SkeletonKind;
  hints?: ShapeHints;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  tone: WidgetTone;
  label: string;
}) {
  const Body = BODY[kind];
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        <Body {...hints} />
      </div>
      {kind === 'presence-setup' ? (
        // No actions before a PR date: only the privacy line, under a rule.
        <div className="mt-3 border-t border-hair px-5 py-4 sm:px-6" aria-hidden>
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3 @xl:hidden" />
        </div>
      ) : (
        <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
          <div className="flex flex-wrap items-center gap-2.5">
            <Skeleton className="h-12 w-full rounded-full sm:w-56" />
            {kind !== 'test' ? <Skeleton className="h-12 w-full rounded-full sm:w-48" /> : null}
          </div>
          <Skeleton className="mt-4 h-3 w-2/3" />
          {/* The days calculator and the test have a second line of small print. */}
          {kind === 'presence' ? <SkeletonText lines={2} className="mt-4" /> : kind === 'test' ? <Skeleton className="mt-2.5 h-3 w-1/2" /> : null}
        </div>
      )}
      {/* The sources footer: two lines (source, checked date) except the test's, which fits on one line on desktop. */}
      <div className={cn('h-[83px] bg-paper-2', kind === 'test' && '@xl:h-14')} aria-hidden />
    </Card>
  );
}
