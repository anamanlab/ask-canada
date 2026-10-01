/**
 * Brand helpers (core). The identity itself lives in the country pack (`pack.brand`, read here on its own
 * so client code that only needs the brand doesn't bundle the rest of the pack); this module is
 * the one place core asks brand questions, so switching `brand.mode` to 'official' changes the header
 * signature slot and the footer disclaimer everywhere.
 */
import { brand } from '@/countries/active.brand';

export { brand };
export const isOfficial = brand.mode === 'official';
/** Message key of the footer disclaimer: independent services must say they are not the government. */
export const disclaimerKey = isOfficial ? 'footer.official.disclaimer' : 'footer.disclaimer';
