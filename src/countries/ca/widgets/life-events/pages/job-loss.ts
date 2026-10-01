/**
 * Losing a job: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - Apply right away; more than 4 weeks after your last day of work you may lose benefits; send the ROE and
 *   documents after you apply. ei-regular-benefit/apply (2026-06-02); eligibility page (2026-08-31)
 * - ROEs are viewed in MSCA; employers submit them. my-account/ei (2026-06-26)
 * - Report every 2 weeks while on EI. employment-insurance-reporting (2026-08-31)
 */
import { CA, type Page } from './shared';

export const JOB_LOSS = {
  eiEligibility: {
    url: {
      en: `${CA}/en/services/benefits/ei/ei-regular-benefit/eligibility.html`,
      fr: `${CA}/fr/services/prestations/ae/assurance-emploi-reguliere/admissibilite.html`,
    },
    title: { en: 'EI regular benefits: Do you qualify', fr: 'Prestations régulières d’assurance-emploi : Êtes-vous admissible' },
    updated: '2026-08-31',
  },
  eiApply: {
    url: {
      en: `${CA}/en/services/benefits/ei/ei-regular-benefit/apply.html`,
      fr: `${CA}/fr/services/prestations/ae/assurance-emploi-reguliere/demande.html`,
    },
    title: { en: 'EI regular benefits: Apply', fr: 'Prestations régulières d’assurance-emploi : Présenter une demande' },
    updated: '2026-06-02',
    quote: {
      en: 'If you apply for Employment Insurance (EI) more than 4 weeks after your last day of work, you may lose benefits.',
      fr: 'Si vous présentez une demande d’assurance-emploi (AE) plus de 4 semaines après votre dernier jour de travail, vous pourriez perdre des prestations.',
    },
  },
  eiEstimator: {
    url: { en: 'https://estimateurae-eiestimator.service.canada.ca/en', fr: 'https://estimateurae-eiestimator.service.canada.ca/fr' },
    title: { en: 'Employment Insurance Benefits Estimator', fr: 'Estimateur des prestations d’assurance-emploi' },
    updated: '2026-06-02',
  },
  msca: {
    url: {
      en: `${CA}/en/employment-social-development/services/my-account.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/mon-dossier.html`,
    },
    title: { en: 'My Service Canada Account', fr: 'Mon dossier Service Canada' },
    updated: '2025-03-03',
  },
  mscaEi: {
    url: {
      en: `${CA}/en/employment-social-development/services/my-account/ei.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/mon-dossier/assurance-emploi.html`,
    },
    title: { en: 'Employment Insurance services in My Service Canada Account', fr: 'Services de l’assurance-emploi dans Mon dossier Service Canada' },
    updated: '2026-06-26',
  },
  eiReporting: {
    url: {
      en: `${CA}/en/services/benefits/ei/employment-insurance-reporting.html`,
      fr: `${CA}/fr/services/prestations/ae/declarations-assurance-emploi.html`,
    },
    title: { en: 'Employment Insurance reporting', fr: 'Déclarations de l’assurance-emploi' },
    updated: '2026-08-31',
  },
  jobBank: {
    url: { en: 'https://www.jobbank.gc.ca/findajob', fr: 'https://www.guichetemplois.gc.ca/trouverunemploi' },
    title: { en: 'Find a job: Job Bank', fr: 'Trouver un emploi : Guichet-Emplois' },
    updated: '2026-08-07',
  },
  benefitsFinder: {
    url: { en: `${CA}/en/services/benefits/finder.html`, fr: `${CA}/fr/services/prestations/chercheur.html` },
    title: { en: 'Benefits Finder', fr: 'Chercheur de prestations' },
    updated: '2026-04-16',
  },
} satisfies Record<string, Page>;
