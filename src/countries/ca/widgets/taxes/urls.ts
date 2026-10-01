/**
 * The official pages the taxes widgets cite and hand off to, in both official languages, with their titles and
 * "Date modified" (read on the day in `CHECKED`; the facts taken from them are recorded in ./data).
 *   URLS.rates[lang]                      a page address
 *   source('rates', lang, quote?)         the same page as a ToolSource (title, url, checked, updated)
 *   localizeSources(sources, lang)        re-issue a tool's sources in the reader's language
 */
import type { ToolSource } from '@/lib/widgets/types';
import { CHECKED, type Lang } from './data';

const C = 'https://www.canada.ca';
const CRA = { en: `${C}/en/revenue-agency/services`, fr: `${C}/fr/agence-revenu/services` };
const PIT = {
  en: `${C}/en/services/taxes/income-tax/personal-income-tax`,
  fr: `${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers`,
};

export const URLS = {
  dates: { en: `${CRA.en}/tax/individuals/topics/important-dates-individuals.html`, fr: `${CRA.fr}/impot/particuliers/sujets/dates-importantes-particuliers.html` },
  filingDates: {
    en: `${CRA.en}/tax/individuals/topics/important-dates-individuals/filing-dates-tax-return.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/dates-importantes-particuliers/dates-limites-production-declaration-revenus.html`,
  },
  instalments: {
    en: `${CRA.en}/payments/payments-cra/individual-payments/income-tax-instalments/due-dates.html`,
    fr: `${CRA.fr}/paiements/paiements-arc/paiements-particuliers/impots-acomptes-provisionnels/dates-limites.html`,
  },
  rrspDates: {
    en: `${CRA.en}/tax/individuals/topics/rrsps-related-plans/important-dates-rrsp-rrif-rdsp.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/reer-regimes-connexes/dates-importantes-reer-reei-reep.html`,
  },
  rrspLimit: {
    en: `${CRA.en}/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/reer-regimes-connexes/cotiser-a-reer-a-rpac-a/effet-vos-cotisations-maximum-deductible-votre-reer-rpac.html`,
  },
  latePenalty: {
    en: `${CRA.en}/tax/individuals/topics/about-your-tax-return/interest-penalties/late-filing-penalty.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/tout-votre-declaration-revenus/interets-penalites/penalite-production-tardive.html`,
  },
  rates: { en: `${CRA.en}/tax/individuals/tax-rates-brackets/current-year.html`, fr: `${CRA.fr}/impot/particuliers/taux-imposition-tranches-revenu/annee-en-cours.html` },
  indexation: {
    en: `${CRA.en}/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html`,
    fr: `${CRA.fr}/impot/particuliers/foire-questions-particuliers/rajustement-montants-fonction-indexation-impot-particuliers-prestations.html`,
  },
  cpp: {
    en: `${CRA.en}/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html`,
    fr: `${CRA.fr}/impot/entreprises/sujets/retenues-paie/retenues-paie-cotisations/regime-pensions-canada-rpc/taux-cotisations-rpc-maximums-exemptions.html`,
  },
  ei: {
    en: `${CRA.en}/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html`,
    fr: `${CRA.fr}/impot/entreprises/sujets/retenues-paie/retenues-paie-cotisations/assurance-emploi-ae/taux-cotisation-a-ae-maximums.html`,
  },
  t4127: {
    en: `${C}/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul.html`,
    fr: `${C}/fr/agence-revenu/services/formulaires-publications/retenues-paie/t4127-formules-calcul-retenues-paie/t4127-jul.html`,
  },
  /** Quebec's own tax is Revenu Québec's: this link and `quebecClinics` are the pages canada.ca itself sends people to. */
  quebecRates: {
    en: 'https://www.revenuquebec.ca/en/citizens/income-tax-return/completing-your-income-tax-return/income-tax-rates/',
    fr: 'https://www.revenuquebec.ca/fr/citoyens/declaration-de-revenus/produire-votre-declaration-de-revenus/taux-dimposition/',
  },
  tfsaRoom: {
    en: `${CRA.en}/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/compte-epargne-libre-impot/cotiser/calculer-droits.html`,
  },
  tfsaOpen: {
    en: `${CRA.en}/tax/individuals/topics/tax-free-savings-account/opening.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/compte-epargne-libre-impot/ouvrir.html`,
  },
  limits: {
    en: `${CRA.en}/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html`,
    fr: `${CRA.fr}/impot/administrateurs-regimes-enregistres/fesp/plafonds-cd-reer-rpdb-celi-mgap.html`,
  },
  fhsa: {
    en: `${CRA.en}/tax/individuals/topics/first-home-savings-account/contributing-your-fhsa.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/compte-epargne-libre-impot-achat-premiere-propriete/cotiser-un-celiapp.html`,
  },
  fhsaOpen: {
    en: `${CRA.en}/tax/individuals/topics/first-home-savings-account/opening-your-fhsas.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/compte-epargne-libre-impot-achat-premiere-propriete/ouvrir-vos-celiapp.html`,
  },
  fhsaHome: {
    en: `${CRA.en}/tax/individuals/topics/first-home-savings-account.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/compte-epargne-libre-impot-achat-premiere-propriete.html`,
  },
  clinics: {
    en: `${CRA.en}/tax/individuals/community-volunteer-income-tax-program/need-a-hand-complete-your-tax-return.html`,
    fr: `${CRA.fr}/impot/particuliers/programme-communautaire-benevoles-matiere-impot/besoin-coup-main-remplir-votre-declaration-revenus.html`,
  },
  clinicFinder: {
    en: 'https://apps.cra-arc.gc.ca/ebci/oecv/external/prot/startClinicSearch.action?request_locale=en_CA',
    fr: 'https://apps.cra-arc.gc.ca/ebci/oecv/external/prot/startClinicSearch.action?request_locale=fr_CA',
  },
  quebecClinics: {
    en: 'https://www.revenuquebec.ca/en/one-mission-concrete-actions/helping-you-meet-your-obligations/income-tax-assistance-volunteer-program/are-you-eligible-for-the-income-tax-assistance-program/',
    fr: 'https://www.revenuquebec.ca/fr/une-mission-des-actions/vous-aider-a-vous-conformer/service-daide-en-impot-programme-des-benevoles/etes-vous-admissible-au-service-daide-en-impot/',
  },
  simpleFile: { en: `${PIT.en}/how-file/simplefile.html`, fr: `${PIT.fr}/comment-produire/declarer-simplement.html` },
  software: { en: `${PIT.en}/how-file/tax-software/find-software.html`, fr: `${PIT.fr}/comment-produire/logiciel-impot/trouver-logiciel.html` },
  howFile: { en: `${PIT.en}/how-file.html`, fr: `${PIT.fr}/comment-produire.html` },
  refunds: {
    en: `${CRA.en}/tax/individuals/topics/about-your-tax-return/refunds.html`,
    fr: `${CRA.fr}/impot/particuliers/sujets/tout-votre-declaration-revenus/remboursements.html`,
  },
  serviceStandards: {
    en: `${CRA.en}/about-canada-revenue-agency-cra/service-standards-cra/service-standards-2026-27.html`,
    fr: `${CRA.fr}/a-propos-agence-revenu-canada-arc/normes-service-a-arc/normes-service-2026-27.html`,
  },
  directDeposit: {
    en: `${CRA.en}/about-canada-revenue-agency-cra/direct-deposit/individuals.html`,
    fr: `${CRA.fr}/a-propos-agence-revenu-canada-arc/depot-direct/particuliers.html`,
  },
  signIn: { en: `${CRA.en}/e-services/cra-login-services.html`, fr: `${CRA.fr}/services-electroniques/services-ouverture-session-arc.html` },
} as const;

