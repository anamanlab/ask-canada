'use client';
/** Loading states for the four estimators, block for block (see ../skeletons.tsx for how they are measured). */
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { Line, Shell, useLong, type Head } from '../skeletons';
import type { Program } from './shared';

/** The hero: big number + line below; on phones the next payment wraps onto its own row. */
function EstimatorHero({ next = true, typical = false, long = false }: { next?: boolean; typical?: boolean; long?: boolean }) {
  return (
    <div className="mx-3 rounded-card border border-hair px-5 py-5 @xl:mx-4">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        {/* A typical figure is set smaller (40px, with ≈), so its hero is shorter. */}
        <div className={cn('flex flex-col justify-between', typical ? 'h-[92px]' : 'h-[105px]', long && '@max-md:h-[115px]')}>
          <Skeleton className={cn('mt-3 w-52', typical ? 'h-10' : 'h-12')} />
          <div>
            <Line h="h-[22px]" w="w-56" />
            {long ? <Line h="h-[22px]" w="w-32" className="@md:hidden" /> : null}
          </div>
        </div>
        {next ? <Line h="h-[19px]" w="w-40" /> : null}
      </div>
    </div>
  );
}

/**
 * A labelled slider (label + value, track), with optional hint lines under it. `field`: the value is a typed
 * money field (44px), beside a label that takes up to three lines on phones (`wraps`).
 */
