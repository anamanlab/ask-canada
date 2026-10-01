'use client';
/** Loading state of civicFindMp: the postal code form, or the MP hero card, riding map and contact section. */
import { Landmark } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { Frame, SectionTitle } from './frame';

export function FindMpSkeleton({ withPostal }: { withPostal: boolean }) {
  const t = useMessages(messages);
  const frame = { icon: Landmark, tone: 'maple' as const, title: t('mp.title'), subtitle: t('mp.subtitle'), label: t('mp.loading') };
  if (!withPostal) {
    return (
      <Frame {...frame} actions={0}>
        <div className="px-5 sm:px-6" aria-hidden>
          <div className="rounded-card border border-hair px-5 py-5">
            <Skeleton className="h-7 w-3/4" />
            <SkeletonText lines={2} className="mt-3 max-w-[52ch]" />
            <div className="mt-4 flex flex-col gap-3 @xl:flex-row @xl:items-end">
              <Skeleton className="h-[74px] w-full @xl:w-[240px]" />
              <Skeleton className="h-12 w-full rounded-chip @xl:w-40" />
            </div>
            <Skeleton className="mt-3 h-3 w-2/3" />
          </div>
        </div>
      </Frame>
    );
  }
  return (
    <Frame {...frame} actions={2}>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 px-3 sm:px-4 @xl:grid-cols-[minmax(0,1fr)_240px]" aria-hidden>
        {/* MP hero card: portrait, name, riding, badges, a role, preferred language. */}
        <div className="rounded-card border border-hair px-5 py-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-[128px] w-[100px] shrink-0 rounded-tile" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-3 h-8 w-4/5" />
              <Skeleton className="mt-2.5 h-4 w-1/2" />
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-14 max-w-full rounded-full" />
                <Skeleton className="h-6 w-28 max-w-full rounded-full" />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-hair pt-3.5">
            <SkeletonText lines={2} />
          </div>
          <Skeleton className="mt-3 h-3 w-48" />
        </div>
        {/* Riding map, with the link to the official maps under it */}
        <div>
          <Skeleton className="h-[220px] rounded-tile @xl:h-[192px]" />
          <Skeleton className="mx-auto my-[15px] h-3.5 w-40" />
        </div>
      </div>
      <section className="px-5 pt-5 sm:px-6" aria-hidden>
        <SectionTitle />
        {/* Contact actions: rows on a phone, tiles when wide. */}
        <div className="grid gap-2 @xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-tile @xl:h-[88px]" />
          ))}
        </div>
        <div className="mt-4 grid gap-2.5 @xl:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-[228px] rounded-tile @xl:h-[196px]" />
          ))}
        </div>
        <SkeletonText lines={2} className="mt-3.5" />
        {/* On phones the postage and seat-count lines wrap to a second line each. */}
        <Skeleton className="mt-2 h-3.5 w-2/3 @xl:hidden" />
      </section>
      <div className="px-5 pt-5 sm:px-6" aria-hidden>
        <SkeletonText lines={2} />
        <Skeleton className="mt-2 h-3.5 w-1/2 @xl:hidden" />
      </div>
    </Frame>
  );
}
