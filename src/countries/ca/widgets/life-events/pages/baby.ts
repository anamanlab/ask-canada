/**
 * Having a baby: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - Parents must register the birth with their province or territory; "Some provinces offer a newborn registration
 *   service" that also applies for a SIN and other child benefits. In all provinces the child's SIN can be requested at
 *   birth registration; in the territories, apply through Service Canada. life-events/child/register-birth (2025-11-18)
 * - CCB: apply as soon as your child is born; applying through birth registration needs no proof of birth; the
 *   CRA also checks related provincial and territorial programs. canada-child-benefit/how-apply (2026-06-25)
 * - EI maternity/parental: apply as soon as you stop working, after 4 weeks you may lose benefits; maternity can
 *   start as early as 12 weeks before the due date (max 15 weeks); standard parental up to 35 weeks, up to $729 a
 *   week; extended up to 61 weeks, up to $437 a week. ei-maternity-parental/apply (2026-06-02, re-checked 2026-09-30).
 *   Shared parental: up to 40 weeks standard or 69 weeks extended in total; one parent can't get more than 35 or 61.
 * - EI maternity/parental amount (re-checked 2026-09-30): maternity and standard parental = 55% of average insurable
 *   weekly earnings, "In 2026, the maximum amount is $729 a week"; extended parental = 33%, "In 2026, the maximum
 *   amount is $437 a week". ei-maternity-parental/benefit-amount (2024-07-29; the 2026 amounts are on the page).
 * - EI maternity/parental eligibility (re-checked 2026-09-30): "600 insured hours of work in the 52 weeks before the
 *   start of your claim" (or since your last claim, if shorter), and regular weekly earnings "decreased by more than
 *   40% for at least 1 week". The page links to the EI Benefits Estimator. ei-maternity-parental/eligibility (2024-10-24)
 * - Quebec residents: maternity/parental benefits come from the Quebec Parental Insurance Plan.
 *   life-events/child/financial-support (2025-11-18)
 * - Child passport: valid for up to 5 years, can't be renewed. child-passport (2026-03-31)
 * - RESP: ask the promoter to apply for the CLB and the CESG. education-savings (2026-04-24)
 */
import { CA, cra, type Page } from './shared';

export const BABY = {
  child: {
    url: { en: `${CA}/en/services/life-events/child.html`, fr: `${CA}/fr/services/evenements-vie/enfant.html` },
    title: { en: 'Welcoming a child', fr: 'Accueillir un enfant' },
    updated: '2025-11-18',
  },
  registerBirth: {
    url: {
      en: `${CA}/en/services/life-events/child/register-birth.html`,
      fr: `${CA}/fr/services/evenements-vie/enfant/enregistrer-naissance.html`,
    },
    title: { en: 'Register your child’s birth', fr: 'Enregistrer la naissance de votre enfant' },
    updated: '2025-11-18',
    quote: {
      en: 'Parents must register their child’s birth with their province or territory.',
      fr: 'Les parents doivent enregistrer la naissance de leur enfant auprès de leur province ou territoire.',
    },
  },
  ccbApply: {
    url: cra(
      'services/child-family-benefits/canada-child-benefit/how-apply.html',
      'services/prestations-enfants-familles/allocation-canadienne-enfants/comment-demande.html',
    ),
    title: { en: 'How to apply: Canada child benefit', fr: 'Comment faire une demande : Allocation canadienne pour enfants' },
    updated: '2026-06-25',
  },
  eiParentalApply: {
    url: {
      en: `${CA}/en/services/benefits/ei/ei-maternity-parental/apply.html`,
      fr: `${CA}/fr/services/prestations/ae/assurance-emploi-maternite-parentales/demande.html`,
    },
    title: { en: 'EI maternity and parental benefits: Apply', fr: 'Prestations de maternité et parentales de l’AE : Présenter une demande' },
    updated: '2026-06-02',
  },
  eiParentalAmount: {
    url: {
      en: `${CA}/en/services/benefits/ei/ei-maternity-parental/benefit-amount.html`,
      fr: `${CA}/fr/services/prestations/ae/assurance-emploi-maternite-parentales/montant-prestation.html`,
    },
    title: { en: 'EI maternity and parental benefits: How much you could receive', fr: 'Prestations de maternité et parentales de l’AE : Combien vous pourriez recevoir' },
    updated: '2024-07-29',
  },
  eiParentalEligibility: {
    url: {
      en: `${CA}/en/services/benefits/ei/ei-maternity-parental/eligibility.html`,
      fr: `${CA}/fr/services/prestations/ae/assurance-emploi-maternite-parentales/admissibilite.html`,
    },
    title: { en: 'EI maternity and parental benefits: Do you qualify', fr: 'Prestations de maternité et parentales de l’AE : Admissibilité' },
    updated: '2024-10-24',
  },
  childSupport: {
    url: {
      en: `${CA}/en/services/life-events/child/financial-support.html`,
      fr: `${CA}/fr/services/evenements-vie/enfant/aide-financiere.html`,
    },
    title: { en: 'Financial support and leave options', fr: 'Aide financière et options de congés' },
    updated: '2025-11-18',
  },
  childPassport: {
    url: {
      en: `${CA}/en/immigration-refugees-citizenship/services/canadian-passports/child-passport.html`,
      fr: `${CA}/fr/immigration-refugies-citoyennete/services/passeports-canadiens/passeport-enfant.html`,
    },
    title: { en: 'How to apply for a child passport in Canada', fr: 'Comment demander un passeport pour enfant au Canada' },
    updated: '2026-03-31',
  },
  resp: {
    url: {
      en: `${CA}/en/services/benefits/education/education-savings.html`,
      fr: `${CA}/fr/services/prestations/education/epargne-etudes.html`,
    },
    title: { en: 'Registered Education Savings Plans and related benefits', fr: 'Régimes enregistrés d’épargne-études et prestations connexes' },
    updated: '2026-04-24',
  },
} satisfies Record<string, Page>;
