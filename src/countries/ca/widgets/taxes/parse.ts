/**
 * Reads dollar amounts out of a question, in English or French. Pure and isomorphic: the scripted answers use
 * it to fill the estimator, and the lab fixtures assert the phrasings it must understand.
 *   amountsIn('I made $65,000 and my employer deducted $10,400')      → [65000, 10400]
 *   taxDeductedIn('I made $65,000 and my employer deducted $10,400')  → 10400
 */

/** "$65,000", "65 000 $", "65k", "10400": digits grouped by a comma or a (non-breaking) space, or plain, or in thousands. */
const NUMBER = String.raw`\d{1,3}(?:[,\s  ]\d{3})+|\d{3,7}|\d{1,3}(?:[.,]\d)?\s?k`;
const AMOUNT = String.raw`\$?\s?(${NUMBER})\b\s?\$?`;

const toNumber = (raw: string) => {
  const s = raw.toLowerCase().replace(/[\s  ]/g, '');
  return s.endsWith('k') ? Number(s.slice(0, -1).replace(',', '.')) * 1000 : Number(s.replace(/,/g, ''));
};

/** Every amount of $1,000 or more in the text, in order. A bare year ("in 2026") is not an amount. */
export function amountsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(new RegExp(AMOUNT, 'gi'))) {
    const n = toNumber(m[1]);
    if (Number.isFinite(n) && n >= 1000 && !(n >= 1900 && n <= 2100 && !/[$k,]/i.test(m[0]))) out.push(Math.round(n));
  }
  return out;
}

const VERB = String.raw`(?:deducted|withheld|took off|taken off|retenue?s?|prélevée?s?|déduite?s?)`;
/** Words that can sit between the verb and its amount: "deducted about $10,400", "retenu à la source 10 400 $". */
const FILLER = String.raw`(?:\s*(?:from my pa(?:y|ycheques?|ychecks?)|at source|à la source|sur (?:ma|mes) paies?|in (?:income )?tax(?:es)?|en impôts?|about|around|roughly|a total of|environ|un total de|de|d['’]|:))*\s*`;
const TAX = String.raw`(?:income |federal )?tax(?:es)?|impôts?(?: fédéral)?`;

const DEDUCTED = [
  // "$10,400 was deducted", "$10,400 in tax was withheld", "10 400 $ d’impôt ont été retenus"
  new RegExp(String.raw`${AMOUNT}\s*(?:(?:of|in|de|d['’]|en)\s*)?(?:${TAX})?\s*(?:was|were|is|has been|have been|got|a été|ont été|est|sont|était|étaient)?\s*(?:already |déjà )?${VERB}`, 'i'),
  // "my employer deducted $10,400", "mon employeur a retenu 10 400 $"
  new RegExp(String.raw`${VERB}${FILLER}${AMOUNT}`, 'i'),
  // "I paid $10,400 in tax", "j’ai payé 10 400 $ d’impôt"
  new RegExp(String.raw`(?:paid|payé)${FILLER}${AMOUNT}\s*(?:in|of|en|de|d['’])\s*(?:${TAX})`, 'i'),
  // "box 22 is $10,400", "case 22 : 10 400 $"
  new RegExp(String.raw`(?:box|case)\s*22\D{0,12}?${AMOUNT}`, 'i'),
];

/** The income tax already taken off the person's pay (T4 box 22), in either word order, EN or FR. */
export function taxDeductedIn(text: string): number | undefined {
  for (const re of DEDUCTED) {
    const n = toNumber(text.match(re)?.[1] ?? '');
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

/** What the estimator can take from a question: the first amount that isn't the tax deducted is the income. */
export function incomeAndTaxIn(text: string): { employmentIncome?: number; taxDeducted?: number } {
  const taxDeducted = taxDeductedIn(text);
  const income = amountsIn(text);
  // Drop the deducted amount once (someone can earn and pay the same figure only in a typo).
  const at = taxDeducted == null ? -1 : income.indexOf(taxDeducted);
  if (at >= 0) income.splice(at, 1);
  return { employmentIncome: income[0], taxDeducted };
}
