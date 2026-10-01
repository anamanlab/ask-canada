/**
 * Official Parks Canada URLs and page titles for the `parks` widget (isomorphic). Every park URL built here
 * is checked by check-urls.mjs, which fails on any 404 or redirect, in English and French.
 *
 * Park pages checked 2026-09-30:
 * - Fees: /pn-np/<path>/visit/tarifs-fees exists for 45 parks. Torngat Mountains, Mealy Mountains and Rouge
 *   have no fees page (404 on both hosts), so `fees` is null for them and nothing links or cites it.
 * - Bulletins: see BULLETINS_PATH. Mealy Mountains and Ukkusiksalik have no bulletins page (404), so the
 *   national bulletins page stands in.
 * - Camping: /pn-np/<path>/activ/camping, except where that address redirects to the park's activities index:
 *   Jasper, Glacier and Mount Revelstoke keep it under activ/passez-stay/camping, Wood Buffalo under activ/camp,
 *   and Point Pelee's only campground is Camp Henry's oTENTiks (activ/otentik).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang, Park } from './data';

const HOST = { en: 'https://parks.canada.ca', fr: 'https://parcs.canada.ca' } as const;

/**
 * Where each park keeps its "Important bulletins" page (the paths differ; default `bulletins`). `null`: the
 * park has no bulletins page of its own, so the national bulletins page stands in.
 */
const BULLETINS_PATH: Record<string, string | null> = {
  kouchibouguac: 'bulletin',
  terranova: 'info/bul',
  mealy: null,
  ukkusiksalik: null,
  forillon: 'securite-safety/bulletins-important',
  woodbuffalo: 'securite_safety/bulletins',
  thaidene: 'security-safety/bulletins',
  ...Object.fromEntries(
    ['elkisland', 'riding', 'wapusk', 'fundy', 'sable', 'nahanni', 'auyuittuq', 'qausuittuq', 'quttinirpaaq', 'sirmilik', '1000', 'bruce', 'georg', 'pelee', 'rouge', 'mauricie', 'mingan', 'grasslands', 'princealbert', 'kluane', 'vuntut', 'kejimkujik', 'pukaskwa'].map((id) => [id, 'securite-safety/bulletins']),
  ),
};

const NATIONAL_BULLETINS = { en: `${HOST.en}/voyage-travel/securite-safety/bulletins`, fr: `${HOST.fr}/voyage-travel/securite-safety/bulletins` } as const;

/** Parks whose camping page is not at `activ/camping`. */
const CAMPING_PATH: Record<string, string> = {
  jasper: 'activ/passez-stay/camping',
  glacier: 'activ/passez-stay/camping',
  revelstoke: 'activ/passez-stay/camping',
  woodbuffalo: 'activ/camp',
  pelee: 'activ/otentik',
};

/** Parks with no fees page of their own. */
const NO_FEES_PAGE = new Set(['torngats', 'mealy', 'rouge']);

export const parkUrls = (p: Park, lang: Lang) => ({
  home: `${HOST[lang]}/pn-np/${p.path}`,
  /** The park's fees page, or null when it has none. */
  fees: NO_FEES_PAGE.has(p.id) ? null : `${HOST[lang]}/pn-np/${p.path}/visit/tarifs-fees`,
  camping: `${HOST[lang]}/pn-np/${p.path}/${CAMPING_PATH[p.id] ?? 'activ/camping'}`,
  bulletins: BULLETINS_PATH[p.id] === null ? NATIONAL_BULLETINS[lang] : `${HOST[lang]}/pn-np/${p.path}/${BULLETINS_PATH[p.id] ?? 'bulletins'}`,
});

