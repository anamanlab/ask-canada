'use client';
/**
 * How a calendar date reads: its name, its detail line, the official page it comes from and its colour. One place,
 * so the hero, the tiles, the agenda, the month grid and the calendar file all word a date the same way.
 */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { PROGRAM_META, URLS, type Lang, type Province, type Tone } from '../data';
import { PROVINCE_SOURCES } from '../sources';
import messages from '../messages';
import { useDate } from '../parts';
import type { CalEvent } from '../types';

/** A payment takes its program's colour; deadlines and holidays share maple (their mark tells them apart). */
export const toneOf = (e: CalEvent): Tone => (e.kind === 'payment' && e.program ? PROGRAM_META[e.program].tone : 'maple');

export type EventText = ReturnType<typeof useEventText>;

export function useEventText(province: Province | null, today: string) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const fmtDate = useDate();
  const lang: Lang = locale === 'fr' ? 'fr' : 'en';

  const long = (iso: string) => fmtDate(iso, { weekday: 'long', month: 'long', day: 'numeric' });
  /** "Oct 20"; with the year once it isn't this year's ("Mar 1, 2027", « 1er mars 2027 »), so a 2027 deadline never reads as this year's. */
  const short = (iso: string) => fmtDate(iso, { month: 'short', day: 'numeric', year: iso.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' });

  const name = (e: CalEvent) =>
    e.kind === 'payment' ? t(e.gst ? 'program.gst.name' : `program.${e.program}.name`) : e.kind === 'tax' ? t(`tax.${e.tax}.name`) : (e.holiday?.name[lang] ?? '');

  /** The short name on a tile or chip ("Canada child benefit" → "Child benefit"). */
  const shortName = (e: CalEvent) =>
    e.kind === 'payment' ? t(e.gst ? 'program.gst.name' : `program.${e.program}.short`) : e.kind === 'tax' ? t(`tax.${e.tax}.name`) : name(e);

  const sub = (e: CalEvent) => {
    if (e.kind === 'payment') return t(e.gst ? 'program.gst.sub' : `program.${e.program}.sub`);
    if (e.kind === 'tax') {
      return e.expected && e.tax === 'rrsp'
        ? t('tax.rrsp.subExpected', { year: String(e.taxYear) })
        : t(`tax.${e.tax}.sub`, { year: String(e.taxYear) });
    }
    const h = e.holiday;
    if (!h) return '';
    const base = province ? t('hol.kind.stat', { placeIn: t(`provIn.${province}`) }) : t('hol.kind.federal');
    if (h.clcWeekend) return `${base} · ${t('hol.clcWeekend', { weekday: fmtDate(h.date, { weekday: 'long' }) })}`;
    if (h.substitute && province) {
      return `${base} · ${t('hol.substitute', { weekday: fmtDate(h.date, { weekday: 'long' }), placeOf: t(`provOf.${province}`), date: fmtDate(h.substitute, { weekday: 'long', month: 'long', day: 'numeric' }) })}`;
    }
    return h.date !== e.date ? `${base} · ${t('hol.kind.observed', { date: fmtDate(h.date, { month: 'long', day: 'numeric' }) })}` : base;
  };

  const sourceUrl = (e: CalEvent) => {
    if (e.kind === 'payment') return e.program && PROGRAM_META[e.program].admin === 'cra' ? URLS.craPayDates[lang] : URLS.calendar[lang];
    if (e.kind === 'tax') return e.tax === 'instalment' ? URLS.instalments[lang] : e.tax === 'rrsp' ? (e.expected ? URLS.rrspRule : URLS.rrsp)[lang] : URLS.filing[lang];
    return province ? PROVINCE_SOURCES[province][lang].url : URLS.federalHolidays[lang];
  };

  return { lang, long, short, name, shortName, sub, sourceUrl };
}
