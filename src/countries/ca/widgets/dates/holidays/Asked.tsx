'use client';
import { Check, Minus, Split } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { HolidayItem, Province } from '../data';
import messages from '../messages';
import { inSentence } from '../names';
import { cap, useDate, Ord } from '../parts';
import { askedView, dayOff } from '../select';
import type { HolidaysOutput } from '../types';

/**
 * A direct answer when they asked about one holiday: yes, no, or "it depends" (Quebec's Good Friday or Easter
 * Monday, at the employer's option). The verdict is a word in a tinted badge, not a glyph that reads as a button.
 * It stays short (verdict, who it covers when that isn't everyone, next date): the answer above it carries the why
 * and where. Without a province the question is answered for the Canada Labour Code, and said so: Easter Monday and
 * Civic Holiday are days off for the federal public service, so "isn't a federal holiday" would be wrong for them.
 */
export function Asked({ asked: a, holidays, province }: { asked: NonNullable<HolidaysOutput['asked']>; holidays: HolidayItem[]; province: Province | null }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const fmtDate = useDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  // English sets the name in a sentence ("Yes, the National Day for Truth and Reconciliation is…"); French leads with
  // it as a label (« Journée nationale de la vérité et de la réconciliation : oui… »).
  const name = lang === 'en' ? inSentence(a.name.en, 'en') : a.name.fr;
  const choice = Boolean(province && a.choiceProvinces.includes(province));
  const yes = province ? a.provinces.includes(province) : a.clc;
  // Quebec's Good Friday or Easter Monday is one holiday at the employer's option: the same verdict for both days,
  // so a worker whose employer picked the other day never reads a plain yes.
  const verdict: 'yes' | 'no' | 'choice' = choice ? 'choice' : yes ? 'yes' : 'no';
  const long = (iso: string) => fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const wd = (iso: string) => fmtDate(iso, { weekday: 'long' });
  const placeIn = province ? t(`provIn.${province}`) : '';
  // Quebec: both days of the pair, in order ("Next: Friday, March 26 or Monday, March 29").
  const other = verdict === 'choice' ? holidays.find((h) => h.choice && h.name.en !== a.name.en && h.date.slice(0, 4) === a.date.slice(0, 4)) : undefined;
  const pair = other ? [a.date, dayOff(other)].sort() : null;
  // The day as the province on screen sees it (they may have switched since asking): a weekend holiday keeps its date,
  // and a provincial government's own day never shows a day off its schedule hasn't published (see `askedView`).
  const raw = holidays.find((h) => h.date === a.date && h.name.en === a.name.en);
  const v = raw ? askedView(raw, province) : a;
  const gov = Boolean(province && !yes && a.government?.includes(province));
  const year = a.date.slice(0, 4);
  const when = pair
    ? t('hol.asked.whenChoice', { a: long(pair[0]), b: long(pair[1]) })
    : v.unscheduled
      ? v.floating
        ? t('hol.asked.whenFloating', { year })
        : t('hol.asked.whenUnscheduled', { date: long(a.date), year })
      : v.clcWeekend
        ? t('hol.asked.whenClc', { date: long(a.date), weekday: wd(a.date) })
        : v.substitute && province
          ? t('hol.asked.whenSubstitute', { date: long(a.date), weekday: wd(a.date), placeOf: t(`provOf.${province}`), sub: long(v.substitute) })
          : v.observed
            ? t(gov ? 'hol.asked.whenGov' : 'hol.asked.whenObserved', { date: long(a.date), observed: long(v.observed) })
            : t('hol.asked.when', { date: long(a.date) });
  const head =
    verdict === 'choice'
      ? cap(t('hol.asked.choice', { placeIn }))
      : province
        ? t(yes ? 'hol.asked.yes' : 'hol.asked.no', { name, placeIn })
        : t(yes ? 'hol.asked.yesFederal' : 'hol.asked.noFederal', { name });
  // Who still gets the day when the answer is no: federal public servants (Easter Monday, Civic Holiday), or the
  // provincial government's own employees (Newfoundland and Labrador's St. Patrick's Day and others).
  const still = verdict !== 'no' ? null : province ? (gov ? t(a.clc ? 'hol.asked.govAndClc' : 'hol.asked.govOnly') : null) : a.federal && !a.clc ? t('hol.asked.psOnly') : null;
  const Icon = verdict === 'yes' ? Check : verdict === 'choice' ? Split : Minus;
  return (
    <div
      className={cn(
        'mx-3 mb-0 rounded-[22px] border px-5 py-4 sm:mx-4',
        verdict === 'yes' ? 'border-pine/20 bg-pine-wash' : verdict === 'choice' ? 'border-amber/25 bg-amber-wash' : 'border-hair bg-paper-2',
      )}
      role="status"
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11.5px] font-semibold uppercase tracking-[.1em]',
          verdict === 'yes' ? 'bg-pine text-paper' : verdict === 'choice' ? 'bg-amber/15 text-ink' : 'bg-glacier-wash text-ink',
        )}
      >
        <Icon className="size-3.5" strokeWidth={2.6} aria-hidden />
        {t(`hol.verdict.${verdict}`)}
      </span>
      <p className="m-0 mt-2.5 font-serif text-[21px] leading-[1.2] tracking-[-.015em] text-ink">{head}</p>
      {still ? <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink">{still}</p> : null}
      <p className="m-0 mt-1.5 text-[14px] leading-snug text-ink-2">
        <Ord>{when}</Ord>
      </p>
    </div>
  );
}
