/** Text matching shared by the riding, bill and news builders (pure). */

const unaccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** "Montréal-Nord" → "montrealnord": accents, case, spaces and punctuation ignored. */
export const fold = (s: string) => unaccent(s).replace(/[^a-z0-9]/g, '');

export const tokens = (s: string) => new Set(unaccent(s).split(/[^a-z0-9]+/).filter(Boolean));

/** LEGISinfo and the news feed use straight apostrophes ("l'examen"); our copy uses typographic ones (’). */
export const curly = (s: string) => s.replace(/'/g, '’');

/** Title words that match a free-text topic (accent-insensitive, stop words ignored). */
const STOP = new Set(
  'a an and act the of to for in on bill bills law laws about is are any there what with new canada canadian loi projet projets de des du la le les et sur en pour un une au aux est il y quel quels'.split(' '),
);

export function topicTerms(q?: string): string[] {
  if (!q) return [];
  return [...tokens(q)].filter((t) => t.length > 2 && !STOP.has(t));
}

/** How many of `terms` appear in `text` (whole words, or words sharing a stem of four letters or more). */
export function matchesTopic(text: string, terms: string[]): number {
  if (!terms.length) return 1;
  const have = tokens(text);
  const words = [...have];
  return terms.filter((t) => have.has(t) || words.some((w) => w.startsWith(t.slice(0, Math.max(4, t.length - 2))))).length;
}

/** Cuts at a word boundary and adds an ellipsis (replacing one the text already ends with). */
export const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n)).replace(/[\s,;:.…«(–-]+$/, '')}…`);

/**
 * A news teaser as shown: two lines of the wide layout, three to four on a phone, always ending on a whole word
 * (the list never cuts mid-word with a CSS clamp).
 */
export const TEASER_MAX = 150;
