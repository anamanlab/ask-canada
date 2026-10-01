/**
 * Official pages (EN + FR) the letter explainer and the forms finder link to. Isomorphic and prose-free:
 * the widget resolves a link in the card's language with `url(key, lang)`. Page titles, "Date modified" and
 * quotes live in ./sources (server). Verification notes: ./data.
 */
import { bi, type Lang } from './data';

export const CA = 'https://www.canada.ca';
export const CRA = { en: `${CA}/en/revenue-agency`, fr: `${CA}/fr/agence-revenu` };
export const IRCC = { en: `${CA}/en/immigration-refugees-citizenship`, fr: `${CA}/fr/immigration-refugies-citoyennete` };

export const URLS = {
  noa: bi(
    `${CA}/en/services/taxes/income-tax/personal-income-tax/after-you-file/noa-nor.html`,
    `${CA}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/apres-declaration-revenus/adc-adnc.html`,
  ),
  objection: bi(
    `${CRA.en}/services/about-canada-revenue-agency-cra/complaints-disputes/file-objection-cppei-appeal-minister/income-tax.html`,
    `${CRA.fr}/services/a-propos-agence-revenu-canada-arc/plaintes-differends/presenter-opposition-appel-rpcae-ministre/impot-revenu.html`,
  ),
  changeReturn: bi(
    `${CA}/en/services/taxes/income-tax/personal-income-tax/after-you-file/change-return.html`,
    `${CA}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/apres-declaration-revenus/changer-declaration.html`,
  ),
  payments: bi(`${CRA.en}/services/payments/payments-cra.html`, `${CRA.fr}/services/paiements/paiements-arc.html`),
  makePayment: bi(
    `${CRA.en}/services/payments/payments-cra/individual-payments/make-payment.html`,
    `${CRA.fr}/services/paiements/paiements-arc/paiements-particuliers/faire-paiement.html`,
  ),
  arrangements: bi(
    `${CRA.en}/services/payments/payments-cra/payment-arrangements.html`,
    `${CRA.fr}/services/paiements/paiements-arc/entente-paiement.html`,
  ),
  refunds: bi(
    `${CRA.en}/services/tax/individuals/topics/about-your-tax-return/refunds.html`,
    `${CRA.fr}/services/impot/particuliers/sujets/tout-votre-declaration-revenus/remboursements.html`,
  ),
  craSignIn: bi(`${CRA.en}/services/e-services/cra-login-services.html`, `${CRA.fr}/services/services-electroniques/services-ouverture-session-arc.html`),
  craContact: bi(`${CRA.en}/corporate/contact-information.html`, `${CRA.fr}/organisation/coordonnees.html`),
  review: bi(
    `${CRA.en}/services/tax/individuals/topics/about-your-tax-return/review-your-tax-return-cra.html`,
    `${CRA.fr}/services/impot/particuliers/sujets/tout-votre-declaration-revenus/examen-votre-declaration-revenus-arc.html`,
  ),
  respond: bi(
    `${CRA.en}/services/tax/individuals/topics/about-your-tax-return/review-your-tax-return-cra/responding-us.html`,
    `${CRA.fr}/services/impot/particuliers/sujets/tout-votre-declaration-revenus/examen-votre-declaration-revenus-arc/lorsque-vous-nous-repondez.html`,
  ),
  submitDocs: bi(
    `${CRA.en}/services/e-services/cra-login-services/about-cra-sign-in-services/submit-documents-online.html`,
    `${CRA.fr}/services/services-electroniques/services-ouverture-session-arc/a-propos-services-ouverture-session-arc/soumettre-documents-ligne.html`,
  ),
  ccb: bi(`${CRA.en}/services/child-family-benefits/canada-child-benefit.html`, `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-enfants.html`),
  ccbGet: bi(
    `${CRA.en}/services/child-family-benefits/canada-child-benefit/get-payments.html`,
    `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-enfants/recevoir-versements.html`,
  ),
  ccbDates: bi(
    `${CRA.en}/services/child-family-benefits/canada-child-benefit/payment-dates.html`,
    `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-enfants/dates-versement.html`,
  ),
  cgeb: bi(
    `${CRA.en}/services/child-family-benefits/canada-groceries-essentials-benefit.html`,
    `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels.html`,
  ),
  cgebDates: bi(
    `${CRA.en}/services/child-family-benefits/canada-groceries-essentials-benefit/payment-dates.html`,
    `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels/dates-versement.html`,
  ),
  benefitDates: bi(`${CRA.en}/services/child-family-benefits/benefit-payment-dates.html`, `${CRA.fr}/services/prestations-enfants-familles/dates-versement-prestations.html`),
  recognizeScam: bi(`${CRA.en}/corporate/scams-fraud/recognize-scam.html`, `${CRA.fr}/organisation/arnaques-fraudes/reconnaitre-arnaque.html`),
  reportScam: bi(`${CRA.en}/corporate/scams-fraud/report-scam.html`, `${CRA.fr}/organisation/arnaques-fraudes/signaler-arnaque.html`),
  verifyCra: bi(`${CRA.en}/corporate/scams-fraud/verify-cra-contact.html`, `${CRA.fr}/organisation/arnaques-fraudes/verifier-arc-appelle.html`),
  cafc: bi('https://antifraudcentre-centreantifraude.ca/report-signalez-eng.htm', 'https://antifraudcentre-centreantifraude.ca/report-signalez-fra.htm'),
  eiRecon: bi(`${CA}/en/services/benefits/ei/ei-reconsideration.html`, `${CA}/fr/services/prestations/ae/assurance-emploi-revision-decision.html`),
  eiReconForm: bi(
    'https://catalogue.servicecanada.gc.ca/content/EForms/en/Detail.html?Form=INS5210',
    'https://catalogue.servicecanada.gc.ca/content/EForms/fr/Detail.html?Form=INS5210',
  ),
  eiReporting: bi(`${CA}/en/services/benefits/ei/employment-insurance-reporting.html`, `${CA}/fr/services/prestations/ae/declarations-assurance-emploi.html`),
  eiContact: bi(
    `${CA}/en/employment-social-development/corporate/contact/ei-individual.html`,
    `${CA}/fr/emploi-developpement-social/ministere/coordonnees/assurance-emploi-individus.html`,
  ),
  msca: bi(`${CA}/en/employment-social-development/services/my-account.html`, `${CA}/fr/emploi-developpement-social/services/mon-dossier.html`),
  oasApply: bi(`${CA}/en/services/benefits/publicpensions/old-age-security/apply.html`, `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/demande.html`),
  oasContact: bi(`${CA}/en/employment-social-development/corporate/contact/oas.html`, `${CA}/fr/emploi-developpement-social/ministere/coordonnees/sv.html`),
  cppApply: bi(`${CA}/en/services/benefits/publicpensions/cpp/apply.html`, `${CA}/fr/services/prestations/pensionspubliques/rpc/demande.html`),
  sinApply: bi(
    `${CA}/en/employment-social-development/services/sin/apply.html`,
    `${CA}/fr/emploi-developpement-social/services/numero-assurance-sociale/demande.html`,
  ),
  bioHow: bi(`${IRCC.en}/services/biometrics/how-to-give.html`, `${IRCC.fr}/services/biometrie/comment-fournir-donnees-biometriques.html`),
  bioWhere: bi(`${IRCC.en}/services/biometrics/where-to-give.html`, `${IRCC.fr}/services/biometrie/ou-fournir-donnees-biometriques.html`),
  irccWebForm: bi(`${IRCC.en}/corporate/contact-ircc/web-form.html`, `${IRCC.fr}/organisation/contactez-ircc/formulaire-web.html`),
  irccStatus: bi(`${IRCC.en}/services/application/check-status.html`, `${IRCC.fr}/services/demande/verifier-etat.html`),
  medical: bi(
    `${IRCC.en}/services/application/medical-police/medical-exams/requirements-permanent-residents.html`,
    `${IRCC.fr}/services/demande/medical-police/examens-medicaux/exigences-residents-permanents.html`,
  ),
  panelPhysician: bi('https://secure.cic.gc.ca/PanelPhysicianMedecinDesigne/en/Home', 'https://secure.cic.gc.ca/PanelPhysicianMedecinDesigne/fr/Accueil'),
  irccForms: bi(`${IRCC.en}/services/application/application-forms-guides.html`, `${IRCC.fr}/services/demande/formulaires-demande-guides.html`),
  citizenshipApply: bi(`${IRCC.en}/services/canadian-citizenship/adult-minor/how.html`, `${IRCC.fr}/services/citoyennete-canadienne/adulte-mineur/comment.html`),
  passports: bi(`${IRCC.en}/services/canadian-passports.html`, `${IRCC.fr}/services/passeports-canadiens.html`),
  craForms: bi(`${CRA.en}/services/forms-publications/forms.html`, `${CRA.fr}/services/formulaires-publications/formulaires.html`),
  craPdfHelp: bi(
    `${CRA.en}/services/forms-publications/about-forms-publications.html`,
    `${CRA.fr}/services/formulaires-publications/a-propos-formulaires-publications-format.html`,
  ),
  scForms: bi('https://catalogue.servicecanada.gc.ca/content/EForms/en/Index.html', 'https://catalogue.servicecanada.gc.ca/content/EForms/fr/Accueil.html'),
  provinces: bi(`${CA}/en/intergovernmental-affairs/services/provinces-territories.html`, `${CA}/fr/affaires-intergouvernementales/services/provinces-territoires.html`),
  departments: bi(`${CA}/en/government/dept.html`, `${CA}/fr/gouvernement/min.html`),
  dtcApply: bi(
    `${CRA.en}/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit/how-apply-dtc.html`,
    `${CRA.fr}/services/impot/particuliers/segments/deductions-credits-impot-personnes-handicapees/credit-impot-personnes-handicapees/comment-demande-ciph.html`,
  ),
  maritalStatus: bi(
    `${CRA.en}/services/child-family-benefits/update-your-marital-status-canada-revenue-agency.html`,
    `${CRA.fr}/services/prestations-enfants-familles/mettre-a-jour-votre-etat-civil-aupres-agence-revenu-canada.html`,
  ),
  cppdApply: bi(
    `${CA}/en/services/benefits/publicpensions/cpp-disability-benefit/apply.html`,
    `${CA}/fr/services/prestations/pensionspubliques/prestation-invalidite-rpc/demande.html`,
  ),
  ccbApply: bi(
    `${CRA.en}/services/child-family-benefits/canada-child-benefit/how-apply.html`,
    `${CRA.fr}/services/prestations-enfants-familles/allocation-canadienne-enfants/comment-demande.html`,
  ),
} as const;
export type UrlKey = keyof typeof URLS;
export const url = (k: UrlKey, lang: Lang) => URLS[k][lang];
