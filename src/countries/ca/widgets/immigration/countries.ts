/**
 * Reading a country out of what people type, for the visa/eTA check and processing times: the tools and the
 * scripted answers use it on the server (the widgets only need `countryName`, in country-name.ts).
 * Names come from Intl.DisplayNames (so French and English are both official-quality), plus common aliases
 * and nationality adjectives people type ("I'm Mexican", « je suis indienne »).
 */
import { ENTRY_COUNTRIES } from './data';

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const ALIASES: Record<string, string[]> = {
  US: ['usa', 'u s', 'u s a', 'united states', 'america', 'american', 'americaine', 'americain', 'etats unis', 'etatsunien'],
  GB: ['uk', 'u k', 'britain', 'great britain', 'england', 'scotland', 'wales', 'british', 'britannique', 'royaume uni', 'angleterre'],
  KR: ['south korea', 'korea', 'korean', 'coree du sud', 'coree', 'coreen', 'coreenne'],
  KP: ['north korea', 'coree du nord'],
  CN: ['china', 'chinese', 'chine', 'chinois', 'chinoise', 'mainland china'],
  HK: ['hong kong', 'hongkong'],
  TW: ['taiwan', 'taiwanese', 'taiwanais', 'taiwanaise'],
  IN: ['india', 'indian', 'inde', 'indien', 'indienne'],
  MX: ['mexico', 'mexican', 'mexique', 'mexicain', 'mexicaine'],
  BR: ['brazil', 'brazilian', 'bresil', 'bresilien', 'bresilienne'],
  PH: ['philippines', 'the philippines', 'filipino', 'filipina', 'philippin', 'philippine', 'philippins'],
  NG: ['nigeria', 'nigerian', 'nigerian', 'nigeriane'],
  PK: ['pakistan', 'pakistani', 'pakistanais', 'pakistanaise'],
  FR: ['france', 'french', 'francais', 'francaise'],
  DE: ['germany', 'german', 'allemagne', 'allemand', 'allemande'],
  IT: ['italy', 'italian', 'italie', 'italien', 'italienne'],
  ES: ['spain', 'spanish', 'espagne', 'espagnol', 'espagnole'],
  PT: ['portugal', 'portuguese', 'portugais', 'portugaise'],
  JP: ['japan', 'japanese', 'japon', 'japonais', 'japonaise'],
  AU: ['australia', 'australian', 'australie', 'australien', 'australienne'],
  IE: ['ireland', 'irish', 'irlande', 'irlandais', 'irlandaise'],
  NZ: ['new zealand', 'kiwi', 'nouvelle zelande'],
  VN: ['vietnam', 'viet nam', 'vietnamese', 'vietnamien', 'vietnamienne'],
  TR: ['turkey', 'turkiye', 'turkish', 'turquie', 'turc', 'turque'],
  CI: ['ivory coast', 'cote d ivoire', 'ivorian', 'ivoirien', 'ivoirienne'],
  CZ: ['czechia', 'czech republic', 'czech', 'tcheque', 'republique tcheque'],
  RU: ['russia', 'russian', 'russie', 'russe'],
  UA: ['ukraine', 'ukrainian', 'ukrainien', 'ukrainienne'],
  IR: ['iran', 'iranian', 'iranien', 'iranienne'],
  CO: ['colombia', 'colombian', 'colombie', 'colombien', 'colombienne'],
  AR: ['argentina', 'argentinian', 'argentine', 'argentin'],
  MA: ['morocco', 'moroccan', 'maroc', 'marocain', 'marocaine'],
  DZ: ['algeria', 'algerian', 'algerie', 'algerien', 'algerienne'],
  TN: ['tunisia', 'tunisian', 'tunisie', 'tunisien', 'tunisienne'],
  HT: ['haiti', 'haitian', 'haitien', 'haitienne'],
  CM: ['cameroon', 'cameroonian', 'cameroun', 'camerounais', 'camerounaise'],
  SN: ['senegal', 'senegalese', 'senegalais', 'senegalaise'],
  EG: ['egypt', 'egyptian', 'egypte', 'egyptien', 'egyptienne'],
  BD: ['bangladesh', 'bangladeshi', 'bangladais'],
  LK: ['sri lanka', 'sri lankan', 'sri lankais'],
  NP: ['nepal', 'nepali', 'nepalese', 'nepalais'],
  ID: ['indonesia', 'indonesian', 'indonesie', 'indonesien', 'indonesienne'],
  MY: ['malaysia', 'malaysian', 'malaisie', 'malaisien', 'malaisienne'],
  TH: ['thailand', 'thai', 'thailande', 'thailandais', 'thailandaise'],
  AE: ['uae', 'u a e', 'emirates', 'dubai', 'emirats arabes unis'],
  SA: ['saudi', 'saudi arabia', 'arabie saoudite'],
  ZA: ['south africa', 'south african', 'afrique du sud', 'sud africain'],
  CD: ['drc', 'dr congo', 'democratic republic of the congo', 'rdc', 'republique democratique du congo'],
  PS: ['palestine', 'palestinian', 'palestinien', 'palestinienne'],
  NL: ['netherlands', 'holland', 'dutch', 'pays bas', 'neerlandais'],
  CH: ['switzerland', 'swiss', 'suisse'],
  BE: ['belgium', 'belgian', 'belgique', 'belge'],
  CA: ['canada', 'canadian', 'canadien', 'canadienne'],
};

type Index = { names: [string, string][] };
let cache: Index | null = null;

function index(): Index {
  if (cache) return cache;
  const codes = [...new Set([...ENTRY_COUNTRIES, ...Object.keys(ALIASES)])];
  const names: [string, string][] = [];
  for (const lang of ['en', 'fr']) {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([lang], { type: 'region' });
    } catch {
      dn = null;
    }
    for (const c of codes) {
      const n = dn?.of(c);
      if (n && n !== c) names.push([fold(n), c]);
    }
  }
  for (const [c, list] of Object.entries(ALIASES)) for (const a of list) names.push([a, c]);
  // Longest names first so "south korea" wins over "korea" and "north macedonia" over "macedonia".
  names.sort((a, b) => b[0].length - a[0].length);
  cache = { names };
  return cache;
}

/**
 * Finds the country named in free text; returns its ISO code or null. "Canada" itself is ignored (every visa
 * question mentions it) unless it's the only country and used as a nationality ("I'm Canadian").
 */
export function countryFromText(text: string): string | null {
  const t = ` ${fold(text)} `;
  let best: { code: string; at: number } | null = null;
  let canadian = false;
  for (const [name, code] of index().names) {
    if (name.length < 3 && name !== 'uk') continue;
    const at = Math.max(t.indexOf(` ${name} `), t.indexOf(` ${name}s `));
    if (at < 0) continue;
    if (code === 'CA') {
      if (name !== 'canada') canadian = true;
      continue;
    }
    if (!best || at < best.at) best = { code, at };
  }
  return best?.code ?? (canadian ? 'CA' : null);
}

/** Accepts an ISO code or a country name (EN/FR); returns an ISO code or null. */
export function toCountryCode(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = v.trim();
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return countryFromText(s);
}
