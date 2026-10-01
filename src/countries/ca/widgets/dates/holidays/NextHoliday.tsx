'use client';
/** The holidays hero: the next holiday (or today's, or the next long weekend when they asked), with its days off drawn out. */
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { HolidayItem, Province } from '../data';
import messages from '../messages';
import { BigDate, Countdown, Ord, cap, useDate, useRel } from '../parts';
import { dayOff, longWeekend, nextLongWeekend } from '../select';
import { holidayName, inSentence } from '../names';
import type { HolidaysOutput } from '../types';
import { DaysOff } from './DaysOff';

export function NextHoliday({
  o,
  province,
  today,
  here,
  off,
  year,
  spaced,
}: {
  o: HolidaysOutput;
  province: Province | null;
  today: string;
  /** Every holiday that applies here, soonest first (all years). */
  here: HolidayItem[];
  /** Their days off, for the long-weekend strip. */
  off: Set<string>;
  /** The year of the list on screen. */
  year: number;
  /** Sits under the direct answer. */
  spaced: boolean;
}) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const fmtDate = useDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const rel = useRel();
  const nm = (h: HolidayItem) => holidayName(h, province, lang);
  // The year is said whenever it isn't the obvious one: under a 2027 list the next holiday is still this year's
  // ("Monday, October 12, 2026"), and late in December the next one is next year's.
  const long = (iso: string, withYear = false) => fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: withYear ? 'numeric' : undefined });
  const says = (iso: string) => iso.slice(0, 4) !== String(year) || iso.slice(0, 4) !== today.slice(0, 4);
  const placeIn = province ? t(`provIn.${province}`) : '';

  // "When is the next long weekend?" leads with the next holiday that makes one (never today's).
  const nextLw = o.longWeekendAsked ? nextLongWeekend(o.holidays, province, today) : null;
  const next = nextLw?.holiday ?? here.find((h) => dayOff(h) >= today) ?? null;
  const lw = nextLw ?? (next ? longWeekend(dayOff(next), off) : null);
  // Today's holiday as it applies here (federal view: the Canada Labour Code date, see `clcView`).
  const todayHere = nextLw ? undefined : here.find((h) => dayOff(h) === today);
  const after = todayHere ? here.find((h) => dayOff(h) > today) : undefined;
  // A federal day off today that isn't a holiday here: a Canada Labour Code holiday, or a public-service day.
  const todayAll = todayHere ? [] : o.holidays.filter((h) => dayOff(h) === today);
  const todayFederal = todayAll.find((h) => h.clc) ?? todayAll.find((h) => h.federal);

  return (
    <div
      className={cn(
        'relative mx-3 overflow-hidden rounded-[22px] border border-hair px-4 py-4 sm:mx-4 sm:px-5 sm:py-5',
        'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--a-green)_22%,transparent),color-mix(in_oklab,var(--a-teal)_16%,transparent)_50%,color-mix(in_oklab,var(--a-rose)_14%,transparent))]',
        spaced && 'mt-3',
      )}
    >
      {next ? (
        <>
          <div className="flex items-center gap-4 sm:gap-5">
            <BigDate date={dayOff(next)} tone="maple" />
            <div className="min-w-0 flex-1">
              <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.12em] text-ink-2">
                {nextLw ? t('hol.nextLw.label') : todayHere ? t('hol.today.label') : province ? t('hol.next.label') : t('hol.next.labelFederal')}
              </p>
              <p className="m-0 mt-1 text-balance font-serif text-[26px] leading-[1.1] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{nm(todayHere ?? next)}</p>
              <p className="m-0 mt-1.5 text-[15px] leading-snug text-ink-2">
                {nextLw ? (
                  <bdi>
                    <Ord>{cap(t('hol.lw.range', { start: long(nextLw.start), end: long(nextLw.end, says(nextLw.end)) }))}</Ord>
                  </bdi>
                ) : (
                  <Ord>{cap(long(dayOff(next), says(dayOff(next))))}</Ord>
                )}
                {/* A long weekend's countdown runs to its first day off (the tile shows the holiday itself): "starts in 10 days". */}
                {todayHere ? null : <Countdown>{nextLw ? t('rel.starts', { rel: rel(today, nextLw.start) }) : rel(today, dayOff(next))}</Countdown>}
              </p>
            </div>
          </div>
          <DaysOff next={next} lw={lw} off={off} today={today} rangeShown={Boolean(nextLw)} />
          {todayHere && after ? (
            <p className="m-0 mt-3 text-[13.5px] leading-snug text-ink-2">
              <Ord>{t('hol.after', { name: inSentence(nm(after), lang), date: long(dayOff(after), says(dayOff(after))), rel: rel(today, dayOff(after)) })}</Ord>
            </p>
          ) : null}
        </>
      ) : (
        <p className="m-0 font-serif text-[21px] text-ink">{t('hol.none')}</p>
      )}
      {todayFederal && province ? (
        <p className="m-0 mt-3 flex items-start gap-2 text-[13.5px] leading-snug text-ink-2">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden strokeWidth={1.8} />
          {t(todayFederal.clc ? 'hol.today.federalOnly' : 'hol.today.psOnly', { name: lang === 'en' ? inSentence(nm(todayFederal), 'en') : nm(todayFederal), placeIn })}
        </p>
      ) : null}
    </div>
  );
}