type UrlKey = keyof typeof URLS;

const TITLES: Record<UrlKey, { en: string; fr: string; updated?: string }> = {
  dates: { en: 'Due dates and payment dates: personal income tax', fr: 'Dates d’échéance et dates de paiement : impôt des particuliers', updated: '2026-09-17' },
  filingDates: { en: 'Filing due dates for your tax return', fr: 'Dates limites de production de votre déclaration de revenus', updated: '2026-01-20' },
  instalments: { en: 'Instalment payment due dates', fr: 'Dates d’échéance des acomptes provisionnels', updated: '2026-01-20' },
  rrspDates: { en: 'Important dates for RRSPs, HBP, LLP, FHSAs and more', fr: 'Dates importantes pour les REER, le RAP, le REEP, les CELIAPP et plus', updated: '2026-01-29' },
  rrspLimit: { en: 'How contributions affect your RRSP deduction limit', fr: 'L’effet de vos cotisations sur votre maximum déductible au titre des REER', updated: '2026-01-29' },
  latePenalty: { en: 'Interest and penalties on late taxes', fr: 'Intérêts et pénalités sur les impôts en retard', updated: '2026-01-20' },
  rates: { en: 'Tax rates and income brackets for 2026', fr: 'Taux d’imposition et tranches d’imposition pour 2026', updated: '2026-06-25' },
  indexation: { en: 'Indexation adjustment for personal income tax and benefit amounts', fr: 'Rajustement selon l’indexation des montants d’impôt et de prestations', updated: '2026-03-12' },
  cpp: { en: 'CPP contribution rates, maximums and exemptions', fr: 'Taux de cotisation au RPC, maximums et exemptions', updated: '2025-10-31' },
  ei: { en: 'EI premium rates and maximums', fr: 'Taux de cotisation à l’AE et maximums', updated: '2025-09-16' },
  t4127: { en: 'T4127 Payroll Deductions Formulas (July 2026)', fr: 'T4127 Formules pour le calcul des retenues sur la paie (juillet 2026)', updated: '2026-06-03' },
  quebecRates: { en: 'Revenu Québec: income tax rates', fr: 'Revenu Québec : taux d’imposition' },
  tfsaRoom: { en: 'Calculate your TFSA contribution room', fr: 'Calculer vos droits de cotisation au CELI', updated: '2026-02-20' },
  tfsaOpen: { en: 'Who can open a TFSA', fr: 'Qui peut ouvrir un CELI', updated: '2025-10-10' },
  limits: { en: 'RRSP and TFSA dollar limits', fr: 'Plafonds des REER et des CELI', updated: '2025-12-01' },
  fhsa: { en: 'Participating in your FHSAs', fr: 'Participer à vos CELIAPP', updated: '2026-09-17' },
  fhsaOpen: { en: 'Opening your FHSAs', fr: 'Ouvrir vos CELIAPP', updated: '2026-02-10' },
  fhsaHome: { en: 'First Home Savings Account (FHSA)', fr: 'Compte d’épargne libre d’impôt pour l’achat d’une première propriété (CELIAPP)', updated: '2026-02-02' },
  clinics: { en: 'Get your taxes done at a free tax clinic', fr: 'Faites faire votre déclaration à un comptoir d’impôts gratuit', updated: '2026-01-27' },
  clinicFinder: { en: 'Find a free tax clinic', fr: 'Trouver un comptoir d’impôts gratuit' },
  quebecClinics: { en: 'Income Tax Assistance – Volunteer Program', fr: 'Service d’aide en impôt – Programme des bénévoles' },
  simpleFile: { en: 'SimpleFile', fr: 'Déclarer simplement', updated: '2026-09-03' },
  software: { en: 'Find certified tax software (NETFILE)', fr: 'Trouver un logiciel homologué (IMPÔTNET)', updated: '2026-04-07' },
  howFile: { en: 'How to file a tax return', fr: 'Comment produire une déclaration de revenus', updated: '2026-09-04' },
  refunds: { en: 'Tax refunds', fr: 'Remboursements d’impôt', updated: '2026-01-20' },
  serviceStandards: { en: 'CRA service standards 2026–2027', fr: 'Normes de service de l’ARC 2026-2027', updated: '2026-05-11' },
  directDeposit: { en: 'Direct deposit for individuals', fr: 'Dépôt direct pour les particuliers', updated: '2026-09-18' },
  signIn: { en: 'CRA sign in services', fr: 'Services d’ouverture de session de l’ARC' },
};

export function source(k: UrlKey, lang: Lang, quote?: string): ToolSource {
  const t = TITLES[k];
  return { title: t[lang], url: URLS[k][lang], checked: CHECKED, ...(t.updated ? { updated: t.updated } : {}), ...(quote ? { quote } : {}) };
}

/** Re-issue sources in the reader's language (the model may call a tool without `lang`). */
export function localizeSources(sources: ToolSource[], lang: Lang): ToolSource[] {
  return sources.map((src) => {
    const k = (Object.keys(URLS) as UrlKey[]).find((key) => URLS[key].en === src.url || URLS[key].fr === src.url);
    return k && URLS[k][lang] !== src.url ? { ...source(k, lang), ...(src.live ? { live: true } : {}) } : src;
  });
}
