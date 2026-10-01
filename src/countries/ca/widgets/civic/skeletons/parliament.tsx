'use client';
/** Loading state of civicParliament: the focus bill and list (a bill or topic question), or the seat chart, explainer and bills. */
import { Landmark } from 'lucide-react';
import { Skeleton, SkeletonText } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { normalizeBillCode } from '../build/bills';
import { HOUSE } from '../data';
import messages from '../messages';
import { ordinal } from '../shared';
import { Frame, SectionTitle } from './frame';

/** A half ring, the shape of the seat chart. */
function Hemicycle() {
  return (
    <div className="mx-auto aspect-[320/166] w-full [mask-image:radial-gradient(circle_at_50%_100%,transparent_45%,black_46%)]">
      <Skeleton className="h-full w-full rounded-b-none rounded-t-full" />
    </div>
  );
}

/**
 * `bill` and `topic` are the tool's input (partial while it streams): the header already reads as the answer
 * will ("Bill C-38 in Parliament", "Bills in Parliament"), so nothing changes under the reader when it arrives.
 */
export function ParliamentSkeleton({ bill, topic }: { bill?: string; topic?: string }) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const code = normalizeBillCode(bill);
  const answerFirst = !!(code || topic?.trim());
  const frame = {
    icon: Landmark,
    tone: 'glacier' as const,
    title: code ? t('parl.titleBill', { code }) : answerFirst ? t('parl.titleBills') : t('parl.title'),
    // The session in progress (the live answer reads the same numbers from LEGISinfo).
    subtitle: <bdi>{t('parl.subtitle', { parliament: ordinal(HOUSE.parliament, intl), session: ordinal(HOUSE.session, intl) })}</bdi>,
    label: t('parl.loading'),
  };
  const bills = (n: number, tall = false) => (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className={cn('rounded-tile', tall ? 'h-[200px] @xl:h-[136px]' : 'h-[136px]')} />
      ))}
    </div>
  );
  if (answerFirst) {
    return (
      <Frame {...frame}>
        <div aria-hidden>
          <div className="px-3 sm:px-4">
            <div className="rounded-card border border-hair px-5 py-5">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="mt-3 h-7 w-4/5" />
              <Skeleton className="mt-2.5 h-4 w-3/5" />
              <div className="mt-4 flex flex-col gap-3.5 border-t border-hair pt-4">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <Skeleton className="mb-1.5 h-3 w-32" />
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((j) => (
                        <Skeleton key={j} className="h-8 flex-1 rounded-[calc(var(--radius-field)*0.66)]" />
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-8 w-12 rounded-[calc(var(--radius-field)*0.66)]" />
                </div>
              </div>
            </div>
          </div>
          <section className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
            <SectionTitle />
            {bills(3, true)}
            <Skeleton className="mt-3 h-3 w-56" />
          </section>
          <div className="mt-5 flex min-h-[60px] items-center border-t border-hair px-5 sm:px-6">
            <div className="flex-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-2 h-3.5 w-56" />
            </div>
          </div>
        </div>
      </Frame>
    );
  }
  return (
    <Frame {...frame}>
      <div aria-hidden>
        <div className="grid items-center gap-5 px-5 sm:px-6 @xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div>
            <Hemicycle />
            <Skeleton className="mx-auto mt-2 h-4 w-48" />
          </div>
          <div>
            <Skeleton className="h-4 w-52" />
            <Skeleton className="mt-4 h-3 w-40" />
            <div className="mt-2.5 flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className={cn('rounded-tile', i === 2 ? 'h-[122px]' : 'h-[106px]')} />
              ))}
            </div>
          </div>
        </div>
        <section className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
          <SectionTitle />
          <div className="grid grid-cols-1 gap-x-3 gap-y-4 @xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="size-6 shrink-0" round />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <SkeletonText lines={3} className="mt-2.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-5 border-t border-hair px-5 pt-5 sm:px-6">
          <SectionTitle />
          {bills(4)}
          <Skeleton className="mt-3 h-3 w-56" />
        </section>
      </div>
    </Frame>
  );
}
