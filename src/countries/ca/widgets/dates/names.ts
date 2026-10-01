/**
 * Key dates: how a holiday's name and a date read in a sentence (pure; shared by the widgets and the scenarios).
 */
import { isChoiceIn, type HolidayItem, type Lang, type Province } from './data';

/** A holiday's name where the person lives (Quebec: "Good Friday or Easter Monday"). */
export const holidayName = (h: HolidayItem, province: Province | null, lang: Lang) => (h.choice && isChoiceIn(h, province) ? h.choice.name[lang] : h.name[lang]);

/** French article for a holiday name: le jour du Souvenir, la fête du Canada, le jour de l’Action de grâces, le Memorial Day, Noël. */
export const frArticle = (n: string) => (/^Noël/.test(n) ? '' : /^(Jour|Lendemain|Vendredi|Lundi|Congé|Memorial)\b/i.test(n) ? 'le ' : /^[AEIOUÉÎ]/.test(n) ? 'l’' : 'la ');

/** English article for a holiday name: "the " for the National Day for Truth and Reconciliation and Quebec's National Holiday, none otherwise. */
export const enArticle = (n: string) => (/^National (Day|Holiday)\b/.test(n) ? 'the ' : '');

/**
 * The name as it reads mid-sentence: « le jour de l’Action de grâces », « le lundi de Pâques », « la fête de Victoria »,
 * « la fête du Canada » (common nouns in lower case, as canada.ca and the CNESST write them). English names read as
 * they are ("Thanksgiving", "National Indigenous Peoples Day"), except the two that take an article: "the National
 * Day for Truth and Reconciliation" (canada.ca) and "the National Holiday" (CNESST).
 */
export const inSentence = (n: string, lang: Lang) => {
  if (lang !== 'fr') return `${enArticle(n)}${n}`;
  const lower = /^(Jour|Lundi|Lendemain|Congé|Fête du|Fête de|Fête des|Fête nationale)\b/.test(n) ? n.charAt(0).toLowerCase() + n.slice(1) : n;
  return `${frArticle(n)}${lower}`;
};

/**
 * Canada.ca French writes the first of the month as « 1er » (« le jeudi 1er janvier », « 1er juill. »); `Intl` gives
 * « 1 ». Applied to every French date the widget or a scripted answer shows.
 */
export const frFirst = (text: string, lang: string) => (lang.startsWith('fr') ? text.replace(/(^|[^\d])1 (?=\p{L})/gu, '$11er ') : text);
