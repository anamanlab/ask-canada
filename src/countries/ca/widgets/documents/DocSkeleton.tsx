'use client';
import type { ReactNode } from 'react';
import { FileText, ShieldQuestion } from 'lucide-react';
import { Card, Skeleton, SkeletonText, WidgetIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { DOCS } from './docs';
import type { ExplainInput } from './explain';

/** The checklist opens on its first steps (see ./Steps). */
const FIRST_STEPS = 3;

/** How many next steps a document shows before its details are known (conditional ones count once). */
export function stepCount(docType?: ExplainInput['docType']) {
  if (!docType || docType === 'other' || !DOCS[docType]) return 0;
  const steps = DOCS[docType].steps;
  const always = steps.filter((x) => !x.when || x.when === 'always').length;
  return always + (steps.length > always ? 1 : 0);
}

/**
 * Loading state shaped like the answer that's coming (verdict, a date, the first steps of this document's
 * checklist, the group of "more" rows and the action bar), so nothing jumps when the output arrives.
 */
export function DocSkeleton({ kind, steps, title, subtitle, label }: { kind: 'doc' | 'verify' | 'identify'; steps: number; title: string; subtitle: string; label: string }) {
  const rows = (n: number, h = 'h-[52px]') => Array.from({ length: n }, (_, i) => <Skeleton key={i} className={cn('w-full rounded-field', h)} />);
  const section = (w: string, body: ReactNode) => (
    <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
      <Skeleton className={cn('mb-3.5 h-3', w)} />
      {body}
    </div>
  );
  return (
    <Card as="section" aurora={kind === 'identify'} aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={kind === 'verify' ? ShieldQuestion : FileText} tone={kind === 'verify' ? 'amber' : 'glacier'} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight text-ink">{title}</p>
          <p className="m-0 mt-0.5 text-[13.5px] text-ink-3">{subtitle}</p>
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {kind === 'identify' ? (
          <div className="px-5 sm:px-6" aria-hidden>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            {[4, 3, 3].map((n, g) => (
              <div key={g} className="mt-6">
                <Skeleton className="mb-3.5 h-3 w-28" />
                <div className="grid gap-2 @xl:grid-cols-2">{rows(n, 'h-16')}</div>
              </div>
            ))}
            <div className="mt-6 grid gap-2.5 pb-6">{rows(2, 'h-16')}</div>
          </div>
        ) : (
          <div aria-hidden>
            <Skeleton className="mx-3 h-[150px] rounded-card sm:mx-4 @max-md:h-[270px]" />
            {kind === 'verify' ? (
              <div className="px-5 pt-5 sm:px-6">
                <Skeleton className="mb-3.5 h-3 w-24" />
                <div className="grid gap-1.5 @xl:grid-cols-2">{rows(8)}</div>
                <div className="mt-4 grid gap-3 @xl:grid-cols-2">{rows(2, 'h-[150px]')}</div>
              </div>
            ) : (
              <>
                <div className="px-5 pt-6 sm:px-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-[52px] w-[46px] shrink-0 rounded-field" />
                    <SkeletonText lines={3} className="flex-1 pt-1" />
                  </div>
                </div>
                {section('w-36', <div className="grid gap-2">{rows(Math.min(steps || FIRST_STEPS, FIRST_STEPS), 'h-[64px]')}</div>)}
                <div className="px-5 pt-6 sm:px-6">
                  <Skeleton className="h-[236px] w-full rounded-tile" />
                </div>
              </>
            )}
            <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6">
              <div className="flex flex-wrap gap-2.5">
                <Skeleton className="h-12 w-56 rounded-full max-sm:w-full" />
                <Skeleton className="h-12 w-40 rounded-full max-sm:w-full" />
              </div>
              <SkeletonText lines={2} className="mt-3" />
            </div>
          </div>
        )}
      </div>
      <div className="h-11 bg-paper-2" aria-hidden />
    </Card>
  );
}
