/**
 * Formatting shared by the weather renderers: temperatures, times in the forecast location's own time zone
 * (Canada.ca style in both languages), place names and province names.
 */
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

/** Left-to-right isolate (LRI … PDI): keeps "−21°" reading as minus 21 inside right-to-left text. */
export const ltr = (s: string) => `\u2066${s}\u2069`;

/**
 * Temperatures: rounded, never "-0", with a real minus sign and a degree sign, wrapped in an LTR isolate so
 * the minus stays in front of the number in RTL layouts (−21° must never read as 21°−, i.e. +21).
 */
export function useTemp() {
  const { fmt } = useLocale();
  return (t: number | null | undefined) => (t == null ? '—' : ltr(`${fmt.number(Math.round(t) || 0).replace('-', '\u2212')}°`));
}

/**
 * Humidex and wind chill are index values, not temperatures: Environment Canada writes them without a degree
 * sign ("Humidex: 28" on a weather.gc.ca city page, "a humidex of 40", "the wind chill is -20"; see data.ts).
 */
export function useIndex() {
  const { fmt } = useLocale();
  return (v: number) => ltr(fmt.number(Math.round(v) || 0).replace('-', '\u2212'));
}

/**
 * Yukon has kept UTC−7 all year since 2020, but Intl has no abbreviation for it ("GMT-7", "UTC−7").
 * Environment Canada writes MST / HNR there, so we do too.
 */
const yukon = (tz: string, s: string) => (/^America\/(Whitehorse|Dawson)$/.test(tz) ? s.replace(/GMT-7|UTC[−-]7/, (m) => (m.startsWith('GMT') ? 'MST' : 'HNR')) : s);

export type Fmt = ReturnType<typeof useLocale>['fmt'];

/**
 * Canada.ca French times: fr-CA pads hours ("08 h 00") and always writes minutes; Canada.ca writes "8 h",
 * "14 h" on the hour and keeps minutes only when they aren't zero ("18 h 27").
 */
const frTime = (s: string) =>
  s
    .replace(/(^|\s)0(\d)(?=\s?h)/g, '$1$2')
    .replace(/(\d)\s?h\s?00(?!\d)/g, '$1 h')
    // A time never breaks across lines: narrow no-break spaces inside "11 h" and "18 h 27".
    .replace(/(\d)\s?h(?:\s?(\d{2}))?(?![\p{L}\d])/gu, (_, d: string, m?: string) => `${d}\u202Fh${m ? `\u202F${m}` : ''}`);
/**
 * One time style everywhere (hourly strip, alert cards, alert groups, badges): minutes only when they
 * aren't zero ("7 a.m.", "7:30 a.m.", "7 h", "7 h 30") and no comma after the weekday ("Thu 2 a.m. ADT").
 */
const tidyTime = (s: string) =>
  frTime(s)
    .replace(/:00(?=\s?[ap]\.?\s?m)/gi, '')
    .replace(/^([^\d,]+),\s/, '$1 ');

type T = (key: string, values?: Record<string, string | number>) => string;

/**
 * Formatters for times in one time zone (pure; `useLocalTime` binds it to the page locale and messages).
 * Alert timings never say "12 a.m." or "12 p.m.": 12:00 is "noon", and 00:00 is "midnight" named by the day it
 * ends ("Wed midnight CST"), because "Thu 12 a.m." reads to many people as Thursday night. Every timing keeps
 * the one day + time + zone order ("Thu 7 a.m. CST", "Wed midnight CST", "Thu noon CST").
 */
export function localTime(fmt: Fmt, tz: string, t: T) {
  const safe = (opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({ ...opts, timeZone: tz });
  const timeTz = (iso: string) => yukon(tz, tidyTime(fmt.date(new Date(iso), safe({ hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }))));
  const weekday = (ms: number) => fmt.date(new Date(ms), safe({ weekday: 'short' }));
  const clock = new Intl.DateTimeFormat('en-CA', safe({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }));
  /** Midnight and noon in words; null for every other time. */
  const named = (iso: string, { day, zone }: { day?: boolean; zone?: boolean }) => {
    const hm = clock.format(new Date(iso));
    const which = hm === '00:00' ? 'midnight' : hm === '12:00' ? 'noon' : null;
    if (!which) return null;
    const abbr = zone ? ` ${timeTz(iso).split(/\s/).pop() ?? ''}` : '';
    if (!day) return `${t(`time.${which}`)}${abbr}`;
    const ms = Date.parse(iso);
    return which === 'noon' ? t('time.noonDay', { day: weekday(ms), tz: abbr }) : t('time.midnightDay', { prev: weekday(ms - 12 * 3600_000), tz: abbr });
  };
  return {
    /** "11 a.m. MST" / "11 h HNR": the hour (minutes when not zero) with the zone's abbreviation. */
    timeTz: (iso: string) => named(iso, { zone: true }) ?? timeTz(iso),
    time: (iso: string) => tidyTime(fmt.date(new Date(iso), safe({ hour: 'numeric', minute: '2-digit' }))),
    hour: (iso: string) => tidyTime(fmt.date(new Date(iso), safe({ hour: 'numeric' }))),
    dayTime: (iso: string) => named(iso, { day: true }) ?? tidyTime(fmt.date(new Date(iso), safe({ weekday: 'short', hour: 'numeric', minute: '2-digit' }))),
    /** "Thu 2 a.m. ADT" / "jeu. 2 h HAA": the one day-and-time style for alert timings. */
    dayTimeTz: (iso: string) =>
      named(iso, { day: true, zone: true }) ?? yukon(tz, tidyTime(fmt.date(new Date(iso), safe({ weekday: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })))),
    day: (iso: string) => fmt.date(new Date(iso), safe({ weekday: 'long', month: 'long', day: 'numeric' })),
    /** YYYY-MM-DD of an instant in the location's zone (to compare days). */
    ymd: (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso)),
  };
}

/** Times in the forecast location's own time zone. */
export function useLocalTime(tz: string) {
  const { fmt } = useLocale();
  const t = useMessages(messages);
  return localTime(fmt, tz, t);
}

/**
 * Feed values shown on their own (an alert's area, impact, confidence) start with a capital: the French feed
 * writes "ville de Winnipeg", "élevé", which reads as unfinished beside a label. Display only; data untouched.
 */
export const capFirst = (s: string, intl: string) => (s ? s.charAt(0).toLocaleUpperCase(intl) + s.slice(1) : s);

/** "Ottawa (Kanata - Orléans)" → { base: "Ottawa", qualifier: "Kanata - Orléans" }. */
export function splitName(name: string) {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { base: m[1].trim(), qualifier: m[2].trim() } : { base: name, qualifier: '' };
}

/** How widgets refer to a place in a follow-up question ("Ottawa, ON"): short and unambiguous. */
export const askName = (p: { name: string; province: string }) => `${splitName(p.name).base}, ${p.province.toUpperCase()}`;

/** Province/territory display names. */
export function useProvinceName() {
  const t = useMessages(messages);
  return (code?: string) => (code ? t(`prov.${code.toLowerCase()}`) : '');
}
