'use client';
/** The search headline: how many postings, where, and what the work pays (with a wages follow-up). */
import { CircleDollarSign } from 'lucide-react';
import { NumberTicker } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { isolate } from './text';
import type { SearchOutput } from './types';

type Props = {
  data: SearchOutput;
  /** The query, isolated for mixed-direction text. */
  query: string;
  /** "in Toronto, ON" / "au Québec", in the interface language. */
  inPlace: string;
  /** A search with no keyword, only Job Bank's student filter. */
  studentOnly: boolean;
  /** The occupation's title in the interface language (when the query matched one). */
  occupationTitle?: string;
  onCompareWages: () => void;
};

export function SearchHero({ data, query, inPlace, studentOnly, occupationTitle, onCompareWages }: Props) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <div className="relative overflow-hidden rounded-tile border border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_14%,transparent),color-mix(in_oklab,var(--a-teal)_12%,transparent)_50%,color-mix(in_oklab,var(--a-violet)_10%,transparent))] px-5 py-5">
      {data.live && data.total ? (
        <>
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-serif text-[46px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
              <NumberTicker value={data.total} format={(n) => fmt.number(Math.round(n))} />
            </span>
            <span className="text-[15.5px] font-medium text-ink-2">{t('search.openPostings', { count: data.total })}</span>
          </p>
          <p className="m-0 mt-2 text-[14.5px] leading-snug text-ink-2">{isolate(studentOnly ? t('search.heroSubStudent', { inPlace }) : t('search.heroSub', { query, inPlace }))}</p>
        </>
      ) : (
        <>
          <p className="m-0 font-serif text-[26px] leading-[1.15] tracking-[-.02em] text-ink">{t('search.offlineTitle')}</p>
          <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{isolate(studentOnly ? t('search.offlineBodyStudent', { inPlace }) : t('search.offlineBody', { query, inPlace }))}</p>
        </>
      )}
      {data.occupation && occupationTitle ? (
        <div className="mt-4 flex items-start gap-2 border-t border-ink/10 pt-3.5">
          <CircleDollarSign className="mt-[3px] size-4 shrink-0 text-pine" aria-hidden strokeWidth={1.9} />
          {/* The link lives in the text column, so when it wraps it lines up with the sentence, not the icon. */}
          <p className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-3 text-[14px] leading-snug text-ink-2">
            <span className="py-[1px]">{t('search.payContext', { title: occupationTitle, median: fmt.money(data.occupation.median, { cents: 'always' }) })}</span>
            <button
              type="button"
              onClick={onCompareWages}
              className="-my-3 min-h-11 text-start text-[14px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
            >
              {t('search.compareProvinces')}
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}
