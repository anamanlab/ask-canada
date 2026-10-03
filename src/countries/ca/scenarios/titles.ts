/**
 * Page titles for the official pages scripted answers cite (from each page's <title>, checked
 * 2026-09-29), so source cards read "Who can apply: Canada child benefit" instead of a URL slug.
 * `withTitles()` rewrites `[n](url)` citations to `[n](url "Title")` for every URL it knows.
 */
import { mapCopy, type Scenario } from '@/lib/scripted/types';

const C = 'https://www.canada.ca';
const IRCC = `${C}/en/immigration-refugees-citizenship/services/canadian-passports`;
const IRCC_FR = `${C}/fr/immigration-refugies-citoyennete/services/passeports-canadiens`;

export const TITLES: Record<string, string> = {
  'https://988.ca/get-help/what-to-expect': 'What to expect when you call or text 9-8-8',
  'https://988.ca/fr': '9-8-8 : Ligne d’aide en cas de crise de suicide',
  'https://ircc.canada.ca/english/passport/map/map.asp': 'Find a passport office or Service Canada Centre',
  'https://ircc.canada.ca/francais/passeport/map/carte.asp': 'Trouver un bureau des passeports ou un Centre Service Canada',
  'https://forces.ca/en/careers': 'Careers: Canadian Armed Forces',
  'https://forces.ca/fr/carrieres': 'Carrières : Forces armées canadiennes',
  'https://rcmp.ca/en/criminal-records/criminal-record-checks/where-go': 'Criminal record checks: Where to go',
  'https://grc.ca/fr/casiers-judiciaires/verification-casier-judiciaire/ou-aller': 'Vérification de casier judiciaire : Où aller',
  'https://weather.gc.ca/': 'Weather warnings and forecasts',
  'https://meteo.gc.ca/': 'Avertissements et prévisions météo',
  'https://parks.canada.ca/voyage-travel/admission': 'Passes, permits and fees',
  'https://parcs.canada.ca/voyage-travel/admission': 'Laissez-passer, permis et frais',
  'https://recalls-rappels.canada.ca/en': 'Find recalls, advisories and safety alerts',
  'https://recalls-rappels.canada.ca/fr': 'Trouvez des rappels, des avis et des avis de sécurité',
  'https://tc.canada.ca/en/road-transportation/defects-recalls-vehicles-tires-child-car-seats': 'Recalls of vehicles, tires and child car seats',
  'https://tc.canada.ca/fr/transport-routier/defauts-rappels-vehicules-pneus-sieges-auto-enfant': 'Rappels des véhicules, des pneus et des sièges d’auto pour enfant',
  'https://travel.gc.ca/assistance/emergency-assistance': 'Request emergency assistance',
  'https://voyage.gc.ca/assistance/assistance-d-urgence': 'Demander de l’aide d’urgence',
  'https://travel.gc.ca/travelling/advisories': 'Travel advice and advisories',
  'https://voyage.gc.ca/voyager/avertissements': 'Conseils aux voyageurs et avertissements',
  'https://www.veterans.gc.ca/en/about-vac/resources/find-programs-and-services/benefits-navigator': 'Benefits Navigator',
  'https://www.veterans.gc.ca/fr/propos-dacc/ressources/trouvez-de-linformation-sur-les-programmes-et-les-services/navigateur-des-avantages-dacc': 'Le navigateur des avantages',
  'https://www.veterans.gc.ca/en/contact-us': 'Contact Veterans Affairs Canada',
  'https://www.veterans.gc.ca/fr/contactez-nous': 'Contacter Anciens Combattants Canada',
  [`${C}/en/employment-social-development/services/my-account/ei.html`]: 'EI services in My Service Canada Account',
  [`${C}/fr/emploi-developpement-social/services/mon-dossier/assurance-emploi.html`]: 'Assurance-emploi dans Mon dossier Service Canada',
  [`${C}/en/immigration-refugees-citizenship/services/canadian-citizenship/adult-minor/who.html`]: 'Canadian citizenship: Who can apply',
  [`${C}/fr/immigration-refugies-citoyennete/services/citoyennete-canadienne/adulte-mineur/qui.html`]: 'Citoyenneté canadienne : Qui peut présenter une demande',
  [`${IRCC}/photos.html`]: 'Passport photo requirements',
  [`${IRCC_FR}/photos.html`]: 'Exigences relatives aux photos de passeport',
  [`${IRCC}/processing-times.html`]: 'Passport service standards',
  [`${IRCC_FR}/delais-traitement.html`]: 'Normes de service pour les passeports',
  [`${IRCC}/renew-adult-passport.html`]: 'How to renew a passport in Canada',
  [`${IRCC_FR}/renouvellement-passeport-adulte.html`]: 'Comment renouveler un passeport pour adulte',
  [`${IRCC}/renew-adult-passport/check-who-renew.html`]: 'Check if you can renew your passport',
  [`${IRCC_FR}/renouvellement-passeport-adulte/verifier-qui-renouveler.html`]: 'Vérifiez si vous pouvez renouveler votre passeport',
  [`${IRCC}/renew-adult-passport/required-documents-photos.html`]: 'What you need to renew your adult passport',
  [`${IRCC_FR}/renouvellement-passeport-adulte/documents-requis-photos.html`]: 'Ce dont vous avez besoin pour renouveler votre passeport',
  [`${IRCC}/renew-adult-passport/submit-form-fees/apply-in-person.html`]: 'Renew a passport in person',
  [`${IRCC_FR}/renouvellement-passeport-adulte/soumettre-formulaire-frais/presenter-en-personne.html`]: 'Renouveler un passeport en personne',
  [`${IRCC}/renew-adult-passport/submit-form-fees/renew-online.html`]: 'Renew a passport online',
  [`${IRCC_FR}/renouvellement-passeport-adulte/soumettre-formulaire-frais/renouveler-en-ligne.html`]: 'Renouveler un passeport en ligne',
  [`${IRCC}/fees/fee-changes-passport.html`]: 'Passport fee changes',
  [`${IRCC_FR}/frais/modification-frais-passeport.html`]: 'Modification des frais de passeport',
  [`${IRCC}/urgent-emergency-passport.html`]: 'Urgent and express passport services',
  [`${IRCC_FR}/passeport-urgent-express.html`]: 'Services de passeport urgents et express',
  [`${C}/en/library-archives/collection/research-help/genealogy-family-history/immigration.html`]: 'Immigration records',
  [`${C}/fr/bibliotheque-archives/collection/aide-recherche/genealogie-histoire-famille/immigration.html`]: 'Documents sur l’immigration',
  [`${C}/en/public-health/services/mental-health-services/mental-health-get-help.html`]: 'Mental health support: get help',
  [`${C}/fr/sante-publique/services/services-sante-mentale/sante-mentale-obtenir-aide.html`]: 'Obtenir du soutien en santé mentale',
  [`${C}/en/revenue-agency/services/child-family-benefits/benefit-payment-dates.html`]: 'Benefit payment dates',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/dates-versement-prestations.html`]: 'Dates de versement des prestations',
  [`${C}/en/revenue-agency/services/child-family-benefits/canada-child-benefit/how-apply.html`]: 'How to apply: Canada child benefit',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants/comment-demande.html`]: 'Comment faire une demande : Allocation canadienne pour enfants',
  [`${C}/en/revenue-agency/services/child-family-benefits/canada-child-benefit/who-apply.html`]: 'Who can apply: Canada child benefit',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-enfants/qui-demande.html`]: 'Qui peut faire une demande : Allocation canadienne pour enfants',
  [`${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit.html`]: 'Canada Groceries and Essentials Benefit',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels.html`]: 'Allocation canadienne pour l’épicerie et les besoins essentiels',
  [`${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/get-benefit.html`]: 'How to get the Canada Groceries and Essentials Benefit',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels/obtenir-allocation.html`]: 'Comment obtenir l’Allocation canadienne pour l’épicerie et les besoins essentiels',
  [`${C}/en/revenue-agency/services/child-family-benefits/canada-groceries-essentials-benefit/who-eligible.html`]: 'Who is eligible: Canada Groceries and Essentials Benefit',
  [`${C}/fr/agence-revenu/services/prestations-enfants-familles/allocation-canadienne-epicerie-besoins-essentiels/qui-admissible.html`]: 'Qui est admissible : Allocation canadienne pour l’épicerie et les besoins essentiels',
  [`${C}/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html`]: 'When to register for and charge the GST/HST',
  [`${C}/fr/agence-revenu/services/impot/entreprises/sujets/tps-tvh-entreprises/quand-inscrire-facture.html`]: 'Quand s’inscrire et facturer la TPS/TVH',
  [`${C}/en/revenue-agency/services/tax/individuals/community-volunteer-income-tax-program.html`]: 'Free tax clinics',
  [`${C}/fr/agence-revenu/services/impot/particuliers/programme-communautaire-benevoles-matiere-impot.html`]: 'Comptoirs d’impôts gratuits',
  [`${C}/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/change-your-address.html`]: 'Change your address with the CRA',
  [`${C}/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/comment-changer-votre-adresse.html`]: 'Changer votre adresse auprès de l’ARC',
  [`${C}/en/revenue-agency/services/tax/individuals/topics/important-dates-individuals.html`]: 'Due dates and payment dates: personal income tax',
  [`${C}/fr/agence-revenu/services/impot/particuliers/sujets/dates-importantes-particuliers.html`]: 'Dates limites et dates de paiement : impôt des particuliers',
  [`${C}/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan.html`]: 'The Home Buyers’ Plan',
  [`${C}/fr/agence-revenu/services/impot/particuliers/sujets/reer-regimes-connexes/est-regime-accession-a-propriete.html`]: 'Le Régime d’accession à la propriété',
  [`${C}/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan/participate-home-buyers-plan.html`]: 'How to participate in the Home Buyers’ Plan',
  [`${C}/fr/agence-revenu/services/impot/particuliers/sujets/reer-regimes-connexes/est-regime-accession-a-propriete/comment-participer-regime-accession-a-propriete.html`]: 'Comment participer au Régime d’accession à la propriété',
  [`${C}/en/services/benefits/education/education-savings/estimating-amounts.html`]: 'How much can be added to an RESP',
  [`${C}/fr/services/prestations/education/epargne-etudes/estimation-montants.html`]: 'Montants qui peuvent être ajoutés à un REEE',
  [`${C}/en/services/benefits/ei/ei-maternity-parental.html`]: 'EI maternity and parental benefits',
  [`${C}/fr/services/prestations/ae/assurance-emploi-maternite-parentales.html`]: 'Prestations de maternité et parentales de l’assurance-emploi',
  [`${C}/en/services/benefits/ei/ei-regular-benefit/apply.html`]: 'EI regular benefits: Apply',
  [`${C}/fr/services/prestations/ae/assurance-emploi-reguliere/demande.html`]: 'Prestations régulières d’assurance-emploi : Demande',
  [`${C}/en/services/benefits/ei/ei-regular-benefit/benefit-amount.html`]: 'EI regular benefits: How much you could receive',
  [`${C}/fr/services/prestations/ae/assurance-emploi-reguliere/montant-prestation.html`]: 'Prestations régulières d’assurance-emploi : Montant',
  [`${C}/en/services/benefits/ei/ei-regular-benefit/eligibility.html`]: 'EI regular benefits: Eligibility',
  [`${C}/fr/services/prestations/ae/assurance-emploi-reguliere/admissibilite.html`]: 'Prestations régulières d’assurance-emploi : Admissibilité',
  [`${C}/en/services/benefits/publicpensions/cpp/when-start.html`]: 'CPP: When to start your retirement pension',
  [`${C}/fr/services/prestations/pensionspubliques/rpc/quand-debut.html`]: 'RPC : Quand commencer à recevoir votre pension',
  [`${C}/en/services/benefits/publicpensions/old-age-security/apply.html`]: 'Old Age Security: Apply, delay or change your start date',
  [`${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/demande.html`]: 'Sécurité de la vieillesse : Demande, report ou changement',
  [`${C}/en/services/benefits/publicpensions/old-age-security/eligibility.html`]: 'Old Age Security: Do you qualify',
  [`${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/admissibilite.html`]: 'Sécurité de la vieillesse : Êtes-vous admissible',
  [`${C}/en/services/benefits/publicpensions/old-age-security/when-start.html`]: 'Old Age Security: When to start',
  [`${C}/fr/services/prestations/pensionspubliques/securite-vieillesse/quand-debut.html`]: 'Sécurité de la vieillesse : Quand commencer',
  [`${C}/en/services/defence/caf.html`]: 'Canadian Armed Forces',
  [`${C}/fr/services/defense/fac.html`]: 'Forces armées canadiennes',
  [`${C}/en/services/science/researchfunding.html`]: 'Research funding and awards',
  [`${C}/fr/services/science/financementrecherche.html`]: 'Financement, subventions et prix pour la recherche',
  [`${C}/en/services/taxes/income-tax/personal-income-tax/how-file/simplefile.html`]: 'SimpleFile',
  [`${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/comment-produire/declarer-simplement.html`]: 'Déclarer simplement',
  [`${C}/en/services/taxes/income-tax/personal-income-tax/how-file/tax-software/find-software.html`]: 'Find certified tax software',
  [`${C}/fr/services/impots/impot-sur-le-revenu/impot-sur-le-revenu-des-particuliers/comment-produire/logiciel-impot/trouver-logiciel.html`]: 'Trouver un logiciel d’impôt homologué',
};

const CITE = /\[(\d{1,2})\]\((https?:\/\/[^)\s]+)\)/g;
export const titleCitations = (text: string) => text.replace(CITE, (m, n: string, url: string) => (TITLES[url] ? `[${n}](${url} "${TITLES[url]}")` : m));

/** Adds page titles to every citation in a list of scenarios (reply, after and intl replies). */
export function withTitles(list: Scenario[]): Scenario[] {
  for (const s of list) {
    s.reply = mapCopy(s.reply, titleCitations);
    if (s.after) s.after = mapCopy(s.after, titleCitations);
  }
  return list;
}
