'use client';
/**
 * Parts of the processing times widget that the result and its loading state both lay out: the "already
 * applied?" link, the notice for a paused program, and the content of one application-type row.
 */
import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronRight, FileSearch, PauseCircle } from 'lucide-react';
import { Badge, ExternalLink, Notice } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { PAUSED, URLS, type Lang } from './data';
import messages from './messages';
import { Meter, useDuration } from './Shared';
import { QUEBEC_SPLIT, type Duration, type TimeKey } from './times';

/** "Already applied? Check your application status": the average matters less than the person's own file. */
export function StatusLink({ lang }: { lang: Lang }) {
  const t = useMessages(messages);
  return (
    <div className="px-5 pt-4 sm:px-6">
      <ExternalLink
        href={URLS.status[lang]}
        standalone
        icon={false}
        className="group flex gap-3 rounded-field bg-glacier-wash px-4 py-3 text-[14.5px] font-normal leading-snug no-underline transition-colors hover:bg-glacier-wash/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glacier"
      >
        <FileSearch className="size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
        <span className="min-w-0 flex-1">
          <strong className="font-semibold">{t('pt.applied.title')}</strong> <span className="text-ink-2 underline decoration-hair-2 underline-offset-[3px] group-hover:text-ink">{t('pt.applied.link')}</span>
        </span>
        <ArrowUpRight className="flip-rtl size-[18px] shrink-0 text-ink-3 transition-transform group-hover:-translate-y-px group-hover:translate-x-px rtl:group-hover:-translate-x-px" aria-hidden />
      </ExternalLink>
    </div>
  );
}

/** A paused program: what the pause means, the official page, and (for parents) the super visa as the way to compare. */
export function PausedNotice({ program, lang, noteId, onCompare }: { program: TimeKey; lang: Lang; noteId?: string; onCompare?: () => void }) {
  const t = useMessages(messages);
  return (
    <div className="px-5 pt-4 sm:px-6">
      <Notice tone="warn" icon={PauseCircle} title={t('pt.paused.title')}>
        <p className="m-0 mt-1">{t('pt.paused.body')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5">
          <ExternalLink href={URLS[PAUSED[program]?.source ?? 'parents'][lang]} standalone>
            {/* One element, not a bare string: a standalone link is a flex row, which drops the space before a split-off last word. */}
            <span>{t('pt.paused.link')}</span>
          </ExternalLink>
          {program === 'parents' ? (
            <button type="button" onClick={onCompare} className="inline-flex min-h-11 items-center gap-1 font-medium text-ink underline decoration-hair-2 underline-offset-[3px]" aria-describedby={noteId}>
              {t('pt.paused.superVisa')}
              <ChevronRight className="size-4 flip-rtl" aria-hidden />
            </button>
          ) : null}
        </div>
        {program === 'parents' ? (
          <p id={noteId} className="m-0 text-[13.5px] text-ink-2">
            {t('pt.paused.superVisaNote')}
          </p>
        ) : null}
      </Notice>
    </div>
  );
}

/**
 * The words of one row. Sponsorship times are published for outside Quebec and for Quebec: in the list, that
 * split lives on the row's second line ("Outside Quebec · In Quebec: about 32 months") so the name stays short
 * and rows keep an even height on a phone. The headline keeps the full name ("… (outside Quebec)").
 */
export function useTimeRowText() {
  const t = useMessages(messages);
  const dur = useDuration();
  const lower = (s: string) => s.charAt(0).toLocaleLowerCase() + s.slice(1);
  return {
    label: (k: TimeKey) => t(QUEBEC_SPLIT.includes(k) ? `pt.row.${k}` : `pt.key.${k}`),
    quebec: (k: TimeKey, q: Duration | null | undefined) => (QUEBEC_SPLIT.includes(k) ? (q ? t('pt.quebecRow', { value: lower(dur(q)) }) : t('pt.outsideQuebec')) : null),
  };
}

/** Grid of one application-type row (the result's radio button and the skeleton's row share it). */
export const TIME_ROW = 'grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-x-3 gap-y-1 rounded-field px-3 py-2 text-start';

/** Inside a row: the application type, its time, then (full width) the paused flag, the Quebec figure and the meter. */
export function TimeRowContent({
  label,
  value,
  known,
  chevron,
  paused,
  quebec,
  meter,
}: {
  label: ReactNode;
  value: ReactNode;
  /** A published time (not "by country" or "no estimate"). */
  known: boolean;
  /** Arrow at the end of a row that can be picked. */
  chevron?: boolean;
  paused?: boolean;
  quebec?: ReactNode;
  meter?: { value: number; max: number; on: boolean };
}) {
  const t = useMessages(messages);
  return (
    <>
      <span className="min-w-0 text-[14.5px] leading-snug text-ink">{label}</span>
      <span className={cn('whitespace-nowrap text-[14px] font-medium tabular-nums', known ? 'text-ink' : 'text-ink-3')}>{value}</span>
      <ChevronRight className={cn('size-4 text-ink-3 flip-rtl transition-opacity', chevron ? 'opacity-50 group-hover:opacity-100' : 'opacity-0')} aria-hidden />
      {paused || quebec ? (
        // Full-width second line: the paused flag and the Quebec figure never squeeze the label.
        <span className="col-span-2 -mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-snug text-ink-3">
          {paused ? (
            <Badge tone="warn" icon={PauseCircle}>
              {t('pt.paused.badge')}
            </Badge>
          ) : null}
          {quebec ? <span>{quebec}</span> : null}
        </span>
      ) : null}
      {meter ? <Meter className="col-span-2 h-1" value={meter.value} max={meter.max} tone={meter.on ? 'glacier' : 'muted'} /> : null}
    </>
  );
}
