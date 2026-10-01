/**
 * Recalls and safety alerts (pure, isomorphic): the output types and the small selectors the renderer and the
 * scenarios share (allergen matching, readable vehicle rows). The parsers for recalls-rappels.canada.ca are
 * in ./recalls-parse.ts and the live fetch in ./live-recalls.ts; neither is imported by the renderer.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './facts';

export type RecallCategory = 'food' | 'health' | 'consumer' | 'vehicles';
export const RECALL_CATEGORIES: RecallCategory[] = ['food', 'health', 'consumer', 'vehicles'];

/** recall = product pulled from sale; alert = warning (e.g. undeclared allergen, unauthorized product); advisory = public advisory. */
export type RecallKind = 'recall' | 'alert' | 'advisory';

export type AffectedProduct = { brand?: string; product?: string; size?: string; upc?: string; codes?: string };

export type RecallDetails = {
  brand?: string;
  product?: string;
  /** One entry per issue type, as the notice lists them: "Food - Allergen - Wheat", "Food - Allergen - Gluten". */
  issue?: string[];
  whatToDo?: string;
  distribution?: string;
  publishedBy?: string;
  recallClass?: string;
  affected?: AffectedProduct[];
  affectedTotal?: number;
};

export type RecallItem = {
  id: string;
  title: string;
  url: string;
  kind: RecallKind;
  /** The site's own type label, e.g. "Food recall warning" / "Rappel d’aliments". */
  type: string;
  category: RecallCategory;
  /** Last updated, YYYY-MM-DD. */
  date: string;
  details?: RecallDetails;
};

/** A notice about an allergen missing from (or wrong on) the label, by its title or issue line (EN + FR). */
const ALLERGEN_NOTICE = /undeclared|improperly declared|incorrectly declared|allerg|non[\s-]déclar|mal déclar|incorrectement déclar/i;
const isAllergenNotice = (i: Pick<RecallItem, 'title' | 'details'>) => ALLERGEN_NOTICE.test(i.title) || (i.details?.issue ?? []).some((s) => ALLERGEN_NOTICE.test(s));

/** Priority food allergens (Canadian labelling), with the words notices use for each (EN + FR). */
type Allergen = 'peanut' | 'milk' | 'egg' | 'sesame' | 'soy' | 'gluten' | 'wheat' | 'treeNuts' | 'mustard';
const W = (s: string) => new RegExp(`(?<!\\p{L})(?:${s})(?!\\p{L})`, 'iu');
const ALLERGEN_WORDS: Record<Allergen, RegExp> = {
  peanut: W('peanuts?|arachides?'),
  milk: W('milk|dairy|lait|produits laitiers'),
  egg: W('eggs?|œufs?|oeufs?'),
  sesame: W('sesame|sésame'),
  soy: W('soy|soya|soja'),
  gluten: W('gluten|wheat|barley|rye|oats?|triticale|spelt|kamut|blé|orge|seigle|avoine|épeautre'),
  wheat: W('wheat|triticale|blé'),
  treeNuts: W('tree ?nuts?|almonds?|cashews?|hazelnuts?|pecans?|pistachios?|walnuts?|macadamias?|brazil nuts?|pine nuts?|noix|amandes?|cajous?|noisettes?|pacanes?|pistaches?|pignons?'),
  mustard: W('mustard|moutarde'),
};
/** How a search names each allergen (the allergen chips and allergen questions send these). */
const ALLERGEN_QUERY: [Allergen, RegExp][] = [
  ['peanut', /^(peanuts?|arachides?)$/i],
  ['milk', /^(milk|dairy|lait)$/i],
  ['egg', /^(eggs?|œufs?|oeufs?)$/i],
  ['sesame', /^(sesame( seeds?)?|sésame|graines de sésame)$/i],
  ['soy', /^(soy|soya|soja)$/i],
  ['gluten', /^gluten$/i],
  ['wheat', /^(wheat|blé)$/i],
  ['treeNuts', /^(tree ?nuts?|nuts?|noix)$/i],
  ['mustard', /^(mustard|moutarde)$/i],
];