export const URLS = {
  admission: { en: `${HOST.en}/voyage-travel/admission`, fr: `${HOST.fr}/voyage-travel/admission` },
  /** Discovery Pass expiry date calculator (passes valid during a Canada Strong Pass period were extended). */
  passCalculator: { en: `${HOST.en}/voyage-travel/admission#calculator`, fr: `${HOST.fr}/voyage-travel/admission#calculateur` },
  youth: { en: `${HOST.en}/voyage-travel/admission/jeunes-youth`, fr: `${HOST.fr}/voyage-travel/admission/jeunes-youth` },
  newcomers: { en: `${HOST.en}/voyage-travel/admission/cultur`, fr: `${HOST.fr}/voyage-travel/admission/cultur` },
  forces: { en: `${HOST.en}/voyage-travel/admission/forces-veteran`, fr: `${HOST.fr}/voyage-travel/admission/forces-veteran` },
  support: { en: `${HOST.en}/voyage-travel/tarifs-fees#support`, fr: `${HOST.fr}/voyage-travel/tarifs-fees#support` },
  feesByPlace: { en: `${HOST.en}/voyage-travel/tarifs-fees`, fr: `${HOST.fr}/voyage-travel/tarifs-fees` },
  buyDiscovery: {
    en: 'https://reservation.pc.gc.ca/store/all?departmentId=-32761&locale=en-CA',
    fr: 'https://reservation.pc.gc.ca/store/all?departmentId=-32761&locale=fr-CA',
  },
  reserve: { en: `${HOST.en}/voyage-travel/reserve`, fr: `${HOST.fr}/voyage-travel/reserve` },
  howToReserve: { en: `${HOST.en}/voyage-travel/reserve/instructions`, fr: `${HOST.fr}/voyage-travel/reserve/instructions` },
  reservationService: { en: 'https://reservation.pc.gc.ca/?locale=en-CA', fr: 'https://reservation.pc.gc.ca/?locale=fr-CA' },
  camping101: {
    en: `${HOST.en}/voyage-travel/hebergement-accommodation/camping-101`,
    fr: `${HOST.fr}/voyage-travel/hebergement-accommodation/camping-101`,
  },
  wildlife: { en: `${HOST.en}/voyage-travel/conseils-tips/faune-wildlife`, fr: `${HOST.fr}/voyage-travel/conseils-tips/faune-wildlife` },
  rules: { en: `${HOST.en}/voyage-travel/regles-rules`, fr: `${HOST.fr}/voyage-travel/regles-rules` },
  emergency: { en: `${HOST.en}/voyage-travel/securite-safety/urgence-emergency`, fr: `${HOST.fr}/voyage-travel/securite-safety/urgence-emergency` },
  bulletins: NATIONAL_BULLETINS,
  fireManagement: { en: `${HOST.en}/nature/science/conservation/feu-fire`, fr: `${HOST.fr}/nature/science/conservation/feu-fire` },
  parksSearch: { en: `${HOST.en}/pn-np/recherche-parcs-parks-search`, fr: `${HOST.fr}/pn-np/recherche-parcs-parks-search` },
  fireMap: { en: 'https://cwfis.cfs.nrcan.gc.ca/interactive-map', fr: 'https://cwfis.cfs.nrcan.gc.ca/carte-interactive' },
  fireDanger: { en: 'https://cwfis.cfs.nrcan.gc.ca/maps/fw?type=fdr', fr: 'https://cwfis.cfs.nrcan.gc.ca/cartes/mf?type=fdr' },
} as const;

/**
 * Official page titles, for the tool outputs' sources (sources.ts), the citations in the answers and for
 * naming a source in the cards. The first source of a card is its footer line, next to "Vérifié le 30 sept.
 * 2026 · +8 de plus": the French titles of those pages are shortened so the footer stays on one line.
 */
