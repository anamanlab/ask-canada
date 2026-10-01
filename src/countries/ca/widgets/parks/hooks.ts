/**
 * Small hooks shared by the parks renderers: the answer's language, Canada.ca-style dates, the reader's time
 * zone, one-line admission summaries, clock times and chunk preloading.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { useMediaQuery } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { ToolSource } from '@/lib/widgets/types';
import { OTHER_FEES, TIERS, type Admission, type Lang } from './data';
import messages from './messages';
import type { ParkSource } from './urls';

/** `fmt.number(km, KM)` → "135 km". */
export const KM = { style: 'unit', unit: 'kilometer' } as const;

/** Language for park names and official links: French for `fr`, English otherwise. */
export function useLang(): Lang {
  const { locale } = useLocale();
  return locale === 'fr' ? 'fr' : 'en';
}

/**
 * `fmt.date` with Canada.ca French style for the first of the month ("1er mai 2026", not "1 mai 2026").
 * Every date a parks widget shows goes through this.
 */
export function useDateText() {
  const { fmt } = useLocale();
  const lang = useLang();
  return (d: string | Date, opts: Intl.DateTimeFormatOptions) => {
    const s = fmt.date(d, opts);
    // No-break spaces: "1er mai 2026" / "May 1, 2026" never split across lines.
    if (lang !== 'fr' || !opts.day) return s.replace(/ /g, '\u00a0');
    const day = typeof d === 'string' ? Number(d.slice(8, 10)) : d.getDate();
    return (day === 1 ? s.replace(/(^|\s)1(?=[\s\u00a0])/, '$11er') : s).replace(/ /g, '\u00a0');
  };
}

/**
 * A clock time with its time zone, in Canada.ca style: "7:05 am PDT" (not "a.m."), "7 h 05 HAP". Every clock
 * time a parks widget formats goes through this, so it matches the times written in the copy ("8 am local time").
 */
export function useClockText() {
  const { fmt } = useLocale();
  const lang = useLang();
  return (at: Date, timeZone: string) => {
    const s = fmt.date(at, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone });
    // English: "a.m." → "am". French: no leading zero on the hour ("07 h 05" → "7 h 05").
    const styled = lang === 'en' ? s.replace(/\b([ap])\.m\./i, (_, h: string) => `${h.toLowerCase()}m`) : s.replace(/^0(?=\d)/, '');
    return styled.replace(/ /g, '\u00a0');
  };
}

const neverChanges = () => () => {};
const deviceZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
/** The capital region's zone: what the server renders with, so the first client render matches it. */
const serverZone = () => 'America/Toronto';

/** The reader's own time zone for clock times (hydration-safe: the server's zone until the page is live). */
export function useTimeZone(): string {
  return useSyncExternalStore(neverChanges, deviceZone, serverZone);
}

/** One-line admission summary for a park, in plain words and local currency format. */
export function useAdmissionText() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, { cents: 'always' });
  /** `short`: a few words for a list row. `long`: the full sentence for the park card. */
  return (a: Admission, style: 'short' | 'long' = 'short') => {
    const short = style === 'short';
    switch (a.kind) {
      case 'daily': {
        const f = TIERS[a.tier];
        return short
          ? t('adm.dailyShort', { adult: money(f.adult) })
          : t('adm.dailyLong', { adult: money(f.adult), senior: money(f.senior), family: money(f.family) });
      }
      case 'free':
        return t('adm.free');
      case 'noDaily':
        return t(short ? 'adm.short.noDaily' : 'adm.noDaily');
      case 'northern':
        if (a.dayTrip) return short ? t('adm.northernDayShort', { day: money(OTHER_FEES.northernDay) }) : t('adm.northernDay', { day: money(OTHER_FEES.northernDay), night: money(OTHER_FEES.northernNight) });
        if (short) return t(a.perDay ? 'adm.short.northernPerDay' : 'adm.short.northern', { fee: money(OTHER_FEES.northernNight) });
        return t(a.perDay ? 'adm.northernPerDay' : 'adm.northern', { fee: money(OTHER_FEES.northernNight) });
      case 'sable':
        return t(short ? 'adm.short.sable' : 'adm.sable', { fee: money(OTHER_FEES.sableDay) });
      case 'gwaii':
        return t(short ? 'adm.short.gwaii' : 'adm.gwaii', { fee: money(OTHER_FEES.gwaiiDay) });
      case 'parking':
        return t('adm.parking', { fee: money(OTHER_FEES.parkingDay) });
      default:
        return t(short ? 'adm.short.check' : 'adm.check');
    }
  };
}

/**
 * Starts fetching a card's lazily loaded chunk as soon as its tool call appears (while the skeleton shows), so
 * the chunk is in memory when the output arrives and the skeleton never flashes a second time.
 * `load` is the same module-level `() => import('./X')` given to `lazy`.
 */
export function usePreload(load: () => Promise<unknown>) {
  useEffect(() => {
    // A failed fetch is retried, and reported, by `lazy` when the card renders.
    load().catch(() => {});
  }, [load]);
}

/**
 * The sources for a card's footer. The footer shows the first one on a single line: on phones that page goes
 * by its short title, so the line is never cut with an ellipsis; from 640px up it has room for the full title.
 * The answer's Sources list is built from the tool output and always has the full titles.
 */
export function useFooterSources(sources: ParkSource[]): ToolSource[] {
  const roomy = useMediaQuery('(min-width: 640px)');
  const [first, ...rest] = sources;
  return !roomy && first?.short ? [{ ...first, title: first.short }, ...rest] : sources;
}