/** The allergen a search is about ("peanut", "undeclared sesame", "arachides"), or null for anything else. */
export function allergenOf(query?: string | null): Allergen | null {
  const q = (query ?? '').trim().replace(/^(undeclared|non[\s-]déclarée?s?)\s+|\s+non[\s-]déclarée?s?$/giu, '');
  return ALLERGEN_QUERY.find(([, re]) => re.test(q))?.[0] ?? null;
}

/**
 * Allergen notices for a search: when the search is an allergen, only the notices whose undeclared or
 * mislabelled allergen is that one (a "Sesame Candy recalled due to undeclared peanut" isn't a sesame notice);
 * otherwise every allergen notice.
 */
export function allergenNotices<T extends Pick<RecallItem, 'title' | 'details'>>(items: T[], query?: string | null): T[] {
  const a = allergenOf(query);
  if (!a) return items.filter(isAllergenNotice);
  const words = ALLERGEN_WORDS[a];
  return items.filter((i) => {
    if (!isAllergenNotice(i)) return false;
    // The issue field names the allergen: "Food - Allergen - Peanut", "Aliments - Allergène - Lait".
    const issue = (i.details?.issue ?? []).flatMap((s) => s.match(/allerg[eè]ne?s?\s*-\s*(.+)$/iu)?.[1] ?? []).join(' ');
    if (issue) return words.test(issue);
    // Otherwise the title, after "due to" / "en raison de" (the product name before it may mention anything).
    const tail = i.title.split(/\b(?:due to|because of|may contain|contains?(?!\p{L})|en raison d|pourrai(?:en)?t contenir|contient)/iu).slice(1).join(' ');
    return words.test(tail || i.title);
  });
}

/**
 * The issue types of a notice as short lines: the leading category ("Food") is dropped, since the row already
 * shows it, and types that share a kind are grouped, so "Food - Allergen - Wheat", "Food - Allergen - Gluten"
 * and "Food - Allergen - Mustard" read "Allergen · Wheat, Gluten, Mustard" instead of repeating the prefix.
 */
export function issueLines(issue: string[] | undefined, sep: string): string[] {
  const groups = new Map<string, string[]>();
  for (const raw of issue ?? []) {
    // A sentence (the notice had no issue types, only a description) is kept whole.
    const parts = /[.!?]$/.test(raw.trim()) || raw.length > 90 ? [raw.trim()] : raw.split(' - ').map((s) => s.trim()).filter(Boolean);
    const rest = parts.length > 1 ? parts.slice(1) : parts;
    const kind = rest.slice(0, -1).join(sep);
    const name = rest[rest.length - 1];
    if (!name) continue;
    const names = groups.get(kind) ?? [];
    if (!names.includes(name)) names.push(name);
    groups.set(kind, names);
  }
  return [...groups].map(([kind, names]) => (kind ? `${kind}${sep}${names.join(', ')}` : names.join(', ')));
}

/** Leading issue words that only repeat the row's category icon. */
const CATEGORY_WORD = /^(food|aliments?|vehicles?|véhicules?|consumer products?|produits de consommation|health products?|produits de santé)$/i;

/**
 * A notice's first issue type as a short label for a row whose title names no hazard: "Medical devices -
 * Performance" → "Medical devices · Performance", "Vehicle - Structure" → "Structure". Sentences are left out.
 */
export function issueLabel(issue: string[] | undefined, sep: string): string | undefined {
  const raw = issue?.[0]?.trim();
  if (!raw || raw.length > 60 || /[.!?]$/.test(raw)) return undefined;
  const parts = raw.split(' - ').map((s) => s.trim()).filter(Boolean);
  const rest = parts.length > 1 && CATEGORY_WORD.test(parts[0]) ? parts.slice(1) : parts;
  return rest.join(sep) || undefined;
}

