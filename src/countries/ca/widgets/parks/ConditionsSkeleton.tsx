'use client';
/** Loading state of the conditions card: one park (danger panel, tiles, bulletins) or the national picture (map, rows). */
import { Flame } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { Actions, Bulletins, Chips, Frame, Rows, Section, Tiles, Tips, has, type In } from './skeleton-parts';

export function ConditionsSkeleton({ input }: { input: In }) {
  const t = useMessages(messages);
  const park = has(input?.park);
  return (
    <Frame icon={Flame} tone="amber" title={t('cond.title')} subtitle={t('cond.loading.sub')} label={t('cond.loading')} second={park}>
      {park ? (
        <>
          {/* Danger panel: label, big word, gauge, one line. */}
          <div className="mx-5 rounded-card border border-hair bg-paper-2/60 px-4 py-5 sm:mx-6 sm:px-5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="mt-2.5 h-8 w-44" />
            <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
            <div className="mt-2.5 flex justify-between">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-2.5 w-16" />
            </div>
            <SkeletonText lines={3} className="mt-4 @xl:[&>*:nth-child(3)]:hidden" />
          </div>
          <div className="mt-3 px-5 sm:px-6">
            <Tiles n={2} h="h-[122px] @xl:h-[112px]" cols="@xl:grid-cols-2" />
            <SkeletonText lines={2} className="mt-4" />
          </div>
          <Section>
            <Bulletins n={4} />
            <Skeleton className="mt-1 h-11 w-36" />
            <SkeletonText lines={2} className="mt-2" />
          </Section>
          <Section>
            <Tips n={6} lines={3} />
            <SkeletonText lines={3} className="mt-14 @xl:mt-4 @xl:[&>*:nth-child(3)]:hidden" />
          </Section>
          <Actions n={3} className="px-5 pt-4 sm:px-6" />
        </>
      ) : (
        <>
          <div className="px-5 sm:px-6">
            <Skeleton className="h-7 w-4/5" />
            <Skeleton className="mt-2 h-7 w-1/2" />
            <Chips n={4} className="mt-3 [&>*]:h-7" />
            <SkeletonText lines={2} className="mt-3 @xl:[&>*:nth-child(2)]:hidden" />
          </div>
          <div className="px-5 pt-4 sm:px-6">
            <Skeleton className="h-[260px] w-full rounded-tile @xl:h-[440px]" />
            <SkeletonText lines={2} className="mt-2.5 @xl:[&>*:nth-child(2)]:hidden" />
          </div>
          <Section>
            <Rows n={8} h="h-12" />
            <Skeleton className="mt-2 h-11 w-40" />
            <SkeletonText lines={3} className="mt-3 @xl:[&>*:nth-child(3)]:hidden" />
          </Section>
        </>
      )}
    </Frame>
  );
}
