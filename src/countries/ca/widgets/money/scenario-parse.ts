/**
 * Reads the numbers out of a typed question for the scripted `money` scenarios ("$120k", "120 000 $",
 * "$2,500 a year", "loyer 1 500 $"). Used only by scenarios/money.ts and ./scenario-replies (server).
 */
import type { BudgetCategory } from './calc/budget';

/**
 * JavaScript's `\b` and `\w` only know ASCII, so `\bépargne` or `propriété\b` never match. This rebuilds a pattern
 * with letter-aware boundaries; the French patterns go through it.
 */
const WORD = String.raw`[\p{L}\p{N}_]`;
const BOUNDARY = `(?:(?<!${WORD})(?=${WORD})|(?<=${WORD})(?!${WORD}))`;
export const words = (re: RegExp) => new RegExp(re.source.replaceAll(String.raw`\b`, BOUNDARY).replaceAll(String.raw`\w`, WORD), 'iu');

/** "120k" → 120000, "1.2m" → 1200000, "120,000" / "120 000" / "120000" → 120000. */
function toNumber(raw: string): number | undefined {
  const m = raw
    .toLowerCase()
    .replace(/[\s  $]/g, '')
    .match(/^(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)(k|m)?$/);
  if (!m) return undefined;
  let s = m[1];
  // Thousands separators: "120,000" / "120.000"; a single short decimal part stays decimal.
  if (/[.,]\d{3}(?:[.,]|$)/.test(s)) s = s.replace(/[.,](?=\d{3}(?:[.,]|$))/g, '');
  const n = Number(s.replace(',', '.'));
  if (!Number.isFinite(n)) return undefined;
  return m[2] === 'k' ? n * 1_000 : m[2] === 'm' ? n * 1_000_000 : n;
}

/** One amount as people write it. A trailing k / m / million counts only when no letter follows ("600 monthly" is 600). */
const AMOUNT = String.raw`\$?\s?(\d{1,3}(?:[,\s  ]\d{3})+|\d+(?:[.,]\d+)?)\s?(k|m|million)?(?![a-zà-ÿ])\s?\$?`;
const amountRe = (after: string, flags = 'i') => new RegExp(`${AMOUNT}\\s*(?:${after})`, flags);
const read = (m: RegExpMatchArray | null) => (m ? toNumber(`${m[1]}${m[2] === 'million' ? 'm' : (m[2] ?? '')}`) : undefined);

