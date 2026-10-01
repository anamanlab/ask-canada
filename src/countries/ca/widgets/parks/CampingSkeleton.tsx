'use client';
/** Loading state of the campsite reservation helper, with the header the card will have when the park is known. */
import { Tent } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { hasReservations, staysOnly } from './data';
import { useLang } from './hooks';
import { matchPark } from './model';
import messages from './messages';
import { Chips, Frame, Section, Tiles, has, type In } from './skeleton-parts';

export function CampingSkeleton({ input }: { input: In }) {
  const t = useMessages(messages);
  const lang = useLang();
  const park = has(input?.park);
  // The same header the card will have when the park is known (its name and campground count).
  const known = park ? matchPark(input?.park as string) : null;
  const plan = known && hasReservations(known) ? known : null;
  const stays = plan ? staysOnly(plan) : null;
  // Row spacing measured against the real card (Banff, and the list of parks): French copy wraps to more lines.
  const fr = lang === 'fr';
  const stepGap = fr ? 'pb-11 @xl:pb-4' : 'pb-5 @xl:pb-2';
  const checkGap = park ? (fr ? 'pb-[31px] @xl:pb-[35px]' : 'pb-[7px] @xl:pb-[27px]') : fr ? 'pb-9 @xl:pb-10' : 'pb-3 @xl:pb-8';
  return (
    <Frame
      icon={Tent}
      tone="glacier"
      title={plan ? t('camp.titlePark', { park: plan.short[lang] }) : t('camp.title')}
      subtitle={plan ? (stays ? t(`camp.subStays.${stays}`) : t('camp.subPark', { count: plan.campgrounds?.length ?? 0 })) : t('camp.sub')}
      label={t('camp.loading')}
      footnote
    >
      {park ? (
        <div className="px-5 sm:px-6">
          <Skeleton className="h-[120px] w-full rounded-card" />
          <div>
            <SkeletonText lines={4} className="mt-3 @xl:[&>*:nth-child(n+3)]:hidden" />
            <Skeleton className="mt-4 h-3 w-44" />
            <Chips n={12} className="mt-2 [&>*]:h-9" />
            <Skeleton className="mt-2 h-11 w-60" />
          </div>
        </div>
      ) : null}
      <Section>
        {/* Parks with distances: a two-column grid of equal cells on phones, a row of pills when wider. */}
        <div className="grid grid-cols-2 gap-1.5 @xl:flex @xl:flex-wrap @xl:gap-2">
          {Array.from({ length: park ? 8 : 12 }, (_, i) => (
            <Skeleton key={i} className={cn('h-[60px] rounded-field @xl:h-11 @xl:rounded-full', ['@xl:w-48', '@xl:w-40', '@xl:w-56', '@xl:w-44', '@xl:w-52', '@xl:w-48'][i % 6])} />
          ))}
        </div>
      </Section>
      {/* 4-step timeline */}
      <Section>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('flex gap-3', stepGap)}>
            <Skeleton className="size-6" round />
            <SkeletonText lines={4} className="flex-1 @xl:[&>*:nth-child(4)]:hidden" />
          </div>
        ))}
      </Section>
      {/* Checklist */}
      <Section>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn('flex gap-3', checkGap)}>
            <Skeleton className="size-6" round />
            <SkeletonText lines={3} className="flex-1 @xl:[&>*:nth-child(3)]:hidden" />
          </div>
        ))}
      </Section>
      <Section>
        <Tiles n={2} h="h-[147px] @xl:h-[118px]" cols="grid-cols-2" />
        {/* The two phone rows: label over number on phones, one line each when wider. */}
        <Skeleton className="mt-3 h-[124px] w-full rounded-field @xl:h-[90px]" />
        <SkeletonText lines={3} className="mt-2 @xl:[&>*:nth-child(3)]:hidden" />
      </Section>
    </Frame>
  );
}
