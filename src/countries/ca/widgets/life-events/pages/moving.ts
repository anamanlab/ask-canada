/**
 * Moving: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - "you must change your address with each government department or agency. Your new address is not shared
 *   automatically because government systems aren't connected." government/change-address.html (2026-09-10).
 *   The same page lists VAC, RCMP firearms, NEXUS, Transport Canada, health card + driver's licence (province).
 * - CRA: online in your CRA account (My Account > Profile), "Processing time: Immediate"; also phone 1-800-959-8281
 *   or Form RC325 by mail (4 to 6 weeks). "The CRA will not share your change of address". change-your-address (2026-03-20)
 * - Service Canada: OAS and CDCP can be changed in MSCA; EI, CPP and the Canada Disability Benefit cannot — call,
 *   request a call back (within 2 business days) or go in person. my-account/personal-information (2026-05-04)
 * - IRCC: "You only need to update your address if you have an active application in progress"; otherwise
 *   documents could be lost, or the application refused or considered abandoned. application/change-address (2026-05-12)
 * - Elections Canada: update online through the Online Voter Registration Service (ereg.elections.ca), or on
 *   your CRA tax return. elections.ca voter registration (2026-09-02)
 * - Passport: cross out the old address on page 4, write the new one above it, no correction fluid; a change of
 *   address doesn't make a passport invalid. passports help-centre/general (2025-12-03)
 * - Moving expenses: new home at least 40 km closer to new work or full-time post-secondary school. line-21900 (2026-01-20)
 * - SIN: no update needed for an address change unless waiting for a Confirmation of SIN letter. sin/update (2026-06-18)
 */
import { CA, cra, type Page } from './shared';

export const MOVING = {
  changeAddress: {
    url: { en: `${CA}/en/government/change-address.html`, fr: `${CA}/fr/gouvernement/changement-adresse.html` },
    title: { en: 'Change your address with the Government of Canada', fr: 'Changement d’adresse auprès du gouvernement du Canada' },
    updated: '2026-09-10',
    quote: {
      en: 'Your new address is not shared automatically because government systems aren’t connected.',
      fr: 'Votre nouvelle adresse n’est pas communiquée automatiquement, car les systèmes gouvernementaux ne sont pas reliés entre eux.',
    },
  },
  craAddress: {
    url: cra(
      'services/tax/individuals/topics/about-your-tax-return/change-your-address.html',
      'services/impot/particuliers/sujets/tout-votre-declaration-revenus/comment-changer-votre-adresse.html',
    ),
    title: { en: 'Change your address with the CRA', fr: 'Changer votre adresse auprès de l’ARC' },
    updated: '2026-03-20',
  },
  scPersonal: {
    url: {
      en: `${CA}/en/employment-social-development/services/my-account/personal-information.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/mon-dossier/renseignements-personnels.html`,
    },
    title: { en: 'Change your personal information with Service Canada', fr: 'Mettre à jour vos renseignements personnels auprès de Service Canada' },
    updated: '2026-05-04',
  },
  irccAddress: {
    url: {
      en: `${CA}/en/immigration-refugees-citizenship/services/application/change-address.html`,
      fr: `${CA}/fr/immigration-refugies-citoyennete/services/demande/changement-adresse.html`,
    },
    title: { en: 'Change my address: immigration and citizenship', fr: 'Changement d’adresse : immigration et citoyenneté' },
    updated: '2026-05-12',
  },
  elections: {
    url: {
      en: 'https://www.elections.ca/content2.aspx?section=vot&dir=reg&document=index&lang=e',
      fr: 'https://www.elections.ca/content2.aspx?section=vot&dir=reg&document=index&lang=f',
    },
    title: { en: 'Voter registration: Elections Canada', fr: 'Inscription des électeurs : Élections Canada' },
    updated: '2026-09-02',
  },
  ereg: {
    url: { en: 'https://ereg.elections.ca/en/ereg/index', fr: 'https://ereg.elections.ca/fr/ereg/index' },
    title: { en: 'Online Voter Registration Service', fr: 'Service d’inscription en ligne des électeurs' },
    updated: '2026-09-02',
  },
  passportHelp: {
    url: {
      en: `${CA}/en/immigration-refugees-citizenship/services/canadian-passports/help-centre/general.html`,
      fr: `${CA}/fr/immigration-refugies-citoyennete/services/passeports-canadiens/centre-aide/general.html`,
    },
    title: { en: 'Passports in general: help centre', fr: 'Passeports en général : centre d’aide' },
    updated: '2025-12-03',
    quote: { en: 'A change of address doesn’t make a passport invalid.', fr: 'Un changement d’adresse n’invalide pas un passeport.' },
  },
  movingExpenses: {
    url: cra(
      'services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-21900-moving-expenses.html',
      'services/impot/particuliers/sujets/tout-votre-declaration-revenus/declaration-revenus/remplir-declaration-revenus/deductions-credits-depenses/ligne-21900-frais-demenagement.html',
    ),
    title: { en: 'Line 21900: Moving expenses', fr: 'Ligne 21900 : Frais de déménagement' },
    updated: '2026-01-20',
  },
  sinUpdate: {
    url: {
      en: `${CA}/en/employment-social-development/services/sin/update.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/numero-assurance-sociale/mettre-a-jour.html`,
    },
    title: { en: 'Update your Social Insurance Number record', fr: 'Mettre à jour votre dossier de numéro d’assurance sociale' },
    updated: '2026-06-18',
  },
  sinApply: {
    url: {
      en: `${CA}/en/employment-social-development/services/sin/apply.html`,
      fr: `${CA}/fr/emploi-developpement-social/services/numero-assurance-sociale/demande.html`,
    },
    title: { en: 'Social Insurance Number: Apply', fr: 'Numéro d’assurance sociale : Présenter une demande' },
    updated: '2026-07-15',
  },
} satisfies Record<string, Page>;
