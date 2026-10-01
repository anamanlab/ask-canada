/**
 * Landing copy revised after the pack catalogs were written (EN + FR, the official languages). These keys
 * take precedence over the pack's for English and French; every other locale keeps the pack's own
 * translation until the localization phase folds these into `src/countries/<cc>/messages/<locale>.json`.
 */
import en from './en.json';
import fr from './fr.json';

const catalogs: Record<string, Record<string, string>> = { en, fr };

/** Wraps the server `t` so revised landing keys win for English and French. */
export function withLandingCopy<V>(t: (key: string, values?: V) => string, locale: string) {
  const own = catalogs[locale];
  return (key: string, values?: V) => (own && key in own ? own[key] : t(key, values));
}

/**
 * A string the landing has only in English and French (the phone lede, the task tiles' second line):
 * `undefined` for every other locale, which keeps the pack's own copy instead.
 */
export function landingOwn(locale: string) {
  const own = catalogs[locale];
  return (key: string) => own?.[key];
}

/**
 * Strings that only the landing has (the status strip): English and French from
 * this folder, and English for every other locale until the localization phase translates them.
 */
export function landingText(locale: string) {
  const own = catalogs[locale] ?? {};
  return (key: string) => own[key] ?? en[key as keyof typeof en] ?? key;
}
