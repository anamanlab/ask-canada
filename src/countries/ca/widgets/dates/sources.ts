/**
 * Key dates: each province's and territory's own holiday pages (isomorphic). The pages, what was read on them and the
 * dates they were checked are recorded in the header of ./data.ts (checked 2026-09-30).
 */
import type { Lang, Province } from './data';

/** Each province's official holiday page, in French where the province publishes one (see the header). */
type Page = { url: string; title: string };
const same = (url: string, en: string, fr: string): Record<Lang, Page> => ({ en: { url, title: en }, fr: { url, title: fr } });
export const PROVINCE_SOURCES: Record<Province, Record<Lang, Page>> = {
  AB: same('https://www.alberta.ca/alberta-general-holidays.aspx', 'General holidays in Alberta', 'Jours fériés en Alberta (en anglais)'),
  BC: same(
    'https://www2.gov.bc.ca/gov/content/employment-business/employment-standards-advice/employment-standards/statutory-holidays',
    'Statutory holidays in British Columbia',
    'Jours fériés en Colombie-Britannique (en anglais)',
  ),
  MB: {
    en: { url: 'https://www.gov.mb.ca/labour/standards/doc,gen-holidays-after-april-30-07,factsheet.html', title: 'General holidays in Manitoba' },
    fr: { url: 'https://www.gov.mb.ca/labour/standards/doc,gen-holidays-after-april-30-07,factsheet.fr.html', title: 'Jours fériés au Manitoba' },
  },
  NB: {
    en: { url: 'https://www2.gnb.ca/content/gnb/en/departments/elg/local_government/content/governance/content/days_of_rest_act/faq.html', title: 'Prescribed days of rest (New Brunswick)' },
    fr: {
      url: 'https://www2.gnb.ca/content/gnb/fr/ministeres/egl/gouvernements_locaux/content/gouvernance/content/loi_su_les_jours_de_repos/faq.html',
      title: 'Jours prescrits de repos (Nouveau-Brunswick)',
    },
  },
  NL: {
    en: { url: 'https://www.gov.nl.ca/gs/files/Your-Rights-At-Work.pdf', title: 'Your Rights at Work: paid public holidays (Newfoundland and Labrador, PDF)' },
    fr: { url: 'https://www.gov.nl.ca/gs/files/Labour-Relations-At-Work-FR.pdf', title: 'Normes d’emploi à Terre-Neuve-et-Labrador : jours fériés payés (PDF)' },
  },
  NS: {
    en: { url: 'https://novascotia.ca/lae/employmentrights/holidaychart.asp', title: 'Paid holidays in Nova Scotia' },
    fr: { url: 'https://novascotia.ca/lae/employmentrights/holidaychart-fr.asp', title: 'Jours fériés payés en Nouvelle-Écosse' },
  },
  NT: {
    en: { url: 'https://www.ece.gov.nt.ca/en/services/employment-standards/frequently-asked-questions', title: 'Employment standards, Northwest Territories' },
    fr: { url: 'https://www.ece.gov.nt.ca/fr/services/employment-standards/foires-aux-questions', title: 'Normes d’emploi, Territoires du Nord-Ouest' },
  },
  NU: same('https://nu-lsco.ca/faq-s?tmpl=component&faqid=11', 'Nunavut general holidays', 'Jours fériés au Nunavut (en anglais)'),
  ON: {
    en: { url: 'https://www.ontario.ca/document/your-guide-employment-standards-act-0/public-holidays', title: 'Public holidays (Ontario)' },
    fr: { url: 'https://www.ontario.ca/fr/document/votre-guide-de-la-loi-sur-les-normes-demploi-0/jours-feries', title: 'Jours fériés (Ontario)' },
  },
  PE: same(
    'https://www.princeedwardisland.ca/en/information/economic-growth-tourism-and-culture/paid-holidays',
    'Paid holidays (Prince Edward Island)',
    'Jours fériés payés (Île-du-Prince-Édouard, en anglais)',
  ),
  QC: {
    en: { url: 'https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays', title: 'Statutory holidays in Quebec (CNESST)' },
    fr: { url: 'https://www.cnesst.gouv.qc.ca/fr/conditions-travail/conges/jours-feries/liste-jours-feries', title: 'Jours fériés au Québec (CNESST)' },
  },
  SK: same(
    'https://www.saskatchewan.ca/business/employment-standards/public-statutory-holidays/list-of-saskatchewan-public-holidays',
    'Saskatchewan public holidays',
    'Jours fériés en Saskatchewan (en anglais)',
  ),
  YT: same('https://yukon.ca/en/doing-business/employer-responsibilities/find-yukon-statutory-holiday', 'Yukon statutory holiday dates', 'Jours fériés au Yukon (en anglais)'),
};

/**
 * Where a provincial government publishes its own employees' holiday schedule, by year (see the header). A year
 * without a schedule shows those days by name only: their dates aren't official yet.
 */
export const GOVERNMENT_SCHEDULES: Partial<Record<Province, Partial<Record<number, string>>>> = {
  NL: { 2026: 'https://www.gov.nl.ca/exec/tbs/2026-paid-holidays-2/' },
};
