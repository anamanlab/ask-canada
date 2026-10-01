/**
 * Benefits facts, verified against canada.ca on 2026-09-30 (each URL + its "Date modified").
 * The rates themselves live in ./rates.ts (the only part the widget loads in the browser); this file adds the
 * official pages, their titles and the payment-date fallback, which the tools and lab fixtures use.
 *
 * Verified facts
 * - Canada Groceries and Essentials Benefit (CGEB) replaced the GST/HST credit in July 2026; same eligibility,
 *   calculation and structure, 25% increase from July 2026 for 5 years. Quarterly, tax-free.
 *   canada-groceries-essentials-benefit.html (2026-06-08)
 *   July 2026–June 2027 (2025 base year): individual $445, spouse $445, each child under 19 $234, first child in a
 *   single-parent family $445, single supplement $234 phasing in from $11,564 (2% rate: chart row $15,000 → $513.72),
 *   phase-out threshold $46,432 (5% rate: chart row $50,000 single → $500.60). how-much/payment-amounts.html
 *   (2026-06-08), how-much/payments-chart.html (2026-06-08). Maximum incomes (2025 base year): single $60,012,
 *   couple $64,232, 1 child $68,912 … who-eligible.html (2026-03-02): 19+ (or younger with spouse/partner or child),
 *   resident of Canada for tax purposes.
 * - Canada child benefit, July 2026–June 2027 (2025 income): under 6 $8,157/yr ($679.75/mo), 6–17 $6,883/yr
 *   ($573.58/mo). AFNI ≤ $38,237 no reduction; $38,237–$82,847: 7% / 13.5% / 19% / 23% (1/2/3/4+ children);
 *   over $82,847: $3,123 / $6,022 / $8,476 / $10,260 + 3.2% / 5.7% / 8% / 9.5%.
 *   canada-child-benefit-we-calculate-your-ccb.html (2026-06-23). Eligibility: lives with child under 18, primarily
 *   responsible, resident, status (citizen/PR/protected person/temporary resident 18 months/Indian Act).
 *   who-apply.html (2025-11-20)
 * - Child disability benefit: up to $3,480/yr ($290/mo) per DTC-eligible child; reduced over $82,847 by 3.2%
 *   (1 child) or 5.7% (2+). child-disability-benefit.html (2026-06-15)
 * - Canada workers benefit, 2025 tax year: max basic $1,633 single / $2,813 family; 27% of working income over
 *   $3,000 (Schedule 6 lines 17–19); reduced 15% over $26,855 single / $30,639 family; ends $37,742 / $49,393.
 *   Disability supplement max $843, 27% of working income over $1,150, reduced 15% (7.5% if spouse also DTC) over
 *   $37,740 single / $49,389 family. QC, AB, NU amounts differ. Up to 50% paid in advance (ACWB).
 *   …/line-45300-canada-workers-benefit-cwb/how-much-you-can-get.html (2026-04-08; the French page,
 *   combien-demander.html, says 2026-04-09: both re-read 2026-10-01), who-is-eligible.html
 *   (2026-04-08, French qui-a-droit.html the same): 19+ (or spouse/child), resident all year, not a full-time student > 13 weeks without a dependant.
 *   5000-S6 2025 (Schedule 6 text version).
 * - Canadian Dental Care Plan: no access to dental insurance, tax returns filed, AFNI < $90,000, Canadian
 *   resident. qualify.html (2026-09-22). Co-payment 0% under $70,000; 40% $70,000–$79,999; 60% $80,000–$89,999.
 *   coverage.html (2026-08-27). Applications open for 2026-2027. apply.html (2026-09-24)
 * - Old Age Security, October–December 2026: 65–74 up to $762.50/mo; 75+ up to $838.75/mo. GIS single up to
 *   $1,138.90 (income < $23,112); spouse gets full OAS up to $685.56 (combined < $30,528); spouse no OAS up to
 *   $1,138.90 (combined < $55,392). payments.html (2026-09-29). 10 years in Canada after 18 (20 if living
 *   abroad); partial pension = years ÷ 40. eligibility.html, benefit-amount.html (2026-09-29). Deferral 0.6%/mo up
 *   to 36% at 70 (age-70 example $1,037.00). when-start.html (2026-09-29). Recovery tax 15% of net income over
 *   $93,454 (2025 income), held back from July 2026–June 2027 payments: the basis every estimate here uses (worked
 *   example: $100,000 in 2025 → $981.90). $95,323 (2026 income) applies to July 2027–June 2028.
 *   recovery-tax.html (re-verified 2026-10-01), payments.html (2026-09-29).
 *   Automatic 10% increase at 75.
 * - GIS income: excludes the OAS pension (and GIS), the first $5,000 of employment/self-employment income and 50% of
 *   the next $10,000. Quarterly report "Maximum Benefit Amounts and Related Figures - CPP (2026) and OAS (October to
 *   December 2026)", footnote 6 (2026-09-29). GIS by income: Open Government "OAS - Table of Benefit Amounts by
 *   marital status and income level", Tables 1–2 CSV, October–December 2026 (2026-09-29). Our formula matches every
 *   row within $2/month: single = $1,138.90 − income/24 − min($176.41, (income − $2,000)/48) a month; each partner
 *   of an OAS pensioner = $685.56 − combined/48 − min($49.99, (combined − $4,000)/96) a month.
 * - CPP retirement pension: max at 65 $1,507.65/mo (January 2026); average new pension at 65 $858.34/mo
 *   (July 2026). amount.html (2026-09-29). Early: −0.6%/mo to −36% at 60; late: +0.7%/mo to +42% at 70.
 *   when-start.html (2026-06-18): "no advantage to waiting after age 70"; applying after 65, you can request a
 *   retroactive start date "as early as 11 months before the month we received your application" (re-checked
 *   2026-09-30). Eligible at 60+ with one valid contribution. eligibility.html.
 * - Canada Disability Benefit: 18–64, DTC approved, 2025 return filed (and spouse), resident, status.
 *   eligibility.html (2026-09-15). July 2026–June 2027 max $204.20/mo; working income exemption $10,210 single /
 *   $14,294 couple; reduction 20% (10% each when both spouses eligible) over $23,000 single / $32,500 couple.
 *   amount.html (2026-09-15, re-read 2026-10-01). The maximum and the working income exemptions are stated for
 *   July 2026 to June 2027. The thresholds ($23,000 / $32,500) and the 20% / 10% rates are stated in the page's
 *   calculation steps ("your adjusted family net income is $23,000 or less … reduced by 20 cents"), which the page
 *   notes are still "calculated using data for the period of July 2025 to June 2026"; it gives no other
 *   thresholds for 2026–2027, so we use these with the 2026–2027 maximum and exemptions (shown as an estimate).
 * - EI regular benefits: 55% of average insurable weekly earnings; 2026 maximum insurable earnings $68,900 →
 *   max $729/week; 14 to 45 weeks; 420–700 hours depending on regional unemployment; family supplement if net
 *   family income ≤ $25,921; taxable. benefit-amount.html (2025-12-31), eligibility.html (2026-08-31).
 *   Apply within 4 weeks of last day of work or you may lose benefits. apply.html
 * - Canada Student Grant for Full-Time Students: up to $4,200/yr ($525/month of study) until end of 2026–2027;
 *   income thresholds by family size (effective 2026-08-01): max-grant below $38,474 (1) … cut-off $69,987 (1) ….
 *   Not in QC, NT, NU. full-time.html (2026-08-31)
 * - Payment dates (live): https://www.canada.ca/en/services/benefits/calendar.html (2026-08-07), parsed from
 *   `<details id="ccb-2026">` etc. Static fallback below matches that page on 2026-09-30.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { LINK_BASE, OFFICIAL, bilingual as L } from './links';
import type { Lang, PayKey } from './rates';

export * from './rates';
export const CHECKED = '2026-09-30';

/** Upcoming payment dates on 2026-09-30 (benefits calendar); the tool refreshes them live. */
export const PAYMENT_DATES_FALLBACK: Record<PayKey, string[]> = {
  ccb: ['2026-10-20', '2026-11-20', '2026-12-11'],
  cgeb: ['2026-10-05'],
  cwb: ['2026-10-09'],
  cpp: ['2026-10-28', '2026-11-26', '2026-12-22'],
  oas: ['2026-10-28', '2026-11-26', '2026-12-22'],
  cdb: ['2026-10-15', '2026-11-19', '2026-12-17'],
};

