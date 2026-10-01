'use client';
/** Loading state of the park finder. The variant follows the tool input: a named park, a place, or neither. */
import { Trees } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { PROVINCES, type Province } from './data';
import { matchPark, matchProvince } from './model';
import messages from './messages';
import { Actions, Bulletins, Chips, Frame, Hero, Rows, Section, Tips, has, type In } from './skeleton-parts';

/** The finder's own subtitle, worked out from the input the same way the tool does, so the header never changes. */
function useFinderSubtitle(input: In) {
  const t = useMessages(messages);
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const parkQ = str(input?.park);
  const nearQ = str(input?.near);
  const given = str(input?.province);
  const province: Province | undefined =
    given && (PROVINCES as readonly string[]).includes(given) ? (given as Province) : !matchPark(parkQ) ? (matchProvince(parkQ) ?? matchProvince(nearQ)) : undefined;
  if (typeof input?.latitude === 'number' && typeof input?.longitude === 'number') return t('finder.subNear', { place: t('finder.here') });
  if (nearQ && !matchProvince(nearQ)) return t('finder.subNear', { place: nearQ });
  return province ? t(`provIn.${province}`) : t('finder.subAll');
}

export function FinderSkeleton({ input }: { input: In }) {
  const t = useMessages(messages);
  const park = has(input?.park);
  const near = !park && has(input?.near);
  const subtitle = useFinderSubtitle(input);
  return (
    <Frame icon={Trees} tone="pine" title={t('finder.title')} subtitle={subtitle} label={t('finder.loading')}>
      {park ? (
        <>
          <Hero />
          <div className="mt-3 px-5 sm:px-6">
            {/* Key facts: one grouped card (rows on phones, three columns on wider containers). */}
            <div className="grid h-[234px] divide-y divide-hair overflow-hidden rounded-tile border border-hair @xl:h-[135px] @xl:grid-cols-3 @xl:divide-x @xl:divide-y-0 rtl:@xl:divide-x-reverse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col justify-center gap-2 px-4">
                  <div className="flex items-center justify-between gap-3 @xl:flex-col @xl:items-start">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ))}
            </div>
            {/* Conditions today: live badge, gauge, a sentence, three bulletins, "see all". */}
            <div className="mt-3 rounded-tile border border-hair bg-paper-2/40 px-4 pb-8 pt-3.5 @xl:pb-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-44 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-2 w-full rounded-full" />
              <SkeletonText lines={3} className="mt-6 @xl:[&>*:nth-child(3)]:hidden" />
              <Skeleton className="mt-4 h-3 w-48" />
              <div className="mt-2">
                <Bulletins n={3} />
              </div>
              <Skeleton className="mt-1 h-11 w-40" />
            </div>
            <Actions n={3} className="mt-3" />
            <div className="mt-4 rounded-tile border border-hair px-4 pb-0 pt-4 @xl:pb-4">
              <Skeleton className="mb-4 h-4 w-52" />
              <Tips n={6} lines={4} />
            </div>
          </div>
          <Section>
            <Chips n={6} className="mb-3 gap-1.5 @max-xl:flex-nowrap @max-xl:overflow-hidden" />
            <Skeleton className="h-[300px] w-full rounded-tile" />
            <Skeleton className="mt-2.5 h-3 w-64" />
          </Section>
          <Section>
            <Skeleton className="mb-2.5 h-[58px] w-full rounded-field" />
            <Rows n={6} />
            <Skeleton className="mt-2 h-11 w-36" />
          </Section>
        </>
      ) : (
        <>
          <Section title={false} className="pt-0">
            <Chips n={6} className="mb-3 gap-1.5 @max-xl:flex-nowrap @max-xl:overflow-hidden" />
            <Skeleton className={cn('w-full rounded-tile', near ? 'h-[300px]' : 'h-[260px] @xl:h-[440px]')} />
            <Skeleton className="mt-2.5 h-3 w-72" />
          </Section>
          <Section>
            <Skeleton className="mb-2.5 h-[58px] w-full rounded-field" />
            <Rows n={6} />
            <Skeleton className="mt-2 h-11 w-36" />
          </Section>
        </>
      )}
    </Frame>
  );
}
