/**
 * Wording helpers for the parks scripted scenarios (scenarios/parks.ts): money and dates in both languages,
 * French prepositions, lists and labels.
 */
import { RESERVATION, isRemote, parkById, type Landscape, type Lang, type Park, type Province } from './data';
import type { Mix } from './pass-model';
import { SOURCE_TITLES, URLS, feesTitle, homeTitle, parkUrls } from './urls';

/** Money in a heading: whole dollars when there are no cents ("$29", like the widget's verdict). */
export const moneyH = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
export const money = (n: number, lang: Lang) => new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' }).format(n);
/** "May 1, 2026" / "1er mai 2026" (Canada.ca French style for the first of the month). */
export const dateLong = (iso: string, lang: Lang) => {
  const s = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
  // No-break spaces: "1er mai 2026" never splits across lines.
  return (lang === 'fr' && Number(iso.slice(8, 10)) === 1 ? s.replace(/^1(?=\s)/, '1er') : s).replace(/ /g, '\u00a0');
};
/** French "at the park": "au parc national Jasper", "à la réserve de parc national Pacific Rim". */
export const frAt = (p: Park) => {
  const n = p.name.fr;
  return /^R[ée]serve/.test(n) ? `à la ${n.charAt(0).toLowerCase()}${n.slice(1)}` : `au ${n.charAt(0).toLowerCase()}${n.slice(1)}`;
};

export const DANGER: Record<string, { en: string; fr: string }> = {
  low: { en: 'low', fr: 'bas' },
  moderate: { en: 'moderate', fr: 'modéré' },
  high: { en: 'high', fr: 'élevé' },
  veryHigh: { en: 'very high', fr: 'très élevé' },
  extreme: { en: 'extreme', fr: 'extrême' },
};

/** Phone numbers never break across lines (non-breaking hyphens). */
export const PHONE = RESERVATION.phoneNumber.replace(/-/g, '\u2011');
export const plural = (n: number, one: string, other: string) => `${n}\u00a0${n === 1 ? one : other}`;
export const mixText = (m: Mix, lang: Lang) =>
  [
    m.family ? (lang === 'fr' ? plural(m.family, 'carte famille ou groupe', 'cartes famille ou groupe') : plural(m.family, 'family/group pass', 'family/group passes')) : '',
    m.adults ? (lang === 'fr' ? plural(m.adults, 'carte adulte', 'cartes adulte') : plural(m.adults, 'adult pass', 'adult passes')) : '',
    m.seniors ? (lang === 'fr' ? plural(m.seniors, 'carte aîné', 'cartes aîné') : plural(m.seniors, 'senior pass', 'senior passes')) : '',
  ]
    .filter(Boolean)
    .join(lang === 'fr' ? ' et ' : ' and ');
export const joinList = (items: string[], lang: Lang) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} ${lang === 'fr' ? 'et' : 'and'} ${items[items.length - 1]}`;
export const PROV_LABEL: Record<Province, { en: string; fr: string }> = {
  ab: { en: 'Alberta', fr: 'en Alberta' },
  bc: { en: 'British Columbia', fr: 'en Colombie-Britannique' },
  mb: { en: 'Manitoba', fr: 'au Manitoba' },
  nb: { en: 'New Brunswick', fr: 'au Nouveau-Brunswick' },
  nl: { en: 'Newfoundland and Labrador', fr: 'à Terre-Neuve-et-Labrador' },
  ns: { en: 'Nova Scotia', fr: 'en Nouvelle-Écosse' },
  nt: { en: 'the Northwest Territories', fr: 'dans les Territoires du Nord-Ouest' },
  nu: { en: 'Nunavut', fr: 'au Nunavut' },
  on: { en: 'Ontario', fr: 'en Ontario' },
  pe: { en: 'Prince Edward Island', fr: 'à l’Île-du-Prince-Édouard' },
  qc: { en: 'Quebec', fr: 'au Québec' },
  sk: { en: 'Saskatchewan', fr: 'en Saskatchewan' },
  yt: { en: 'Yukon', fr: 'au Yukon' },
};
export const LAND_LABEL: Record<Landscape, { en: string; fr: string }> = {
  mountains: { en: 'in the mountains', fr: 'en montagne' },
  coast: { en: 'on the coast', fr: 'sur la côte' },
  lakes: { en: 'among lakes and forests', fr: 'de lacs et de forêts' },
  prairie: { en: 'on the prairies', fr: 'dans les Prairies' },
  north: { en: 'in the North', fr: 'dans le Nord' },
};

/**
 * A numbered citation that carries its page title, `[3](https://… "Fees · Banff National Park")`, so the
 * Sources list shows the same title whether or not the card lists the page too (never a slug from the URL).
 */
export const cite = (n: number | string, to: { url: string; title: string }) => `[${n}](${to.url} "${to.title.replace(/"/g, '”').replace(/\s+/g, ' ').trim()}")`;
/** One of the pages in URLS, under its official title. */
export const page = (key: keyof typeof SOURCE_TITLES & keyof typeof URLS, lang: Lang) => ({ url: URLS[key][lang], title: SOURCE_TITLES[key][lang] });
export const parksPage = (lang: Lang) => ({ url: lang === 'fr' ? 'https://parcs.canada.ca/pn-np' : 'https://parks.canada.ca/pn-np', title: SOURCE_TITLES.parks[lang] });
export const parkHome = (p: Park, lang: Lang) => ({ url: parkUrls(p, lang).home, title: homeTitle(p, lang) });
/** A park's fees page, or Parks Canada's fees-by-place page for the three parks that have none. */
export const feesPage = (p: Park | null | undefined, lang: Lang) => {
  const url = p && parkUrls(p, lang).fees;
  return p && url ? { url, title: feesTitle(p, lang) } : page('feesByPlace', lang);
};
export const banffFees = (lang: Lang) => feesPage(parkById('banff'), lang);
/** Where the fire rules for a park are: its own page for remote and northern parks, the visitor guidelines otherwise. */
export const fireRulesPage = (p: Park, lang: Lang) => (isRemote(p) ? parkHome(p, lang) : page('rules', lang));
/** The next season's launch dates are usually posted from December: stop saying "not yet" then. */
export const nextSeasonDatesDue = (today = new Date().toISOString().slice(0, 10)) => today >= RESERVATION.nextSeasonDatesFrom;
