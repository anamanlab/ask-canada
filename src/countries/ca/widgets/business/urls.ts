/**
 * Official pages the business tools link to, in both languages. Each was opened and checked with the facts in
 * data.ts (see the verification notes at the top of that file).
 */
const CRA = { en: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses', fr: 'https://www.canada.ca/fr/agence-revenu/services/impot/entreprises' };
const BN = {
  en: `${CRA.en}/topics/business-registration/business-number-program-account`,
  fr: `${CRA.fr}/sujets/inscription-entreprise/numero-entreprise-comptes-programme`,
};
const SETUP = {
  en: `${CRA.en}/small-businesses-self-employed-income/setting-your-business`,
  fr: `${CRA.fr}/revenu-petites-entreprises-travailleurs-independants/etablir-votre-entreprise`,
};
const CC = { en: 'https://ised-isde.canada.ca/site/corporations-canada/en', fr: 'https://ised-isde.canada.ca/site/corporations-canada/fr' };
const CBSA = 'https://www.cbsa-asfc.gc.ca';

export const URLS = {
  gstWhen: { en: `${CRA.en}/topics/gst-hst-businesses/when-register-charge.html`, fr: `${CRA.fr}/sujets/tps-tvh-entreprises/quand-inscrire-facture.html` },
  gstRates: {
    en: `${CRA.en}/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html`,
    fr: `${CRA.fr}/sujets/tps-tvh-entreprises/facturer-percevoir-quel-taux/calculatrice.html`,
  },
  needBn: { en: `${BN.en}/need-bn.html`, fr: `${BN.fr}/besoin-ne.html` },
  accounts: { en: `${BN.en}/need-program-accounts.html`, fr: `${BN.fr}/besoin-comptes-programme.html` },
  registerBn: { en: `${BN.en}/how-register/resident.html`, fr: `${BN.fr}/comment-inscrire/resident.html` },
  rideshare: { en: `${BN.en}/register-rideshare-taxi.html`, fr: `${BN.fr}/inscrire-covoiturage-taxi.html` },
  craSignIn: {
    en: 'https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services.html',
    fr: 'https://www.canada.ca/fr/agence-revenu/services/services-electroniques/services-ouverture-session-arc.html',
  },
  soleProp: { en: `${SETUP.en}/sole-proprietorship.html`, fr: `${SETUP.fr}/entreprise-individuelle.html` },
  partnership: { en: `${SETUP.en}/partnership.html`, fr: `${SETUP.fr}/societe-personnes.html` },
  corporation: { en: `${SETUP.en}/corporation.html`, fr: `${SETUP.fr}/societe.html` },
  structures: {
    en: 'https://ised-isde.canada.ca/site/ised/en/social-enterprises-canada/creating-and-maintaining-social-enterprise',
    fr: 'https://ised-isde.canada.ca/site/isde/fr/entreprises-sociales-canada/creation-exploitation-dune-entreprise-sociale',
  },
  registerSoleProp: {
    en: 'https://www.canada.ca/en/services/business/start/register-with-gov/register-sole-prop-partner.html',
    fr: 'https://www.canada.ca/fr/services/entreprises/lancer/enregistrer-entreprise-aupres-gouvernement/enregistrement-entreprise-proprietaire-societe-collectif.html',
  },
  howIncorporate: { en: `${CC.en}/business-corporations/how-incorporate-business`, fr: `${CC.fr}/societes-actions/comment-incorporer-entreprise` },
  ccFees: { en: `${CC.en}/services-fees-and-processing-times`, fr: `${CC.fr}/services-frais-delais-dexecution` },
  ccBenefits: { en: `${CC.en}/benefits-incorporating`, fr: `${CC.fr}/avantages-constitution-societe` },
  extraProvincial: {
    en: `${CC.en}/register-federal-corporation-province-or-territory`,
    fr: `${CC.fr}/enregistrer-corporation-federale-dans-province-territoire`,
  },
  annualReturn: { en: `${CC.en}/keep-your-corporation-good-shape/annual-return`, fr: `${CC.fr}/garder-votre-corporation-bonne-forme/rapport-annuel` },
  naming: { en: `${CC.en}/naming-corporation`, fr: `${CC.fr}/choisir-denomination-dune-societe` },
  filingCentre: { en: 'https://ised-isde.canada.ca/cc/lgcy/hm.html?lang=eng', fr: 'https://ised-isde.canada.ca/cc/lgcy/hm.html?lang=fra' },
  bbf: { en: 'https://innovation.ised-isde.canada.ca/s/?language=en_CA', fr: 'https://innovation.ised-isde.canada.ca/s/?language=fr_CA' },
  supportFinancing: {
    en: 'https://www.canada.ca/en/services/business/start/support-financing.html',
    fr: 'https://www.canada.ca/fr/services/entreprises/lancer/soutien-financement-pour-entreprise.html',
  },
  csbfp: {
    en: 'https://ised-isde.canada.ca/site/canada-small-business-financing-program/en',
    fr: 'https://ised-isde.canada.ca/site/programme-financement-petites-entreprises-canada/fr',
  },
  irap: { en: 'https://nrc.canada.ca/en/support-technology-innovation', fr: 'https://nrc.canada.ca/fr/soutien-linnovation-technologique' },
  tcs: { en: 'https://www.tradecommissioner.gc.ca/en.html', fr: 'https://www.deleguescommerciaux.gc.ca/fr.html' },
  canadaStrong: {
    en: 'https://www.canada.ca/en/campaign/canadastrong/find-support-for-your-business.html',
    fr: 'https://www.canada.ca/fr/campagne/uncanadafort/trouvez-du-soutien-pour-votre-entreprise.html',
  },
  tariffResponses: {
    en: 'https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-tariff-responses.html',
    fr: 'https://www.canada.ca/fr/ministere-finances/programmes/politiques-finances-echanges-internationaux/droits-douane-canada-en-reponse.html',
  },
  importGuide: { en: `${CBSA}/import/guide-eng.html`, fr: `${CBSA}/import/guide-fra.html` },
  importSetup: { en: `${CBSA}/import/guide-4-eng.html`, fr: `${CBSA}/import/guide-4-fra.html` },
  importDuties: { en: `${CBSA}/import/guide-3-eng.html`, fr: `${CBSA}/import/guide-3-fra.html` },
  customsTariff: { en: `${CBSA}/trade-commerce/tariff-tarif/menu-eng.html`, fr: `${CBSA}/trade-commerce/tariff-tarif/menu-fra.html` },
  exportGuide: { en: `${CBSA}/services/export/guide-eng.html`, fr: `${CBSA}/services/export/guide-fra.html` },
  canexport: {
    en: 'https://www.tradecommissioner.gc.ca/en/our-solutions/funding-financing-international-business/canexport-smes.html',
    fr: 'https://www.deleguescommerciaux.gc.ca/fr/nos-solutions/soutien-financier-expansion-commerciale-international/canexport-pme.html',
  },
  dutiesRelief: { en: `${CBSA}/import/ddr-red/relief-report-eng.html`, fr: `${CBSA}/import/ddr-red/relief-report-fra.html` },
  drawback: { en: `${CBSA}/import/ddr-red/drawback-eng.html`, fr: `${CBSA}/import/ddr-red/drawback-fra.html` },
  counterTariffs: {
    en: 'https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-response-us-tariffs/complete-list-us-products-subject-to-counter-tariffs.html',
    fr: 'https://www.canada.ca/fr/ministere-finances/programmes/politiques-finances-echanges-internationaux/reponse-canada-droits-douane-americains/liste-complete-produits-americains-assujettis-contre-mesures-tarifaires.html',
  },
  rqRegister: {
    en: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/registering-for-the-gst-and-qst/',
    fr: 'https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/inscription-aux-fichiers-de-la-tps-et-de-la-tvq/',
  },
  fx: { en: 'https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/', fr: 'https://www.banqueducanada.ca/taux/taux-de-change/taux-de-change-quotidiens/' },
} as const;

export type UrlKey = keyof typeof URLS;
