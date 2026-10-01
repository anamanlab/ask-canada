/**
 * Health & safety facts, verified on the official pages on 2026-09-30 (URL + "Date modified" beside each); the
 * travel health pages were verified again on 2026-10-01.
 * Used by the tools, the fixtures and the scripted scenarios. The renderers don't import this file: they get
 * links and sources from the tool output, and the few constants they compute with from ./facts.ts.
 *
 * Canadian Dental Care Plan (CDCP) — Employment and Social Development Canada / Service Canada
 * - Eligibility, all 4 requirements: (1) no access to private dental insurance or coverage (including a
 *   health spending account; access counts even if never used, not enrolled, premium-paid; exception:
 *   retired and opted out of pension dental coverage before December 11, 2023 and can't opt back in);
 *   (2) you and your spouse/common-law partner filed your tax returns in Canada; (3) adjusted family net
 *   income less than $90,000; (4) Canadian resident for tax purposes (you and your partner).
 *   Adjusted family net income = line 23600 (you and your spouse/partner) minus UCCB and RDSP income
 *   (lines 11700 and 12500) plus UCCB and RDSP amounts repaid (lines 21300 and 23200).
 *   Government social program dental coverage does not disqualify you (plans coordinate).
 *   Check box 45 (T4) / box 015 (T4A): 1 = no access; 2, 3, 4 or 5 = access offered.
 *   .../dental-care-plan/qualify.html (2026-09-22) · FR .../regime-soins-dentaires/admissibilite.html (2026-09-22)
 * - Co-payment by adjusted family net income: under $70,000 → 0 % (plan covers 100 % of CDCP fees);
 *   $70,000–$79,999 → 40 %; $80,000–$89,999 → 60 %. Providers may charge more than CDCP fees.
 *   Orthodontic services are currently not available. .../coverage.html (2026-08-27) · FR couverture.html (2026-08-27)
 * - Apply: applications open for the 2026-2027 benefit period; online via My Service Canada Account or
 *   canada.ca (srv024.service.canada.ca/en/application), or by phone 1-833-537-4342 (TTY 1-833-677-6262).
 *   Each spouse/partner applies separately. .../apply.html (2026-09-24) · FR demande.html (2026-09-24)
 * - Renewal for 2026-2027 closed June 1, 2026; benefit period ends each June 30; renewals for 2027-2028
 *   open in spring 2027. .../renew.html (2026-09-22)
 * - Contact: 1-833-537-4342, 8:30 am to 4:30 pm local time, Monday to Friday. .../contact.html (2026-04-10)
 * - No fee to apply or renew; beware of scams. dental-care-plan.html (2026-09-22)
 * - Applicants list themselves and any dependants; a spouse/common-law partner submits their own application.
 *   apply.html (2026-09-24)
 * - Providers: "Participation in the CDCP is voluntary"; providers bill Sun Life directly and CDCP clients
 *   "should not be asked to pay the full cost upfront". .../providers.html · FR fournisseurs.html (2026-06-02).
 *   (The old visit-provider.html#find page now redirects to the CDCP home page, so it isn't linked.)
 * - First Nations and Inuit: NIHB dental benefits for eligible clients; show client identification so the
 *   provider can bill NIHB directly. sac-isc.gc.ca/eng/1574192221735/1574192306943 (2025-10-07). CDS guidance
 *   (SAC-ISC): clarify NIHB vs CDCP on dental questions.
 *
 * Recalls and safety alerts — Health Canada, CFIA and Transport Canada publish on recalls-rappels.canada.ca
 * (live search: /en/search/site, /fr/recherche/site; category facets cat:144 Food, cat:180 Health products,
 * cat:101 Consumer products, cat:443 Vehicles — verified 2026-09-30). Guidance (CDS AI Answers, HC-SC):
 * redirect specific recall questions to the self-service Recalls site. Report a concern:
 * canada.ca/en/services/health/report-health-safety-concern.html (food → CFIA "where to report a food
 * complaint", inspection.canada.ca, 2025-10-07; Quebec residents report to MAPAQ first). Email alerts:
 * /en/subscribe (2024-02-02): daily digest or immediately, by category and by food allergen (peanut, milk,
 * egg, sesame seeds, soy, mustard, tree nut, gluten…); vehicle recall subscriptions aren't offered. Vehicles, tires and child car seats:
 * tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats (VIN lookup, 1-800-333-0510).
 *
 * Drug Product Database (DPD) — Health Canada. Live API health-products.canada.ca/api/drug/ (drugproduct,
 * activeingredient, status, form, route, schedule; lang=en|fr). Product page: /dpd-bdpp/info?lang=eng&code=<drug_code>.
 * DIN: 8-digit number assigned before marketing, on the label of prescription and OTC drugs authorized for sale;
 * a drug sold without a DIN is not in compliance (fact sheet, 2024-12-02). Natural health products are in a separate database (LNHPD). Side effects: MedEffect reporting page
 * (2023-09-08). The Government of Canada does not provide medical advice.
 *
 * Travel health — Public Health Agency of Canada notices on travel.gc.ca/travelling/health-safety/travel-health-notices
 * (live table; each notice carries its own "Last updated" date). Levels: 1 Practise health precautions;
 * 2 Practise enhanced health precautions; 3 Avoid non-essential travel; 4 Avoid all travel.
 * "Visit a travel health clinic or talk to a health care provider about 6 weeks before your trip" —
 * travel.gc.ca/travelling/health-safety/vaccines.
 * Two dates on those pages, re-checked 2026-10-01 in EN and FR: the "Date modified" printed at the foot of the
 * page (<time property="dateModified">) is 2026-01-21 for the notices and 2026-08-28 for vaccines; the
 * <meta name="dcterms.modified"> in the head is 2026-09-22 on every page of the site (the template's date, not
 * the content's). A source's `updated` is the printed one, which is what a reader sees and can check; the tool
 * reads it from both pages on each call (dateModifiedOf in ./travel-parse.ts) and the constants below are only
 * the fallback when a page can't be fetched.
 * Destinations: the list in ./destinations.ts, from the open data behind travel.gc.ca/travelling/advisories.
 * Childhood vaccination schedules differ by province or territory; childhood vaccines are free —
 * canada.ca/en/public-health/services/vaccination-children/when-to-vaccinate.html (2026-05-13).
 */
