'use client';
/**
 * Loading state of the Drug Product Database lookup, and the layout classes it shares with the result
 * (./DrugLookup.tsx), so the two can't drift apart.
 */
import { Pill } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { HERO_BOX, Lines, NoticeSkeleton, rows, ShellSkeleton, TEXT, useLang } from './shared';

/** Product cards shown before "Show more": a brand can have up to 6 (Advil), so the skeleton can match exactly. */
export const SHOWN = 4;

/** The card shared by a product and its placeholder: one set of paddings, so the two can't drift apart. */
export const CARD = 'flex flex-col rounded-tile border border-hair bg-card px-4 pb-3 pt-4 shadow-sm';
/**
 * The result's own structure with bars for text: the verdict panel, the product cards (1 for a DIN, up to 4 for
 * a brand), the "showing 4 of 48" line and the advice notice. Paddings and gaps are the result's classes; only
 * the number of text lines is assumed (the verdict and the advice wrap on a phone).
 */
export function DrugSkeleton({ cards }: { cards: number }) {
  const t = useMessages(messages);
  const fr = useLang() === 'fr';
  const brand = cards > 1;
  return (
    <ShellSkeleton title={t('drugs.title')} subtitle={t('drugs.subtitle')} icon={Pill} tone="glacier" label={t('drugs.loading')} actions={1} heights={{ source: fr ? 'h-[83px]' : 'max-sm:h-[83px]' }}>
      <div className={cn(HERO_BOX, 'border-hair')}>
        <div className="flex items-start gap-3.5">
          <Skeleton className="size-9 shrink-0" round />
          <div className="min-w-0 flex-1">
            <Lines line={TEXT.verdict} rows={rows(2, 1)} />
            {/* "25 products called “Advil” are marketed now, out of 48…" runs a line longer than "DIN … is Ozempic…". */}
            <Lines line={TEXT.body} rows={rows((brand ? 3 : 2) + (fr ? 1 : 0), brand && fr ? 2 : 1)} className="mt-1" />
          </div>
        </div>
      </div>
      <div className={cn('mt-4 grid gap-2.5 px-5 sm:px-6', brand && '@xl:grid-cols-2')}>
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className={CARD}>
            <Lines line={TEXT.brand} rows={['w-3/5']} />
            {/* A DIN lookup is usually one product with a descriptor ("Dispenses 1 mg doses") under its name. */}
            {brand ? null : <Lines line="h-[17.2px]" rows={rows(fr ? 3 : 2, 1)} className="mt-0.5" />}
            <Lines line="h-7" rows={['w-32']} className="mt-3" />
            <Lines line="h-[25.2px]" rows={['w-28']} className="mt-2" />
            {/* Form, route and company: the longest of a brand's products wraps to a second line. */}
            <Lines line={TEXT.small} rows={brand ? rows(i === 0 ? 2 : 1) : rows(2, 1)} className="mt-2.5" />
            <Lines line="h-[20px]" rows={['w-2/5']} className="mt-1" />
            <Lines line={TEXT.control} rows={['w-3/5']} className="pt-2" />
          </div>
        ))}
      </div>
      {brand ? (
        <div className={cn(MORE_ROW, 'px-5 sm:px-6')} aria-hidden>
          <Lines line={TEXT.small} rows={['w-3/5 @xl:w-56']} className={MORE_TEXT} />
          {/* « Afficher 2 autres » and « Voir les 48 dans la base de données » take a line each on a phone. */}
          <Lines line={TEXT.control} rows={[fr ? 'w-36' : 'w-24']} />
          <Lines line={TEXT.control} rows={[fr ? 'w-60' : 'w-44']} />
        </div>
      ) : null}
      <div className="px-5 pt-4 sm:px-6">
        <NoticeSkeleton rows={rows(fr ? 7 : 5, fr ? 3 : 2)} />
      </div>
    </ShellSkeleton>
  );
}

/** "Showing 4 of 48", then the two ways to see more: one line on desktop; on a phone the text, then the actions. */
export const MORE_ROW = 'm-0 mt-1 flex min-h-11 flex-wrap items-center gap-x-5 text-[13.5px] leading-snug text-ink-3 @xl:gap-x-2';
export const MORE_TEXT = 'w-full pt-2 @xl:w-auto @xl:pt-0';
