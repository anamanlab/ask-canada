/**
 * Finds the destination named in a question among the destinations Global Affairs Canada covers
 * (country-table.ts): aliases people use, accent-insensitive matching and near-miss suggestions.
 * No network needed. Server-side only (tool + scenarios); the renderer never imports it.
 */
import { COUNTRIES, type CountryRow } from './country-table';

/**
 * Other ways people name a destination: short forms, older names and popular cities or regions.
 * Keys are folded (lower case, no accents, punctuation as spaces).
 */
const ALIASES: Record<string, string> = {
  usa: 'US', 'u s a': 'US', 'u s': 'US', 'united states of america': 'US', 'the states': 'US', america: 'US', amerique: 'US', 'etats unis d amerique': 'US', 'etats unis': 'US',
  hawaii: 'US', florida: 'US', floride: 'US', 'new york': 'US', 'las vegas': 'US', california: 'US', californie: 'US', arizona: 'US',
  orlando: 'US', miami: 'US', seattle: 'US', boston: 'US', chicago: 'US', 'los angeles': 'US', 'san francisco': 'US', 'palm springs': 'US', texas: 'US',
  uk: 'GB', 'u k': 'GB', britain: 'GB', 'great britain': 'GB', 'grande bretagne': 'GB', england: 'GB', angleterre: 'GB', scotland: 'GB', ecosse: 'GB',
  wales: 'GB', 'pays de galles': 'GB', 'northern ireland': 'GB', 'irlande du nord': 'GB', london: 'GB', londres: 'GB', edinburgh: 'GB', edimbourg: 'GB',
  cancun: 'MX', 'puerto vallarta': 'MX', 'los cabos': 'MX', cabo: 'MX', 'cabo san lucas': 'MX', 'mexico city': 'MX', 'playa del carmen': 'MX', tulum: 'MX',
  'riviera maya': 'MX', mazatlan: 'MX', cozumel: 'MX', acapulco: 'MX', 'huatulco': 'MX', 'ixtapa': 'MX',
  'punta cana': 'DO', 'puerto plata': 'DO', 'santo domingo': 'DO', samana: 'DO', 'la romana': 'DO', 'republique dominicaine': 'DO',
  varadero: 'CU', havana: 'CU', havane: 'CU', 'la havane': 'CU', 'cayo coco': 'CU', holguin: 'CU', 'cayo santa maria': 'CU',
  'montego bay': 'JM', negril: 'JM', 'ocho rios': 'JM', nassau: 'BS', 'the bahamas': 'BS', aruba: 'AW',
  paris: 'FR', provence: 'FR', rome: 'IT', florence: 'IT', venice: 'IT', venise: 'IT', milan: 'IT', tuscany: 'IT', toscane: 'IT',
  barcelona: 'ES', barcelone: 'ES', madrid: 'ES', seville: 'ES', lisbon: 'PT', lisbonne: 'PT', porto: 'PT', algarve: 'PT', madeira: 'PT', madere: 'PT',
  berlin: 'DE', munich: 'DE', amsterdam: 'NL', holland: 'NL', hollande: 'NL', athens: 'GR', athenes: 'GR', santorini: 'GR', dublin: 'IE',
  turkey: 'TR', turquie: 'TR', istanbul: 'TR', czech: 'CZ', 'czech republic': 'CZ', 'republique tcheque': 'CZ', prague: 'CZ', 'ivory coast': 'CI',
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP', seoul: 'KR', korea: 'KR', coree: 'KR', 'coree du sud': 'KR', beijing: 'CN', shanghai: 'CN', pekin: 'CN',
  bangkok: 'TH', phuket: 'TH', 'chiang mai': 'TH', bali: 'ID', jakarta: 'ID', hanoi: 'VN', 'ho chi minh': 'VN', manila: 'PH', manille: 'PH',
  delhi: 'IN', 'new delhi': 'IN', mumbai: 'IN', goa: 'IN', dubai: 'AE', 'abu dhabi': 'AE', uae: 'AE', 'u a e': 'AE', emirates: 'AE',
  israel: 'IL', palestine: 'IL', gaza: 'IL', 'west bank': 'IL', cisjordanie: 'IL', jerusalem: 'IL', 'tel aviv': 'IL',
  burma: 'MM', birmanie: 'MM', 'cape verde': 'CV', 'cap vert': 'CV', 'east timor': 'TL', 'st lucia': 'LC', 'st kitts': 'KN', 'st martin': 'MF',
  'st maarten': 'SX', 'st barts': 'BL', 'st barths': 'BL', 'saint pierre and miquelon': 'PM', 'st pierre': 'PM', 'saint pierre': 'PM',
  lima: 'PE', cusco: 'PE', 'machu picchu': 'PE', 'buenos aires': 'AR', 'rio de janeiro': 'BR', bogota: 'CO', cartagena: 'CO', 'san jose costa rica': 'CR',
  'costa rica': 'CR', marrakech: 'MA', cairo: 'EG', 'le caire': 'EG', sydney: 'AU', melbourne: 'AU', auckland: 'NZ', reykjavik: 'IS',
  'bosnia': 'BA', 'macedonia': 'MK', 'macedoine': 'MK', 'swaziland': 'SZ', 'the gambia': 'GM', gambia: 'GM', 'drc': 'CD', 'rdc': 'CD',
  'st vincent': 'VC', 'saint vincent': 'VC', 'trinidad': 'TT', 'tobago': 'TT', 'turks and caicos': 'TC', 'turks et caicos': 'TC', caymans: 'KY',
  'us virgin islands': 'VI', 'virgin islands': 'VI', 'bvi': 'VG', 'canaries': 'IC', 'canary islands': 'IC', tenerife: 'IC', 'gran canaria': 'IC',
  azores: 'PT-20', acores: 'PT-20', 'micronesia': 'FM', 'micronesie': 'FM', 'north korea': 'KP', 'coree du nord': 'KP',
};