export const SOURCE_TITLES = {
  admission: { en: 'Passes, permits and fees', fr: 'Laissez-passer et frais' },
  fees: { en: 'Fees', fr: 'Tarification' },
  feesByPlace: { en: 'Fees · Parks Canada', fr: 'Tarification · Parcs Canada' },
  parks: { en: 'National parks', fr: 'Parcs nationaux' },
  reserve: { en: 'Parks Canada reservations', fr: 'Réservations' },
  howToReserve: { en: 'How to make reservations', fr: 'Comment faire une réservation' },
  wildlife: { en: 'Top tips to respect wildlife and stay safe', fr: 'Conseils pour respecter la faune et être en sécurité' },
  rules: { en: 'Visitor guidelines', fr: 'Directives à l’intention des visiteurs' },
  emergency: { en: 'Emergency contacts', fr: 'Coordonnées d’urgence' },
  bulletins: { en: 'Important bulletins', fr: 'Bulletins importants' },
  parksSearch: { en: 'Find a national park', fr: 'Cherchez un parc national' },
  // Short, so the widget footer fits on one line; the full name is in fireMap and the Sources list domain.
  fireDanger: { en: 'Fire danger (CWFIS)', fr: 'Risque d’incendie (SCIFV)' },
  fireMap: { en: 'Canadian Wildland Fire Information System: interactive map', fr: 'Système canadien d’information sur les feux de végétation : carte interactive' },
  youth: { en: 'Free admission for youth 17 and under', fr: 'Entrée gratuite pour les jeunes de 17 ans et moins' },
};

/**
 * A source with the short title a phone's footer line has room for. The card's footer shows the first source
 * as "host › title" on one line, and at 390px that line holds about 13 characters after "parks.canada.ca › "
 * (7 after the fire system's longer host). The Sources list and the citations keep the full `title`.
 */
export type ParkSource = ToolSource & { short?: string };

/** Short footer titles for the pages a card can cite first (see ParkSource). */
export const SOURCE_SHORT: Partial<Record<keyof typeof SOURCE_TITLES, { en: string; fr: string }>> = {
  admission: { en: 'Admission', fr: 'Tarifs' },
  reserve: { en: 'Reservations', fr: 'Réservations' },
  bulletins: { en: 'Bulletins', fr: 'Bulletins' },
  parksSearch: { en: 'Find a park', fr: 'Recherche' },
  fireDanger: { en: 'Danger', fr: 'Danger' },
};
/** The longest park name the phone footer has room for; a longer one is cited as "Park page". */
const FOOTER_SHORT_MAX = 13;
const PARK_PAGE = { en: 'Park page', fr: 'Page du parc' } as const;
const homeShort = (p: Park, lang: Lang) => (p.short[lang].length <= FOOTER_SHORT_MAX ? p.short[lang] : PARK_PAGE[lang]);

/** The longest park name a card's footer line has room for (the French line carries a longer "checked" note). */
const FOOTER_NAME_MAX = { en: 33, fr: 26 } as const;
/** The title a park's own page is cited under: its name, or its short name where the full one would wrap the footer ("Gros-Morne"). */
export const homeTitle = (p: Park, lang: Lang) => (p.name[lang].length <= FOOTER_NAME_MAX[lang] ? p.name[lang] : p.short[lang]);
/** The title a park's fees page is cited under, in the cards and in the answers ("Fees · Banff National Park"). */
export const feesTitle = (p: Park, lang: Lang) => `${SOURCE_TITLES.fees[lang]} · ${p.name[lang]}`;

/** A park's own page as a source, under its name (and its short name for the phone footer). */
export const parkHomeSource = (p: Park, lang: Lang, checked: string): ParkSource => ({ title: homeTitle(p, lang), short: homeShort(p, lang), url: parkUrls(p, lang).home, checked });

/**
 * A park's own pages as sources (its page, then its fees page with that page's "Date modified"), for a card
 * that shows a park other than the one its tool output was built for. `checked`: the day the data was verified.
 */
export function parkPageSources(p: Park, lang: Lang, checked: string): ParkSource[] {
  const { fees } = parkUrls(p, lang);
  return [parkHomeSource(p, lang, checked), ...(fees ? [{ title: feesTitle(p, lang), url: fees, checked, ...(p.feesUpdated ? { updated: p.feesUpdated } : {}) }] : [])];
}