const { CRA, ARC } = LINK_BASE;
const CWB_EN = '/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-45300-canada-workers-benefit-cwb';
const CWB_FR = '/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/declaration-revenus/remplir-declaration-revenus/deductions-credits-depenses/ligne-45300-allocation-canadienne-travailleurs-act';

export const URLS = {
  ...OFFICIAL,
  cgeb: L(`${CRA}/canada-groceries-essentials-benefit.html`, `${ARC}/allocation-canadienne-epicerie-besoins-essentiels.html`),
  cgebAmounts: L(`${CRA}/canada-groceries-essentials-benefit/how-much/payment-amounts.html`, `${ARC}/allocation-canadienne-epicerie-besoins-essentiels/combien-recevoir/montants-versements.html`),
  cgebWho: L(`${CRA}/canada-groceries-essentials-benefit/who-eligible.html`, `${ARC}/allocation-canadienne-epicerie-besoins-essentiels/qui-admissible.html`),
  cgebGet: L(`${CRA}/canada-groceries-essentials-benefit/get-benefit.html`, `${ARC}/allocation-canadienne-epicerie-besoins-essentiels/obtenir-allocation.html`),
  ccbAmount: L(`${CRA}/canada-child-benefit-overview/canada-child-benefit-we-calculate-your-ccb.html`, `${ARC}/allocation-canadienne-enfants/combien-recevoir.html`),
  ccbWho: L(`${CRA}/canada-child-benefit/who-apply.html`, `${ARC}/allocation-canadienne-enfants/qui-demande.html`),
  ccbApply: L(`${CRA}/canada-child-benefit/how-apply.html`, `${ARC}/allocation-canadienne-enfants/comment-demande.html`),
  childDisability: L(`${CRA}/child-disability-benefit.html`, `${ARC}/prestation-enfants-handicapes.html`),
  calculator: L(`${CRA}/child-family-benefits-calculator.html`, `${ARC}/calculateur-prestations-enfants-familles.html`),
  cwb: L(`${CWB_EN}.html`, `${CWB_FR}.html`),
  cwbAmount: L(`${CWB_EN}/how-much-you-can-get.html`, `${CWB_FR}/combien-demander.html`),
  cwbWho: L(`${CWB_EN}/who-is-eligible.html`, `${CWB_FR}/qui-a-droit.html`),
  dental: L('/en/services/benefits/dental/dental-care-plan.html', '/fr/services/prestations/dentaire/regime-soins-dentaires.html'),
  dentalQualify: L('/en/services/benefits/dental/dental-care-plan/qualify.html', '/fr/services/prestations/dentaire/regime-soins-dentaires/admissibilite.html'),
  dentalCoverage: L('/en/services/benefits/dental/dental-care-plan/coverage.html', '/fr/services/prestations/dentaire/regime-soins-dentaires/couverture.html'),
  dentalApply: L('/en/services/benefits/dental/dental-care-plan/apply.html', '/fr/services/prestations/dentaire/regime-soins-dentaires/demande.html'),
  oasPayments: L('/en/services/benefits/publicpensions/old-age-security/payments.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/paiements.html'),
  oasAmount: L('/en/services/benefits/publicpensions/old-age-security/benefit-amount.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/montant-prestation.html'),
  oasElig: L('/en/services/benefits/publicpensions/old-age-security/eligibility.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/admissibilite.html'),
  oasWhen: L('/en/services/benefits/publicpensions/old-age-security/when-start.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/quand-debut.html'),
  oasRecovery: L('/en/services/benefits/publicpensions/old-age-security/recovery-tax.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/impot-recuperation.html'),
  oasApply: L('/en/services/benefits/publicpensions/old-age-security/apply.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/demande.html'),
  gis: L('/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti.html'),
  gisElig: L('/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/eligibility.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/admissibilite.html'),
  gisApply: L('/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/apply.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/demande.html'),
  oasQuarterly: L(
    '/en/employment-social-development/programs/pensions/pension/statistics/2026-quarterly-october-december.html',
    '/fr/emploi-developpement-social/programmes/pensions/pension/statistiques/rapport-trimestriel/2026-trimestriel-octobre-decembre.html',
  ),
  gisTable: { en: 'https://open.canada.ca/data/en/dataset/dfa4daf1-669e-4514-82cd-982f27707ed0', fr: 'https://ouvert.canada.ca/data/fr/dataset/dfa4daf1-669e-4514-82cd-982f27707ed0' },
  cppAmount: L('/en/services/benefits/publicpensions/cpp/amount.html', '/fr/services/prestations/pensionspubliques/rpc/montant-prestation.html'),
  cppWhen: L('/en/services/benefits/publicpensions/cpp/when-start.html', '/fr/services/prestations/pensionspubliques/rpc/quand-debut.html'),
  cppElig: L('/en/services/benefits/publicpensions/cpp/eligibility.html', '/fr/services/prestations/pensionspubliques/rpc/admissibilite.html'),
  cppApply: L('/en/services/benefits/publicpensions/cpp/apply.html', '/fr/services/prestations/pensionspubliques/rpc/demande.html'),
  retirementCalc: L('/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html', '/fr/services/prestations/pensionspubliques/rpc/calculatrice-revenu-retraite.html'),
  cdb: L('/en/services/benefits/disability/canada-disability-benefit.html', '/fr/services/prestations/handicap/prestation-canadienne-personnes-situation-handicap.html'),
  cdbAmount: L('/en/services/benefits/disability/canada-disability-benefit/amount.html', '/fr/services/prestations/handicap/prestation-canadienne-personnes-situation-handicap/montant.html'),
  cdbElig: L('/en/services/benefits/disability/canada-disability-benefit/eligibility.html', '/fr/services/prestations/handicap/prestation-canadienne-personnes-situation-handicap/eligibilite.html'),
  cdbApply: L('/en/services/benefits/disability/canada-disability-benefit/apply.html', '/fr/services/prestations/handicap/prestation-canadienne-personnes-situation-handicap/demande.html'),
  dtc: L(
    '/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html',
    '/fr/agence-revenu/services/impot/particuliers/segments/deductions-credits-impot-personnes-handicapees/credit-impot-personnes-handicapees.html',
  ),
  eiAmount: L('/en/services/benefits/ei/ei-regular-benefit/benefit-amount.html', '/fr/services/prestations/ae/assurance-emploi-reguliere/montant-prestation.html'),
  eiElig: L('/en/services/benefits/ei/ei-regular-benefit/eligibility.html', '/fr/services/prestations/ae/assurance-emploi-reguliere/admissibilite.html'),
  eiApply: L('/en/services/benefits/ei/ei-regular-benefit/apply.html', '/fr/services/prestations/ae/assurance-emploi-reguliere/demande.html'),
  eiEstimator: { en: 'https://estimateurae-eiestimator.service.canada.ca/en', fr: 'https://estimateurae-eiestimator.service.canada.ca/fr' },
  oasEstimator: { en: 'https://estimateursv-oasestimator.service.canada.ca/en', fr: 'https://estimateursv-oasestimator.service.canada.ca/fr' },
  student: L('/en/services/benefits/education/student-aid/grants-loans/full-time.html', '/fr/services/prestations/education/aide-etudiants/bourses-prets/temps-plein.html'),
  studentAid: L('/en/services/benefits/education/student-aid/grants-loans.html', '/fr/services/prestations/education/aide-etudiants/bourses-prets.html'),
  calendar: L('/en/services/benefits/calendar.html', '/fr/services/prestations/calendrier.html'),
  craAccount: L('/en/revenue-agency/services/e-services/cra-login-services.html', '/fr/agence-revenu/services/services-electroniques/services-ouverture-session-arc.html'),
  msca: L('/en/employment-social-development/services/my-account.html', '/fr/emploi-developpement-social/services/mon-dossier.html'),
} as const;

