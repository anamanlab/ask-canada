'use client';
/**
 * The body of each business loading state (see skeletons.tsx for the card around it). Each mirrors its widget's
 * real structure with the same container-query breakpoints; heights follow what is already known from the tool
 * input (an export that needs no declaration is short, a named province brings the agency card) and the
 * language (French wraps onto more lines), so the card keeps its height when the answer arrives.
 */
import { useContext, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { TradeInput } from './build';
import { exportCheck } from './calc';
import { Field, Footer, Hero, Lines, Longer, Pills, ProvincePills, range, Row, Section, Segment, Stats, Steps, Toggles } from './skeleton-parts';

export type SkeletonKind = 'registration' | 'structure' | 'incorporate' | 'funding' | 'import' | 'export';

/** The tool input so far: sizes the loading state like the answer it announces. */
export type SkeletonInput = Partial<TradeInput> & { province?: string | null };

export const BODY: Record<SkeletonKind, (input?: SkeletonInput) => ReactNode> = {
  registration: () => <RegistrationBody />,
  structure: () => <StructureBody />,
  incorporate: () => <IncorporateBody />,
  funding: (input) => <FundingBody province={Boolean(input?.province)} />,
  import: (input) => <ImportBody amount={Boolean(input?.amount)} />,
  export: (input) => <ExportBody input={input} />,
};

function StructureBody() {
  const longer = useContext(Longer);
  return (
    <>
      <Hero lines={3} narrow={longer} grow={false} />
      <div className="grid gap-5 px-5 pt-5 sm:px-6">
        <div className="@xl:max-w-[440px]">
          <Skeleton className="mb-2 h-4 w-44" />
          <Segment />
        </div>
        <div>
          <Skeleton className="mb-2 h-4 w-64" />
          {longer ? <Skeleton className="mb-2 h-4 w-40 @xl:hidden" /> : null}
          <Pills widths={['w-60', 'w-56', 'w-56', 'w-52']} />
        </div>
      </div>
      <Section title="w-40">
        <div className="grid gap-4">
          {range(3).map((i) => (
            <div key={i} className="grid gap-2 @xl:grid-cols-[200px_minmax(0,1fr)] @xl:items-center">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-2.5 w-full" round />
            </div>
          ))}
        </div>
      </Section>
      <Section title="w-28">
        <Skeleton className="h-12 w-full @xl:h-8" />
        {/* Phones: one structure at a time (two lines per row); wide: the three-column table, whose French cells run a line longer. */}
        <div className="mt-2 grid">
          {range(7).map((i) => (
            <div key={i} className={cn('grid gap-2 border-b border-hair py-2 last:border-b-0 @xl:grid-cols-4 @xl:gap-x-5', longer ? '@xl:py-[19px]' : '@xl:py-3')}>
              <Skeleton className="h-3 w-24" />
              {range(3).map((c) => (
                <div key={c} className={cn('grid gap-2', c > 0 && 'hidden @xl:grid')}>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="hidden h-3.5 w-3/5 @xl:block" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>
      <Footer secondary footnote={2} source="short" />
    </>
  );
}

function IncorporateBody() {
  return (
    <>
      <Hero lines={1} narrow={1} />
      <Stats n={2} notes cls="grid-cols-2 px-5 pt-4 sm:px-6" />
      <div className="px-5 pt-3 sm:px-6">
        <Toggles n={1} />
      </div>
      <Section title="w-36">
        <Skeleton className="h-[62px] w-full rounded-field" />
        <Lines n={1} narrow={2} className="mt-3.5" />
      </Section>
      <Section title="w-28">
        {/* The checklist's rows are padded tap targets, taller than plain steps. */}
        <Steps row="py-2" lines={[[1, 1], [2, 4], [2, 5], [1, 1], [1, 3]]} />
      </Section>
      <Section title="w-56">
        <Lines n={2} narrow={1} className="mb-4" />
        <ProvincePills />
        <Lines n={1} narrow={2} className="mt-5" />
        <Skeleton className="mt-4 h-4 w-48" />
      </Section>
      <Section title="w-40">
        <Lines n={5} narrow={4} />
      </Section>
      <Footer secondary footnote={1} />
    </>
  );
}

/** `province`: the person named one, so the answer opens on their regional agency's card (otherwise one line asks for it). */
function FundingBody({ province }: { province: boolean }) {
  const longer = useContext(Longer);
  return (
    <>
      <div className="mx-3 rounded-card border border-hair px-5 py-5 sm:mx-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-7 w-3/5" />
        <Lines n={2} narrow={1} className="mt-3" />
        <Skeleton className="mt-5 h-12 w-44 rounded-full max-sm:w-full" />
      </div>
      <div className="grid gap-4 px-5 pt-5 sm:px-6 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] @xl:gap-6">
        <Field />
        <div>
          <Skeleton className="mb-2 h-3.5 w-48" />
          <Pills widths={longer ? ['w-28', 'w-24', 'w-28', 'w-28', 'w-32'] : ['w-20', 'w-20', 'w-24', 'w-28', 'w-32']} />
        </div>
      </div>
      <Section title="w-60">
        {province ? <Skeleton className={cn('w-full rounded-tile @xl:h-[158px] @xl:w-1/2', longer ? 'h-[280px]' : 'h-[243px]')} /> : <Lines n={2} narrow={1} className="py-4" />}
      </Section>
      <Section title="w-36">
        <div className="grid gap-2">
          {range(2).map((i) => (
            <Row key={i} className={cn('@xl:h-[82px]', longer ? 'h-[146px]' : 'h-[128px]')} />
          ))}
        </div>
      </Section>
      <Footer footnote={longer ? 3 : 2} source="long" />
    </>
  );
}

/** `amount`: an invoice amount was given, so the answer opens on the four result tiles (otherwise on one prompt row). */
function ImportBody({ amount }: { amount: boolean }) {
  const longer = useContext(Longer);
  return (
    <>
      <div className="px-5 sm:px-6">
        <Segment />
      </div>
      <Section title="w-48">
        <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3 @xl:grid-cols-[minmax(0,1.3fr)_132px_minmax(0,1fr)]">
          <Field />
          <Field />
          <Field className="col-span-2 @xl:col-span-1" />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-5 @xl:mt-2">
          <div className="flex min-h-11 w-full items-center @xl:order-last @xl:ms-auto @xl:w-auto">
            <Skeleton className="h-3.5 w-52" />
          </div>
          <div className="grid gap-2.5">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-40 @xl:hidden" />
          </div>
        </div>
        {amount ? (
          <div className="mt-4">
            <Stats n={4} cls="grid-cols-2 @xl:grid-cols-4" />
          </div>
        ) : (
          <Skeleton className="mt-4 h-[50px] w-full rounded-tile" />
        )}
        <Lines n={2} narrow={2} className="mt-4" />
        <Skeleton className="mt-3 h-[92px] w-full rounded-field" />
      </Section>
      <Section title="w-36">
        <Steps row={longer ? 'py-1' : undefined} lines={[[1, 1], [1, 2], [1, 2], [1, 2], [2, 4], [1, 2]]} />
      </Section>
      <Footer source="long" />
    </>
  );
}

/** French labels and descriptions wrap more: taller pills, account card and toggle rows. */
function RegistrationBody() {
  const longer = useContext(Longer);
  return (
    <>
      <Hero narrow={4} />
      <Section first title="w-48">
        <Skeleton className="mt-10 h-11 w-full rounded-field" />
        <div className="mt-5 grid grid-cols-2 gap-3 @xl:grid-cols-4">
          {range(4).map((i) => (
            <Field key={i} />
          ))}
        </div>
        <Lines n={2} narrow={longer ? 3 : 2} className="mt-3 @xl:mt-9" />
        <Skeleton className="mt-6 mb-2 h-4 w-40" />
        <Pills widths={longer ? ['w-44', 'w-56', 'w-64'] : ['w-32', 'w-32', 'w-36']} />
      </Section>
      <Section title="w-52">
        <Skeleton className={cn('w-full rounded-tile', longer ? 'h-[270px] @xl:h-[220px]' : 'h-[236px] @xl:h-[200px]')} />
        <div className="mt-5 grid gap-x-8 gap-y-3 @xl:grid-cols-2">
          {range(4).map((i) => (
            <div key={i} className={cn('flex items-start justify-between gap-4', longer ? 'min-h-[68px] @xl:min-h-[84px]' : 'min-h-11 @xl:min-h-[60px]')}>
              <div className="grid gap-2 pt-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-7 w-12 shrink-0" round />
            </div>
          ))}
        </div>
      </Section>
      {/* The "Rate to charge" row, flush against the footer's rule. */}
      <div className="-mb-5 mt-6 flex min-h-14 @xl:mt-9 items-center justify-between gap-3 border-t border-hair px-5 sm:px-6">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="size-9 shrink-0" round />
      </div>
      <Footer footnote={1} note={false} />
    </>
  );
}

function ExportBody({ input }: { input?: SkeletonInput }) {
  const res = exportCheck({ destination: input?.destination ?? 'other', restricted: input?.restricted, value: input?.value });
  const longer = useContext(Longer);
  return (
    <>
      <div className="px-5 sm:px-6">
        <Segment />
      </div>
      <Section title="w-60">
        <Skeleton className="mb-2 h-4 w-48" />
        <Segment />
        <div className="mt-4 grid gap-3 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] @xl:items-end">
          <Field />
          <div className={cn('flex items-center justify-between gap-4', longer ? 'min-h-[124px] @xl:min-h-[72px]' : 'min-h-[84px] @xl:min-h-12')}>
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
            <Skeleton className="h-7 w-12 shrink-0" round />
          </div>
        </div>
      </Section>
      <div className="pt-4">
        <Hero lines={1} />
      </div>
      {res.declaration ? (
        <>
          <Section title="w-64">
            <div className="grid">
              {range(5).map((i) => (
                <div key={i} className="flex gap-6 border-t border-hair py-3.5 first:border-t-0">
                  <Skeleton className="h-3.5 w-20" />
                  <Lines n={1} narrow={1} className="flex-1" />
                </div>
              ))}
            </div>
          </Section>
          <Section title="w-36">
            <Steps lines={[[1, 2], [1, 2], [1, 2]]} />
          </Section>
        </>
      ) : null}
      <Section title="w-32">
        <Row className={longer ? 'h-[145px] @xl:h-[87px]' : 'h-[86px] @xl:h-[70px]'} />
      </Section>
      <Footer />
    </>
  );
}
