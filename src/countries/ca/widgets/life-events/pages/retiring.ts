/**
 * Retiring: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - The retirement checklist's date is the date the person wants their CPP to start (not their last day of work):
 *   CPP can only start between 60 and 70, and the 12-month application window counts back from that start date.
 * - CPP: start as early as 60 or as late as 70; -0.6%/month before 65 (max 36%), +0.7%/month after 65 (max 42%).
 *   cpp/when-start (2026-06-18). You must apply; up to 12 months before your chosen start date. cpp/apply (2026-09-29)
 * - OAS: most people are enrolled automatically (letter around the 64th birthday); no letter one month after ->
 *   contact Service Canada. old-age-security/apply (2026-09-09)
 * - GIS: monthly tax-free payment, 65+, low income; often automatic. guaranteed-income-supplement (2026-09-29)
 * - RRSP: options (RRIF, annuity) up to the end of the year you turn 71. receiving-income-rrsp (2026-01-29)
 */
import { CA, cra, type Page } from './shared';

export const RETIRING = {
  retirement: {
    url: { en: `${CA}/en/services/life-events/retirement.html`, fr: `${CA}/fr/services/evenements-vie/retraite.html` },
    title: { en: 'Learn and plan for your retirement', fr: 'Apprendre et planifier pour votre retraite' },
    updated: '2026-02-20',
  },
  retirementCalculator: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/retirement-income-calculator.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/calculatrice-revenu-retraite.html`,
    },
    title: { en: 'Canadian Retirement Income Calculator', fr: 'Calculatrice du revenu de retraite canadienne' },
    updated: '2025-11-25',
  },
  cppWhen: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/when-start.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/quand-debut.html`,
    },
    title: { en: 'When to start your CPP retirement pension', fr: 'Quand commencer à recevoir votre pension de retraite du RPC' },
    updated: '2026-06-18',
  },
  cppApply: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/apply.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/demande.html`,
    },
    title: { en: 'CPP retirement pension: Apply', fr: 'Pension de retraite du RPC : Présenter une demande' },
    updated: '2026-09-29',
    quote: {
      en: 'You can apply up to 12 months before your chosen start date.',
      fr: 'Vous pouvez présenter une demande jusqu’à 12 mois avant la date de début choisie.',
    },
  },
  oasApply: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/apply.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/demande.html`,
    },
    title: { en: 'Old Age Security: Apply, delay, or change your start date', fr: 'Sécurité de la vieillesse : Présenter une demande, retarder ou modifier la date de début' },
    updated: '2026-09-09',
  },
  gis: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti.html`,
    },
    title: { en: 'Guaranteed Income Supplement', fr: 'Supplément de revenu garanti' },
    updated: '2026-09-29',
  },
  gisEligibility: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/eligibility.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/admissibilite.html`,
    },
    title: { en: 'Guaranteed Income Supplement: Do you qualify', fr: 'Supplément de revenu garanti : Êtes-vous admissible' },
    updated: '2026-09-29',
  },
  gisApply: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/apply.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/demande.html`,
    },
    title: { en: 'Guaranteed Income Supplement: Apply', fr: 'Supplément de revenu garanti : Présenter une demande' },
    updated: '2026-09-09',
  },
  rrspIncome: {
    url: cra(
      'services/tax/individuals/topics/rrsps-related-plans/receiving-income-rrsp.html',
      'services/impot/particuliers/sujets/reer-regimes-connexes/recevoir-revenu-vos-reer.html',
    ),
    title: { en: 'Receiving income from an RRSP', fr: 'Recevoir un revenu de vos REER' },
    updated: '2026-01-29',
  },
  scams: {
    url: {
      en: `${CA}/en/services/life-events/retirement/protect-yourself-scams-fraud.html`,
      fr: `${CA}/fr/services/evenements-vie/retraite/protegez-vous-arnaques-fraude.html`,
    },
    title: { en: 'Protect yourself from scams and fraud', fr: 'Protégez-vous contre les arnaques et la fraude' },
    updated: '2025-12-19',
  },
} satisfies Record<string, Page>;
