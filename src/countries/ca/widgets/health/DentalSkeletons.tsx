'use client';
/** Loading states of the dental checker and its summary card: the result's shape and height, so nothing jumps. */
import { Smile } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { nbPeriod } from './dental-saved';
import { CDCP } from './facts';
import messages from './messages';
import { ShellSkeleton, useLang } from './shared';

export function SummarySkeleton() {
  const t = useMessages(messages);
  // French runs longer on phones: the tiers heading takes 2 lines and the note 3.
  const fr = useLang() === 'fr';
  return (
    <ShellSkeleton title={t('dental.title')} subtitle={t('dental.summary.subtitle', { period: nbPeriod(CDCP.benefitPeriod) })} icon={Smile} tone="pine" label={t('dental.loading')} actions={1} badge={false} heights={{ source: 'h-[83px]' }}>
      <div className="px-5 sm:px-6">
        <Skeleton className="h-[118px] w-full rounded-tile @xl:h-[70px]" />
        <Skeleton className={cn('mt-5 h-[18px] w-52', fr && '@max-xl:mb-[18px]')} />
        <div className="mt-2.5 grid grid-cols-2 gap-2 @xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[97px] w-full rounded-tile @xl:h-[98px]" />
          ))}
        </div>
        {/* The note under the tiers: one line on desktop in English, two in French; a line more on a phone. */}
        <Skeleton className={cn('mt-2.5 h-[36px] w-full @xl:h-[18px] @xl:w-4/5', fr && 'h-[54px] @xl:h-[36px]')} />
      </div>
    </ShellSkeleton>
  );
}

/** Verdict, the coverage tile and slider, the 4 requirements and "Good to know". */
export function DentalSkeleton() {
  const t = useMessages(messages);
  // French runs longer: the questions and the "Good to know" lines wrap once more, and the footnote takes two lines.
  const fr = useLang() === 'fr';
  return (
    <ShellSkeleton
      title={t('dental.title')}
      subtitle={t('dental.subtitle', { period: nbPeriod(CDCP.benefitPeriod) })}
      icon={Smile}
      tone="pine"
      label={t('dental.loading')}
      footnote
      heights={{ footnote: fr ? 'h-[36px] max-sm:h-[76px]' : 'max-sm:h-[56px]', source: 'h-[83px]' }}
    >
      <div className="mx-5 sm:mx-6">
        <Skeleton className={cn('w-full rounded-card @xl:h-[95px]', fr ? 'h-[145px]' : 'h-[116px]')} />
      </div>
      <div className="px-5 pt-5 sm:px-6">
        <Skeleton className="mb-3.5 h-3 w-40" />
        <div className="grid gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <Skeleton className="h-[150px] w-full rounded-tile @xl:h-[150px]" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-[88px] w-full" />
          </div>
        </div>
        <div className="mt-4 grid gap-x-5 gap-y-2 @xl:grid-cols-[minmax(0,240px)_minmax(0,1fr)] @xl:items-end">
          <Skeleton className="h-[70px] w-full rounded-field" />
          <Skeleton className={cn('w-full @xl:h-[93px]', fr ? 'h-[110px]' : 'h-[92px]')} />
        </div>
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
        <Skeleton className="mb-3.5 h-3 w-36" />
        <div className="grid gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className={cn('w-full rounded-tile', fr ? 'h-[198px] @xl:h-[99px]' : 'h-[183px] @xl:h-[84px]')} />
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
        <Skeleton className="mb-3.5 h-3 w-28" />
        <div className="grid gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className={cn('w-full', fr ? 'h-[89px] @xl:h-11' : 'h-[64px] @xl:h-7')} />
          ))}
        </div>
      </div>
    </ShellSkeleton>
  );
}
