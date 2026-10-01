/**
 * recalls-rappels.canada.ca (pure): the parsers for its search results and notice pages, and the official
 * search URL. Used by ./live-recalls.ts, the fixtures and the scenarios, never by the
 * renderer, so none of it ships to the browser.
 */
import { URLS, type Lang } from './data';
import { mergeRepeats } from './recall-titles';
import { allergenNotices, RECALL_CATEGORIES, type AffectedProduct, type RecallCategory, type RecallDetails, type RecallItem, type RecallKind } from './recalls';

/** Category facet ids on recalls-rappels.canada.ca (same in EN and FR). */
const CATEGORY_FACET: Record<RecallCategory, number> = { food: 144, health: 180, consumer: 101, vehicles: 443 };

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '’', nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', trade: '™', reg: '®' };

export function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Visible text of an HTML fragment, whitespace collapsed. */
export function textOf(html: string): string {
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|li|div|tr)>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[​ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ORIGIN = 'https://recalls-rappels.canada.ca';

function categoryFromIcon(icon: string, type: string): RecallCategory {
  if (/food/.test(icon)) return 'food';
  if (/health/.test(icon)) return 'health';
  if (/transport|vehicle/.test(icon) || /v[ée]hicule/i.test(type)) return 'vehicles';
  return 'consumer';
}

function kindOf(label: string, type: string): RecallKind {
  if (/recall|rappel/i.test(label)) return 'recall';
  if (/advisory|avis public|public/i.test(type) && !/warning|mise en garde/i.test(type)) return 'advisory';
  return 'alert';
}

/** Parse one results page of /en/search/site (or /fr/recherche/site). */
export function parseSearchPage(html: string): { total: number; items: RecallItem[] } {
  const totalMatch = html.match(/(?:Displaying|Affichage)[^<]*?(?:of|des|sur)\s+([\d\s,.  ]+)\s+(?:items|éléments)/i);
  const total = totalMatch ? Number(totalMatch[1].replace(/[^\d]/g, '')) : 0;
  const items: RecallItem[] = [];
  for (const row of html.split('search-result views-row').slice(1)) {
    const icon = row.match(/icon-([a-z0-9-]+)\.svg/i)?.[1] ?? '';
    const a = row.match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    const label = row.match(/class="label[^"]*">([^<]*)</)?.[1] ?? '';
    const typeDate = row.match(/class="ar-type">([^<]*)</)?.[1] ?? '';
    if (!a) continue;
    const [typeRaw, dateRaw] = typeDate.split('|').map((s) => s.trim());
    const date = dateRaw?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (!date) continue;
    const href = decode(a[1]);
    const url = href.startsWith('http') ? href : `${ORIGIN}${href}`;
    const type = decode(typeRaw ?? '');
    items.push({
      id: url.split('/').pop() ?? url,
      title: textOf(a[2]),
      url,
      kind: kindOf(label, type),
      type,
      category: categoryFromIcon(icon, type),
      date,
    });
  }
  return { total: total || items.length, items };
}

const field = (html: string, name: string) => {
  const re = new RegExp(`field--name-${name}[^"]*field--item[^>]*>([\\s\\S]*?)</div>`, 'i');
  const m = html.match(re);
  return m ? textOf(m[1]) || undefined : undefined;
};

/** Every value of a multi-value field ("Food - Allergen - Wheat", "Food - Allergen - Gluten"), repeats dropped. */
const fieldList = (html: string, name: string): string[] | undefined => {
  const open = html.match(new RegExp(`<div class="field field--name-${name}[^"]*field--items">`, 'i'));
  if (!open || open.index == null) return undefined;
  const rest = html.slice(open.index + open[0].length);
  const re = /\s*<div class="field--item">([\s\S]*?)<\/div>/y;
  const vals: string[] = [];
  for (let m = re.exec(rest); m; m = re.exec(rest)) vals.push(textOf(m[1]));
  const out = [...new Set(vals.filter(Boolean))];
  return out.length ? out : undefined;
};

const fieldItems = (html: string, name: string) => fieldList(html, name)?.join(', ');

const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s);

