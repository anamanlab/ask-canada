'use client';
/** One Job Bank posting: the whole card opens the posting; the bookmark saves it on this device. */
import { Bookmark, BookmarkCheck, Building2, Clock3, MapPin, Sparkles, Wifi } from 'lucide-react';
import { Badge, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { daysSince, usePay } from './parts';
import { isFresh } from './search-model';
import type { Lang } from './data';
import { employerName, mendApostrophes } from './text';
import type { JobPosting } from './types';

type Props = {
  job: JobPosting;
  today: string;
  /** Language of the search the postings came from (for Job Bank's own words, shown as written). */
  lang: Lang;
  saved: boolean;
  onSave: (job: JobPosting) => void;
};

export function JobCard({ job, today, lang, saved, onSave }: Props) {
  const t = useMessages(messages);
  const pay = usePay();
  const days = job.date ? daysSince(job.date, today) : null;
  const payText = pay(job.salary);
  const fresh = isFresh(job, today);
  const title = mendApostrophes(job.title.trim());
  return (
    <article className="group relative rounded-tile border border-hair bg-card px-4 py-3.5 shadow-sm transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-hair-2 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h5 className="m-0 text-[15.5px] font-semibold leading-snug tracking-[-.005em] text-ink">
            {/* The link stretches over the card; its arrow shows on hover or focus, glued to the title's last word. */}
            <ExternalLink
              href={job.url}
              className="py-0 font-semibold no-underline outline-none after:absolute after:inset-0 after:rounded-tile after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink [&_svg]:text-ink-3 [&_svg]:opacity-0 [&_svg]:transition-opacity group-focus-within:[&_svg]:opacity-100 group-hover:[&_svg]:opacity-100"
            >
              {title}
            </ExternalLink>
          </h5>
          <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13.5px] text-ink-2">
            {job.employer ? (
              <span className="inline-flex min-w-0 items-start gap-1.5">
                <Building2 className="mt-[3px] size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={1.8} />
                <span className="min-w-0 break-words">{employerName(job.employer)}</span>
              </span>
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-ink-3" aria-hidden strokeWidth={1.8} />
                {job.location}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSave(job)}
          aria-pressed={saved}
          aria-label={saved ? t('search.unsave', { title }) : t('search.save', { title })}
          title={saved ? t('search.unsaveShort') : t('search.saveShort')}
          className={cn(
            'relative z-10 -me-2 -mt-1.5 grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-ink',
            saved ? 'text-maple' : 'text-ink-3',
          )}
        >
          {saved ? <BookmarkCheck className="size-[19px]" strokeWidth={1.9} aria-hidden /> : <Bookmark className="size-[19px]" strokeWidth={1.8} aria-hidden />}
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {payText && job.salary?.min == null ? (
          // Pay we couldn't read reliably: Job Bank's own words (in the posting's language), in a neutral chip.
          <span className="rounded-chip bg-paper-2 px-2.5 py-1 text-[12.5px] text-ink-2">
            <bdi lang={lang}>{payText}</bdi>
          </span>
        ) : payText ? (
          <span className="inline-flex flex-wrap items-center gap-x-1 rounded-chip bg-pine-wash px-2.5 py-1 text-[13px] font-semibold text-pine">
            <bdi dir="ltr">{payText}</bdi>
            {/* Real amounts whose stated period can't be right ("$26 to $30 a year"): never a bare range. */}
            {job.salary?.period ? null : <span className="font-normal opacity-80">· {t('pay.periodUnclear')}</span>}
            {job.salary?.negotiable ? <span className="font-normal opacity-80">· {t('pay.negotiable')}</span> : null}
          </span>
        ) : (
          <span className="rounded-chip bg-paper-2 px-2.5 py-1 text-[12.5px] text-ink-2">{t('pay.notListed')}</span>
        )}
        {days != null ? (
          <Badge tone={fresh ? 'info' : 'neutral'} icon={fresh ? Sparkles : Clock3}>
            {t('search.posted', { days })}
          </Badge>
        ) : null}
        {job.workplace === 'remote' || job.workplace === 'hybrid' ? <Badge tone="ok" icon={Wifi}>{t(`workplace.${job.workplace}`)}</Badge> : null}
        {job.postedOnJobBank ? <Badge tone="neutral">{t('search.onJobBank')}</Badge> : null}
        {job.directApply ? <Badge tone="neutral">{t('search.directApply')}</Badge> : null}
      </div>
    </article>
  );
}
