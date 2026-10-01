/**
 * Place lookup (pure, isomorphic): match a typed place against ECCC's 844 forecast locations, find the
 * nearest AQHI community to a point, and pick the local time zone. No network here; tools/weather.ts falls back to the
 * NRCan Geolocator for places that aren't forecast locations (small towns, postal-code areas).
 */
import { CITIES, type CityRow } from './cities/index';
import { AQHI_COMMUNITIES } from './aqhi-communities';
import type { Lang, Province } from './data';
import { distanceKm, fold } from './geo';
import { provinceOf, toLite } from './nearest';
import type { PlaceLite } from './types';

const PROV_NAMES: Record<Province, string[]> = {
  ab: ['ab', 'alta', 'alberta'],
  bc: ['bc', 'cb', 'british columbia', 'colombie britannique'],
  mb: ['mb', 'man', 'manitoba'],
  nb: ['nb', 'new brunswick', 'nouveau brunswick'],
  nl: ['nl', 'tnl', 'nfld', 'newfoundland', 'labrador', 'newfoundland and labrador', 'terre neuve', 'terre neuve et labrador'],
  ns: ['ns', 'nova scotia', 'nouvelle ecosse'],
  nt: ['nt', 'nwt', 'tno', 'northwest territories', 'territoires du nord ouest'],
  nu: ['nu', 'nvt', 'nunavut'],
  on: ['on', 'ont', 'ontario'],
  pe: ['pe', 'pei', 'ipe', 'prince edward island', 'ile du prince edouard'],
  qc: ['qc', 'que', 'quebec province', 'province de quebec'],
  sk: ['sk', 'sask', 'saskatchewan'],
  yt: ['yt', 'yk', 'yukon'],
};

/** Common names that differ from ECCC's labels. */
const ALIASES: Record<string, string> = {
  ottawa: 'on-118',
  'ottawa gatineau': 'on-118',
  'quebec city': 'qc-133',
  'ville de quebec': 'qc-133',
  quebec: 'qc-133',
  sudbury: 'on-40',
  'greater sudbury': 'on-40',
  'grand sudbury': 'on-40',
  vancouver: 'bc-74',
  'metro vancouver': 'bc-74',
  gta: 'on-143',
  'greater toronto': 'on-143',
  'grand toronto': 'on-143',
  'st johns': 'nl-24',
  'saint johns': 'nl-24',
  'saint john s': 'nl-24',
  pei: 'pe-5',
  charlottetown: 'pe-5',
  lloydminster: 'ab-15',
};

/** Where a bare, ambiguous name most likely points (biggest city); alternatives are still offered. */
const PREFERRED: Record<string, string> = { windsor: 'on-94', kingston: 'on-69', london: 'on-137', richmond: 'bc-96', victoria: 'bc-85', halifax: 'ns-19', winnipeg: 'mb-38', calgary: 'ab-52', edmonton: 'ab-50' };

const base = (name: string) => name.replace(/\s*\(.*\)\s*$/, '');

type Indexed = { row: CityRow; full: string[]; base: string[] };
let INDEX: Indexed[] | null = null;
function index() {
  if (!INDEX) {
    INDEX = CITIES.map((row) => {
      const names = [row[1], row[2] || row[1]];
      return { row, full: [...new Set(names.map(fold))], base: [...new Set(names.map((n) => fold(base(n))))] };
    });
  }
  return INDEX;
}

export const cityById = (id: string) => CITIES.find((r) => r[0] === id);

/** Split "Moncton, NB" / "London Ontario" into the place and a province hint. */
export function splitProvince(q: string): { name: string; province?: Province } {
  const f = fold(q);
  for (const [prov, names] of Object.entries(PROV_NAMES) as [Province, string[]][]) {
    for (const n of names.sort((a, b) => b.length - a.length)) {
      const re = new RegExp(`(?:^|\\s)(?:in\\s+|en\\s+|au\\s+)?${n}$`);
      if (re.test(f) && f !== n) return { name: f.replace(re, '').trim(), province: prov };
    }
  }
  return { name: f };
}

type Match = { kind: 'one'; place: PlaceLite; alternatives: PlaceLite[] } | { kind: 'many'; options: PlaceLite[] } | { kind: 'none' };

