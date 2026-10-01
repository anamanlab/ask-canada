/**
 * Server-side tables for the travel tools: feed URLs, the source list (EN + FR) and the dated notice
 * fallback. Facts and their verification dates are documented in data.ts. Imported by build.ts, live.ts,
 * fixtures.ts and the scenarios only; the renderers get their sources from the tool output (`sourcesIn`).
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, URLS } from './data';
import type { Lang } from './types';

export const FEEDS = {
  index: 'https://data.international.gc.ca/travel-voyage/index-alpha-eng.json',
  country: (iso: string) => `https://data.international.gc.ca/travel-voyage/cta-cap-${encodeURIComponent(iso)}.json`,
  waits: { en: 'https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-eng.csv', fr: 'https://www.cbsa-asfc.gc.ca/bwt-taf/bwt-fra.csv' },
  /** The wait-times page itself, read for its notices. */
  waitsPage: { en: 'https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html', fr: 'https://www.cbsa-asfc.gc.ca/bwt-taf/menu-fra.html' },
} as const;

/**
 * Used only when the wait-times page can't be read. Copied from that page on 2026-09-30 (see the comment at
 * the top). "Winter 2027" ends on 2027-03-20, so it stops showing on its own after that date.
 */
const WAIT_NOTICE_FALLBACK: { crossing: string; until: string; title: Record<Lang, string>; body: Record<Lang, string> }[] = [
  {
    crossing: 'st-bernard-de-lacolle',
    until: '2027-03-20',
    title: {
      en: 'Saint-Bernard-de-Lacolle under redevelopment: Expect border delays until Winter 2027',
      fr: 'Réaménagement en cours à Saint-Bernard-de-Lacolle : attendez-vous à des délais à la frontière jusqu’à l’hiver 2027',
    },
    body: {
      en: 'Work to redevelop this border crossing’s primary inspection line is underway and expected to end in Winter 2027. As a result, wait times may be higher than normal. We strongly encourage you to monitor traffic and adjust your route accordingly.',
      fr: 'Des travaux de réaménagement de la ligne d’inspection primaire de ce poste frontalier sont prévus jusqu’à l’hiver 2027. Ainsi, les temps d’attente pourraient être plus longs que d’habitude. Nous vous encourageons fortement à surveiller l’état de la circulation et à adapter votre itinéraire en conséquence.',
    },
  },
];

/**
 * The fallback notices still in effect on `today` (YYYY-MM-DD), in the tool's shape: the answer's language,
 * plus both official languages (`text`) so the card follows the UI.
 */
export const fallbackWaitNotices = (lang: Lang, today: string) =>
  WAIT_NOTICE_FALLBACK.filter((n) => n.until >= today).map((n, i) => ({
    id: `cbsa-${i}`,
    crossing: n.crossing,
    title: n.title[lang],
    body: n.body[lang],
    text: { en: { title: n.title.en, body: n.body.en }, fr: { title: n.title.fr, body: n.body.fr } },
  }));

/** Popular destinations offered when a name isn't recognised. */
export const POPULAR = ['US', 'MX', 'FR', 'GB', 'DO', 'CU', 'JP', 'PT'] as const;

type L = Lang;
const src = (title: Record<L, string>, url: Record<L, string>, lang: L, updated?: string, extra: Partial<ToolSource> = {}): ToolSource => ({
  title: title[lang],
  url: url[lang],
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...extra,
});

export const SOURCES = {
  explained: (lang: L) =>
    src(
      { en: 'Travel Advice and Advisories: Explained', fr: 'Conseils aux voyageurs et avertissements : explications' },
      URLS.explained,
      lang,
      '2026-08-11',
    ),
  advisories: (lang: L) =>
    src({ en: 'Travel advice and advisories by destination', fr: 'Conseils aux voyageurs et avertissements par destination' }, URLS.advisories, lang, '2026-08-28'),
  roca: (lang: L) =>
    src({ en: 'Registration of Canadians Abroad', fr: 'Inscription des Canadiens à l’étranger' }, URLS.roca, lang, '2026-07-08', {
      quote:
        lang === 'fr'
          ? 'L’Inscription des Canadiens à l’étranger est un service gratuit qui permet au gouvernement du Canada de vous aviser en cas d’urgence à votre destination ou à la maison.'
          : 'Registration of Canadians Abroad is a free service that allows the Government of Canada to notify you in case of an emergency at your destination or a personal emergency at home.',
    }),
  emergency: (lang: L) =>
    src({ en: 'Request emergency assistance outside Canada', fr: 'Demander une assistance d’urgence à l’extérieur du Canada' }, URLS.emergency, lang, '2026-09-03', {
      quote:
        lang === 'fr'
          ? 'Les citoyens canadiens peuvent contacter le Centre de surveillance et d’intervention d’urgence pour obtenir une assistance consulaire 24 heures sur 24, 7 jours sur 7.'
          : 'Canadian citizens can contact the Emergency Watch and Response Centre for 24/7 consular assistance.',
    }),
  declare: (lang: L) =>
    src(
      { en: 'I Declare: A guide for residents returning to Canada', fr: 'Je déclare : Un guide pour les résidents du Canada qui reviennent au pays' },
      URLS.declare,
      lang,
      '2025-11-25',
      {
        quote:
          lang === 'fr'
            ? 'La durée de votre absence du Canada détermine votre admissibilité à une exemption personnelle et la quantité de biens que vous pouvez ramener au pays sans avoir à payer de droits et de taxes.'
            : 'The length of your absence from Canada determines your eligibility for an exemption and the amount of goods you can bring back, without paying any duty and taxes.',
      },
    ),
  bis: (lang: L) => src({ en: 'Contact border information services', fr: 'Communiquer avec le service d’information sur la frontière' }, URLS.bis, lang, '2026-03-13'),
  /** The surtax notice's dated fact ("effective as of 12:01 a.m., September 8, 2026") comes from this Finance Canada page. */
  surtaxes: (lang: L) =>
    src(
      { en: 'Complete list of U.S. products subject to counter tariffs', fr: 'Liste complète des produits américains assujettis à des contre-mesures tarifaires' },
      URLS.surtaxes,
      lang,
    ),
  arrivecan: (lang: L) =>
    src(
      { en: 'Use Advance Declaration to save time at the border', fr: 'Utiliser la Déclaration faite à l’avance pour gagner du temps à la frontière' },
      URLS.arrivecan,
      lang,
      '2024-09-07',
    ),
  waits: (lang: L, live: boolean) =>
    src(
      {
        // Short enough for the footer at any width; "30 busiest land crossings" is in the widget's footnote.
        en: 'Border wait times: United States to Canada',
        fr: 'Temps d’attente à la frontière canado-américaine',
      },
      URLS.waits,
      lang,
      undefined,
      live ? { live: true } : {},
    ),
  destination: (lang: L, name: string, url: string, updated?: string, live = true): ToolSource => ({
    title: lang === 'fr' ? `Conseils aux voyageurs : ${name}` : `Travel advice and advisories: ${name}`,
    url,
    checked: CHECKED,
    ...(updated ? { updated } : {}),
    ...(live ? { live: true } : {}),
  }),
};

/** The same source list in both official languages, so a card's footer can follow the UI's language. */
export const inBoth = (list: (lang: Lang) => ToolSource[]): Record<Lang, ToolSource[]> => ({ en: list('en'), fr: list('fr') });
