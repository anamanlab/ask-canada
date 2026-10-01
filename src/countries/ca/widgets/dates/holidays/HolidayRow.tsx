'use client';
/** One holiday in the year's list: date tile, name, the day it's observed, its kind, and where it sits (today, next, passed). */
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { isWeekend } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { isChoiceIn, type HolidayItem, type Province } from '../data';
import messages from '../messages';
import { holidayName, inSentence } from '../names';
import { MiniDate, cap, useDate, Ord } from '../parts';
import { dayOff } from '../select';

const CAPTION = 'font-mono text-[11px] uppercase tracking-[.06em] text-ink-3';

export function HolidayRow({
  h,
  province,
  today,
  isNext,
  other,
  sameDay,
}: {
  h: HolidayItem;
  province: Province | null;
  today: string;
  isNext: boolean;
  /** Quebec: the other day the employer may give instead (Easter Monday for Good Friday). */
  other?: HolidayItem;
  /**
   * A Canada Labour Code holiday on the same day that isn't statutory here (Quebec: Victoria Day, on National Patriots'
   * Day). It isn't counted under "federal holidays not observed here" (the day is already off), so the row names it.
   */
  sameDay?: HolidayItem;
}) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const fmtDate = useDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const long = (iso: string) => fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' });
  const d = dayOff(h);
  const past = d < today;
  const choice = isChoiceIn(h, province);
  // Provincial, also a Canada Labour Code holiday (N.L.'s Memorial Day is one too: July 1 is Canada Day), or the
  // employer's choice: beside the row when there's room, under the date in a phone-width column (never dropped).
  const kind = province ? (choice ? t('hol.choice.badge') : h.clc || h.clcDay ? t('hol.badge.federal') : h.federal ? t('hol.badge.publicService') : t('hol.badge.provincial')) : null;
  return (
    <li className={cn('flex items-center gap-3 border-t border-hair py-3 first:border-t-0', isNext && 'rounded-[14px] border-transparent bg-maple-wash px-2.5 [&+li]:border-t-transparent')}>
      <MiniDate date={d} tone={past ? 'ink' : 'maple'} muted={past} />
      <div className="min-w-0 flex-1">
        <p className={cn('m-0 text-[15.5px] font-medium leading-snug', past ? 'text-ink-2' : 'text-ink')}>{holidayName(h, province, lang)}</p>
        <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">
          <Ord>{choice && other ? cap(t('hol.choice.dates', { a: long(d), b: long(dayOff(other)) })) : cap(long(d))}</Ord>
          {h.observed ? (
            <Ord>
              {` · ${isWeekend(h.date) ? `${t('hol.weekendNote')} (${fmtDate(h.date, { weekday: 'short', month: 'short', day: 'numeric' })})` : t('hol.kind.observed', { date: fmtDate(h.date, { month: 'long', day: 'numeric' }) })}`}
            </Ord>
          ) : null}
        </p>
        {h.clcWeekend ? <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">{t('hol.clcWeekend', { weekday: fmtDate(h.date, { weekday: 'long' }) })}</p> : null}
        {h.substitute && province ? (
          <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">
            <Ord>{t('hol.substitute', { weekday: fmtDate(h.date, { weekday: 'long' }), placeOf: t(`provOf.${province}`), date: long(h.substitute) })}</Ord>
          </p>
        ) : null}
        {sameDay ? <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">{t('hol.sameDay', { name: inSentence(sameDay.name[lang], lang) })}</p> : null}
        {kind ? <p className={cn('m-0 mt-1 @md:hidden', CAPTION)}>{kind}</p> : null}
      </div>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {d === today ? (
          <Badge tone="danger">{t('hol.badge.today')}</Badge>
        ) : isNext ? (
          <Badge tone="danger">{t('hol.badge.next')}</Badge>
        ) : past ? (
          // A word, not a check mark: beside "Also federal" a check read as "yes, observed", and said nothing to a screen reader.
          <span className={CAPTION}>{t('hol.past')}</span>
        ) : null}
        {kind ? <span className={cn('@max-md:hidden', CAPTION)}>{kind}</span> : null}
      </span>
    </li>
  );
}
