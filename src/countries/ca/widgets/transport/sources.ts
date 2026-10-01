/** The numbered sources each transport tool returns (title, URL, the page's "Date modified"). Facts: data.ts. */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, URLS, type Lang } from './data';

const src = (title: { en: string; fr: string }, url: { en: string; fr: string }, lang: Lang, updated?: string, extra: Partial<ToolSource> = {}): ToolSource => ({
  title: title[lang],
  url: url[lang],
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...extra,
});

export function recallSources(lang: Lang, live: boolean): ToolSource[] {
  return [
    src(
      { en: 'Motor Vehicle Safety Recalls Database', fr: 'Base de données sur les rappels de sécurité des véhicules automobiles' },
      URLS.recallsDb,
      lang,
      undefined,
      { live },
    ),
    src({ en: 'Defects and recalls of vehicles, tires and child car seats', fr: 'Défauts et rappels de véhicules, de pneus et de sièges d’auto pour enfants' }, URLS.recalls, lang, '2025-01-22'),
    src({ en: 'The importance of having recalled vehicles repaired', fr: 'L’importance de faire réparer les véhicules qui font l’objet d’un rappel' }, URLS.recallRepair, lang, '2019-03-08', {
      quote: lang === 'fr' ? undefined : 'The manufacturer will almost always make these repairs free of charge.',
    }),
    src({ en: 'Find a vehicle, tire or child car seat manufacturer', fr: 'Trouver un fabricant de véhicules, de pneus ou de sièges d’auto pour enfants' }, URLS.manufacturers, lang, '2019-04-16'),
  ];
}

export function droneSources(lang: Lang, live: boolean, youth = false): ToolSource[] {
  return [
    ...(youth
      ? [src({ en: 'Canadian Aviation Regulations, s. 901.54: pilot requirements and direct supervision', fr: 'Règlement de l’aviation canadien, art. 901.54 : exigences relatives au pilote et supervision directe' }, URLS.carPilot.basic, lang, '2025-11-04')]
      : []),
    src({ en: 'Drone operation categories and pilot certificates', fr: 'Catégories d’opérations de drones et certificats de pilote' }, URLS.droneCategories, lang, '2025-11-04'),
    // The exam page shows Transport Canada's fees from the same service-fee API the widget reads: when the fees are live,
    // this source says so (one source per URL, so a numbered citation to the exam page keeps the exam page's title).
    src({ en: 'Take a drone pilot online exam', fr: 'Passez un examen en ligne de pilote de drone' }, URLS.droneExam, lang, '2025-11-04', live ? { live: true } : {}),
    src({ en: 'Registering your drone', fr: 'Immatriculer votre drone' }, URLS.droneRegister, lang, '2026-03-19'),
    src({ en: 'Advanced operations', fr: 'Opérations avancées' }, URLS.droneAdvanced, lang, '2026-03-19'),
    src({ en: 'Level 1 Complex operations', fr: 'Opérations complexes de niveau 1' }, URLS.droneComplex, lang, '2026-03-19'),
    src({ en: 'Keep your drone pilot skills up to date', fr: 'Maintenez vos compétences de pilote de drone' }, URLS.droneRecency, lang, '2026-05-28'),
  ];
}

export function boatingSources(lang: Lang, lost = false): ToolSource[] {
  const lookup = src({ en: 'Course Provider Lookup', fr: 'Outil de recherche de fournisseurs de cours' }, URLS.pcocLookup, lang);
  const faq = src({ en: 'Operator Card (PCOC) – FAQ', fr: 'Carte de conducteur (CCEP) – FAQ' }, URLS.pcocFaq, lang, '2026-05-12');
  // Replacing a lost card: the FAQ (who replaces it) and the lookup (to find them) come first.
  if (lost) return [faq, lookup, ...boatingSources(lang).filter((x) => x.url !== faq.url)];
  return [
    src({ en: 'Pleasure Craft Operator Card (PCOC)', fr: 'Carte de conducteur d’embarcation de plaisance (CCEP)' }, URLS.pcoc, lang, '2024-05-30', {
      quote:
        lang === 'fr'
          ? undefined
          : 'Proof of competency is required with all motor types (including electric trolling motors) and even when the motor is not in use (such as when sailing).',
    }),
    src({ en: 'Operator Card (PCOC) – FAQ', fr: 'Carte de conducteur (CCEP) – FAQ' }, URLS.pcocFaq, lang, '2026-05-12'),
    src({ en: 'Find education resources for recreational boaters', fr: 'Trouver des ressources de formation pour les plaisanciers' }, URLS.pcocProviders, lang, '2025-07-23'),
  ];
}

