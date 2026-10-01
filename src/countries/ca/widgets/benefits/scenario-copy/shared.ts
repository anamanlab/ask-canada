/** Helpers the scripted replies share: numbered citations, dates and money in the answer's language. */
import { PAYMENT_DATES_FALLBACK, source, type Lang, type SourceKey } from '../data';
import { upcoming } from '../payments';
import { todayInCanada } from '../../../data/holidays';

export type VarsCtx = { text: string; lang: Lang };

/** `[n](url "Title")`: a numbered citation with the page title for the Sources list. */
export const cite = (n: number, key: SourceKey, lang: Lang) => {
  const s = source(key, lang);
  return `[${n}](${s.url} "${s.title.replace(/"/g, '')}")`;
};

export const longDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
export const nextPay = (key: keyof typeof PAYMENT_DATES_FALLBACK) => upcoming(PAYMENT_DATES_FALLBACK, todayInCanada())[key]?.[0];

/** Dollars in the answer's language: whole by default, with cents for official monthly rates. */
export const cadIn = (lang: Lang) => (n: number, cents = false) =>
  new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(n);
