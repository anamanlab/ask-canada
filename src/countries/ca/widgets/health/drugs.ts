/**
 * Drug Product Database lookup (pure, isomorphic): types, ranking and plain-language helpers.
 * The live calls to health-products.canada.ca/api/drug live in ./live-drugs.ts (server only).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { inLang, type Lang } from './facts';

export type DrugAccess = 'rx' | 'otc' | 'other';
export type DrugStatus = 'marketed' | 'approved' | 'inactive';

export type DrugIngredient = { name: string; strength?: string; unit?: string; per?: string; perUnit?: string };

export type DrugProduct = {
  drugCode: number;
  din: string;
  brand: string;
  descriptor?: string;
  company: string;
  /** Human, Veterinary, Radiopharmaceutical, Disinfectant (as the database names it, in the answer language). */
  className?: string;
  status: DrugStatus;
  /** The database's own status wording, e.g. "Marketed" / "Commercialisé", "Cancelled Post Market". */
  statusLabel?: string;
  /** The database's external status code (1 approved, 2 marketed, 3 cancelled pre market, 4 cancelled post market, 6 dormant…). */
  statusCode?: number;
  /** When the current status took effect (YYYY-MM-DD), e.g. the date it was cancelled. */
  statusDate?: string;
  /** First marketed (YYYY-MM-DD), when known. */
  since?: string;
  /**
   * Active ingredients as the database lists them: `strength` `unit` per `per` `perUnit`
   * (e.g. 1.34 MG per ML = 1.34 mg/mL; 200 MG per TAB). `per` is empty when it's 1.
   */
  ingredients: DrugIngredient[];
  forms: string[];
  routes: string[];
  schedules: string[];
  access: DrugAccess;
  url: string;
  /** Number of active ingredients (from the product listing; used for ranking before details load). */
  ais?: number;
};

/** The links and sources that change with the language. */
export type DrugLinks = { dpdUrl: string; lnhpdUrl: string; sideEffectUrl: string; sources: ToolSource[] };

export type DrugOutput = DrugLinks & {
  query: string;
  kind: 'din' | 'name';
  lang: Lang;
  live: boolean;
  fetchedAt: string;
  /** Products matching the search in the database (all statuses, human use). */
  total: number;
  /** Of those, currently marketed. */
  marketed: number;
  products: DrugProduct[];
  /** The same links and sources in the other official language. */
  alt?: DrugLinks;
};

/** Plain-language access class from Health Canada's schedule names (EN or FR). */
export function accessOf(schedules: string[]): DrugAccess {
  const rx = schedules.some((s) => /^prescription\b|sur ordonnance|narcoti|stupéfiant|\bCDSA\b|\bLRCDAS\b|targeted|ciblée/i.test(s.trim()));
  if (rx) return 'rx';
  if (schedules.some((s) => /non-prescription|sans ordonnance|\bOTC\b|vente libre/i.test(s))) return 'otc';
  return 'other';
}

/** DPD external status codes: 2 = marketed; 1 = approved (not yet marketed); everything else is inactive. */
export function statusOf(code: number | undefined): DrugStatus {
  return code === 2 ? 'marketed' : code === 1 ? 'approved' : 'inactive';
}

/**
 * Plain-language status for a product, keyed on the database's external status code
 * (verified against health-products.canada.ca/api/drug/status on 2026-09-30):
 * 1 Approved · 2 Marketed · 3 Cancelled Pre Market · 4 Cancelled Post Market · 6 Dormant ·
 * 9 Cancelled (Unreturned Annual) · 10 Cancelled (Safety Issue) · 12 Authorization By Interim Order Revoked ·
 * 13 Restricted Access · 14 Authorization By Interim Order Expired · 15 Cancelled (Transitioned To Biocides).
 */
