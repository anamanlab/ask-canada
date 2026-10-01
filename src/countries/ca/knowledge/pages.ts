/**
 * The closest official starting page for each department the knowledge router can pick (EN + FR).
 * Used when no scripted answer fits: instead of a generic "Services" link, the person gets the
 * canada.ca theme page (or department site) their question belongs to. Verified 2026-09-29.
 */
export type DeptPage = { name: { en: string; fr: string }; url: { en: string; fr: string } };

const C = 'https://www.canada.ca';

export const DEPT_PAGES: Record<string, DeptPage> = {
  ircc: {
    name: { en: 'Immigration and citizenship', fr: 'Immigration et citoyenneté' },
    url: { en: `${C}/en/services/immigration-citizenship.html`, fr: `${C}/fr/services/immigration-citoyennete.html` },
  },
  'cra-arc': {
    name: { en: 'Taxes', fr: 'Impôts' },
    url: { en: `${C}/en/services/taxes.html`, fr: `${C}/fr/services/impots.html` },
  },
  'edsc-esdc': {
    name: { en: 'Benefits', fr: 'Prestations' },
    url: { en: `${C}/en/services/benefits.html`, fr: `${C}/fr/services/prestations.html` },
  },
  'hc-sc': {
    name: { en: 'Health', fr: 'Santé' },
    url: { en: `${C}/en/services/health.html`, fr: `${C}/fr/services/sante.html` },
  },
  'cbsa-asfc': {
    name: { en: 'Canada Border Services Agency', fr: 'Agence des services frontaliers du Canada' },
    url: { en: `${C}/en/border-services-agency.html`, fr: `${C}/fr/agence-services-frontaliers.html` },
  },
  eccc: {
    name: { en: 'Weather, climate and hazards', fr: 'Météo, climat et catastrophes' },
    url: { en: `${C}/en/services/environment/weather.html`, fr: `${C}/fr/services/environnement/meteo.html` },
  },
  tc: {
    name: { en: 'Transport and infrastructure', fr: 'Transport et infrastructure' },
    url: { en: `${C}/en/services/transport.html`, fr: `${C}/fr/services/transport.html` },
  },
  'vac-acc': {
    name: { en: 'Veterans Affairs Canada', fr: 'Anciens Combattants Canada' },
    url: { en: 'https://www.veterans.gc.ca/en', fr: 'https://www.veterans.gc.ca/fr' },
  },
  'dnd-mdn': {
    name: { en: 'National security and defence', fr: 'Sécurité nationale et défense' },
    url: { en: `${C}/en/services/defence.html`, fr: `${C}/fr/services/defense.html` },
  },
  'ceo-bec': {
    name: { en: 'Elections Canada', fr: 'Élections Canada' },
    url: { en: 'https://www.elections.ca/home.aspx', fr: 'https://www.elections.ca/accueil.aspx' },
  },
  'ised-isde': {
    name: { en: 'Business and industry', fr: 'Entreprises et industrie' },
    url: { en: `${C}/en/services/business.html`, fr: `${C}/fr/services/entreprises.html` },
  },
  'sac-isc': {
    name: { en: 'Indigenous Peoples', fr: 'Autochtones' },
    url: { en: `${C}/en/services/indigenous-peoples.html`, fr: `${C}/fr/services/autochtones.html` },
  },
  statcan: {
    name: { en: 'Statistics Canada', fr: 'Statistique Canada' },
    url: { en: 'https://www.statcan.gc.ca/en/start', fr: 'https://www.statcan.gc.ca/fr/debut' },
  },
  'bac-lac': {
    name: { en: 'Library and Archives Canada', fr: 'Bibliothèque et Archives Canada' },
    url: { en: `${C}/en/library-archives.html`, fr: `${C}/fr/bibliotheque-archives.html` },
  },
  fin: {
    name: { en: 'Department of Finance Canada', fr: 'Ministère des Finances Canada' },
    url: { en: `${C}/en/department-finance.html`, fr: `${C}/fr/ministere-finances.html` },
  },
  jus: {
    name: { en: 'Policing, justice and emergencies', fr: 'Services de police, justice et urgences' },
    url: { en: `${C}/en/services/policing.html`, fr: `${C}/fr/services/police.html` },
  },
  'nrcan-rncan': {
    name: { en: 'Natural Resources Canada', fr: 'Ressources naturelles Canada' },
    url: { en: 'https://natural-resources.canada.ca/', fr: 'https://ressources-naturelles.canada.ca/' },
  },
};

export const ALL_SERVICES: DeptPage = {
  name: { en: 'Government of Canada services', fr: 'Services du gouvernement du Canada' },
  url: { en: `${C}/en/services.html`, fr: `${C}/fr/services.html` },
};
