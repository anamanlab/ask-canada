'use client';
/** Building blocks shared by the citizenship loading states (see Skeletons.tsx). */
import type { ReactNode } from 'react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';

export const Pad = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('px-5 sm:px-6', className)}>{children}</div>;

/** A titled section, like WidgetSection: mono label, then content. */
export const Section = ({ children, rule }: { children: ReactNode; rule?: boolean }) => (
  <Pad className={cn('pt-5', rule && 'mt-5 border-t border-hair')}>
    <Skeleton className="mb-4 h-3 w-40" />
    {children}
  </Pad>
);

export const Row = ({ h = 'h-[60px]' }: { h?: string }) => (
  <div className={cn('flex items-center gap-3 rounded-field border border-hair px-3', h)}>
    <Skeleton className="size-8 shrink-0" round />
    <div className="min-w-0 flex-1">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="mt-2 h-3 w-1/3" />
    </div>
  </div>
);

/** A labelled field; `hint` adds the one- or two-line hint under the label. */
export const FieldBlock = ({ hint }: { hint?: boolean }) => (
  <div>
    <Skeleton className="h-3.5 w-32" />
    {hint ? (
      <>
        <Skeleton className="mt-2.5 h-3 w-4/5" />
        <Skeleton className="mt-1.5 h-3 w-1/2 @md:hidden" />
      </>
    ) : null}
    <Skeleton className="mt-2 h-11 w-full rounded-field" />
  </div>
);

export const Steps = ({ n }: { n: number }) => (
  <div className="grid gap-5">
    {Array.from({ length: n }, (_, i) => (
      <div key={i} className="flex gap-3.5">
        <Skeleton className="size-7 shrink-0" round />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <SkeletonText lines={2} className="mt-2.5" />
          <Skeleton className="mt-2.5 h-3.5 w-1/2 @xl:hidden" />
        </div>
      </div>
    ))}
  </div>
);
