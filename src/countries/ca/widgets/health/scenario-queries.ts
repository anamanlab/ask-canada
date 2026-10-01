/**
 * Reading a question for the scripted health answers (pure, server only): the product, brand or allergen in a
 * recall question, the drug or DIN in a drug question, and the income in a dental question (EN + FR).
 */
import type { DentalInput } from './dental';
import { cleanDrugQuery } from './drugs';
import { cleanQuery } from './recalls-parse';

export type Ctx = { text: string; lang: 'en' | 'fr'; timeZone?: string };

/* ── Recalls ── */

const RECALL_Q: RegExp[] = [
  /\b(?:recalls?|safety alerts?|warnings?)\s+(?:for|on|of|about|involving|with)\s+(.+?)[?.!]*$/i,
  /\bis there (?:a|any) recall (?:on|for|of)\s+(.+?)[?.!]*$/i,
  /\b(?:has|have|was|were|is|are)\s+(.+?)\s+(?:been\s+|being\s+)?recalled\b/i,
  /^(?:any\s+|are there any\s+)?(.+?)\s+recalls?\s*\??$/i,
  /\brappels?\s+(?:pour|de|du|des|sur|concernant|visant)\s+(.+?)[?.!]*$/i,
  /\b(?:un|des) rappels? (?:pour|sur|de|du|des|visant)\s+(.+?)[?.!]*$/i,
  /\b(.+?)\s+(?:a|ont)[- ]t[- ](?:il|elle|ils|elles)\s+été rappelée?s?\b/i,
  /\b(.+?)\s+(?:a|ont) été rappelée?s?\b/i,
];

