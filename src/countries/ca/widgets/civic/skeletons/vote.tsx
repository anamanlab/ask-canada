'use client';
/** Loading state of civicVoterCheck: verdict, the three questions, the tabs and the checklist. */
import { Vote } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { Frame, SectionTitle } from './frame';

export function VoterSkeleton() {
  const t = useMessages(messages);
  return (
    <Frame icon={Vote} tone="pine" title={t('vote.title')} subtitle={t('vote.subtitle')} label={t('vote.loading')}>
      <div aria-hidden>
        {/* Verdict */}
        <div className="mx-3 flex items-start gap-3.5 rounded-card border border-hair px-5 py-5 sm:mx-4">
          <Skeleton className="size-9 shrink-0" round />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="mt-2 h-7 w-1/2 @xl:hidden" />
            <SkeletonText lines={2} className="mt-3" />
          </div>
        </div>
        {/* Three questions */}
        <section className="px-5 pt-5 sm:px-6">
          <SectionTitle />
          <div className="flex flex-col gap-3.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:gap-4">
                <Skeleton className="h-4 w-28 @xl:w-[150px]" />
                {/* A segmented control: 44px options inside a 4px frame. */}
                <Skeleton className="h-[52px] w-full rounded-[14px] @xl:flex-1" />
              </div>
            ))}
          </div>
        </section>
        {/* Tabs + the registration options */}
        <div className="px-5 pt-5 sm:px-6">
          <div className="flex gap-6 border-b border-hair pb-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-5 w-20" />
            ))}
          </div>
          <SkeletonText lines={2} className="mt-4" />
          <div className="mt-3 grid gap-2.5 @xl:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px] rounded-tile @xl:h-[124px]" />
            ))}
          </div>
        </div>
        {/* Ready to vote */}
        <section className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
          <SectionTitle />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-tile @xl:h-[64px]" />
            ))}
          </div>
        </section>
      </div>
    </Frame>
  );
}