/** Parse the summary of one notice page (brand, product, issue, what to do, distribution, affected products). */
export function parseNotice(html: string): RecallDetails {
  const issueLong = clip(field(html, 'field-issue-long'), 220);
  const details: RecallDetails = {
    brand: fieldItems(html, 'field-brand-ref'),
    product: clip(field(html, 'field-product'), 160),
    issue: fieldList(html, 'field-issue-type') ?? (issueLong ? [issueLong] : undefined),
    whatToDo: clip(field(html, 'field-action'), 220)?.replace(/^.*\b(section below|ci-dessous)\b.*$/i, '') || undefined,
    distribution: fieldItems(html, 'field-distribution-region'),
    publishedBy: field(html, 'field-organization') ?? html.match(/field--name-field-organization[^>]*>([^<]+)</)?.[1]?.trim(),
    recallClass: fieldItems(html, 'field-hazard-type'),
  };
  // Affected products table: map columns by header name (EN or FR).
  const t = html.match(/field--name-field-affected-products[\s\S]*?<table[\s\S]*?<\/table>/i)?.[0];
  if (t) {
    const heads = [...(t.match(/<thead[\s\S]*?<\/thead>/i)?.[0] ?? '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => textOf(m[1]).toLowerCase());
    const col = (re: RegExp) => heads.findIndex((h) => re.test(h));
    const idx = {
      brand: col(/^(brand|marque)/),
      product: col(/^(product|produit|model|modèle|common name|nom)/),
      size: col(/^(size|format|taille)/),
      upc: col(/^(upc|cup)/),
      codes: col(/^(codes?|lot|numéro|number)/),
    };
    const body = t.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] ?? '';
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => [...r[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => textOf(c[1])));
    const val = (cells: string[], i: number) => {
      const v = i >= 0 ? cells[i] : undefined;
      return v && !/^(none|aucun|aucune|n\/a|s\.o\.|-)$/i.test(v) ? clip(v, 90) : undefined;
    };
    const affected = rows
      .filter((c) => c.some(Boolean))
      .map((c) => {
        const p: AffectedProduct = { brand: val(c, idx.brand), product: val(c, idx.product), size: val(c, idx.size), upc: val(c, idx.upc), codes: val(c, idx.codes) };
        // Notices sometimes put lot or best-before codes in the UPC column: only label digits as a UPC.
        if (p.upc && /\p{L}/u.test(p.upc)) {
          p.codes = [p.upc, p.codes].filter(Boolean).join(' · ');
          p.upc = undefined;
        }
        return p;
      })
      .filter((p) => p.product || p.upc || p.codes);
    if (affected.length) {
      details.affected = affected.slice(0, 6);
      details.affectedTotal = affected.length;
    }
  }
  for (const k of Object.keys(details) as (keyof RecallDetails)[]) if (details[k] == null) delete details[k];
  return details;
}

/**
 * The official search page for the same query (the handoff). Several words are searched as one exact phrase
 * ("car seat"), unless `any` asks for notices that mention any of the words (the site's own unquoted search).
 */
export function searchUrlFor(lang: Lang, query?: string | null, category?: RecallCategory | 'all', page?: number, any = false): string {
  const p = new URLSearchParams();
  const q = query?.trim();
  if (q) p.set('search_api_fulltext', !any && /\s/.test(q) && !/^".*"$/.test(q) ? `"${q}"` : q);
  if (category && category !== 'all') p.set('f[0]', `cat:${CATEGORY_FACET[category]}`);
  if (page) p.set('page', `,0,${page}`); // Drupal's multi-pager syntax on this site
  const qs = p.toString();
  return `${URLS.recallsSearch[lang]}${qs ? `?${qs}` : ''}`;
}

/** Words that lead a product name without naming it: never searched on their own. */
const GENERIC_LEAD = /^(the|new|old|big|mini|extra|super|baby|kids?|children|organic|natural|fresh|frozen|les?|la|des|une?|nouveaux?|nouvelle|petite?s?|grande?s?|bio|bébé|enfants?)$/i;

/**
 * Wider searches to try when an exact phrase finds nothing, most precise first: the leading word alone (the
 * brand in "Advil Caplets" or "Tylenol Extra Strength"; `brandLike` when it was written with a capital), then
 * any of the words. A single word has nothing wider.
 */
export function broaderQueries(query: string): { query: string; any: boolean; brandLike: boolean }[] {
  const words = query.trim().split(/\s+/);
  if (words.length < 2) return [];
  const lead = words[0].replace(/[^\p{L}\p{N}-]/gu, '');
  const brand = lead.length >= 3 && !GENERIC_LEAD.test(lead) ? [{ query: lead, any: false, brandLike: /^\p{Lu}/u.test(lead) }] : [];
  return [...brand, { query: words.join(' '), any: true, brandLike: false }];
}

/** Notice pages one result may fetch for summaries, and how many it fetches when few filters need them. */
const DETAILS_MAX = 12;
const DETAILS_MIN = 8;
/** Rows a filter shows on arrival: its cards and the rows under them, before "Show more". */
const ON_ARRIVAL = 6;

/**
 * Which notices get their summary fetched (by URL), so every filter opens on a card with what to do and the
 * affected products, not only the newest notices overall: the first two rows of each category (and of the
 * allergen chip, for a search), then the rows shown on arrival, then a third per category. Counted on the rows
 * the widget shows (a warning and its recall are one row). `items` is in display order.
 */
export function detailPicks(items: RecallItem[], query?: string | null): Set<string> {
  const rows = mergeRepeats(items);
  const picks = new Set<string>();
  const add = (list: RecallItem[]) => {
    for (const it of list) if (picks.size < DETAILS_MAX) picks.add(it.url);
  };
  const firstOf = (k: RecallCategory, n: number) => rows.filter((r) => r.category === k).slice(0, n);
  for (const k of RECALL_CATEGORIES) add(firstOf(k, 2));
  if (query) add(allergenNotices(rows, query).slice(0, 2));
  add(rows.slice(0, ON_ARRIVAL));
  for (const k of RECALL_CATEGORIES) add(firstOf(k, 3));
  for (const r of rows) if (picks.size < DETAILS_MIN) picks.add(r.url);
  return picks;
}

/** Most recent first; stable for equal dates. */
export function byDateDesc(items: RecallItem[]): RecallItem[] {
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (a.it.date === b.it.date ? a.i - b.i : a.it.date < b.it.date ? 1 : -1))
    .map((x) => x.it);
}

/** Drop repeats (the recent listing can repeat across pages when new notices land mid-fetch). */
export function dedupe(items: RecallItem[]): RecallItem[] {
  const seen = new Set<string>();
  return items.filter((it) => (seen.has(it.url) ? false : (seen.add(it.url), true)));
}

/** Normalize a free-text query: trim, drop filler like "recalls for", cap length. */
export function cleanQuery(q?: string | null): string | null {
  const s = (q ?? '')
    .replace(/[“”«»"]/g, ' ')
    .replace(/\b(recalls?|rappels?|recalled|rappelée?s?|safety alerts?|alerts?|any|recent|récents?)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
  return s.length >= 2 ? s : null;
}