import type { ToolSource } from '@/lib/widgets/types';

import { CDCP, OFFICIAL, type Lang } from './facts';

export { CDCP, type Lang };
export const CHECKED = '2026-09-30';

const CA = 'https://www.canada.ca';
const dental = { en: `${CA}/en/services/benefits/dental/dental-care-plan`, fr: `${CA}/fr/services/prestations/dentaire/regime-soins-dentaires` };

export const URLS = {
  dental: { en: `${dental.en}.html`, fr: `${dental.fr}.html` },
  dentalQualify: OFFICIAL.dentalQualify,
  dentalApply: { en: `${dental.en}/apply.html`, fr: `${dental.fr}/demande.html` },
  dentalCoverage: { en: `${dental.en}/coverage.html`, fr: `${dental.fr}/couverture.html` },
  dentalRenew: { en: `${dental.en}/renew.html`, fr: `${dental.fr}/renouveler.html` },
  dentalContact: { en: `${dental.en}/contact.html`, fr: `${dental.fr}/contactez.html` },
  dentalProviders: { en: `${dental.en}/providers.html`, fr: `${dental.fr}/fournisseurs.html` },
  nihbDental: { en: 'https://www.sac-isc.gc.ca/eng/1574192221735/1574192306943', fr: 'https://www.sac-isc.gc.ca/fra/1574192221735/1574192306943' },
  dentalStatus: { en: 'https://srv024.service.canada.ca/en/status', fr: 'https://srv024.service.canada.ca/fr/etat' },

  recalls: OFFICIAL.recalls,
  recallsSearch: { en: 'https://recalls-rappels.canada.ca/en/search/site', fr: 'https://recalls-rappels.canada.ca/fr/recherche/site' },
  recallsSubscribe: { en: 'https://recalls-rappels.canada.ca/en/subscribe', fr: 'https://recalls-rappels.canada.ca/fr/abonnez-vous' },
  reportConcern: {
    en: `${CA}/en/services/health/report-health-safety-concern.html`,
    fr: `${CA}/fr/services/sante/signaler-probleme-lie-sante-ou-securite.html`,
  },
  foodComplaint: {
    en: 'https://inspection.canada.ca/en/food-safety-consumers/where-report-complaint',
    fr: 'https://inspection.canada.ca/fr/salubrite-alimentaire-consommateurs/ou-signaler-plainte',
  },
  vehicleRecalls: {
    en: 'https://tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats',
    fr: 'https://tc.canada.ca/fr/transport-routier/defauts-rappels-vehicules-pneus-sieges-auto-enfant',
  },
  carSeatAlerts: {
    en: 'https://tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats/safety-alerts-notices-child-car-seats',
    fr: 'https://tc.canada.ca/fr/transport-routier/defauts-rappels-vehicules-pneus-sieges-auto-enfant/avis-alertes-securite-concernant-sieges-auto-enfant',
  },

  dpd: OFFICIAL.dpd,
  dpdAbout: {
    en: `${CA}/en/health-canada/services/drugs-health-products/drug-products/drug-product-database.html`,
    fr: `${CA}/fr/sante-canada/services/medicaments-produits-sante/medicaments/base-donnees-produits-pharmaceutiques.html`,
  },
  din: {
    en: `${CA}/en/health-canada/services/drugs-health-products/drug-products/fact-sheets/drug-identification-number.html`,
    fr: `${CA}/fr/sante-canada/services/medicaments-produits-sante/medicaments/feuillets-information/numero-identification-medicament.html`,
  },
  lnhpd: { en: 'https://health-products.canada.ca/lnhpd-bdpsnh/index-eng.jsp', fr: 'https://health-products.canada.ca/lnhpd-bdpsnh/index-fra.jsp' },
  sideEffect: {
    en: `${CA}/en/health-canada/services/drugs-health-products/medeffect-canada/adverse-reaction-reporting.html`,
    fr: `${CA}/fr/sante-canada/services/medicaments-produits-sante/medeffet-canada/declaration-effets-indesirables.html`,
  },

  thn: OFFICIAL.thn,
  travelVaccines: { en: 'https://travel.gc.ca/travelling/health-safety/vaccines', fr: 'https://voyage.gc.ca/voyager/sante-securite/vaccins' },
  travelClinic: { en: 'https://travel.gc.ca/travelling/health-safety/clinic', fr: 'https://voyage.gc.ca/voyager/sante-securite/clinique' },
  advisories: { en: 'https://travel.gc.ca/travelling/advisories', fr: 'https://voyage.gc.ca/voyager/avertissements' },
  childVaccines: {
    en: `${CA}/en/public-health/services/vaccination-children/when-to-vaccinate.html`,
    fr: `${CA}/fr/sante-publique/services/vaccinations-pour-enfants/moment-faire-vacciner.html`,
  },
  vaccineSchedule: {
    en: 'https://www.healthycanadians.gc.ca/apps/vaccination-schedule/index-eng.php',
    fr: 'https://canadiensensante.gc.ca/apps/vaccination-schedule/index-fra.php',
  },
  vaccineRecords: {
    en: `${CA}/en/public-health/services/immunization-vaccines/vaccine-records-access-vaccination-history.html`,
    fr: `${CA}/fr/sante-publique/services/immunisation-vaccins/carnets-vaccination-accedez-vos-antecedents-vaccination-votre-enfant.html`,
  },
} as const;

