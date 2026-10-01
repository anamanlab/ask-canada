'use client';
/**
 * The postings of a search (or the jobs saved on this device): sort, filter chips, five cards at a time.
 * Filtering and sorting run on the device, on the postings the tool returned.
 */
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Button, LiveRegion, Segmented, WidgetSection } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { HOURS_PER_YEAR, type Lang, type Province } from './data';
import { FilterChips } from './FilterChips';
import { JobCard } from './JobCard';
import messages from './messages';
import { filterCounts, offeredFilters, visibleJobs, type Filter, type Sort } from './search-model';
import type { JobPosting } from './types';

const PAGE = 5;
/** A saved view with this few postings shows just the cards: no sort, no filters. */
const FEW_SAVED = 3;

/**
 * Sort, filter and page of the list. The parent owns it (and resets it from its "saved jobs" button), so the
 * cards animate between the two views instead of remounting.
 */
export function useListView() {
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [shown, setShown] = useState(PAGE);
  return {
    filter,
    sort,
    shown,
    pickFilter: (f: Filter) => (setFilter(f), setShown(PAGE)),
    pickSort: (v: Sort) => (setSort(v), setShown(PAGE)),
    showMore: () => setShown((n) => n + PAGE),
    reset: () => (setFilter('all'), setSort('relevance'), setShown(PAGE)),
  };
}

type Props = {
  view: ReturnType<typeof useListView>;
  jobs: JobPosting[];
  today: string;
  /** Language of the search (Job Bank's own words on a card are in it). */
  lang: Lang;
  /** Postings Job Bank has for this search; when the list holds them all, the heading says "All", not "Top". */
  total: number | null;
  /** The province asked about: its postings lead the "best match" order. */
  province?: Province;
  /** Reposts folded into one card by the tool (0 for the saved view). */
  duplicates: number;
  /** Showing the jobs saved on this device instead of the search. */
  savedView: boolean;
  onLeaveSaved: () => void;
  isSaved: (id: string) => boolean;
  onSave: (job: JobPosting) => void;
};

export function JobList({ view, jobs, today, lang, total, province, duplicates, savedView, onLeaveSaved, isSaved, onSave }: Props) {
  const t = useMessages(messages);
  const reduce = useReducedMotion();
  const { filter, sort, shown } = view;

  const bare = savedView && jobs.length <= FEW_SAVED;
  const counts = filterCounts(jobs, today);
  const list = visibleJobs(jobs, { filter, sort, today, province });
  // "Top 17" above "See all 17" would promise a longer list that doesn't exist.
  const payHint = sort === 'pay' && !bare && list.length > 1 ? t('search.sort.payHint', { hours: HOURS_PER_YEAR }) : '';
  const everything = total != null && jobs.length + duplicates >= total;
  // A filter narrows the list: the heading counts what is on screen against the whole ("1 of 17 postings").
  const narrowed = filter !== 'all' && !bare && list.length < jobs.length;
  const heading = narrowed
    ? t(savedView ? 'search.savedFiltered' : 'search.filtered', { shown: list.length, count: jobs.length })
    : savedView
    ? t('search.savedTitle')
    : duplicates > 0
      ? t('search.topUnique', { count: jobs.length })
      : everything
        ? t('search.all', { count: jobs.length })
        : t('search.top', { count: jobs.length });

  const controls = (
    <>
      {savedView ? (
        <button
          type="button"
          onClick={onLeaveSaved}
          className="-mx-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-1 text-[13.5px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
        >
          <ArrowLeft className="size-3.5 flip-rtl" aria-hidden />
          {t('search.backToAll')}
        </button>
      ) : null}
      {bare ? null : (
        <Segmented
          label={t('search.sort')}
          value={sort}
          onChange={view.pickSort}
          className="w-full @md:w-[340px] [&>button]:text-[13.5px]"
          options={[
            { value: 'relevance', label: t('search.sort.relevance') },
            { value: 'newest', label: t('search.sort.newest') },
            { value: 'pay', label: t('search.sort.pay') },
          ]}
        />
      )}
    </>
  );

  return (
    <WidgetSection
      title={
        <>
          {heading}
          {!savedView && duplicates > 0 ? <span className="ms-2 text-ink-3">· {t('search.duplicates', { count: duplicates })}</span> : null}
        </>
      }
      // Beside the heading when the card is wide; on a phone the same controls take their own row under it.
      aside={<div className="hidden items-center gap-3 @md:flex">{controls}</div>}
    >
      {savedView || !bare ? <div className="-mt-1.5 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 @md:hidden">{controls}</div> : null}
      {bare ? null : <FilterChips filters={offeredFilters(counts, filter)} counts={counts} value={filter} onChange={view.pickFilter} />}

      {/* How "Top pay" ranks: hourly and yearly pay are mixed in one list, so the rule is on screen. */}
      {payHint ? <p className="m-0 -mt-0.5 mb-3 text-[13px] leading-snug text-ink-2">{payHint}</p> : null}
      <LiveRegion text={[narrowed && list.length ? t('search.showingOf', { shown: list.length, count: jobs.length }) : t('search.showing', { count: list.length }), payHint].filter(Boolean).join(' ')} delay={400} />
      {list.length ? (
        <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2.5 p-0">
          <AnimatePresence initial={false}>
            {list.slice(0, shown).map((j) => (
              <motion.li
                key={j.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              >
                <JobCard job={j} today={today} lang={lang} saved={isSaved(j.id)} onSave={onSave} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="m-0 rounded-tile bg-paper-2 px-4 py-5 text-center text-[14.5px] text-ink-2">{t('search.noneFiltered')}</p>
      )}
      {list.length > shown ? (
        <div className="mt-3 flex justify-center">
          <Button size="md" variant="secondary" onClick={view.showMore}>
            {t('search.more', { count: Math.min(PAGE, list.length - shown) })}
          </Button>
        </div>
      ) : null}
    </WidgetSection>
  );
}