/** Match a typed place name against the forecast locations. */
export function matchCity(query: string, lang: Lang = 'en'): Match {
  const { name, province } = splitProvince(query);
  if (!name) return { kind: 'none' };
  const inProv = (r: CityRow) => !province || provinceOf(r[0]) === province;
  const alias = ALIASES[name];
  if (alias) {
    const row = cityById(alias);
    if (row && inProv(row)) return { kind: 'one', place: toLite(row, lang), alternatives: [] };
  }
  const idx = index().filter((e) => inProv(e.row));
  let hits = idx.filter((e) => e.full.includes(name));
  if (!hits.length) hits = idx.filter((e) => e.base.includes(name));
  if (!hits.length && name.length >= 4) hits = idx.filter((e) => e.full.some((n) => n.startsWith(name + ' ')));
  if (!hits.length) return { kind: 'none' };
  // Prefer names without a parenthetical ("Calgary" over "Calgary (Olympic Park)").
  const plain = hits.filter((e) => !/\(/.test(e.row[1]));
  const pool = plain.length ? plain : hits;
  const provs = new Set(pool.map((e) => provinceOf(e.row[0])));
  if (provs.size === 1) {
    const pick = pool.find((e) => e.row[0] === PREFERRED[name]) ?? pool[0];
    return { kind: 'one', place: toLite(pick.row, lang), alternatives: [] };
  }
  const preferred = pool.find((e) => e.row[0] === PREFERRED[name]);
  if (preferred) {
    return {
      kind: 'one',
      place: toLite(preferred.row, lang),
      alternatives: pool.filter((e) => e !== preferred).map((e) => toLite(e.row, lang)),
    };
  }
  return { kind: 'many', options: pool.slice(0, 6).map((e) => toLite(e.row, lang)) };
}

export function nearestAqhi(lat: number, lon: number, lang: Lang = 'en') {
  let best = AQHI_COMMUNITIES[0];
  let bestD = Infinity;
  for (const row of AQHI_COMMUNITIES) {
    const d = distanceKm(lat, lon, row[3], row[4]);
    if (d < bestD) {
      bestD = d;
      best = row;
    }
  }
  return { id: best[0], name: (lang === 'fr' && best[2]) || best[1], km: Math.round(bestD) };
}

/**
 * IANA time zone for a point in a province (close enough for showing local forecast times; the exceptions
 * that matter for big populations are handled: NW Ontario, NE BC, the Kootenays, Lloydminster, Labrador,
 * the Magdalen Islands and Nunavut's three zones).
 */
export function timeZoneFor(province: Province, lat: number, lon: number): string {
  switch (province) {
    case 'bc':
      if (lon > -121 && lat > 55.5) return 'America/Dawson_Creek';
      if (lon > -117.8 && lat < 50.5) return 'America/Edmonton';
      return 'America/Vancouver';
    case 'ab':
      return 'America/Edmonton';
    case 'sk':
      return lon > -110.2 ? 'America/Regina' : 'America/Edmonton';
    case 'mb':
      return 'America/Winnipeg';
    case 'on':
      return lon < -90 ? 'America/Winnipeg' : 'America/Toronto';
    case 'qc':
      if (lon > -62.5 && lat < 48) return 'America/Halifax';
      if (lon > -59.5) return 'America/Puerto_Rico';
      return 'America/Toronto';
    case 'nb':
    case 'ns':
    case 'pe':
      return 'America/Halifax';
    case 'nl':
      return lat > 51.5 && lon < -57.1 ? 'America/Goose_Bay' : 'America/St_Johns';
    case 'yt':
      return 'America/Whitehorse';
    case 'nt':
      return 'America/Yellowknife';
    case 'nu':
      if (lon < -102) return 'America/Cambridge_Bay';
      if (lon < -85) return 'America/Rankin_Inlet';
      return 'America/Iqaluit';
  }
}

/** Big cities offered when we need a place (one per province/territory, capitals and largest). */
const POPULAR_IDS = ['on-143', 'qc-147', 'bc-74', 'ab-52', 'on-118', 'ab-50', 'mb-38', 'qc-133', 'ns-19', 'sk-40', 'nb-23', 'nl-24', 'pe-5', 'yt-16', 'nt-24', 'nu-21'];
export const popularPlaces = (lang: Lang) =>
  POPULAR_IDS.flatMap((id) => {
    const row = cityById(id);
    return row ? [toLite(row, lang)] : [];
  });

/** First letter of a postal code → province (for sanity checks on geocoder hits). */
export const FSA_PROVINCE: Record<string, Province[]> = {
  A: ['nl'], B: ['ns'], C: ['pe'], E: ['nb'], G: ['qc'], H: ['qc'], J: ['qc'], K: ['on'], L: ['on'], M: ['on'], N: ['on'], P: ['on'],
  R: ['mb'], S: ['sk'], T: ['ab'], V: ['bc'], X: ['nt', 'nu'], Y: ['yt'],
};

const GEO_PROVINCES: Record<string, Province> = {
  alberta: 'ab', 'british columbia': 'bc', manitoba: 'mb', 'new brunswick': 'nb', 'newfoundland and labrador': 'nl', 'nova scotia': 'ns',
  'northwest territories': 'nt', nunavut: 'nu', ontario: 'on', 'prince edward island': 'pe', quebec: 'qc', saskatchewan: 'sk', yukon: 'yt',
};
export const provinceFromName = (name?: string | null): Province | undefined => (name ? GEO_PROVINCES[fold(name)] : undefined);
