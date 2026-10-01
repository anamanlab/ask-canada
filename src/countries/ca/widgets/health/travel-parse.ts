/**
 * Travel health notices on travel.gc.ca / voyage.gc.ca (pure): the parser for the Public Health Agency of
 * Canada's notice table, and destination matching against travel.gc.ca's list of destinations. Used by
 * ./live-travel.ts, never by the renderer, so none of it ships to the browser.
 */
import { DESTINATIONS } from './destinations';
import type { Lang } from './facts';
import { decode, textOf } from './recalls-parse';
import type { ThnLevel, ThnNotice } from './travel';

/**
 * `rows` is how many table rows had cells: a page that was fetched but gave no notice (rows 0, or rows without a
 * level or a link) has changed its markup, which is not the same failure as a site that can't be reached.
 */
type ThnPage = { notices: ThnNotice[]; rows: number; /** The page's "Date modified" (YYYY-MM-DD), when it states one. */ modified: string | null };

const BASE: Record<Lang, string> = { en: 'https://travel.gc.ca', fr: 'https://voyage.gc.ca' };

/**
 * Parse the notice table structurally: every row of `<table id="reportlist">` that has cells, whatever its
 * classes. Cell 0 holds the level (levelN.svg, or "Level N" / « Niveau N »), cell 1 the linked title, cell 2 the
 * places and cell 3 the date. Both markups the site has served parse the same way: rows marked
 * `<tr class='font-small'>` with a fifth cell (until September 2026), and plain `<tr>` rows of four cells.
 */
