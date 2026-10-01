/**
 * Reading questions (EN + FR). JavaScript's `\b` is ASCII-only: it sees "é" as a non-word character, so
 * `\bétudes\b` never matches "d’études" and `\bcitoyenneté\b` never matches "citoyenneté". Every pattern in the
 * immigration scenarios and parsers goes through `uni()`, which swaps `\b` for a Unicode-aware boundary (any
 * letter or digit in any script counts as part of a word) and adds the `u` flag.
 */
import type { TimeKey } from './times';

const WORD = '[\\p{L}\\p{M}\\p{N}_]';
const BOUNDARY = `(?:(?<=${WORD})(?!${WORD})|(?<!${WORD})(?=${WORD}))`;

/** `/\bétudiant\b/i` → the same pattern with Unicode word boundaries (`iu`). */
export function uni(re: RegExp): RegExp {
  // Skip escaped backslashes (`\\b` is a literal "\" then "b"), rewrite only real `\b` escapes.
  const source = re.source.replace(/\\\\|\\b/g, (m) => (m === '\\b' ? BOUNDARY : m));
  return new RegExp(source, re.flags.includes('u') ? re.flags : `${re.flags}u`);
}
export const uniAll = (res: RegExp[]) => res.map(uni);

const EXTEND = uni(/\b(extend\w*|extension|prolong\w*|renew\w*|renouvel\w*)\b/);
const P = {
  inCanada: uni(/\b(in canada|au canada|inland|from inside canada|de l['’]intérieur du canada)\b/),
  supervisa: uni(/\bsuper ?visa\b/),
  eta: uni(/\b(e-?ta|ave|electronic travel|autorisation de voyage)\b/),
  visitor: uni(/\b(visitors?|tourists?|visit|visiteurs?|touristes?)\b/),
  visitorRecord: uni(/\b(record|fiche)\b/),
  study: uni(/\b(study|studies|student|studying|études?|étudiante?s?|étudier)\b/),
  iec: uni(/\b(iec|working holiday|experience canada|expérience internationale|eic|pvt)\b/),
  work: uni(/\b(work permit|permis de travail|work visa|visa de travail)\b/),
  prCard: uni(/\b(pr card|carte de résident permanent|carte de r[ée]sident)\b/),
  parents: uni(/\b(parents?|grand-?parents?|grands-parents)\b/),
  spouse: uni(/\b(spous\w*|partner|wife|husband|common-law|conjoint\w*|époux|épouse|mari)\b/),
  fsw: uni(/\b(skilled worker|fsw|travailleurs? qualifiés?)\b/),
  pnp: uni(/\b(provincial nominee|pnp|candidats? des provinces|programme des candidats)\b/),
  citizenship: uni(/\b(citizenship|citoyenneté)\b/),
  proof: uni(/\b(proof|certificate|preuve|certificat)\b/),
};

/** Which processing-time row a question is about ("Délais de traitement du permis d’études" → 'study'). */
export function programFromText(text: string): TimeKey {
  const t = text.toLowerCase();
  const ext = EXTEND.test(t);
  if (P.supervisa.test(t)) return 'supervisa';
  if (P.eta.test(t)) return 'eta';
  if (P.visitor.test(t)) return ext || P.visitorRecord.test(t) ? 'visitor-extension' : 'visitor';
  if (P.study.test(t)) return ext ? 'study-extension' : 'study';
  if (P.iec.test(t)) return 'iec';
  if (P.work.test(t)) return ext ? 'work-extension' : 'work';
  if (P.prCard.test(t)) return 'pr-card';
  if (P.parents.test(t)) return 'parents';
  if (P.spouse.test(t)) return P.inCanada.test(t) ? 'spouse-inside' : 'spouse-outside';
  if (P.fsw.test(t)) return 'fsw';
  if (P.pnp.test(t)) return 'pnp-ee';
  if (P.citizenship.test(t)) return P.proof.test(t) ? 'citizenship-proof' : 'citizenship';
  return 'cec';
}
