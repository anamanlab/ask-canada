/**
 * Death of a loved one: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - CRA: report the date of death as soon as possible (1-800-959-8281, any option; or Form RC4111), even if the
 *   person had no benefits. notify-death-date (2026-09-17)
 * - CPP/OAS: cancel as soon as possible (1-800-277-9914); payable for the month of death, later payments repaid.
 *   cpp/cancel-cpp (2025-06-18)
 * - CPP death benefit: $2,500 basic + possible $2,500 top-up (max $5,000); executor should apply within 60 days.
 *   "If an estate exists, the executor named in the will or the administrator named by the Court" applies. "If no
 *   estate exists or if the executor has not applied", payment may go to others who apply, in order: whoever paid
 *   or is responsible for paying the funeral, the surviving spouse or common-law partner, the next of kin. Payment
 *   takes about 6 to 12 weeks from a completed application. (re-checked 2026-09-30, EN + FR)
 *   Apply online in My Service Canada Account (online CPP Death Benefit form) or by mail (ISP1200); no in-person
 *   channel is listed.
 *   The top-up (deaths from January 1, 2025) needs the deceased to qualify for the death benefit AND to have
 *   never received a CPP/QPP retirement pension, disability or post-retirement disability benefit, AND to have no
 *   surviving spouse or common-law partner eligible for a survivor's pension. cpp-death-benefit (2026-05-25,
 *   re-checked 2026-09-30)
 * - Survivor's pension: legally married to, or the common-law partner (conjugal, at least 1 year) of, the
 *   deceased contributor; a separated legal spouse may qualify if there's no common-law partner. Apply as soon as
 *   possible: back payments cover at most 12 months. Apply online (My Service Canada Account) or by mail
 *   (ISP1300). cpp-survivor-pension (2026-05-25, re-checked 2026-09-30); death/benefits-programs (2026-05-21).
 * - CPP children's benefits: under 18, or 18 to 25 and attending a recognized school or university full-time
 *   or part-time. cpp-childrens-benefit (2026-09-10). Allowance for the Survivor: 60 to 64, low income. (2026-09-25)
 * - Allowance for the Survivor, eligibility (re-checked 2026-09-30): "Your spouse or common-law partner has died and
 *   you have not remarried or entered into a new common-law relationship"; 60 to 64; live in Canada; "lived in Canada
 *   for at least 10 years since the age of 18"; not under a sponsorship agreement; annual income less than $31,152
 *   (October to December 2026). allowance-survivor/eligibility (2026-09-29). Overview: monthly, tax-free, up to
 *   $1,726.18 a month; "You will have to apply"; apply "no earlier than 11 months before your 60th birthday".
 *   allowance-survivor (2026-09-25). Apply online in My Service Canada Account, or with a paper form by mail.
 *   allowance-survivor/apply (2026-09-01).
 * - GIS (re-checked 2026-09-30): 65 or older, receive the OAS pension, live in Canada, not under a sponsorship
 *   agreement, income below the threshold (single, divorced or widowed: less than $23,112).
 *   guaranteed-income-supplement/eligibility (2026-09-29). Monthly, tax-free; single, widowed or divorced: up to
 *   $1,138.90 a month. guaranteed-income-supplement (2026-09-29). A letter "shortly after your 64th birthday"
 *   confirms OAS enrolment and that Service Canada will try to enrol you in the GIS automatically; no letter one
 *   month after your 64th birthday -> contact Service Canada. guaranteed-income-supplement/apply (2026-09-09).
 * - SIN: in a province, vital statistics notifies the SIN program; in a territory or outside Canada you must.
 *   Passport: mail a valid passport to Passport Program, Gatineau QC K1A 0G3 with a copy of the death certificate.
 *   death/notify (2026-09-24)
 * - Final return: death Jan 1 – Oct 31 -> April 30 of the next year; Nov 1 – Dec 31 -> 6 months after, same day.
 *   If the deceased, or their cohabiting spouse or partner, ran a business: file by June 15 of the next year
 *   (Dec 16 – 31 -> 6 months after), but a balance owing is still due on the regular date.
 *   Weekend or CRA public holiday -> next business day is on time. prepare-returns/filing-deadlines (2026-01-20,
 *   re-checked 2026-09-30)
 * - Legal representatives act through the CRA (never sign in as the person). represent-deceased (2026-01-20)
 */
import { LINKS } from '../facts';
import { CA, cra, type Page } from './shared';

