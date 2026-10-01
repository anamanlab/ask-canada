'use client';
/** Skeleton shapes for the controls a transport answer can be adjusted with: pickers, fields, sliders, the calculator and charts. */
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { Label, pad } from './skeleton-blocks';

const CONTROLS = ['kinds3', 'trips4', 'calc', 'field', 'grid6', 'chips', 'sizes4', 'choices2', 'slider', 'bars'] as const;
export type ControlBlock = (typeof CONTROLS)[number];
export const isControl = (kind: string): kind is ControlBlock => (CONTROLS as readonly string[]).includes(kind);

export function ControlPart({ kind }: { kind: ControlBlock }) {
  switch (kind) {
    case 'kinds3':
      return (
        <div className="grid grid-cols-3 gap-2 px-5 pb-3 sm:px-6" aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-[14px]" />
          ))}
        </div>
      );
    case 'trips4':
      // Stacked icon-over-label cards on a phone, icon beside a two-line label in a wide column (see ChoiceGrid `stack`).
      return (
        <div className="grid grid-cols-4 gap-2 px-5 pb-4 sm:px-6" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[76px] rounded-[14px] @xl:h-[61px]" />
          ))}
        </div>
      );
    case 'calc':
      // The possession calculator: two fields, the hint, the meter box and the equivalents note.
      return (
        <div className={cn(pad, 'mt-5 border-t border-hair pb-1.5')} aria-hidden>
          <Label />
          <div className="grid gap-3 @md:grid-cols-[1.4fr_1fr]">
            {[0, 1].map((i) => (
              <div key={i}>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-12 w-full rounded-field" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3 h-3 w-4/5" />
          <Skeleton className="mt-2 h-3 w-1/2 @xl:hidden" />
          <Skeleton className="mt-4 h-[122px] rounded-tile @xl:h-[110px]" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-full @xl:hidden" />
          <Skeleton className="mt-2 h-3 w-1/3 @xl:hidden" />
        </div>
      );
    case 'field':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-11 w-full rounded-field" />
          <Skeleton className="mt-2.5 h-3 w-2/3" />
        </div>
      );
    case 'grid6':
      return (
        <div className="px-5 pt-4 sm:px-6" aria-hidden>
          <div className="grid gap-2 @xl:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[60px] rounded-[14px]" />
            ))}
          </div>
          <Skeleton className="mt-4 h-4 w-28" />
          <Skeleton className="mt-4 h-3 w-3/4" />
        </div>
      );
    case 'chips':
      return (
        <div className={cn(pad, 'flex gap-2')} aria-hidden>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-11 flex-1 rounded-[14px]" />
          ))}
        </div>
      );
    case 'sizes4':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid grid-cols-1 gap-2 @md:grid-cols-2 @xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[62px] rounded-[14px]" />
            ))}
          </div>
        </div>
      );
    case 'choices2':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-[14px] @xl:h-[76px]" />
            ))}
          </div>
        </div>
      );
    case 'slider':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid gap-5 @xl:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="mt-5 h-1.5 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-6 h-11 w-full rounded-[14px]" />
        </div>
      );
    case 'bars':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="flex h-[124px] items-end gap-2">
            {[40, 55, 30, 70, 45, 85].map((h, i) => (
              <span key={i} className="block flex-1" style={{ height: `${h}%` }}>
                <Skeleton className="h-full rounded-b-[3px] rounded-t-[7px]" />
              </span>
            ))}
          </div>
        </div>
      );
  }
}
