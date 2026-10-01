'use client';
/**
 * Loading state of the recalls widget, in the result's shape and height: the headline line, the filters, the
 * newest notices as cards, a few rows, the lot-code tip and (for the latest notices) the product search row.
 */
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { ShellSkeleton, useLang } from './shared';

/** `tall`: a row whose title wraps once more (French titles run longer). */
function Row({ tall = false }: { tall?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3.5 py-2.5', tall ? 'min-h-[140px] @md:min-h-[81px]' : 'min-h-[100px] @md:min-h-[60px]')}>
      <Skeleton className="size-9 shrink-0 rounded-field" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="size-9 shrink-0" round />
    </div>
  );
}

export function RecallsSkeleton({ search, chips }: { search: boolean; chips: boolean }) {
  const t = useMessages(messages);
  // French runs longer: the filter chips take a third row on a phone, the cards and one row a line more, and the
  // source line wraps on desktop too.
  const fr = useLang() === 'fr';
  const chipWidths = search ? ['w-16', 'w-[176px]'] : fr ? ['w-20', 'w-[124px]', 'w-[108px]', 'w-[122px]', 'w-[130px]'] : ['w-16', 'w-[88px]', 'w-24', 'w-[104px]', 'w-[92px]'];
  return (
    <ShellSkeleton title={t('recalls.title')} subtitle={t('recalls.subtitle')} icon={ShieldAlert} tone="maple" label={t('recalls.loading')} heights={{ note: 'hidden', source: fr ? 'h-[83px]' : 'max-sm:h-[83px]' }}>
      <div className="px-5 sm:px-6">
        <Skeleton className={cn('w-full max-w-[420px] rounded-field', search ? 'h-[85px] @md:h-[65px]' : 'h-[63px] @md:h-[38px]')} />
      </div>
      {chips ? (
        <div className="mt-4 flex flex-wrap gap-2 px-5 sm:px-6">
          {chipWidths.map((w) => (
            <Skeleton key={w} className={cn('h-11', w)} round />
          ))}
        </div>
      ) : null}
      <div className={cn('mt-6 grid gap-3.5 px-5 sm:px-6', !search && '@2xl:grid-cols-2')}>
        {Array.from({ length: search ? 1 : 2 }, (_, i) => (
          <Skeleton key={i} className={cn('w-full rounded-card', search ? 'h-[317px] @xl:h-[218px]' : fr ? 'h-[339px]' : 'h-[315px]')} />
        ))}
      </div>
      <div className="px-5 sm:px-6">
        {[1, 3].map((n) => (
          <div key={n} className="mt-7">
            <Skeleton className="mb-2 h-[18px] w-28" />
            {Array.from({ length: n }, (_, i) => (
              <Row key={i} tall={fr && !search && n === 1} />
            ))}
          </div>
        ))}
        {/* A search groups its rows by month: usually one more group than the latest notices have days. */}
        {search ? <Skeleton className="mt-7 hidden h-[18px] w-28 @md:block" /> : null}
        {search ? <div className="hidden h-[52px] @md:block" /> : null}
        <Skeleton className="mt-5 h-6 w-32" />
        <Skeleton className={cn('mt-9 w-full rounded-field @xl:h-[38px]', fr ? 'h-[77px]' : 'h-[58px]')} />
      </div>
      {search ? null : (
        <div className="mt-7 border-t border-hair px-5 pt-5 sm:px-6">
          <Skeleton className="h-[52px] w-full" round />
          <Skeleton className="mt-5 h-5 w-36" />
          <div className="h-[46px]" />
        </div>
      )}
    </ShellSkeleton>
  );
}