export type SourceKey =
  | 'cgeb'
  | 'cgebAmounts'
  | 'cgebGet'
  | 'ccbAmount'
  | 'ccbWho'
  | 'childDisability'
  | 'cwbAmount'
  | 'cwbWho'
  | 'dentalQualify'
  | 'dentalCoverage'
  | 'oasPayments'
  | 'oasAmount'
  | 'oasWhen'
  | 'oasRecovery'
  | 'gisElig'
  | 'oasQuarterly'
  | 'gisTable'
  | 'cppAmount'
  | 'cppWhen'
  | 'cdbAmount'
  | 'cdbElig'
  | 'eiAmount'
  | 'eiElig'
  | 'eiApply'
  | 'student'
  | 'calendar';

/** `updated`: the page's "Date modified"; `updatedFr` where the French page carries a different one. */
const META: Record<SourceKey, { en: string; fr: string; updated: string; updatedFr?: string; quote?: { en: string; fr: string } }> = {
  cgeb: {
    en: 'Canada Groceries and Essentials Benefit (CGEB)',
    fr: 'Allocation canadienne pour l’épicerie et les besoins essentiels (ACEBE)',
    updated: '2026-06-08',
    quote: {
      en: 'The Canada Groceries and Essentials Benefit (CGEB) replaced the GST/HST credit in July 2026.',
      fr: 'En juillet 2026, l’Allocation canadienne pour l’épicerie et les besoins essentiels (ACEBE) a remplacé le crédit pour la TPS/TVH.',
    },
  },
  cgebAmounts: { en: 'CGEB: Payment amounts', fr: 'ACEBE : Montants des versements', updated: '2026-06-08' },
  cgebGet: { en: 'How to get the Canada Groceries and Essentials Benefit', fr: 'Comment obtenir l’Allocation canadienne pour l’épicerie et les besoins essentiels', updated: '2026-06-08' },
  ccbAmount: {
    en: 'Canada child benefit: How much you can get',
    fr: 'Allocation canadienne pour enfants : Combien vous pourriez recevoir',
    updated: '2026-06-23',
    quote: { en: 'under 6 years of age: $8,157 per year ($679.75 per month)', fr: 'de moins de 6 ans : 8 157 $ par année (679,75 $ par mois)' },
  },
  ccbWho: { en: 'Canada child benefit: Who can apply', fr: 'Allocation canadienne pour enfants : Qui peut faire une demande', updated: '2025-11-20' },
  childDisability: { en: 'Child disability benefit (CDB)', fr: 'Prestation pour enfants handicapés (PEH)', updated: '2026-06-15' },
  cwbAmount: { en: 'Canada workers benefit: How much you can get', fr: 'Allocation canadienne pour les travailleurs : Combien pouvez-vous demander', updated: '2026-04-08', updatedFr: '2026-04-09' },
  cwbWho: { en: 'Canada workers benefit: Who is eligible', fr: 'Allocation canadienne pour les travailleurs : Qui a droit', updated: '2026-04-08' },
  dentalQualify: {
    en: 'Canadian Dental Care Plan: Do you qualify',
    fr: 'Régime canadien de soins dentaires : Êtes-vous admissible',
    updated: '2026-09-22',
    quote: { en: 'Requirement 3: Your adjusted family net income is less than $90,000', fr: 'Pour être admissible au RCSD, votre revenu familial net rajusté doit être inférieur à 90 000 $.' },
  },
  dentalCoverage: { en: 'What services are covered in the Canadian Dental Care Plan', fr: 'Quels sont les services couverts par le Régime canadien de soins dentaires', updated: '2026-08-27' },
  oasPayments: { en: 'Old Age Security payment amounts', fr: 'Montant des paiements de la Sécurité de la vieillesse', updated: '2026-09-29' },
  oasAmount: { en: 'Old Age Security: How much you could receive', fr: 'Sécurité de la vieillesse : Montant que vous pourriez recevoir', updated: '2026-09-29' },
  oasWhen: {
    en: 'Old Age Security: When to start',
    fr: 'Sécurité de la vieillesse : Quand commencer',
    updated: '2026-09-29',
  },
  oasRecovery: { en: 'Old Age Security pension recovery tax', fr: 'Impôt de récupération de la Sécurité de la vieillesse', updated: '2026-09-29' },
  gisElig: { en: 'Guaranteed Income Supplement: Do you qualify', fr: 'Supplément de revenu garanti : Êtes-vous admissible', updated: '2026-09-29' },
  oasQuarterly: {
    en: 'Maximum Benefit Amounts and Related Figures: CPP (2026) and OAS (October to December 2026)',
    fr: 'Montants maximaux des prestations et données connexes : RPC (2026) et SV (octobre à décembre 2026)',
    updated: '2026-09-29',
    quote: {
      en: 'The income level cut-offs do not include the OAS pension, the first $5,000 of employment or self-employment income and 50% of employment or self-employment income between $5,000 and $15,000.',
      fr: 'Les revenus annuels limites n’incluent pas la pension de la SV, les premiers 5 000 $ de revenus d’emploi ou de travail autonome et 50 % des revenus d’emploi ou de travail autonome entre 5 000 $ et 15 000 $.',
    },
  },
  gisTable: {
    en: 'Old Age Security: Table of Benefit Amounts by marital status and income level (Open Government)',
    fr: 'Sécurité de la vieillesse : Tableau des montants des prestations selon l’état matrimonial et le niveau de revenu (Gouvernement ouvert)',
    updated: '2026-09-29',
  },
  cppAmount: { en: 'CPP retirement pension: How much you could receive', fr: 'Pension de retraite du RPC : Montant que vous pourriez recevoir', updated: '2026-09-29' },
  cppWhen: {
    en: 'CPP retirement pension: When to start',
    fr: 'Pension de retraite du RPC : Quand commencer',
    updated: '2026-06-18',
    quote: {
      en: 'Payments increase by 0.7% each month (8.4% per year), up to 42% at age 70.',
      fr: 'Les versements augmentent de 0,7 % par mois (8,4% par année), jusqu\'à concurrence de 42 % si vous commencez à l\'âge de 70 ans.',
    },
  },
  cdbAmount: { en: 'Canada Disability Benefit: How much you could receive', fr: 'Prestation canadienne pour les personnes handicapées : Combien vous pourriez recevoir', updated: '2026-09-15' },
  cdbElig: { en: 'Canada Disability Benefit: Do you qualify', fr: 'Prestation canadienne pour les personnes handicapées : Êtes-vous admissible', updated: '2026-09-15' },
  eiAmount: {
    en: 'EI regular benefits: How much you could receive',
    fr: 'Assurance-emploi : Montant que vous pourriez recevoir',
    updated: '2025-12-31',
    quote: {
      en: 'As of January 1, 2026, the maximum yearly insurable earnings amount is $68,900. This means that you can receive a maximum amount of $729 per week.',
      fr: 'Depuis le 1er janvier 2026, le maximum de la rémunération annuelle assurable est de 68 900 $. Cela signifie que vous pouvez recevoir un montant maximal de 729 $ par semaine.',
    },
  },
  eiElig: { en: 'EI regular benefits: Do you qualify', fr: 'Assurance-emploi : Êtes-vous admissible', updated: '2026-08-31' },
  eiApply: {
    en: 'EI regular benefits: Apply',
    fr: 'Assurance-emploi : Présenter une demande',
    updated: '2026-06-02',
    quote: {
      en: 'If you apply for Employment Insurance (EI) more than 4 weeks after your last day of work, you may lose benefits.',
      fr: 'Si vous présentez une demande plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations.',
    },
  },
  student: { en: 'Canada Student Grant for Full-Time Students', fr: 'Bourse d’études canadienne pour les étudiants à temps plein', updated: '2026-08-31' },
  calendar: { en: 'Benefits payment dates', fr: 'Dates de paiement des prestations', updated: '2026-08-07' },
};