/**
 * "Seats And Restraints" → "Seats and restraints": Transport Canada's system names arrive in Title Case. Words
 * after the first are lower-cased in the notice's language; acronyms (ABS, SRS) keep their capitals.
 */
export const sentenceCase = (s: string, lang: Lang = 'en') => s.replace(/(?<=[\s/-])\p{Lu}\p{Ll}+/gu, (w) => w.toLocaleLowerCase(`${lang}-CA`));

const MAKER_CASE: Record<string, string> = { Bmw: 'BMW', Gmc: 'GMC', Brp: 'BRP', Ktm: 'KTM', Gm: 'GM', Llc: 'LLC', Usa: 'USA', Ltd: 'Ltd', Ulc: 'ULC' };
/** "FIAT CHRYSLER AUTOMOBILES" → "Fiat Chrysler Automobiles" (makers shouted in Transport Canada's database). */
const makerCase = (s: string) =>
  s === s.toUpperCase()
    ? s.toLowerCase().replace(/(^|[\s(/&.-])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase()).replace(/\b\p{L}+\b/gu, (w) => MAKER_CASE[w] ?? w)
    : s;

/**
 * A Transport Canada row as people read it: "Transport Canada Recall - 2026399 - BRITAX" with the product
 * "Child Car Seat recalled by BRITAX" becomes "Child car seat · Britax" and recall number "2026-399".
 * Other notices keep their own title.
 */
export function rowTitle(item: Pick<RecallItem, 'title' | 'category' | 'details'>, sep: string): { title: string; ref?: string } {
  const m = item.category === 'vehicles' ? item.title.match(/(?:Transport Canada Recall|Numéro de rappel de Transports Canada|Rappel de Transports Canada)\s*-\s*(\d{4})(\d+)\s*-\s*(.+)$/i) : null;
  if (!m) return { title: item.title };
  const maker = makerCase(m[3].trim());
  const what = item.details?.product?.split(/\s+(?:recalled by|rappelée?s? par)\s+/i)[0]?.trim();
  // "Child Car Seat" → "Child car seat"; acronyms (SUV, ATV) keep their capitals.
  const product = what ? what.replace(/(?<=\s)\p{Lu}\p{Ll}+/gu, (w) => w.toLowerCase()) : '';
  return { title: product ? `${product}${sep}${maker}` : maker, ref: `${m[1]}-${m[2]}` };
}

export type RecallsInput = { query?: string; category?: RecallCategory | 'all'; allergen?: boolean; /** Open the newest notice's details. */ expand?: boolean; lang?: Lang };

/** The links and sources that change with the language. */
export type RecallLinks = {
  /** The same search on the official site. */
  searchUrl: string;
  subscribeUrl: string;
  reportUrl: string;
  /** Vehicles, tires and child car seats: Transport Canada's lookup (VIN, make and model). */
  vehicleUrl: string;
  sources: ToolSource[];
};

export type RecallsOutput = RecallLinks & {
  mode: 'recent' | 'search';
  /** The person asked about an undeclared allergen: the widget opens on the allergen notices. */
  allergen?: boolean;
  /** The person asked which sizes or codes are affected: the newest notice opens with its details showing. */
  expand?: boolean;
  /** What was searched (after `broadened`, the wider search the notices come from). */
  query: string | null;
  /**
   * The exact phrase asked for (`from`) found nothing, so `query` is a wider search: the leading brand word, or
   * (`any`) notices that mention any of the words. The widget and the answer both say so.
   */
  broadened?: { from: string; any?: boolean };
  category: RecallCategory | 'all';
  lang: Lang;
  live: boolean;
  /** ISO timestamp of the fetch (or of the snapshot). */
  fetchedAt: string;
  /** Total matches reported by the recalls site (may exceed the items shown). */
  total: number;
  items: RecallItem[];
  /** The same links and sources in the other official language. */
  alt?: RecallLinks;
};
