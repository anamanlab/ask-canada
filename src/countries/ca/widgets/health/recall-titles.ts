/**
 * Recall notices as people scan them (pure, isomorphic): the official title "Certain Summerhill Market brand
 * raspberries and raspberry-containing products recalled due to norovirus" becomes the product ("Summerhill
 * Market raspberries and raspberry-containing products") and the hazard ("Norovirus"). The official title is
 * never rewritten beyond that split, and a title that doesn't follow a known pattern is shown whole.
 */
import type { Lang } from './facts';
import { issueLabel, rowTitle, sentenceCase, type RecallItem } from './recalls';

type Split = { product: string; hazard?: string };

const cap = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
const tidy = (s: string) => s.replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
/** French "because of": « en raison de la / du / des / de l’ / d’un / d’une / d’ / de ». */
const FR_DUE = "en raison (?:de la |du |des |de l['’]|d['’]une? |d['’]|de )";

const PATTERNS: [RegExp, (m: RegExpMatchArray) => Split][] = [
  // "Certain X brand Y recalled due to Z"
  [/^(?:certain |various )?(.+?) recalled (?:due to|for) (.+)$/i, (m) => ({ product: m[1].replace(/ brand(?= )/gi, ''), hazard: m[2] })],
  // "X brand Y contains undeclared milk"
  [/^(.+?) (?:may contain|contains?) (undeclared .+)$/i, (m) => ({ product: m[1].replace(/ brand(?= )/gi, ''), hazard: m[2] })],
  // "Health Canada warns that X may pose a risk of injury"
  [/^health canada warns that (.+?) (?:may )?poses? an? (risk of .+)$/i, (m) => ({ product: m[1], hazard: m[2] })],
  // « Rappel de certains X de marque Y en raison de la présence de Z »
  // (« Rappel de certaines framboises et de produits… » : without « Rappel de », the list reads « framboises et produits… ».)
  [new RegExp(`^rappel de (?:certaine?s? )?(.+?) ${FR_DUE}(.+)$`, 'i'), (m) => ({ product: m[1].replace(/ et d(?:e |es |['’])/g, ' et '), hazard: m[2] })],
  // « Certaines pompes X rappelées en raison d’un risque de choc électrique »
  [new RegExp(`^(?:certaine?s? )?(.+?) rappelée?s? ${FR_DUE}(.+)$`, 'i'), (m) => ({ product: m[1], hazard: m[2] })],
  // « Présence non déclarée de lait dans X »
  [/^(présence non déclarée d(?:e la |e l['’]|es |u |e |['’]).+?) dans (.+)$/i, (m) => ({ product: m[2], hazard: m[1] })],
  // « Santé Canada avertit que X peut présenter un risque de blessure »
  [/^santé canada avertit que (.+?) (?:peut |peuvent |pourrai(?:en)?t )?présente(?:r|nt)? un (risque d.+)$/i, (m) => ({ product: m[1], hazard: m[2] })],
  // "Apo-Semaglutide Injection : Incorrect dose display"
  [/^([^:]{3,60}?)\s?: (.{6,})$/, (m) => ({ product: m[1], hazard: m[2] })],
];

/** The product and the hazard named in an official notice title (EN + FR). */
export function splitTitle(title: string): Split {
  const s = tidy(title);
  for (const [re, pick] of PATTERNS) {
    const m = s.match(re);
    if (!m) continue;
    const { product, hazard } = pick(m);
    const p = tidy(product.replace(/\s*[«»]\s*/g, ' '));
    if (p.length < 3) continue;
    return { product: cap(p), hazard: hazard ? cap(tidy(hazard)) : undefined };
  }
  return { product: s };
}

export type RowText = {
  /** What the row leads with: the product, or the whole title when it has no known pattern. */
  title: string;
  hazard?: string;
  /** The notice's issue type, for a title that names no hazard ("Medical devices · Performance"). */
  issue?: string;
  /** Transport Canada recall number. */
  ref?: string;
  /** The title was shortened: the summary shows the official one. */
  shortened: boolean;
};

/** How a notice reads in the list: vehicles as "Child car seat · Britax", everything else as product + hazard. */
export function rowText(item: Pick<RecallItem, 'title' | 'category' | 'details'>, sep: string, lang: Lang = 'en'): RowText {
  const v = rowTitle(item, sep);
  const issue = issueLabel(item.details?.issue, sep);
  // Transport Canada names its systems in Title Case ("Seats And Restraints"): shown in sentence case.
  if (v.ref) return { title: v.title, issue: issue ? sentenceCase(issue, lang) : undefined, ref: v.ref, shortened: true };
  const { product, hazard } = splitTitle(item.title);
  return { title: product, hazard, issue: hazard ? undefined : issue, shortened: Boolean(hazard) };
}

export type Merged = RecallItem & {
  /** Earlier notices about the same product (a warning, then its recall), newest first. */
  earlier?: RecallItem[];
};

const key = (i: RecallItem) => {
  const { product, hazard } = splitTitle(i.title);
  return hazard ? `${i.category}|${product.toLocaleLowerCase()}` : null;
};

/**
 * One row per product: when the same product has two notices in the list (a food safety warning, then the
 * recall a day later), the newer one leads and carries the earlier ones, so the list doesn't read as a repeat.
 * `items` is newest first.
 */
export function mergeRepeats(items: RecallItem[]): Merged[] {
  const byKey = new Map<string, Merged>();
  const out: Merged[] = [];
  for (const it of items) {
    const k = key(it);
    const first = k ? byKey.get(k) : undefined;
    if (first) {
      first.earlier = [...(first.earlier ?? []), it];
      continue;
    }
    const row: Merged = { ...it };
    if (k) byKey.set(k, row);
    out.push(row);
  }
  return out;
}