/** Lower case, accents removed, anything that isn't a letter or digit becomes a single space. */
export const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

type Needle = { key: string; iso: string };
let needles: Needle[] | null = null;
function allNeedles(): Needle[] {
  if (needles) return needles;
  const out: Needle[] = [];
  for (const [iso, en, fr] of COUNTRIES) {
    for (const name of [en, fr, en.replace(/\s*\(.*?\)/g, ''), fr.replace(/\s*\(.*?\)/g, '')]) {
      const key = fold(name.replace(/^(.*), The$/, 'The $1'));
      if (key.length > 2) out.push({ key, iso });
    }
  }
  for (const [key, iso] of Object.entries(ALIASES)) out.push({ key, iso });
  // Longest first: "Dominican Republic" before "Dominica", "Papua New Guinea" before "Guinea".
  needles = out.sort((a, b) => b.key.length - a.key.length);
  return needles;
}

/** Words around "America" that make it a continent ("South America", « Amérique du Sud »). */
const NOT_AFTER = /\b(south|central|latin|north)\s*$/;
const NOT_BEFORE = /^\s*(du|centrale|latine)\b/;

export function countryByIso(iso: string): CountryRow | undefined {
  const up = iso.toUpperCase();
  return COUNTRIES.find((c) => c[0] === up);
}

/**
 * Finds the destination named in free text ("Is it safe to go to Cancún?", « Puis-je aller au Mexique? »),
 * or an exact ISO code ("MX"). Returns undefined when no destination is recognised.
 */
export function findCountry(text: string): CountryRow | undefined {
  const raw = text.trim();
  if (/^[A-Za-z]{2}(-\d{2})?$/.test(raw)) {
    const hit = countryByIso(raw);
    if (hit) return hit;
  }
  const q = ` ${fold(raw)} `;
  // "Canada" itself is not a destination here.
  for (const { key, iso } of allNeedles()) {
    const at = q.indexOf(` ${key} `);
    if (at < 0) continue;
    if ((key === 'america' || key === 'amerique') && (NOT_AFTER.test(q.slice(0, at)) || NOT_BEFORE.test(q.slice(at + key.length + 1)))) continue;
    // "Georgia" the U.S. state: only when the text also says so.
    if (iso === 'GE' && /\b(atlanta|savannah|state of georgia|georgia usa|usa|u s)\b/.test(q)) return countryByIso('US');
    return countryByIso(iso);
  }
  // "the US" / "the U.S." (upper case only, so "tell us" never matches).
  if (/\b(?:the\s+)?U\.?S\.?(?:A\.?)?(?![a-z])/.test(raw) && /\bUS\b|U\.S/.test(raw)) return countryByIso('US');
  return undefined;
}

/** Words of a question that are never part of a destination's name. */
const STOP = new Set(
  (
    'trip trips travel travelling traveling travels traveller voyage voyages voyager register registration regist ' +
    'abroad outside canada canadian canadians safe safety going visit visiting vacation holiday where what when which ' +
    'there their this that with from have need does should could would about right now today advisory advisories ' +
    'inscrire inscription etranger pays aller partir vacances securitaire dangereux avertissement avertissements quel quelle ' +
    'comment pour dans avec mon votre notre sont est-ce'
  ).split(' '),
);

/**
 * Up to `n` destinations for "did you mean": each query word (4+ letters, not a stop-word) must start one
 * of the words of a destination's English or French name ("Mexi" → Mexico, "Portu" → Portugal). Returns
 * [] when nothing matches, so the caller can offer popular destinations instead. Never matches inside a
 * word ("trip" is not "AusTRIa").
 */
export function suggestCountries(text: string, n = 4): CountryRow[] {
  const q = fold(text)
    .split(' ')
    .filter((w) => w.length >= 4 && !STOP.has(w));
  if (!q.length) return [];
  const scored = COUNTRIES.map((c) => {
    const words = `${fold(c[1])} ${fold(c[2])}`.split(' ');
    const score = q.reduce((s, w) => s + (words.some((x) => x.startsWith(w) || (w.length >= 6 && x.startsWith(w.slice(0, -1)))) ? w.length : 0), 0);
    return { c, score };
  }).filter((x) => x.score > 0);
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.c);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Regex source matching any destination name (English, French, with or without accents) or common alias.
 * Used by scenarios to route "visa for Japan" here and "visa to visit Canada" to immigration.
 */
export const DESTINATION_PATTERN: string = (() => {
  const names = new Set<string>();
  for (const [, en, fr] of COUNTRIES) {
    for (const n of [en, fr, en.replace(/\s*\(.*?\)/g, ''), fr.replace(/\s*\(.*?\)/g, '')]) {
      const clean = n.replace(/^(.*), The$/, '$1').trim();
      if (clean.length < 3) continue;
      names.add(clean);
      names.add(clean.normalize('NFD').replace(/[̀-ͯ]/g, ''));
    }
  }
  for (const k of Object.keys(ALIASES)) if (k.length >= 3) names.add(k);
  const alts = [...names].sort((a, b) => b.length - a.length).map((n) => escape(n).replace(/['’ -]/g, "[-'’ ]?"));
  return `(?:${alts.join('|')})`;
})();
