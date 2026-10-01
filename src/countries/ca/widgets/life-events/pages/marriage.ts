/**
 * Marriage or name change: the official pages this event's steps cite, and what was verified on each (fetched on
 * 2026-09-30; `updated` is the page's own "Date modified").
 *
 * - Tell the CRA by the end of the month after your status changed (e.g. March -> end of April). Common-law =
 *   12 continuous months living together, or parent of your child. Benefits recalculated from the month after.
 *   update-your-marital-status-canada-revenue-agency (2026-03-20)
 * - CRA name change: "We do not accept name changes online." By phone (1-800-959-8281) only "if you haven't already
 *   changed one of your names" (e.g. an earlier first-name change rules out a last-name change by phone); exception:
 *   changing back to a birth name the CRA has on file can be done by phone. Otherwise, and for changing both first
 *   and last names, mail or fax a letter with proof. should-you-tell-cra-about-your-change-name (2026-03-20,
 *   re-checked 2026-09-30)
 * - SIN: legal name change -> "you are required by law to update your record"; no fee; online ~5 business days.
 *   sin/update (2026-06-18)
 * - Passport: renewal requires the same name; otherwise apply for a new adult passport.
 *   check-who-renew (2026-04-27, see widgets/passport/data.ts), new-adult-passport (2026-03-31)
 */
import { CA, cra, type Page } from './shared';

export const MARRIAGE = {
  craMarital: {
    url: cra(
      'services/child-family-benefits/update-your-marital-status-canada-revenue-agency.html',
      'services/prestations-enfants-familles/mettre-a-jour-votre-etat-civil-aupres-agence-revenu-canada.html',
    ),
    title: { en: 'Change your marital status with the CRA', fr: 'Changer votre état civil auprès de l’ARC' },
    updated: '2026-03-20',
    quote: {
      en: 'You must tell the Canada Revenue Agency (CRA) about your new marital status by the end of the following month after your status changed.',
      fr: 'Vous devez informer l’Agence du revenu du Canada (ARC) de votre nouvel état civil au plus tard à la fin du mois suivant celui du changement.',
    },
  },
  craName: {
    url: cra(
      'services/tax/individuals/topics/about-your-tax-return/should-you-tell-cra-about-your-change-name.html',
      'services/impot/particuliers/sujets/tout-votre-declaration-revenus/comment-pouvez-vous-nous-informer-votre-changement.html',
    ),
    title: { en: 'Change your name with the CRA', fr: 'Changer votre nom auprès de l’ARC' },
    updated: '2026-03-20',
  },
  craPersonal: {
    url: cra('services/update-information-cra/personal.html', 'services/mettre-a-jour-renseignements-arc/personnels.html'),
    title: { en: 'Update your personal information with the CRA', fr: 'Mettre à jour vos renseignements personnels auprès de l’ARC' },
    updated: '2025-07-03',
  },
  newPassport: {
    url: {
      en: `${CA}/en/immigration-refugees-citizenship/services/canadian-passports/new-adult-passport.html`,
      fr: `${CA}/fr/immigration-refugies-citoyennete/services/passeports-canadiens/nouveau-passeport-adulte.html`,
    },
    title: { en: 'Apply for a new adult passport in Canada', fr: 'Demander un passeport pour adulte au Canada' },
    updated: '2026-03-31',
  },
} satisfies Record<string, Page>;
