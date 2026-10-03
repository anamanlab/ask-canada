/**
 * Brand helpers (core). The identity itself lives in the country pack (`pack.brand`, read here on its own
 * so client code that only needs the brand doesn't bundle the rest of the pack); this module is
 * the one place core asks brand questions, so switching `brand.mode` to 'official' changes the header
 * signature slot and the footer disclaimer everywhere.
 */
import { brand } from '@/countries/active.brand';
import { pack } from '@/countries/active';
import type { Locale } from '@/lib/i18n/config';

export { brand };
export const isOfficial = brand.mode === 'official';

/**
 * The pack's other official language, given the reader's. Canada: English <-> French. Brazil:
 * Portuguese <-> English. Falls back to English for a pack with a single official language.
 */
export function otherOfficial(locale: Locale): Locale {
  return (pack.locales.official.find((l) => l !== locale) ?? 'en') as Locale;
}

/** The endonym of a locale, for a language toggle (`Português`, `English`). */
export const endonym = (locale: Locale) =>
  new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;
/** Message key of the footer disclaimer: independent services must say they are not the government. */
export const disclaimerKey = isOfficial ? 'footer.official.disclaimer' : 'footer.disclaimer';