function SliderSkeleton({ hint = 0, phoneHint = hint, wraps = false, field = false }: { hint?: number; phoneHint?: number; wraps?: boolean; field?: boolean }) {
  const lines = Math.max(hint, phoneHint);
  return (
    <div>
      <div className="flex flex-col gap-2">
        <div className={cn('flex items-center justify-between gap-3', field ? 'h-11' : 'h-[23px]', wraps && (field ? '@max-md:h-[58px]' : '@max-md:h-11'))}>
          <Skeleton className="h-3.5 w-44 max-w-[50%]" />
          {field ? <Skeleton className="h-11 w-[8.75rem] shrink-0 rounded-field" /> : <Skeleton className="h-5 w-20" />}
        </div>
        <span className="flex h-11 items-center">
          <Skeleton className="h-1.5 w-full" round />
        </span>
      </div>
      {lines ? (
        <div className="mt-0.5">
          {Array.from({ length: lines }, (_, i) => (
            <Line key={i} h={i ? 'h-5' : 'h-[22px]'} w={i === lines - 1 ? 'w-2/3' : 'w-full'} className={i >= hint ? '@md:hidden' : i >= phoneHint ? '@max-md:hidden' : undefined} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Section({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return <div className={cn('px-5 pt-5 sm:px-6', !first && 'mt-5 border-t border-hair')}>{children}</div>;
}

const BAR_HEIGHTS = { oas: [60, 65, 70, 74, 79, 84], cpp: [46, 51, 56, 61, 66, 72, 78, 84, 90, 95, 100] };

function BarsSkeleton({ program }: { program: 'oas' | 'cpp' }) {
  return (
    <div>
      <Line h="h-5" w="w-48" className="mb-2" />
      <div className="flex h-[132px] items-end gap-[5px]">
        {BAR_HEIGHTS[program].map((h, i) => (
          <span key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            <span className="flex min-h-0 w-full flex-1 items-end">
              <span className="block w-full" style={{ height: `${h}%` }}>
                <Skeleton className="size-full rounded-b-[3px] rounded-t-[7px]" />
              </span>
            </span>
            <Skeleton className="h-[11px] w-4" />
          </span>
        ))}
      </div>
    </div>
  );
}

function Rows({ n }: { n: number }) {
  return (
    <div>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={cn('flex h-[42px] items-center justify-between gap-4', i && 'border-t border-hair')}>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Info rows (icon + text); each item is its line count [wide, phone]. */
function InfoLines({ items }: { items: [number, number][] }) {
  return (
    <div className="mt-4 grid gap-2">
      {items.map(([wide, phone], i) => {
        const n = Math.max(wide, phone);
        return (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="mt-0.5 size-4 shrink-0" round />
            <div className="min-w-0 flex-1">
              {Array.from({ length: n }, (_, j) => (
                <Line
                  key={j}
                  h={j ? 'h-5' : 'h-[19px]'}
                  w={j === n - 1 ? 'w-1/2' : 'w-full'}
                  className={j >= wide ? '@md:hidden' : j >= phone ? '@max-md:hidden' : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CcbBody() {
  const long = useLong();
  return (
    <>
      <EstimatorHero />
      <Section first>
        <div className="grid gap-4">
          <SliderSkeleton field hint={1} phoneHint={long ? 2 : 1} />
          <div className="grid gap-2 @md:grid-cols-2">
            <Skeleton className="h-[62px] w-full rounded-tile" />
            <Skeleton className="h-[62px] w-full rounded-tile" />
          </div>
          <Skeleton className={cn('h-[62px] w-full rounded-tile', long && '@max-md:h-[78px]')} />
        </div>
      </Section>
      <Section>
        <Line h="h-5" w="w-52" className="mb-3" />
        <Skeleton className="h-[150px] w-full rounded-field" />
        <Line h="h-[17px]" w="w-full" bar="h-2.5" className="mt-2" />
        <div className="mt-4">
          <Rows n={2} />
        </div>
      </Section>
    </>
  );
}

function EiBody() {
  const long = useLong();
  return (
    <>
      <EstimatorHero next={false} />
      <div className="px-5 pt-5 sm:px-6">
        <Skeleton className={cn('w-full rounded-tile', long ? 'h-[88px] @max-md:h-[148px]' : 'h-[68px] @max-md:h-32')} />
      </div>
      <Section first>
        <SliderSkeleton field wraps hint={1} phoneHint={2} />
        <Skeleton className={cn('mt-6 h-[60px] w-full rounded-tile', long && '@max-md:h-20')} />
      </Section>
      <Section>
        <div className="grid gap-2.5 @md:grid-cols-2">
          <Skeleton className={cn('h-[120px] w-full rounded-tile', long && '@max-md:h-[137px]')} />
          <Skeleton className="h-[120px] w-full rounded-tile" />
        </div>
        <InfoLines items={[[1, long ? 2 : 1], [2, 4]]} />
      </Section>
    </>
  );
}

function OasBody() {
  const long = useLong();
  return (
    <>
      <EstimatorHero />
      <Section first>
        <div className="grid gap-5">
          <SliderSkeleton wraps={long} />
          <SliderSkeleton />
          <div className="flex h-11 items-center justify-between gap-4 @max-md:h-16">
            <div className="grid gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-7 w-12 shrink-0" round />
          </div>
          <SliderSkeleton field hint={2} phoneHint={long ? 5 : 4} />
        </div>
      </Section>
      <Section>
        <div className="grid gap-5 @xl:grid-cols-[1fr_1.1fr] @xl:items-end">
          <Rows n={4} />
          <BarsSkeleton program="oas" />
        </div>
        <Skeleton className="mt-4 h-[68px] w-full rounded-tile @max-md:h-32" />
      </Section>
    </>
  );
}

function CppBody() {
  const long = useLong();
  return (
    <>
      <EstimatorHero typical long={long} />
      <Section first>
        <div className="grid gap-4">
          <SliderSkeleton />
          <div>
            <SliderSkeleton field />
            <div className="mt-1 flex h-[26px] items-center gap-2">
              <Skeleton className="h-5 w-16" round />
              <Skeleton className="h-3 w-48" />
            </div>
            <Line h="h-5" w="w-full" />
            <Line h="h-5" w="w-2/3" />
            <Line h="h-5" w="w-1/2" className="@md:hidden" />
            {long ? <Line h="h-5" w="w-full" className="@md:hidden" /> : null}
            {long ? <Line h="h-5" w="w-1/3" className="@md:hidden" /> : null}
          </div>
        </div>
      </Section>
      <Section>
        <div className="grid gap-5 @xl:grid-cols-[1.2fr_1fr] @xl:items-end">
          <BarsSkeleton program="cpp" />
          <Skeleton className="h-[103px] w-full rounded-tile" />
        </div>
        <InfoLines items={[[long ? 2 : 1, 3], [1, 2]]} />
      </Section>
    </>
  );
}

const BODY: Record<Program, () => React.ReactNode> = { ccb: CcbBody, ei: EiBody, oas: OasBody, cpp: CppBody };

export function EstimatorSkeleton({ program, ...head }: Head & { program: Program }) {
  const long = useLong();
  const Body = BODY[program];
  return (
    <Shell head={head} source={program === 'oas' && !long ? 'narrow' : 'wide'}>
      <Body />
    </Shell>
  );
}