export function cannabisSources(lang: Lang, trip?: string): ToolSource[] {
  const border = src({ en: 'Cannabis at the border', fr: 'Le cannabis à la frontière' }, URLS.cannabisBorder, lang, '2021-03-26', {
    quote: lang === 'fr' ? undefined : 'Don’t bring it in. Don’t take it out.',
  });
  const travel = src({ en: 'Drugs, alcohol and travel outside Canada', fr: 'Drogues, alcool et voyages à l’étranger' }, URLS.cannabisTravel, lang, '2026-08-13');
  const flights = src({ en: 'Cannabis (marijuana): what can I bring?', fr: 'Cannabis (marijuana) : que puis-je emporter?' }, URLS.cannabisFlights, lang, '2022-12-22');
  const limit = src({ en: 'Limits for public possession of cannabis', fr: 'Limites de possession de cannabis en public' }, URLS.cannabisLimit, lang, '2025-05-28', {
    quote: lang === 'fr' ? undefined : 'an adult may possess up to 30 grams of dried cannabis, or its equivalent, in public',
  });
  const provinces = src({ en: 'Authorized cannabis retailers in the provinces and territories', fr: 'Magasins de cannabis autorisés dans les provinces et territoires' }, URLS.cannabisProvinces, lang, '2022-10-26');
  const penalties = src({ en: 'Penalties for cannabis-related offences', fr: 'Sanctions pour les infractions liées au cannabis' }, URLS.cannabisPenalties, lang, '2025-08-27');
  // Lead with the page that answers the trip: Health Canada's limit on the road, CATSA on a plane, CBSA at the border.
  if (trip === 'domestic-road') return [limit, border, provinces, flights, penalties];
  if (trip === 'domestic-flight') return [flights, limit, border, travel, penalties];
  return [border, travel, flights, limit, penalties];
}

export function petSources(lang: Lang, trip?: string): ToolSource[] {
  const all = [
    src({ en: 'Travelling with a pet', fr: 'Voyager avec un animal de compagnie' }, URLS.pets, lang, '2026-08-14'),
    src({ en: 'Bringing animals to Canada: importing and travelling with pets', fr: 'Amener des animaux au Canada : importation et voyages avec des animaux de compagnie' }, URLS.petsImport, lang, '2024-07-22'),
    src({ en: 'Dogs travelling to the United States', fr: 'Chiens voyageant aux États-Unis' }, URLS.petsUs, lang, '2024-08-01'),
    src({ en: 'Travelling with animals', fr: 'Voyager avec des animaux' }, URLS.petsTravel, lang, '2024-11-27'),
  ];
  return trip === 'domestic-flight' || trip === 'domestic-road' ? [all[3], all[0], all[1], all[2]] : all;
}

export function evSources(lang: Lang, live: boolean): ToolSource[] {
  return [
    src({ en: 'Electric Vehicle Affordability Program (EVAP)', fr: 'Programme pour l’abordabilité des véhicules électriques (PAVE)' }, URLS.ev, lang, '2026-09-04', { live }),
    src({ en: 'EVAP: overview', fr: 'PAVE : aperçu' }, URLS.evOverview, lang, '2026-09-10', {
      quote:
        lang === 'fr'
          ? undefined
          : 'battery electric vehicles and hydrogen fuel cell vehicles are eligible for up to $5,000',
    }),
    src({ en: 'EVAP: vehicle list', fr: 'PAVE : liste des véhicules' }, URLS.evList, lang, '2026-03-10', { live }),
    src({ en: 'EVAP: questions and answers', fr: 'PAVE : questions et réponses' }, URLS.evQa, lang, '2026-02-12'),
  ];
}
