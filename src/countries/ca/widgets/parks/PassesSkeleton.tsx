'use client';
/** Loading state of the pass calculator: verdict, chart, party steppers, the two totals, the pass prices. */
import { Ticket } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { Frame, Section, Tiles } from './skeleton-parts';

export function PassesSkeleton() {
  const t = useMessages(messages);
  return (
    <Frame icon={Ticket} tone="maple" title={t('pass.title')} subtitle={t('pass.sub')} label={t('pass.loading')}>
      {/* Verdict */}
      <div className="mx-5 rounded-card border border-hair bg-paper-2/60 px-4 py-5 sm:mx-6 sm:px-5">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="mt-2 h-7 w-1/2 @xl:hidden" />
        <SkeletonText lines={2} className="mt-3 @xl:[&>*:nth-child(2)]:hidden" />
      </div>
      {/* Chart */}
      <div className="px-5 pt-5 sm:px-6">
        <Skeleton className="h-[164px] w-full rounded-tile @xl:h-[184px]" />
        <Skeleton className="mt-2 h-3.5 w-3/5" />
      </div>
      <Section>
        <div className="divide-y divide-hair overflow-hidden rounded-tile border border-hair">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex h-[62px] items-center justify-between gap-3 px-4">
              <SkeletonText lines={2} className="w-32" />
              <Skeleton className="h-9 w-28 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-5 h-3.5 w-48" />
        <Skeleton className="mt-6 h-2 w-full rounded-full" />
        <Skeleton className="mt-6 h-3.5 w-56" />
        <Skeleton className="mt-2 h-[84px] w-full rounded-field" />
      </Section>
      <Section>
        <Tiles n={2} h="h-[122px]" cols="@xl:grid-cols-2" />
        <SkeletonText lines={4} className="mt-3 @xl:[&>*:nth-child(n+3)]:hidden" />
      </Section>
      <Section>
        <Tiles n={4} h="h-[80px] @xl:h-[76px]" cols="@xl:grid-cols-2" />
        <Skeleton className="mt-3 h-[180px] w-full rounded-tile @xl:h-[124px]" />
      </Section>
    </Frame>
  );
}
