'use client';
/** Skeleton shapes for what a transport answer says: the verdict, lists, recall cards, steps, actions and the source footer. */
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

export type ContentBlock = 'hero' | 'heroTall' | 'heroShort' | 'bullets' | 'bulletsLong' | 'notice' | 'action1' | 'cards' | 'steps' | 'tiles3' | 'list' | 'note' | 'actions' | 'footer' | 'footer2' | 'footerWrap';

export const pad = 'px-5 pt-5 sm:px-6';
export function Label() {
  return <Skeleton className="mb-3.5 h-3 w-36" />;
}

export function ContentPart({ kind }: { kind: ContentBlock }) {
  switch (kind) {
    case 'hero':
    case 'heroTall':
      return (
        <div className="mx-2 flex flex-col gap-3.5 rounded-[22px] border border-hair px-4 py-5 @sm:mx-3 @sm:flex-row @sm:px-5 sm:mx-4" aria-hidden>
          <Skeleton className="size-8 shrink-0 @sm:size-9" round />
          <div className="flex-1">
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="mt-2 h-6 w-1/2" />
            <Skeleton className="mt-3 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-3/4" />
            <Skeleton className="mt-2 h-3.5 w-2/3 @xl:hidden" />
            <Skeleton className="mt-2 h-3.5 w-1/2 @xl:hidden" />
            {kind === 'heroTall' ? (
              <div className="mt-3.5 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-44 rounded-full" />
                <Skeleton className="h-6 w-64 max-w-full rounded-full" />
              </div>
            ) : null}
          </div>
        </div>
      );
    case 'heroShort':
      // A one-line verdict and one supporting line; on a phone each wraps onto two.
      return (
        <div className="mx-2 flex flex-col gap-3.5 rounded-[22px] border border-hair px-4 py-5 @sm:mx-3 @sm:flex-row @sm:px-5 sm:mx-4" aria-hidden>
          <Skeleton className="size-8 shrink-0 @sm:size-9" round />
          <div className="flex-1">
            <Skeleton className="h-7 w-3/5" />
            <Skeleton className="mt-3 h-3.5 w-4/5" />
            <Skeleton className="mt-2 h-3.5 w-1/2 @xl:hidden" />
          </div>
        </div>
      );
    case 'bullets':
    case 'bulletsLong':
      // Three points: one line each in a wide column (two when long), about three on a phone.
      return (
        <div className={cn(pad, 'pb-1.5')} aria-hidden>
          <Label />
          <div className="grid gap-2">
            {['w-11/12', 'w-full', 'w-4/5'].map((w, i) => (
              <div key={i} className="grid gap-1.5 py-[3px]">
                <Skeleton className={cn('h-3.5', w)} />
                <Skeleton className={cn('h-3.5 w-full', kind === 'bullets' && '@xl:hidden')} />
                {kind === 'bulletsLong' && i === 1 ? <Skeleton className="h-3.5 w-full @xl:hidden" /> : null}
                <Skeleton className="h-3.5 w-2/3 @xl:hidden" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'action1':
      // One handoff button and its note: beside it in a wide card, under it on a phone.
      return (
        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
          <Skeleton className="h-12 w-52 rounded-full max-sm:w-full" />
          <div className="ms-auto grid w-52 justify-items-end gap-1.5 py-1.5 max-sm:ms-0 max-sm:w-full max-sm:justify-items-start max-sm:py-0">
            <Skeleton className="h-3 w-full max-sm:w-3/5" />
            <Skeleton className="h-3 w-4/5 max-sm:w-1/2" />
          </div>
        </div>
      );
    case 'notice':
      return (
        <div className="px-5 pt-3 sm:px-6" aria-hidden>
          <Skeleton className="h-[176px] rounded-tile @xl:h-[72px]" />
        </div>
      );
    case 'cards':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid gap-2.5 ps-6">
            <div className="rounded-[16px] border border-hair px-4 py-3.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="mt-2.5 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
              <div className="mt-4 grid gap-3.5 border-t border-hair pt-3.5">
                {[4, 2, 2].map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-7 shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3 w-24" />
                      {Array.from({ length: n }, (_, j) => (
                        <Skeleton key={j} className="mt-2 h-3.5 w-full" />
                      ))}
                      {/* A phone wraps each paragraph onto about twice as many lines. */}
                      {[0, 1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="mt-2 h-3.5 w-full @xl:hidden" />
                      ))}
                      <Skeleton className="mt-2 h-3.5 w-3/5" />
                    </div>
                  </div>
                ))}
                <Skeleton className="h-3 w-64 max-w-full" />
                <Skeleton className="my-3 h-4 w-32" />
              </div>
            </div>
            {/* One open card and two collapsed ones: the common case (three recalls), with nothing under the list. */}
            {[0, 1].map((i) => (
              <div key={i} className="rounded-[16px] border border-hair px-4 py-3.5 max-@xl:pb-6">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-2.5 h-4 w-11/12" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-2 h-4 w-2/3 @xl:hidden" />
                <Skeleton className="mt-2 h-4 w-3/4 @xl:hidden" />
                <Skeleton className="mt-2 h-4 w-1/2 @xl:hidden" />
                <Skeleton className="mt-2 h-4 w-1/3 @xl:hidden" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'steps':
    case 'list':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid gap-4">
            {Array.from({ length: kind === 'steps' ? 4 : 3 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-7 shrink-0" round />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3.5 w-full" />
                  <Skeleton className="mt-1.5 h-3.5 w-full @xl:hidden" />
                  <Skeleton className="mt-1.5 h-3.5 w-full @xl:hidden" />
                  <Skeleton className="mt-1.5 h-3.5 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'tiles3':
      return (
        <div className={pad} aria-hidden>
          <Label />
          <div className="grid gap-3 @xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-tile border border-hair px-4 py-3.5">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-2.5 h-3.5 w-full" />
                <Skeleton className="mt-1.5 h-3.5 w-full" />
                <Skeleton className="mt-1.5 hidden h-3.5 w-2/3 @xl:block" />
              </div>
            ))}
          </div>
        </div>
      );
    case 'note':
      return (
        <div className="px-5 pt-3 sm:px-6" aria-hidden>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      );
    case 'actions':
      return (
        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
          <Skeleton className="h-12 w-60 max-w-full rounded-full" />
          <Skeleton className="h-12 w-44 max-w-full rounded-full" />
        </div>
      );
    case 'footer2':
    case 'footerWrap':
      // A source line and the "checked" line: stacked (footer2), or stacked only while the card is narrow (footerWrap).
      return (
        <div className={cn('flex flex-col gap-3 bg-paper-2 px-5 py-5 sm:px-6', kind === 'footerWrap' && '@xl:flex-row @xl:items-center @xl:justify-between')} aria-hidden>
          <Skeleton className="h-4 w-72 max-w-[85%]" />
          <Skeleton className="h-4 w-40" />
        </div>
      );
    case 'footer':
      return (
        <div className="flex items-center justify-between gap-4 bg-paper-2 px-5 py-3 sm:px-6" aria-hidden>
          <Skeleton className="h-4 w-56 max-w-[60%]" />
          <Skeleton className="h-4 w-28" />
        </div>
      );
  }
}
