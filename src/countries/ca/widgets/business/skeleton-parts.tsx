'use client';
/** Building blocks of the business loading states (see skeletons.tsx): the same shapes and breakpoints as the real widgets. */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { PROVINCES } from './data';
import { useBiz } from './shared';

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** French runs ~20% longer, so its text blocks wrap onto an extra line. */
export const Longer = createContext(0);

/** `lines` body lines on wide cards; `narrow` extra lines on phones, where the same text wraps more. */
export function Hero({ lines: base = 2, narrow = 2, grow = true, className }: { lines?: number; narrow?: number; /** One more line in French (default). */ grow?: boolean; className?: string }) {
  const longer = useContext(Longer);
  const lines = base + (grow ? longer : 0);
  return (
    <div className={cn('mx-3 rounded-card border border-hair px-5 py-5 sm:mx-4', className)}>
      <div className="flex items-start gap-3.5">
        <Skeleton className="size-9 shrink-0" round />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-[26px] w-4/5" />
          <Skeleton className="mt-1.5 h-[26px] w-2/5 @xl:hidden" />
          {range(lines + narrow).map((i) => (
            <Skeleton key={i} className={cn('mt-2.5 h-3.5', i === lines + narrow - 1 ? 'w-3/5' : 'w-full', i >= lines && '@xl:hidden')} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Section({ children, first, title = 'w-44' }: { children: ReactNode; first?: boolean; title?: string }) {
  return (
    <div className={cn('px-5 pt-5 sm:px-6', !first && 'mt-5 border-t border-hair')}>
      <Skeleton className={cn('mb-4 h-3.5', title)} />
      {children}
    </div>
  );
}

export const Field = ({ className }: { className?: string }) => (
  <div className={cn('min-w-0', className)}>
    <Skeleton className="mb-2 h-3.5 w-24" />
    <Skeleton className="h-11 w-full rounded-field" />
  </div>
);
export const Pills = ({ widths }: { widths: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {widths.map((w, i) => (
      <Skeleton key={i} className={cn('h-11 rounded-chip', w)} />
    ))}
  </div>
);
/** One pill per province or territory: an even two-column grid on phones, sized from the localized name when wide. */
export function ProvincePills() {
  const { t } = useBiz();
  return (
    <div className="grid grid-cols-2 gap-2 @xl:flex @xl:flex-wrap">
      {PROVINCES.map((p) => (
        <span
          key={p}
          aria-hidden
          className="shimmer block h-11 rounded-chip text-[14.5px] @xl:w-(--w)"
          style={{ '--w': `calc(${t(`prov.${p}`).length * 0.52}em + 58px)` } as CSSProperties}
        />
      ))}
    </div>
  );
}
export function Lines({ n, narrow: base = 0, className }: { n: number; narrow?: number; className?: string }) {
  const longer = useContext(Longer);
  const narrow = base + (n + base >= 2 ? longer : 0);
  return (
    <div className={cn('grid gap-2.5', className)}>
      {range(n + narrow).map((i) => (
        <Skeleton key={i} className={cn('h-3.5', i === n + narrow - 1 ? 'w-3/5' : 'w-full', i >= n && '@xl:hidden')} />
      ))}
    </div>
  );
}
export const Row = ({ className }: { className?: string }) => <Skeleton className={cn('h-[66px] w-full rounded-tile', className)} />;
/** A two-option Segmented: as wide as its parent, like the real control (cap the parent where the widget does). */
export const Segment = () => <Skeleton className="h-[58px] w-full rounded-field" />;
export const Toggles = ({ n }: { n: number }) => (
  <div className="grid gap-x-6 gap-y-1 @xl:grid-cols-2">
    {range(n).map((i) => (
      <div key={i} className="flex min-h-12 items-center justify-between gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-12 shrink-0" round />
      </div>
    ))}
  </div>
);
/** Stat tiles. `notes`: tiles whose note wraps under the figure (the incorporation fees), so they stand taller. */
export function Stats({ n, cls, notes }: { n: number; cls: string; notes?: boolean }) {
  const longer = useContext(Longer);
  const h = notes ? (longer ? 'h-[157px] @xl:h-[122px]' : 'h-[139px] @xl:h-[122px]') : longer ? 'h-[130px] @xl:h-[112px]' : 'h-[112px]';
  return (
    <div className={cn('grid gap-2.5', cls)}>
      {range(n).map((i) => (
        <Skeleton key={i} className={cn('w-full rounded-tile', h)} />
      ))}
    </div>
  );
}
/** Vertical steps: [wide, narrow] detail lines per step. `row`: extra classes per step (a checklist's rows are padded). */
export function Steps({ lines, row }: { lines: [number, number][]; row?: string }) {
  const longer = useContext(Longer);
  return (
    <div className="grid gap-5">
      {lines.map(([wide, base], i) => {
        const narrow = base + longer;
        const most = Math.max(wide, narrow);
        return (
          <div key={i} className={cn('flex gap-3.5', row)}>
            <Skeleton className="size-6 shrink-0" round />
            <div className="grid flex-1 gap-2 pt-1">
              <Skeleton className="h-4 w-3/5" />
              {range(most).map((j) => (
                <Skeleton key={j} className={cn('h-3.5', j === most - 1 ? 'w-2/5' : 'w-full', j >= wide && '@xl:hidden', j >= narrow && 'hidden @xl:block')} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** `source`: whether the source line wraps onto a second row at wide widths too ('auto': in French only). It always does on phones. */
export function Footer({ secondary, footnote = 0, note = true, source = 'auto' }: { secondary?: boolean; footnote?: number; note?: boolean; source?: 'short' | 'long' | 'auto' }) {
  const longer = useContext(Longer);
  const wraps = source === 'long' || (source === 'auto' && longer > 0);
  return (
    <>
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-12 w-64 rounded-full max-sm:w-full" />
          {secondary ? <Skeleton className="h-12 w-40 rounded-full max-sm:w-full" /> : null}
          {note ? (
            <div className="ms-auto grid w-44 gap-2 max-sm:ms-0 max-sm:w-full">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/5 max-sm:w-4/5" />
            </div>
          ) : null}
        </div>
        {footnote ? <Lines n={footnote} narrow={1} className="mt-4" /> : null}
      </div>
      <div className={cn('flex h-[83px] items-center gap-3 bg-paper-2 px-5 sm:px-6', !wraps && '@xl:h-[57px]')}>
        <Skeleton className="size-5 shrink-0" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </>
  );
}