/** The product, brand or allergen named in a recall question, or null for "any recent recalls?". */
export function recallQueryOf(text: string): string | null {
  for (const re of RECALL_Q) {
    const m = text.match(re);
    if (!m) continue;
    const q = cleanQuery(
      m[1]
        .replace(/(?<!\p{L})non[- ]d[ée]clar[ée]e?s?(?!\p{L})/giu, ' ')
        .replace(/\b(undeclared|the|my|a|an|any|some|this|these|mon|ma|mes|le|la|les|l['’]|un|une|du|des|ce|cette|brand|marque|products?|produits?|food|aliments?|y a-t-il|are there|there)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        // French partitive left at the start: "de la moutarde", "de l’œuf", "d’arachide".
        .replace(/^(?:de\s+la\s+|de\s+l['’]\s*|de\s+|d['’]\s*|l['’]\s*)/i, ''),
    );
    if (q && !/^(recent|latest|new|récents?|nouveaux|derniers|this week|cette semaine|today|aujourd['’]hui|canada)$/i.test(q)) return q;
  }
  return null;
}

export const RECALLS_MATCH = [/\brecall(s|ed)?\b/i, /\bsafety alerts?\b/i, /\brappel(s|ée?s?)?\b/i, /\bavis de s[ée]curit[ée]\b/i];

/** Food allergens as people name them (EN + FR), for routing allergen questions. */
export const ALLERGEN = '(?<!\\p{L})(peanuts?|milk|eggs?|sesame|soy|soya|gluten|wheat|tree ?nuts?|nuts?|mustard|arachides?|lait|œufs?|oeufs?|sésame|soja|noix|moutarde|blé)(?!\\p{L})';
export const DRUG_WORDS = /\b(drugs?|medications?|medicines?|meds|pills?|capsules?|inhalers?|DIN|m[ée]dicaments?|g[ée]lules?|inhalateurs?)\b/i;

/* ── Dental ── */

/** The income named in a question: "$76,500", "76 500 $", "62k", "85000". */
export const money = (text: string): number | undefined => {
  const m = text.match(/\$?\s?(\d{2,3})(?:[ ,.  ]?(\d{3}))?\s?(k|000|\$)?/i);
  if (!m) return undefined;
  const n = m[2] ? Number(`${m[1]}${m[2]}`) : m[3] && /k|000/i.test(m[3]) ? Number(m[1]) * 1000 : undefined;
  return n && n >= 5_000 && n <= 500_000 ? n : undefined;
};

const NO_COVERAGE = /\b(no|don['’]t have|without|lost my) (dental )?(insurance|coverage|benefits)\b|\bsans assurance\b|\bpas d['’]assurance\b/i;

/** What a dental question already tells the checker: the income, and "I have no dental insurance". */
export const dentalInputOf = ({ text, lang }: Ctx): DentalInput => ({ familyIncome: money(text), noPrivateCoverage: NO_COVERAGE.test(text) ? true : undefined, lang });

/* ── Drugs ── */

const OK_EN = '(?:approved|authori[sz]ed|legal|available|sold|allowed|licen[sc]ed)';
const OK_FR = '(?:approuvée?s?|autorisée?s?|vendue?s?|en vente|offerte?s?|disponibles?|homologuée?s?|légale?s?|permise?s?)';
const RX_FR = '(?:nécessite|exige|requiert|demande)(?:nt)?';

/** Each pattern captures the drug's name (EN, then FR). The first that yields a usable name wins. */
const DRUG_Q: RegExp[] = [
  new RegExp(`\\b(?:is|are)\\s+(.+?)\\s+(?:still\\s+|currently\\s+)?${OK_EN}\\b`, 'i'),
  /\b(?:what(?:'s|’s| is) in|ingredients? (?:in|of)|look up|lookup|search(?: for)?|find)\s+(?:the drug\s+)?(.+?)[?.!]*$/i,
  /\b(?:does|do|will|would)\s+(.+?)\s+(?:need|require)s? a prescription\b/i,
  /\bprescription (?:for|to (?:get|buy|take))\s+(.+?)[?.!]*$/i,
  /\b(?:is|are)\s+(.+?)\s+(?:a\s+)?prescription\b/i,
  new RegExp(`\\best-ce qu(?:e\\s+|['’]\\s*)(.+?)\\s+(?:est|sont)\\s+(?:encore\\s+)?${OK_FR}`, 'i'),
  new RegExp(`\\best-ce qu(?:e\\s+|['’]\\s*)(.+?)\\s+${RX_FR}\\s+une ordonnance`, 'i'),
  new RegExp(`^(.+?)\\s+(?:est|sont)-(?:il|elle|ils|elles)\\s+(?:encore\\s+)?${OK_FR}`, 'i'),
  new RegExp(`^(.+?)\\s+${RX_FR}(?:-t-(?:il|elle)|-(?:ils|elles))?\\s+une ordonnance`, 'i'),
  /\bordonnance pour\s+(?:obtenir\s+|acheter\s+|prendre\s+)?(.+?)[?.!]*$/i,
  /(?:que contien(?:t|nent)|qu['’]y a-t-il dans|ingrédients? (?:actifs? )?(?:dans|d[eu]s?(?=\s)|d['’])|chercher|rechercher|cherche)\s*(?:le médicament\s+)?(.+?)[?.!]*$/i,
];

/** Words left over from a question that are never a drug's name: the fallback must not search for "Canada". */
const NOT_A_DRUG = /^(?:canada|here|ici|it|this|that|these|those|they|my|mine|il|elle|ils|elles|ce|cet|cette|ça|cela|mon|ma|mes|prescription|ordonnance|ingredients?|ingrédients?|din|drugs?|approved|authori[sz]ed|legal|available|sold|allowed|approuvée?|autorisée?|vendue?|offerte?|disponible|légale?|oui|non|yes|no)$|database|base de donn|pharmaceutique/i;
const SCAFFOLD = /\b(in canada|au canada|still|currently|right now|encore|actuellement|en ce moment|DIN|active|actifs?)\b/gi;
const usable = (q: string) => (q.length >= 3 && !NOT_A_DRUG.test(q) ? q : '');

/**
 * The brand name or DIN in a drug question, cased as the person wrote it; '' when the question names none
 * ("How do I use the Drug Product Database?"), so the answer asks for the name instead of searching a stray word.
 */
export function drugQueryOf(text: string): string {
  const din = text.match(/\b\d{8}\b/);
  if (din) return din[0];
  const t = text.trim();
  for (const re of DRUG_Q) {
    const m = t.match(re);
    if (!m?.[1]) continue;
    const q = usable(cleanDrugQuery(m[1].replace(SCAFFOLD, ' ')));
    if (q) return q;
  }
  // No known phrasing: the last word that could be a name ("Advil?"), never the country or a question word.
  const last = t.replace(SCAFFOLD, ' ').replace(/[?!.,;:«»"“”()]/g, ' ').trim().split(/\s+/).pop() ?? '';
  return usable(cleanDrugQuery(last));
}

export type DrugIntent = 'din' | 'ingredients' | 'prescription' | 'approved';

/** What a drug question asks: its ingredients, whether it needs a prescription, a DIN, or (default) whether it's sold in Canada. */
export function drugIntentOf(text: string): DrugIntent {
  if (/\b\d{8}\b/.test(text)) return 'din';
  if (/ingredients?\b|ingrédients?|what(?:'s|’s| is) in\b|que contien/i.test(text)) return 'ingredients';
  if (/\bprescription\b|\bordonnance\b|over[- ]the[- ]counter|vente libre/i.test(text)) return 'prescription';
  return 'approved';
}