type Pair = { en: string; fr: string };
const src = (title: Pair, url: Pair, lang: Lang, updated?: string, extra: Partial<ToolSource> = {}): ToolSource => ({
  title: title[lang],
  url: url[lang],
  checked: CHECKED,
  ...(updated ? { updated } : {}),
  ...extra,
});

export function dentalSources(lang: Lang): ToolSource[] {
  return [
    src(
      { en: 'Canadian Dental Care Plan: Do you qualify', fr: 'Régime canadien de soins dentaires : Êtes-vous admissible' },
      URLS.dentalQualify,
      lang,
      '2026-09-22',
      {
        quote:
          lang === 'fr'
            ? 'Pour être admissible au RCSD, votre revenu familial net rajusté doit être inférieur à 90 000 $.'
            : 'To be eligible for the CDCP, your adjusted family net income must be less than $90,000.',
      },
    ),
    src({ en: 'What services are covered in the Canadian Dental Care Plan', fr: 'Services couverts par le Régime canadien de soins dentaires' }, URLS.dentalCoverage, lang, '2026-08-27'),
    src({ en: 'Apply for the Canadian Dental Care Plan', fr: 'Présenter une demande au Régime canadien de soins dentaires' }, URLS.dentalApply, lang, '2026-09-24'),
    src({ en: 'Contact the Canadian Dental Care Plan', fr: 'Communiquer avec le Régime canadien de soins dentaires' }, URLS.dentalContact, lang, '2026-04-10'),
    src(
      { en: 'Canadian Dental Care Plan: Information for oral health providers', fr: 'Régime canadien de soins dentaires : Information pour les fournisseurs de soins buccodentaires' },
      URLS.dentalProviders,
      lang,
      '2026-06-02',
    ),
    src(
      { en: 'Non-Insured Health Benefits program for First Nations and Inuit: Dental benefits', fr: 'Programme des services de santé non assurés pour les Premières Nations et les Inuit : prestations dentaires' },
      URLS.nihbDental,
      lang,
      '2025-10-07',
    ),
  ];
}