export function parseThn(html: string, lang: Lang): ThnPage {
  const notices: ThnNotice[] = [];
  const table = html.match(/<table[^>]*\bid=["']reportlist["'][^>]*>([\s\S]*?)<\/table>/i)?.[1] ?? html;
  let rows = 0;
  for (const m of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (cells.length < 3) continue;
    rows++;
    const level = Number(cells[0].match(/level(\d)\.svg/i)?.[1] ?? textOf(cells[0]).match(/(?:Level|Niveau)\s*(\d)/i)?.[1]);
    const a = cells[1].match(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!a || !(level >= 1 && level <= 4)) continue;
    const where = textOf(cells[2]);
    const global = /^(all countries|tous les pays)$/i.test(where);
    const href = decode(a[1]);
    notices.push({
      id: href.split('/').pop() ?? href,
      level: level as ThnLevel,
      title: textOf(a[2]),
      locations: global ? [where] : splitPlaces(where),
      global,
      updated: textOf(cells[3] ?? '').match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? '',
      url: href.startsWith('http') ? href : `${BASE[lang]}${href}`,
    });
  }
  return { notices, rows, modified: dateModifiedOf(html) };
}

/** The "Date modified" a Government of Canada page states: `<time property="dateModified">2026-01-21</time>`. */
export function dateModifiedOf(html: string): string | null {
  return html.match(/<time[^>]*\bproperty=["']dateModified["'][^>]*>\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
}

/** "Gambia, The" and "Saint Vincent & the Grenadines" survive; split on commas otherwise. */
function splitPlaces(s: string): string[] {
  const parts = s.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (/^the$/i.test(p) && out.length) out[out.length - 1] += ', The';
    else out.push(p);
  }
  return out;
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

type Place = { en: string; fr: string };

/**
 * Every way a destination can be written, longest first: its official name in each language without the
 * bracketed part ("Democratic Republic of Congo"), "Gambia" for "Gambia, The", and a bracketed alternate name
 * ("Ivory Coast", "East Timor"). A key two destinations share is dropped. The capitals in brackets (Kinshasa,
 * Brazzaville) are in ALIASES with the other everyday names.
 */
const KEYS: [key: string, place: Place][] = (() => {
  const seen = new Map<string, Place | null>();
  const add = (key: string, place: Place) => {
    const k = norm(key);
    if (k.length < 4) return;
    const had = seen.get(k);
    seen.set(k, had && had.en !== place.en ? null : place);
  };
  for (const [, en, fr] of DESTINATIONS) {
    const place = { en, fr };
    for (const name of [en, fr]) {
      add(name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/,\s*The$/i, ''), place);
      const alt = name.match(/\(([^)]{6,})\)/)?.[1];
      if (alt && !/kinshasa|brazzaville|\./i.test(alt)) add(alt, place);
    }
  }
  return [...seen].flatMap(([k, p]): [string, Place][] => (p ? [[k, p]] : [])).sort((a, b) => b[0].length - a[0].length);
})();

const BY_ISO = new Map<string, Place>(DESTINATIONS.map(([iso, en, fr]) => [iso, { en, fr }]));

/** Everyday names, cities and regions → the destination travel.gc.ca files them under (ISO code in ./destinations.ts). */
const ALIASES: [RegExp, string][] = [
  [/\b(usa|u s a|u s|united states of america|the states|etats unis d'amerique|hawaii|florida|floride|california|californie|new york|las vegas|arizona|texas|alaska)\b/, 'US'],
  [/\b(uk|u k|england|angleterre|scotland|ecosse|wales|pays de galles|great britain|grande bretagne|britain|london|londres|northern ireland|irlande du nord)\b/, 'GB'],
  [/\b(holland|hollande|amsterdam)\b/, 'NL'],
  [/\b(turkey|turquie|istanbul)\b/, 'TR'],
  [/\b(czech republic|republique tcheque)\b/, 'CZ'],
  [/\b(burma|birmanie)\b/, 'MM'],
  [/\b(punta cana)\b/, 'DO'],
  [/\b(cancun|puerto vallarta|mexico city|cabo san lucas|playa del carmen|tulum)\b/, 'MX'],
  [/\b(bali)\b/, 'ID'],
  [/\b(varadero|havana|la havane)\b/, 'CU'],
  [/\b(israel|palestine|gaza|west bank|cisjordanie|tel aviv|jerusalem)\b/, 'IL'],
  [/\b(uae|u a e|dubai|abu dhabi|emirats)\b/, 'AE'],
  [/\b(trinidad|tobago|trinite)\b/, 'TT'],
  [/\b(bosnia|bosnie)\b/, 'BA'],
  [/\b(antigua|barbuda)\b/, 'AG'],
  [/\b(st kitts|saint kitts|nevis)\b/, 'KN'],
  [/\b(st lucia|ste lucie)\b/, 'LC'],
  [/\b(st vincent|saint vincent|grenadines)\b/, 'VC'],
  [/\b(turks (and|&) caicos|turks et caicos)\b/, 'TC'],
  [/\b(cape verde|cap vert)\b/, 'CV'],
  [/\b(swaziland)\b/, 'SZ'],
  [/\b(macau)\b/, 'MO'],
  [/\b(us virgin islands|u s virgin islands)\b/, 'VI'],
  [/\b(tahiti|bora bora)\b/, 'PF'],
  [/\b(phuket|bangkok)\b/, 'TH'],
  // The two Congos and the two Koreas, by their explicit names only (as travel.gc.ca lists them, checked
  // 2026-10-01). A bare "Congo" or "Korea" is ambiguous: it matches nothing, and the widget asks for the
  // destination instead of showing the other country's notices. The longer name is tested first.
  [/\b(drc|dr congo|d r congo|kinshasa|democratic republic of the congo|rdc|congo kinshasa)\b/, 'CD'],
  [/\b(brazzaville|republic of the congo|congo brazzaville)\b/, 'CG'],
  [/\b(dprk|pyongyang)\b/, 'KP'],
  [/\b(seoul|busan)\b/, 'KR'],
];

/**
 * The destination named in free text ("Cuba", or a whole question): the longest official name that appears as
 * whole words, in either language, else an everyday alias ("Hawaii", "the UK"). The list is travel.gc.ca's own
 * list of destinations (./destinations.ts), not the places today's notices happen to name, so a country with no
 * notice of its own is still a known destination.
 */
export function findPlace(text: string): Place | null {
  const t = ` ${norm(text)} `;
  for (const [key, place] of KEYS) if (t.includes(` ${key} `)) return place;
  for (const [re, iso] of ALIASES) if (re.test(t)) return BY_ISO.get(iso) ?? null;
  return null;
}

/** Capitalized words that follow a preposition in a question without being a place ("in December", "to Health Canada"). */
const NOT_A_PLACE = /^(january|february|march|april|may|june|july|august|september|october|november|december|canada|health|public|i|covid)\b/i;
const CAP = "\\p{Lu}[\\p{L}'’.-]*";
const CANDIDATE = new RegExp(`(?<![\\p{L}])(?:for|to|in|visit(?:ing)?|pour|au|aux|en|à|vers|visiter)\\s+(?:the\\s+|la\\s+|le\\s+|les\\s+|l['’])?(${CAP}(?:[\\s-]+(?:(?:of|the|and|du|de|des|la|le|et)\\s+)*${CAP})*)`, 'gu');

/**
 * The place a text names when travel.gc.ca doesn't list it. A short text is the place itself ("Narnia", as the
 * model passes it); in a question, the capitalized name after "to", "for", "in" (« à », « au », « en »), so
 * "Is it safe to travel to Narnia?" gives "Narnia". Null when the text names no place at all ("Are there any
 * travel health notices right now?"): the widget then shows every current notice, not a "couldn't find" notice.
 */
export function placeCandidate(text: string): string | null {
  const t = text.trim().replace(/[?!.]+$/, '');
  if (!t) return null;
  if (t.split(/\s+/).length <= 3 && !/[?]/.test(text)) return /notices?|conseils?|vaccin|travel|voyage|health|santé/i.test(t) ? null : t;
  let hit: string | null = null;
  for (const m of t.matchAll(CANDIDATE)) if (!NOT_A_PLACE.test(m[1])) hit = m[1];
  return hit;
}

/** Notices that apply to a place (named as the notices' language names it), global notices included. */
export function noticesFor(place: Place, notices: ThnNotice[]): ThnNotice[] {
  const names = new Set([norm(place.en), norm(place.fr)]);
  return notices.filter((n) => n.global || n.locations.some((l) => names.has(norm(l))));
}

export const byLevel = (a: ThnNotice, b: ThnNotice) => b.level - a.level || (a.updated < b.updated ? 1 : a.updated > b.updated ? -1 : 0);
