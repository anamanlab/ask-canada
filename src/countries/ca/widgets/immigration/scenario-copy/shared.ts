/** Helpers shared by the immigration scenario copy (EN + FR): URLs, message lookup, dates, numbers, durations. */
import { formatMessage } from '@/lib/i18n/format';
import { URLS } from '../data';
import { NAMED_KINDS, type Draw } from '../draws';
import en from '../messages/en.json';
import fr from '../messages/fr.json';
import type { Duration } from '../times';

export type Lang = 'en' | 'fr';
export type Ctx = { text: string; lang: Lang; timeZone?: string };
export const U = (k: keyof typeof URLS, lang: Lang) => URLS[k][lang];
export const intl = (lang: Lang) => (lang === 'fr' ? 'fr-CA' : 'en-CA');
export const msg = (lang: Lang, key: string, values?: Record<string, string | number>) =>
  formatMessage(((lang === 'fr' ? fr : en) as Record<string, string>)[key] ?? (en as Record<string, string>)[key] ?? key, values, intl(lang));
/** "October 1" · « 1er octobre » (Canada.ca French writes the first of the month as an ordinal). */
export function longDate(iso: string, lang: Lang) {
  const text = new Intl.DateTimeFormat(intl(lang), { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  return lang === 'fr' ? text.replace(/^1(?=\s)/, '1er') : text;
}
export const num = (n: number, lang: Lang) => new Intl.NumberFormat(intl(lang)).format(n);
/** Standard round types get their official name in the answer's language; category rounds keep the feed's. */
export const roundName = (d: Draw, lang: Lang) => (NAMED_KINDS.includes(d.kind) ? msg(lang, `round.${d.kind}`) : (d.names?.[lang] ?? d.name));
export function durText(d: Duration | null, lang: Lang) {
  if (!d) return msg(lang, 'time.none').toLowerCase();
  const base = msg(lang, `unit.${d.unit}`, { count: d.n });
  return d.q ? msg(lang, d.q === 'more' ? 'time.more' : 'time.about', { value: base }).toLowerCase() : base;
}
/**
 * A round in an English sentence: "a Trades Occupations round", "a Canadian Experience Class round",
 * "a general round (all programs)". Feed names read badly after "for the".
 */
export function aRound(d: Draw) {
  if (d.kind === 'general') return 'a general round (all programs)';
  const name = roundName(d, 'en');
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name} round`;
}
/** "A, B and C" in the answer's language. */
export function listOf(items: string[], lang: Lang) {
  try {
    return new Intl.ListFormat(intl(lang), { type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}