export function recallSources(lang: Lang, live: boolean): ToolSource[] {
  return [
    src({ en: 'Recalls, advisories and safety alerts', fr: 'Rappels, avis et avis de sécurité' }, URLS.recalls, lang, undefined, { live }),
    src({ en: 'Report a health or safety concern', fr: 'Signaler un problème lié à la santé ou à la sécurité' }, URLS.reportConcern, lang),
    src({ en: 'Get email alerts about recalls', fr: 'Recevoir des alertes par courriel sur les rappels' }, URLS.recallsSubscribe, lang, '2024-02-02'),
  ];
}

export function drugSources(lang: Lang, live: boolean): ToolSource[] {
  return [
    src({ en: 'Drug Product Database', fr: 'Base de données sur les produits pharmaceutiques' }, URLS.dpd, lang, undefined, { live }),
    src({ en: 'Report a side effect of a health product', fr: 'Signaler un effet secondaire d’un produit de santé' }, URLS.sideEffect, lang, '2023-09-08'),
  ];
}

/**
 * The "Date modified" printed on the two travel pages on 2026-10-01 (the same in EN and FR), used when a page
 * can't be fetched. Not the `dcterms.modified` meta (2026-09-22 site-wide): see the note at the top.
 */
const THN_MODIFIED = '2026-01-21';
const TRAVEL_VACCINES_MODIFIED = '2026-08-28';
const TRAVEL_CHECKED = '2026-10-01';

/** The "Date modified" each travel page printed when it was just fetched (null or absent: the recorded date). */
export type TravelModified = { notices?: string | null; vaccines?: string | null };

export function travelSources(lang: Lang, live: boolean, modified: TravelModified = {}): ToolSource[] {
  return [
    src({ en: 'Travel health notices', fr: 'Conseils de santé aux voyageurs' }, URLS.thn, lang, modified.notices ?? THN_MODIFIED, { live, checked: TRAVEL_CHECKED }),
    src(
      { en: 'Vaccines and medications before travel', fr: 'Vaccins et médicaments avant le départ' },
      URLS.travelVaccines,
      lang,
      modified.vaccines ?? TRAVEL_VACCINES_MODIFIED,
      {
        checked: TRAVEL_CHECKED,
        quote:
          lang === 'fr'
            ? 'Consultez une clinique de santé-voyage ou un professionnel de la santé environ six semaines avant votre départ'
            : 'Visit a travel health clinic or talk to a health care provider about 6 weeks before your trip',
      },
    ),
  ];
}
