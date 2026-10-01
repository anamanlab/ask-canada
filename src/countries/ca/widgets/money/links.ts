/**
 * Official pages for the `money` widget, in both official languages, and the links each calculator uses.
 * Small and client-safe: the widgets derive links from the page language (Official Languages parity: a French
 * page shows French canada.ca links even when the tool was called without `lang`).
 * "Date modified" for each page is recorded in ./data (facts) and ./sources (the Sources list).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { Lang } from './data';

/** Normalize any locale to the language of the official pages (French for fr*, English otherwise). */
export const L = (lang?: string): Lang => (lang?.startsWith('fr') ? 'fr' : 'en');

const C = 'https://www.canada.ca';
const ES = { en: `${C}/en/services/benefits/education/education-savings`, fr: `${C}/fr/services/prestations/education/epargne-etudes` };
const CRA = { en: `${C}/en/revenue-agency/services/tax/individuals/topics`, fr: `${C}/fr/agence-revenu/services/impot/particuliers/sujets` };
const FCAC = { en: `${C}/en/financial-consumer-agency/services`, fr: `${C}/fr/agence-consommation-matiere-financiere/services` };

export const URLS = {
  respAmounts: { en: `${ES.en}/estimating-amounts.html`, fr: `${ES.fr}/estimation-montants.html` },
  respOpen: { en: `${ES.en}/opening-plan.html`, fr: `${ES.fr}/creer-plan.html` },
  clb: { en: `${ES.en}/canada-learning-bond.html`, fr: `${ES.fr}/bon-etudes-canadien.html` },
  respPay: { en: `${ES.en}/paying-education.html`, fr: `${ES.fr}/paiement-education.html` },
  respLimit: {
    en: `${CRA.en}/registered-education-savings-plans-resps/resp-contributions.html`,
    fr: `${CRA.fr}/regime-enregistre-epargne-etudes-reee/cotisations-a-reee.html`,
  },
  savingFuture: {
    en: `${C}/en/revenue-agency/services/tax/individuals/educational-programs/saving-future.html`,
    fr: `${C}/fr/agence-revenu/services/impot/particuliers/programmes-educatifs/epargner-avenir.html`,
  },
  tfsaRoom: {
    en: `${CRA.en}/tax-free-savings-account/contributing/calculate-room.html`,
    fr: `${CRA.fr}/compte-epargne-libre-impot/cotiser/calculer-droits.html`,
  },
  limits: {
    en: `${C}/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html`,
    fr: `${C}/fr/agence-revenu/services/impot/administrateurs-regimes-enregistres/fesp/plafonds-cd-reer-rpdb-celi-mgap.html`,
  },
  rrspLimit: {
    en: `${CRA.en}/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html`,
    fr: `${CRA.fr}/reer-regimes-connexes/cotiser-a-reer-a-rpac-a/effet-vos-cotisations-maximum-deductible-votre-reer-rpac.html`,
  },
  fhsa: { en: `${CRA.en}/first-home-savings-account.html`, fr: `${CRA.fr}/compte-epargne-libre-impot-achat-premiere-propriete.html` },
  fhsaClose: {
    en: `${CRA.en}/first-home-savings-account/closing-your-fhsa.html`,
    fr: `${CRA.fr}/compte-epargne-libre-impot-achat-premiere-propriete/fermer-votre-celiapp.html`,
  },
  marginalRates: {
    en: `${C}/en/revenue-agency/services/tax/individuals/tax-rates-brackets.html`,
    fr: `${C}/fr/agence-revenu/services/impot/particuliers/taux-imposition-tranches-revenu.html`,
  },
  hbp: {
    en: `${CRA.en}/rrsps-related-plans/what-home-buyers-plan.html`,
    fr: `${CRA.fr}/reer-regimes-connexes/est-regime-accession-a-propriete.html`,
  },
  craAccount: {
    en: `${C}/en/revenue-agency/services/e-services/cra-login-services.html`,
    fr: `${C}/fr/agence-revenu/services/services-electroniques/services-ouverture-session-arc.html`,
  },
  mortgagePrep: { en: `${FCAC.en}/mortgages/preparing-mortgage.html`, fr: `${FCAC.fr}/hypotheques/preparer-hypotheque.html` },
  downPayment: { en: `${FCAC.en}/mortgages/down-payment.html`, fr: `${FCAC.fr}/hypotheques/combien-mise-de-fonds.html` },
  reforms: {
    en: `${C}/en/department-finance/news/2024/12/boldest-mortgage-reforms-in-decades-come-into-force-today.html`,
    fr: `${C}/fr/ministere-finances/nouvelles/2024/12/les-reformes-hypothecaires-les-plus-audacieuses-des-dernieres-decennies-entrent-en-vigueur-aujourdhui.html`,
  },
  cmhcPremiums: {
    en: 'https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/mortgage-loan-insurance/mortgage-loan-insurance-homeownership-programs/premium-information-for-homeowner-and-small-rental-loans',
    fr: 'https://www.cmhc-schl.gc.ca/professionnels/financement-de-projets-et-financement-hypothecaire/assurance-pret-hypothecaire/aph-po-et-petits-immeubles-locatifs/primes-dassurance-pret-hypothecaire',
  },
  qualifier: {
    en: 'https://itools-ioutils.fcac-acfc.gc.ca/MQ-HQ/MQCalc-EAPHCalc-eng.aspx',
    fr: 'https://itools-ioutils.fcac-acfc.gc.ca/MQ-HQ/MQCalc-EAPHCalc-fra.aspx',
  },
  boc: {
    en: 'https://www.bankofcanada.ca/rates/interest-rates/canadian-interest-rates/',
    fr: 'https://www.banqueducanada.ca/taux/taux-dinteret/taux-dinteret-au-canada/',
  },
  budget: { en: `${FCAC.en}/make-budget.html`, fr: `${FCAC.fr}/faire-budget.html` },
  budgetPlanner: {
    en: 'https://itools-ioutils.fcac-acfc.gc.ca/BP-PB/budget-planner',
    fr: 'https://itools-ioutils.fcac-acfc.gc.ca/BP-PB/planificateur-budgetaire',
  },
} as const;

