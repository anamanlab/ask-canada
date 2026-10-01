/** Formatting for the computed passport answers (server-side text, so plain Intl with the Canadian locales). */
import { titleCitations } from '../../../scenarios/titles';
import { TITLES, URLS } from '../data';
import type { L } from './parse';

/**
 * Citations to the planner's own sources carry the planner's titles, so a page reads the same in the widget's
 * source list and in every answer, turn after turn.
 */
const SOURCE_TITLES = new Map<string, string>(
  (Object.keys(TITLES) as (keyof typeof TITLES)[]).flatMap((k) => (['en', 'fr'] as const).map((l) => [URLS[k][l], TITLES[k][l]] as [string, string])),
);
const CITE = /\[(\d{1,2})\]\((https?:\/\/[^)\s]+)\)/g;
export const cite = (md: string) => titleCitations(md.replace(CITE, (m, n: string, url: string) => (SOURCE_TITLES.has(url) ? `[${n}](${url} "${SOURCE_TITLES.get(url)}")` : m)));

const locale = (lang: L) => (lang === 'fr' ? 'fr-CA' : 'en-CA');
const date = (iso: string, lang: L, opts: Intl.DateTimeFormatOptions) => {
  const s = new Intl.DateTimeFormat(locale(lang), { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  return lang === 'fr' ? s.replace(/^1(?=\s)/, '1er') : s; // « le 1er février »
};
export const longDate = (iso: string, lang: L) => date(iso, lang, { month: 'long', day: 'numeric', year: 'numeric' });
export const dayMonth = (iso: string, lang: L) => date(iso, lang, { month: 'long', day: 'numeric' });
export const monthYear = (ym: string, lang: L) => date(`${ym}-15`, lang, { month: 'long', year: 'numeric' });
export const monthName = (n: number, lang: L) => date(`2026-${String(n).padStart(2, '0')}-15`, lang, { month: 'long' });
/** "$50", "$125.75" / « 50 $ », « 125,75 $ »: canada.ca writes whole-dollar fees without cents. */
export const money = (n: number, lang: L) =>
  new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'CAD', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n).replace('CA', '');
