/**
 * Small text helpers shared by the scripted travel answers (server): numbered citations with the official
 * page's title, money and dates in the answer's language, and markdown-safe feed text.
 */
import { formatMoney } from '@/lib/i18n/format';
import { findCountry } from '../countries';
import { URLS } from '../data';
import { displayPhone, telHref } from '../phone';
import { frFirst } from '../select';
import type { Lang } from '../types';

/** `[n](url "Page title")`, so the Sources list shows the official page's own title. */
export const TITLES: Partial<Record<keyof typeof URLS, Record<Lang, string>>> = {
  advisories: { en: 'Travel advice and advisories by destination', fr: 'Conseils aux voyageurs et avertissements par destination' },
  explained: { en: 'Travel Advice and Advisories: Explained', fr: 'Conseils aux voyageurs et avertissements : explications' },
  roca: { en: 'Registration of Canadians Abroad', fr: 'Inscription des Canadiens à l’étranger' },
  emergency: { en: 'Request emergency assistance outside Canada', fr: 'Demander une assistance d’urgence à l’extérieur du Canada' },
  lostStolen: { en: 'Lost or stolen belongings outside Canada', fr: 'Perte ou vol d’effets personnels à l’étranger' },
  declare: { en: 'I Declare: A guide for residents returning to Canada', fr: 'Je déclare : Un guide pour les résidents du Canada qui reviennent au pays' },
  waits: { en: 'Border wait times: United States to Canada', fr: 'Temps d’attente à la frontière canado-américaine' },
};
export const cite = (n: number, key: keyof typeof URLS, lang: Lang) => {
  const title = TITLES[key]?.[lang];
  return `[${n}](${URLS[key][lang]}${title ? ` "${title}"` : ''})`;
};
export const citeUrl = (n: number, url: string, title: string) => `[${n}](${url} "${title.replace(/"/g, '')}")`;
export const destTitle = (name: string, lang: Lang) => (lang === 'fr' ? `Conseils aux voyageurs : ${name}` : `Travel advice and advisories: ${name}`);
export const destCite = (n: number, c: { url: string; name: string }, lang: Lang) => citeUrl(n, c.url, destTitle(c.name, lang));

/** "$800" / « 800 $ », cents only when there are any (core's formatter, as `fmt.money` in the widget). */
export const money = (n: number, lang: Lang) => formatMoney(n, lang === 'fr' ? 'fr-CA' : 'en-CA');

export const longDate = (iso: string, lang: Lang) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return frFirst(new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', timeZone: 'America/Toronto' }).format(d), lang);
};

/** Keeps a phone number on one line in the answer text. */
export const nb = (s: string) => s.replace(/ /g, '\u00a0');

/** An office number in international form ("+81 3 5412 6200"), or as printed when it can't be normalised. */
export const phoneText = (raw: string, iso: string) => nb(displayPhone(raw, telHref(raw, { iso })) ?? raw);

/** The embassy or high commission when there is one (not whichever consulate the feed lists first). */
export const mainOffice = <O extends { type: string; passportServices: boolean }>(offices: O[]): O | undefined => {
  const main = offices.filter((o) => /embassy|high commission|ambassade|haut-commissariat/i.test(o.type));
  return main.find((o) => o.passportServices) ?? main[0] ?? offices.find((o) => o.passportServices) ?? offices[0];
};

/**
 * The destination for a tool call: the country's own name in the answer's language ("Mexico" / « Mexique »),
 * not the whole question, so the loading card can already say "Checking Mexico" and match the result.
 */
export const placeOf = (text: string, lang: Lang) => {
  const row = findCountry(text);
  return row ? (lang === 'fr' ? row[2] : row[1]) : text;
};
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const firstSentence = (s: string) => s.split(/(?<=[.!?])\s+/)[0] ?? s;
/** Markdown-safe (no brackets or asterisks from the feed). */
export const safe = (s: string) => s.replace(/[[\]*_`]/g, '');