export function source(key: SourceKey, lang: Lang, extra: Partial<ToolSource> = {}): ToolSource {
  const m = META[key];
  return {
    title: m[lang],
    url: (URLS as Record<string, { en: string; fr: string }>)[key][lang],
    checked: CHECKED,
    updated: (lang === 'fr' && m.updatedFr) || m.updated,
    ...(m.quote ? { quote: m.quote[lang] } : {}),
    ...extra,
  };
}

export type LinkProgram = 'ccb' | 'childDisability' | 'cgeb' | 'cwb' | 'cdcp' | 'oas' | 'gis' | 'cpp' | 'cdb' | 'ei' | 'student';
/** How you get it: `taxes` = file your return and it's automatic; `apply` = apply once; `claim` = claim on the return. */
export type HowKind = 'taxes' | 'apply' | 'claim';

const LINKS: Record<LinkProgram, { info: keyof typeof URLS; action: keyof typeof URLS; how: HowKind }> = {
  ccb: { info: 'ccbAmount', action: 'ccbApply', how: 'apply' },
  childDisability: { info: 'childDisability', action: 'dtc', how: 'apply' },
  cgeb: { info: 'cgeb', action: 'cgebGet', how: 'taxes' },
  cwb: { info: 'cwb', action: 'cwbAmount', how: 'claim' },
  cdcp: { info: 'dentalQualify', action: 'dentalApply', how: 'apply' },
  cdb: { info: 'cdbElig', action: 'cdbApply', how: 'apply' },
  ei: { info: 'eiElig', action: 'eiApply', how: 'apply' },
  student: { info: 'student', action: 'studentAid', how: 'apply' },
  oas: { info: 'oasAmount', action: 'oasApply', how: 'apply' },
  gis: { info: 'gisElig', action: 'gisApply', how: 'apply' },
  cpp: { info: 'cppAmount', action: 'cppApply', how: 'apply' },
};

export type ProgramLinks = Record<LinkProgram, { info: string; action: string; how: HowKind }>;

export function programLinks(lang: Lang): ProgramLinks {
  const out = {} as ProgramLinks;
  for (const [id, l] of Object.entries(LINKS) as [LinkProgram, (typeof LINKS)[LinkProgram]][]) {
    out[id] = { info: URLS[l.info][lang], action: URLS[l.action][lang], how: l.how };
  }
  return out;
}
