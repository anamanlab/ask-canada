/** Pure text helpers shared by the jobs renderers (no React, no data tables). */
import { fold } from './data';

/** Visible place labels: "Terre‑Neuve‑et‑Labrador" never splits at a hyphen (non-breaking hyphens). */
export const nbHyphens = (s: string) => s.replace(/-/g, '\u2011');

/**
 * A query or place typed in any script, isolated from the sentence around it (Unicode FSI…PDI), so
 * “nurse” keeps its quotes in the right order inside a right-to-left sentence.
 */
export const isolate = (s: string) => `\u2068${s}\u2069`;

const SMALL_WORDS = new Set(['and', 'of', 'the', 'for', 'at', 'in', 'on', 'de', 'des', 'du', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'pour', 'sur']);
/** Short words that are words, not acronyms ("PRO", "INC"); other words of 3 letters or less stay in capitals ("IWK", "RBC"). */
const SHORT_WORDS = new Set(['inc', 'ltd', 'ltée', 'co', 'pro', 'bar', 'inn', 'spa', 'bay', 'big', 'top', 'new', 'old', 'red', 'sun', 'air', 'car', 'one', 'two', 'st', 'ste', 'cie', 'art', 'bio', 'eco', 'éco', 'lac', 'mer', 'bon', 'ile', 'île', 'bel', 'max', 'go', 'my', 'our', 'all', 'fox', 'oak', 'elm', 'sea']);

const cap = (w: string) => w.charAt(0).toLocaleUpperCase('fr-CA') + w.slice(1);

/** One word of a name ("SAINT-JEAN-DE-DIEU" → "Saint-Jean-de-Dieu", "L'ÉPICERIE" → "L'Épicerie", "MCDONALD'S" → "McDonald's"). */
function nameWord(word: string, first: boolean): string {
  const lower = word.toLocaleLowerCase('fr-CA');
  const bare = lower.replace(/[^\p{L}]/gu, '');
  if (!first && SMALL_WORDS.has(bare)) return lower;
  if (!SHORT_WORDS.has(bare) && (!/[aeiouyàâäéèêëîïôöùûüÿ]/u.test(bare) || (bare.length <= 3 && !SMALL_WORDS.has(bare)))) return word;
  return lower
    .split('-')
    .map((part, i) => {
      if (i > 0 && SMALL_WORDS.has(part)) return part;
      // An elided article or O' ("l'érable", "o'brien") capitalises what follows; "'s" doesn't.
      const p = part.replace(/^([\p{L}])(['’])(\p{L}{2,})/u, (_, a: string, q: string, rest: string) => a + q + cap(rest));
      // Inside a name the elided article stays small: "Centre d’Hébergement l’Amitié".
      if (!first && i === 0 && /^[dl]['’]\p{L}{2,}/u.test(part)) return p;
      return cap(p).replace(/^Mc(\p{L})/u, (_, c: string) => `Mc${c.toLocaleUpperCase('en-CA')}`);
    })
    .join('-');
}

/**
 * Job Bank sometimes serves a typographic apostrophe as a literal "?" ("Centre d?hébergement", "l?Amitié").
 * A question mark between two letters is never punctuation, so it becomes the apostrophe it was.
 */
export const mendApostrophes = (s: string) => s.replace(/(?<=\p{L})\?(?=\p{L})/gu, '’');

/**
 * An employer name as people write it: "SHIRETOWN NURSING HOME" → "Shiretown Nursing Home",
 * "PLOMBERIE PRO SOLUTION" → "Plomberie Pro Solution". Only names entirely in capitals (more than 4
 * letters) change; acronyms ("CHSLD", "IWK") stay as they are.
 */
export function employerName(raw: string): string {
  // A stray trailing comma from the source ("… MOBILITY INC,") never shows.
  const name = mendApostrophes(raw.replace(/[\s,;]+$/, ''));
  const letters = name.replace(/[^\p{L}]/gu, '');
  if (letters.length <= 4 || letters !== letters.toLocaleUpperCase('fr-CA') || letters === letters.toLocaleLowerCase('fr-CA')) return name;
  let first = true;
  return name
    .split(/(\s+)/)
    .map((w) => {
      if (!/\p{L}/u.test(w)) return w;
      const out = nameWord(w, first);
      first = false;
      return out;
    })
    .join('');
}

/** A French date that falls on the first of the month reads "1ᵉʳ mai 2025", not "1 mai 2025". */
export const frFirst = (date: string, lang: 'en' | 'fr') => (lang === 'fr' ? date.replace(/^1(?=\s)/, '1ᵉʳ') : date);

/** "Registered nurse" → "registered nurse", for a title inside a sentence. */
export const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * A resume chip in sentence case, however the resume wrote it: "receiving" → "Receiving", "FORKLIFT OPERATOR" →
 * "Forklift operator". Mixed case ("Power BI", "iOS") and short acronyms ("SQL", "AWS") stay as written.
 */
export function chipLabel(term: string): string {
  const shouting = term.length > 4 && term === term.toLocaleUpperCase('fr-CA') && term !== term.toLocaleLowerCase('fr-CA');
  if (shouting) return cap(term.toLocaleLowerCase('fr-CA'));
  return term === term.toLocaleLowerCase('fr-CA') ? cap(term) : term;
}

/**
 * Show a matched (folded) term the way the person wrote it: "cablage" → "Câblage", "power bi" → "Power BI".
 * Falls back to the folded term when it can't be found in the original text.
 */
export function displayTerm(original: string, term: string): string {
  const words = original.match(/[\p{L}\p{N}#+.'’-]+/gu) ?? [];
  const n = term.split(' ').length;
  for (let i = 0; i + n <= words.length; i++) {
    const span = words.slice(i, i + n);
    const f = fold(span.join(' '));
    if (f === term || f === `${term}s`) return span.join(' ').replace(/[.,;:]+$/, '');
  }
  return term;
}