export const DEATH = {
  death: {
    url: { en: `${CA}/en/services/life-events/death.html`, fr: `${CA}/fr/services/evenements-vie/deces.html` },
    title: { en: 'What to do when someone dies', fr: 'Que faire lors d’un décès' },
    updated: '2025-09-18',
  },
  deathNotify: {
    url: { en: `${CA}/en/services/life-events/death/notify.html`, fr: `${CA}/fr/services/evenements-vie/deces/aviser.html` },
    title: { en: 'What to do when someone dies: Notify of a death', fr: 'Que faire lors d’un décès : Aviser d’un décès' },
    updated: '2026-09-24',
  },
  deathBenefits: {
    url: {
      en: `${CA}/en/services/life-events/death/benefits-programs.html`,
      fr: `${CA}/fr/services/evenements-vie/deces/prestations-programmes.html`,
    },
    title: { en: 'What to do when someone dies: Benefits and programs', fr: 'Que faire lors d’un décès : Prestations et programmes' },
    updated: '2026-05-21',
  },
  craDeath: {
    url: cra(
      'services/tax/individuals/life-events/doing-taxes-someone-died/notify-death-date.html',
      'services/impot/particuliers/evenements-vie/faire-impots-personne-decedee/informer-date-deces.html',
    ),
    title: { en: 'Notify the CRA of a date of death', fr: 'Informer l’ARC de la date d’un décès' },
    updated: '2026-09-17',
    quote: {
      en: 'Even if the deceased was not receiving benefit payments, you should report the date of death.',
      fr: 'Même si la personne décédée ne recevait pas de prestations, vous devriez déclarer la date du décès.',
    },
  },
  cppCancel: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/cancel-cpp.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/rpc-annuler.html`,
    },
    title: { en: 'Cancel CPP and OAS benefits after a death', fr: 'Annuler les prestations du RPC et de la SV après un décès' },
    updated: '2025-06-18',
  },
  cppDeath: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/cpp-death-benefit.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/prestation-rpc-deces.html`,
    },
    title: { en: 'CPP death benefit', fr: 'Prestation de décès du RPC' },
    updated: '2026-05-25',
    quote: {
      en: 'The executor should apply for the benefit within 60 days of the date of death.',
      fr: 'L’exécuteur testamentaire devrait demander la prestation dans les 60 jours suivant la date du décès.',
    },
  },
  cppSurvivor: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/cpp-survivor-pension.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/rpc-pension-survivant.html`,
    },
    title: { en: 'CPP survivor’s pension', fr: 'Pension de survivant du RPC' },
    updated: '2026-05-25',
  },
  cppChildren: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/cpp/cpp-childrens-benefit.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/rpc/prestation-rpc-enfant.html`,
    },
    title: { en: 'CPP benefits for children under 25', fr: 'Prestations d’enfants de moins de 25 ans du RPC' },
    updated: '2026-09-10',
  },
  survivorAllowance: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/allocation-survivant.html`,
    },
    title: { en: 'Allowance for the Survivor', fr: 'Allocation au survivant' },
    updated: '2026-09-25',
  },
  survivorAllowanceEligibility: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor/eligibility.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/allocation-survivant/admissibilite.html`,
    },
    title: { en: 'Allowance for the Survivor: Do you qualify', fr: 'Allocation au survivant : Êtes-vous admissible' },
    updated: '2026-09-29',
  },
  survivorAllowanceApply: {
    url: {
      en: `${CA}/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/allowance-survivor/apply.html`,
      fr: `${CA}/fr/services/prestations/pensionspubliques/securite-vieillesse/supplement-revenu-garanti/allocation-survivant/demande.html`,
    },
    title: { en: 'Allowance for the Survivor: Apply', fr: 'Allocation au survivant : Présenter une demande' },
    updated: '2026-09-01',
  },
  finalReturn: {
    url: cra(
      'services/tax/individuals/life-events/doing-taxes-someone-died/prepare-returns/filing-deadlines.html',
      'services/impot/particuliers/evenements-vie/faire-impots-personne-decedee/preparer-declarations/dates-limites-produire-declarations.html',
    ),
    title: { en: 'Filing and payment due dates for someone who died', fr: 'Dates limites de production et de paiement pour une personne décédée' },
    updated: '2026-01-20',
  },
  representDeceased: {
    url: cra(
      'services/tax/individuals/life-events/doing-taxes-someone-died/represent-deceased.html',
      'services/impot/particuliers/evenements-vie/faire-impots-personne-decedee/representer-personne-decedee.html',
    ),
    title: { en: 'Represent someone who died', fr: 'Représenter une personne décédée' },
    updated: '2026-01-20',
  },
  sinDeath: {
    url: {
      en: `${CA}/en/employment-social-development/services/sin/reporting-death.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/numero-assurance-sociale/rapport-deces.html`,
    },
    title: { en: 'Social Insurance Number: Report a death', fr: 'Numéro d’assurance sociale : Déclarer un décès' },
    updated: '2026-05-13',
  },
  mentalHealth: {
    url: LINKS.mentalHealth,
    title: { en: 'Mental health support: get help', fr: 'Obtenir du soutien en matière de santé mentale' },
    updated: '2026-01-14',
  },
} satisfies Record<string, Page>;
