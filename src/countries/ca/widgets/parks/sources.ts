/**
 * Source entries (title, URL, "Date modified", quote) for the parks tool outputs. Built on the server and
 * carried in each output's `sources`; the renderers never import this file.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { type Lang, type Park } from './data';
import { SOURCE_SHORT, SOURCE_TITLES as T, URLS, feesTitle, parkHomeSource, parkUrls, type ParkSource } from './urls';

/** The day every fact in data.ts was last checked against its official page. */
export const CHECKED = '2026-09-30';

const src = (title: string, url: string, updated?: string, extra: Partial<ParkSource> = {}): ParkSource => ({
  title,
  url,
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...extra,
});

export const sources = {
  admission: (lang: Lang) =>
    src(T.admission[lang], URLS.admission[lang], '2026-09-16', {
      short: SOURCE_SHORT.admission?.[lang],
      quote:
        lang === 'fr'
          ? 'Une carte d’entrée Découverte de Parcs Canada donne accès à plus de 80 destinations pendant 12 mois.'
          : 'An annual Parks Canada Discovery Pass covers admission to more than 80 destinations for 12 months.',
    }),
  youth: (lang: Lang) => src(T.youth[lang], URLS.youth[lang], '2026-09-21'),
  /** The park's own fees page; an empty list for the three parks that have none (never cite a missing page). */
  parkFees: (p: Park, lang: Lang): ToolSource[] => {
    const url = parkUrls(p, lang).fees;
    return url ? [src(feesTitle(p, lang), url, p.feesUpdated)] : [];
  },
  parkHome: (p: Park, lang: Lang) => parkHomeSource(p, lang, CHECKED),
  reserve: (lang: Lang) => src(T.reserve[lang], URLS.reserve[lang], '2026-08-06', { short: SOURCE_SHORT.reserve?.[lang] }),
  howToReserve: (lang: Lang) =>
    src(T.howToReserve[lang], URLS.howToReserve[lang], '2026-08-06', {
      quote:
        lang === 'fr'
          ? 'Lors de la journée de lancement, la saison entière sera ouverte aux réservations pour ce lieu.'
          : 'On a location’s launch day, the entire season will open for reservations for that location.',
    }),
  wildlife: (lang: Lang) => src(T.wildlife[lang], URLS.wildlife[lang], '2025-05-08'),
  rules: (lang: Lang) => src(T.rules[lang], URLS.rules[lang], '2025-10-31'),
  emergency: (lang: Lang) => src(T.emergency[lang], URLS.emergency[lang], '2026-09-24'),
  bulletins: (lang: Lang, url?: string, live = true) => src(T.bulletins[lang], url ?? URLS.bulletins[lang], undefined, { live, short: SOURCE_SHORT.bulletins?.[lang] }),
  parksSearch: (lang: Lang) => src(T.parksSearch[lang], URLS.parksSearch[lang], undefined, { short: SOURCE_SHORT.parksSearch?.[lang] }),
  fireDanger: (lang: Lang, live = true) => src(T.fireDanger[lang], URLS.fireDanger[lang], undefined, { live, short: SOURCE_SHORT.fireDanger?.[lang] }),
  fireMap: (lang: Lang, live = true) => src(T.fireMap[lang], URLS.fireMap[lang], undefined, { live }),
};