export function mortgageInput(text: string) {
  const t = text.replace(/’/g, "'");
  const income =
    read(t.match(new RegExp(`(?:make|earn|earning|income(?: of| is)?|salary(?: of| is)?|gagne|revenu(?: de| est)?|salaire(?: de)?)\\s*(?:about|around|environ)?\\s*${AMOUNT}`, 'i'))) ??
    read(t.match(amountRe('(?:a|per|/)\\s*(?:year|yr)|(?:par|/)\\s*an(?:née)?|income|household income|de revenu')));
  const price =
    read(t.match(amountRe('(?:home|house|condo|townhouse|place|property|maison|condo|propriété|logement)'))) ??
    read(t.match(new RegExp(`(?:home|house|condo|maison|propriété)\\s*(?:for|at|of|à|de)\\s*${AMOUNT}`, 'i')));
  const downPct = t.match(/(\d{1,2}(?:[.,]\d+)?)\s?%\s*(?:down|de mise de fonds|mise de fonds)/i)?.[1];
  let downPayment = read(t.match(amountRe('(?:down|de mise de fonds|mise de fonds|en mise de fonds)')));
  if (downPayment == null && downPct && price) downPayment = Math.round((price * Number(downPct.replace(',', '.'))) / 100);
  const rateM = t.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s?%\s*(?:rate|interest|mortgage|taux|d'intérêt|fixed|fixe|variable)/i) ?? t.match(/(?:rate|taux)\s*(?:of|is|de|est)?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s?%/i);
  const rate = rateM ? Number(rateM[1].replace(',', '.')) : undefined;
  const firstTimeBuyer = words(/\b(first[- ]time|first home|premi(?:er|ère) (?:achat|propriété|acheteur|maison))\b/i).test(t) || undefined;
  return {
    income: income && income >= 10_000 ? income : undefined,
    price: price && price >= 50_000 ? price : undefined,
    downPayment,
    rate: rate && rate > 0 && rate < 20 ? rate : undefined,
    firstTimeBuyer,
  };
}

export function respInput(text: string) {
  const t = text.replace(/’/g, "'");
  const newborn = words(/\b(newborn|new baby|just (had|born)|nouveau-né|naissance|bébé)\b/i).test(t);
  const ageM =
    t.match(/\b(\d{1,2})[- ]?(?:year|yr)s?[- ]?old\b/i) ??
    t.match(/\b(?:is|turns|aged?)\s*(\d{1,2})\b/i) ??
    t.match(/\b(\d{1,2})\s*ans\b/i);
  const age = ageM ? Number(ageM[1]) : newborn ? 0 : undefined;
  const monthly = read(t.match(amountRe('(?:a|per|/|par)\\s*mois|(?:a|per|/)\\s*month|monthly|mensuel\\w*')));
  const yearly = read(t.match(amountRe('(?:a|per|/)\\s*year|(?:par|/)\\s*an(?:née)?|yearly|annually|annuellement')));
  const annual = monthly != null ? monthly * 12 : yearly;
  const low = /\b(low[- ]income|faible revenu|revenu modeste)\b/i.test(t);
  const ok = annual != null && annual <= 50_000;
  return {
    childAge: age != null && age <= 17 ? age : undefined,
    annual: ok ? annual : undefined,
    incomeTier: low ? ('low' as const) : undefined,
    /** The amount as the person said it (for the heading): "$100 a month" or "$1,200 a year". */
    said: ok ? (monthly != null ? { amount: monthly, per: 'month' as const } : { amount: annual as number, per: 'year' as const }) : undefined,
  };
}

/** The planner's tool input read from the question: `respInput` without `said`, which only the reply's heading uses. */
export function respToolInput(text: string) {
  const { childAge, annual, incomeTier } = respInput(text);
  return { childAge, annual, incomeTier };
}

export function compareInput(text: string) {
  const home = words(/\b(house|home|condo|down ?payment|fhsa|first home|maison|propriété|mise de fonds|celiapp)\b/i).test(text);
  const retire = /\b(retire\w*|pension|retraite)\b/i.test(text);
  const age = Number(text.match(/\b(?:i['’]?m|i am|j['’]ai)\s*(\d{2})\b/i)?.[1]) || undefined;
  return { goal: home ? ('home' as const) : retire ? ('retirement' as const) : undefined, firstHome: home ? true : undefined, age };
}

type BudgetLine = BudgetCategory | 'savings';
/** Words people use for each budget line, EN and FR. */
const BUDGET_WORDS: Record<BudgetLine, string> = {
  housing: 'rent|mortgage(?: payment)?|loyer|hypothèque',
  utilities: 'utilities|hydro|electricity|heat(?:ing)?|services publics|électricité|chauffage',
  food: 'groceries|grocery|food|épicerie|nourriture|alimentation',
  childcare: 'child ?care|day ?care|garderie|services? de garde|frais de garde',
  debt: '(?:car |student )?loans?(?: payments?)?|car payments?|debts?(?: payments?)?|credit cards?|dettes?|prêts?(?: auto| étudiants?)?|cartes? de crédit',
  insurance: 'insurance|assurances?',
  phone: 'phone(?: and internet)?|cell(?: ?phone)?|internet|téléphone|cellulaire',
  transport: 'transport(?:ation)?|transit|bus pass|gas|car|transport en commun|essence|auto|voiture',
  personal: 'personal|entertainment|fun|personnel(?:les)?|loisirs|sorties',
  other: 'other|everything else|autres?|le reste',
  savings: 'savings?|saving|save|épargne|épargner|économies|économise',
};
/** An amount is given to the first line that claims it: a "car loan" is a debt before "car" is transport. */
const BUDGET_ORDER: readonly BudgetLine[] = ['housing', 'utilities', 'food', 'childcare', 'debt', 'insurance', 'phone', 'transport', 'personal', 'other', 'savings'];
const PER_MONTH = String.raw`(?:(?:a|per|each|/|par|chaque)\s*(?:month|mois)|monthly|mensuel\w*)`;
const PER_YEAR = String.raw`(?:(?:a|per|/|par)\s*(?:year|an(?:née)?))`;

/**
 * Monthly take-home pay and every budget line the person named: "$600 on groceries", "rent is $1,500",
 * "loyer 1 500 $, épicerie 600 $". Each amount in the text is used once.
 */
export function budgetInput(text: string) {
  const t = text.replace(/’/g, "'");
  const used = new Set<number>();
  // The amount's own position in the text, so two lines never share it.
  const take = (re: RegExp): number | undefined => {
    for (const m of t.matchAll(new RegExp(re.source, 'giu'))) {
      const at = (m.index ?? 0) + m[0].indexOf(m[1]);
      const n = read(m);
      if (n == null || used.has(at)) continue;
      used.add(at);
      return n;
    }
    return undefined;
  };
  const pay = String.raw`(?:take[- ]home(?: pay)?|net (?:pay|income)|bring home|salaire net|revenu net|paie nette)`;
  const earn = String.raw`(?:make|earn|get paid|gagne|touche|reçois)`;
  const filler = String.raw`\s*(?:(?:is|are|of|at|about|around|de|est|à|environ)\s+){0,2}`;
  const yearly = take(words(new RegExp(String.raw`\b${pay}\b${filler}${AMOUNT}\s*${PER_YEAR}`)));
  const income =
    yearly != null
      ? Math.round(yearly / 12)
      : (take(words(new RegExp(String.raw`\b(?:${pay}|${earn})\b${filler}${AMOUNT}\s*${PER_MONTH}`))) ?? take(words(new RegExp(String.raw`\b${pay}\b${filler}${AMOUNT}`))));

  const lines: Partial<Record<BudgetLine, number>> = {};
  // "$600 on groceries" / "600 $ d'épicerie" first, then "groceries $600" / "épicerie : 600 $".
  for (const k of BUDGET_ORDER) {
    const w = BUDGET_WORDS[k];
    lines[k] = take(words(new RegExp(String.raw`${AMOUNT}\s*(?:${PER_MONTH}\s*)?(?:on|for|in|to|into|towards?|de|d'|pour|en|dans)\s*(?:(?:my|the|le|la|l'|les|mon|ma|mes|un|une)\s*)?(?:${w})\b`)));
  }
  for (const k of BUDGET_ORDER) {
    if (lines[k] != null) continue;
    const w = BUDGET_WORDS[k];
    lines[k] = take(words(new RegExp(String.raw`\b(?:${w})\b\s*[:=,]?${filler}${AMOUNT}`)));
  }
  const { savings, ...rest } = lines;
  const expenses = Object.fromEntries(Object.entries(rest).filter(([, n]) => n != null));
  return { income, expenses: Object.keys(expenses).length ? expenses : undefined, savings };
}