/**
 * The pages each tool cites, in the order of its Sources list. The first is the one the widget footer names:
 * its title is here too (copied from the live page), because the loading state lays out that footer before
 * the answer arrives. Every other title, date and quote stays on the server, in ./sources.
 */
export const CITED = {
  resp: ['respAmounts', 'respOpen', 'clb', 'respPay', 'respLimit'],
  compare: ['savingFuture', 'tfsaRoom', 'rrspLimit', 'fhsa', 'limits', 'hbp', 'fhsaClose', 'marginalRates'],
  mortgage: ['mortgagePrep', 'downPayment', 'reforms', 'cmhcPremiums', 'boc'],
  budget: ['budget', 'budgetPlanner'],
} as const satisfies Record<string, readonly (keyof typeof URLS)[]>;
export type MoneyTool = keyof typeof CITED;

export const LEAD_TITLES: Record<MoneyTool, Record<Lang, string>> = {
  resp: {
    en: 'How much money can be added to Registered Education Savings Plans',
    fr: 'Montant d’argent que les prestations pourraient ajouter au régime enregistré d’épargne-études',
  },
  compare: { en: 'Saving for the future', fr: 'Épargner pour l’avenir' },
  mortgage: { en: 'Preparing to get a mortgage', fr: 'Se préparer à obtenir une hypothèque' },
  budget: { en: 'Making a budget', fr: 'Faire un budget' },
};

export const respLinks = (lang: Lang) => ({ open: URLS.respOpen[lang] });
export const compareLinks = (lang: Lang) => ({ fhsaClose: URLS.fhsaClose[lang], rates: URLS.marginalRates[lang], account: URLS.craAccount[lang] });
export const mortgageLinks = (lang: Lang) => ({ qualifier: URLS.qualifier[lang], boc: URLS.boc[lang] });
export const budgetLinks = (lang: Lang) => ({ planner: URLS.budgetPlanner[lang] });

/** The output's sources in the page language (answers saved before `sourcesByLang` existed keep their own). */
export const sourcesIn = (output: { sources: ToolSource[]; sourcesByLang?: Record<Lang, ToolSource[]> }, lang: Lang): ToolSource[] => output.sourcesByLang?.[lang] ?? output.sources;