export type PlainStatus = 'marketed' | 'approved' | 'neverSold' | 'noLonger' | 'dormant' | 'safety' | 'interimEnded' | 'restricted' | 'biocide';
export function plainStatus(p: Pick<DrugProduct, 'status' | 'statusCode'>): PlainStatus {
  switch (p.statusCode) {
    case 1:
      return 'approved';
    case 2:
      return 'marketed';
    case 3:
      return 'neverSold';
    case 4:
    case 9:
      return 'noLonger';
    case 6:
      return 'dormant';
    case 10:
      return 'safety';
    case 12:
    case 14:
      return 'interimEnded';
    case 13:
      return 'restricted';
    case 15:
      return 'biocide';
    default:
      return p.status === 'marketed' ? 'marketed' : p.status === 'approved' ? 'approved' : 'noLonger';
  }
}

export const isDin = (q: string) => /^\s*(din\s*[:#]?\s*)?\d{8}\s*$/i.test(q);
export const dinOf = (q: string) => q.replace(/\D/g, '').slice(0, 8);

/**
 * Clean a free-text drug query: drop punctuation, filler words and French articles and elisions ("L’Ozempic",
 * "le Tylenol", "d’Advil"), keep the name as the person cased it.
 */
export function cleanDrugQuery(q: string): string {
  if (isDin(q)) return dinOf(q);
  return q
    .replace(/[®™©"“”«»?!.,;:()]/g, ' ')
    .replace(/(^|\s)[ld]['’]\s*(?=\p{L})/giu, '$1')
    .replace(/(?<![\p{L}\p{N}-])(the|drug|medication|medicine|pills?|tablets?|m[ée]dicaments?|comprim[ée]s?|le|la|les|du|de|des|un|une)(?![\p{L}\p{N}-])/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

/** Variants people rarely mean by the bare brand (children's, night-time, suppositories…). */
const VARIANT = /\b(CHILDREN|INFANTS?|KIDS|PEDIATRIC|JUNIOR|JR|NIGHT|NIGHTTIME|NUIT|ENFANTS?|NOURRISSONS?|SUPPOSITOR\w*|DROPS|GOUTTES|CREAM|CRÈME|GEL|PATCH|SPRAY|BUG|ARTHRITIS|MUSCLE|BACK|BODY)\b/;

/**
 * The product most people mean first: marketed, then an exact name, then the brand's own line (not a variant
 * such as children's or night-time), fewer active ingredients, then the longest-standing product (lowest drug
 * code, i.e. earliest in the database: "Tylenol Regular Strength" before "Tylenol Muscle & Body"), then A-Z.
 */
export function rankProducts(products: DrugProduct[], query: string): DrugProduct[] {
  const q = query.trim().toUpperCase();
  const statusRank: Record<DrugStatus, number> = { marketed: 0, approved: 1, inactive: 2 };
  const variant = (p: DrugProduct) => Number(VARIANT.test(p.brand.toUpperCase().replace(/[’']S\b/g, '')));
  return [...products].sort(
    (a, b) =>
      statusRank[a.status] - statusRank[b.status] ||
      Number(b.brand.toUpperCase() === q) - Number(a.brand.toUpperCase() === q) ||
      Number(b.brand.toUpperCase().startsWith(q)) - Number(a.brand.toUpperCase().startsWith(q)) ||
      variant(a) - variant(b) ||
      ((a.ais ?? a.ingredients.length) || 9) - ((b.ais ?? b.ingredients.length) || 9) ||
      a.drugCode - b.drugCode ||
      a.brand.length - b.brand.length ||
      a.brand.localeCompare(b.brand) ||
      a.din.localeCompare(b.din),
  );
}

export const productUrl = (drugCode: number, lang: Lang) =>
  `https://health-products.canada.ca/dpd-bdpp/info?lang=${lang === 'fr' ? 'fre' : 'eng'}&code=${drugCode}`;

/** "IBUPROFEN 200 MG" → "Ibuprofen" (title case for names shouted in the database). */
export function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s(/-])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase())
    .replace(/\b(Ulc|Llc|Lp|Usa|Ii|Iii)\b/g, (w) => w.toUpperCase());
}

/** Company names shouted in the database, cased the way the companies write them. */
const COMPANY_WORDS: Record<string, string> = {
  Glaxosmithkline: 'GlaxoSmithKline',
  Astrazeneca: 'AstraZeneca',
  Mcneil: 'McNeil',
  Biosyent: 'BioSyent',
  Abbvie: 'AbbVie',
  Glaxo: 'Glaxo',
  Jamp: 'JAMP',
  Gsk: 'GSK',
  Ulc: 'ULC',
  Llc: 'LLC',
  Lp: 'LP',
  Ltee: 'Ltée',
  'Ltée': 'Ltée',
  Sa: 'SA',
  Ag: 'AG',
  Gmbh: 'GmbH',
  Bv: 'BV',
  Nv: 'NV',
  Usa: 'USA',
};

/** "GLAXOSMITHKLINE INC" → "GlaxoSmithKline Inc"; "NOVO NORDISK A/S" → "Novo Nordisk A/S". Mixed case is kept as is. */
export function companyCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return titleCase(s)
    .split(/(\s+)/)
    .map((w, i) => {
      const bare = w.replace(/[.,]$/, '');
      if (i > 0 && /^(Of|And|De|Du|Des|La|Le|Et|The)$/.test(bare)) return bare.toLowerCase() + w.slice(bare.length);
      const tail = w.slice(bare.length);
      if (COMPANY_WORDS[bare]) return COMPANY_WORDS[bare] + tail;
      // Initialisms with no vowel ("Bgp", "Pms") and slashed ones ("A/s") are uppercase.
      if (/^\p{L}{2,4}$/u.test(bare) && !/[aeiouy]/i.test(bare)) return bare.toUpperCase() + tail;
      if (/^\p{L}\/\p{L}$/u.test(bare)) return bare.toUpperCase() + tail;
      return w;
    })
    .join('');
}

/** "DISPENSES 1 MG DOSES. MULTIDOSE PREFILLED PEN" → "Dispenses 1 mg doses. Multidose prefilled pen". */
export function sentenceCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
}

const UNIT: Record<string, { en: string; fr: string }> = {
  ML: { en: 'mL', fr: 'mL' },
  L: { en: 'L', fr: 'L' },
  TAB: { en: 'tablet', fr: 'comprimé' },
  CAP: { en: 'capsule', fr: 'capsule' },
  IU: { en: 'IU', fr: 'UI' },
  UI: { en: 'IU', fr: 'UI' },
  '%': { en: '%', fr: '%' },
};
const unitLabel = (u: string, lang: Lang) => UNIT[u.toUpperCase()]?.[lang] ?? u.toLowerCase();

/**
 * "1.34 mg/mL", "200 mg/tablet", "150 mg/comprimé", "5 mg/5 mL": the strength with its denominator, so a
 * concentration is never read as a dose. `num` formats decimals for the reader's language.
 */
export function strengthLabel(a: DrugIngredient, lang: Lang, num: (n: number) => string = String): string | null {
  if (!a.strength) return null;
  const n = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? num(Number(v)) : v);
  const unit = a.unit ? unitLabel(a.unit, lang) : '';
  const head = unit === '%' ? `${n(a.strength)}${lang === 'fr' ? '\u00a0' : ''}%` : `${n(a.strength)}${unit ? ` ${unit}` : ''}`;
  if (!a.perUnit) return head;
  const per = a.per && Number(a.per) !== 1 ? `${n(a.per)} ` : '';
  return `${head}/${per}${unitLabel(a.perUnit, lang)}`;
}

/**
 * The same result with its links and sources in the reader's language (the tool answers in the language it
 * was asked in; if that differs from the interface, the official pages still open in the reader's language).
 */
export function drugsIn(data: DrugOutput, lang: Lang): DrugOutput {
  if (data.lang === lang) return data;
  return { ...inLang(data, lang), products: data.products.map((p) => ({ ...p, url: productUrl(p.drugCode, lang) })) };
}
