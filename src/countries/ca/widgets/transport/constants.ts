/**
 * The few verified facts the renderers need on the device (kept apart from data.ts so its URL catalogue, source lists
 * and manufacturer table stay on the server). Sources and "Date modified" for every value: the header of data.ts.
 */
export type Lang = 'en' | 'fr';

/** Electric Vehicle Affordability Program: dates, price cap, lease proration and the yearly incentive levels. */
export const EVAP = {
  start: '2026-02-16',
  end: '2031-03-31',
  cap: 50_000,
  minLease: 12,
  fullLease: 48,
  totalFunding: 2_275_000_000,
  /** Fallback when the live page can't be read. */
  remaining: { amount: 2_000_000_000, asOf: '2026-09-01' },
  levels: [
    { year: 2026, zev: 5000, phev: 2500 },
    { year: 2027, zev: 4000, phev: 2000 },
    { year: 2028, zev: 3000, phev: 1500 },
    { year: 2029, zev: 3000, phev: 1500 },
    { year: 2030, zev: 2000, phev: 1000 },
    { year: 2031, zev: 2000, phev: 1000 },
  ],
};

const TC = { en: 'https://tc.canada.ca/en', fr: 'https://tc.canada.ca/fr' };

/** The official page each tool falls back to when it has no output to read links from (the error state). */
export const OFFICIAL = {
  recallsDb: {
    en: 'https://wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/menu.aspx?lang=eng',
    fr: 'https://wwwapps.tc.gc.ca/Saf-Sec-Sur/7/VRDB-BDRV/search-recherche/menu.aspx?lang=fra',
  },
  droneCategories: {
    en: `${TC.en}/aviation/drone-safety/learn-rules-you-fly-your-drone/drone-operation-categories-pilot-certificates`,
    fr: `${TC.fr}/aviation/securite-drones/apprenez-regles-avant-piloter-votre-drone/categories-operations-drone-certificats-pilote`,
  },
  pcoc: {
    en: `${TC.en}/marine-transportation/preparing-operate-your-vessel/pleasure-craft-operator-card-pcoc`,
    fr: `${TC.fr}/transport-maritime/se-preparer-utiliser-son-embarcation/carte-conducteur-embarcation-plaisance-ccep`,
  },
  cannabisBorder: {
    en: 'https://www.cbsa-asfc.gc.ca/travel-voyage/cannabis-eng.html',
    fr: 'https://www.cbsa-asfc.gc.ca/travel-voyage/cannabis-fra.html',
  },
  pets: {
    en: 'https://inspection.canada.ca/en/travelling-pets-food-plants/travelling-pets',
    fr: 'https://inspection.canada.ca/fr/voyage-animaux-aliments-ou-vegetaux/voyager-animaux-compagnie',
  },
  ev: {
    en: `${TC.en}/road-transportation/innovative-technologies/electric-vehicles/electric-vehicle-affordability-program`,
    fr: `${TC.fr}/transport-routier/technologies-novatrices/vehicules-electriques/programme-abordabilite-vehicules-electriques`,
  },
} as const;
