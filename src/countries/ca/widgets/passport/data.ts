/**
 * Passport facts, verified against canada.ca on 2026-09-29, re-checked 2026-09-30 (twice) (see each URL + "Date modified").
 * Isomorphic: used by the tool (server) and the planner (client, for instant toggles).
 *
 * Verified facts
 * - Fees in Canada (since 2026-03-31): 10-year adult $163.50, 5-year adult $122.50, child $58.50;
 *   urgent pickup $125.75, express pickup $50, standard pickup $20 (fees.json `passport-pickup-standard`,
 *   re-read 2026-09-30; apply-in-person.html: "Your passport will be mailed to you unless you pay the extra fee
 *   to pick it up in person").
 *   https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/fees/fee-changes-passport.html (2026-07-20)
 *   https://www.canada.ca/content/dam/ircc/documents/json/fees.json (live fee list used by canada.ca)
 * - Processing (excludes mailing): 10 business days in person at a passport office (10-day locations);
 *   20 business days at a Service Canada Centre, by mail, or online. Urgent: end of next business day.
 *   Express: 2 to 9 business days. processing-times.html (2026-03-30): "Passport office or Service Canada
 *   Centre with 10-day processing: 10 business days"; "Regular Service Canada Centre, scheduled outreach site,
 *   mail, or online: 20 business days"; "This doesn't include mailing time." Re-checked 2026-09-30.
 * - Renewal: no guarantor, proof of citizenship or supporting ID; 2 references needed.
 *   renew-adult-passport.html (2026-07-28); required-documents-photos.html (2026-04-27): references 18+,
 *   known you 2+ years. Can't be: your spouse or common-law partner; parents, step/foster parents, in-laws;
 *   children, grandchildren, siblings, grandparents (and their spouses/partners); or anyone else related to
 *   you or your partner by blood, marriage, common-law, adoption or guardianship WHO LIVES AT YOUR ADDRESS.
 *   So aunts, uncles, cousins, nieces and nephews CAN be references unless they live with you, and "a
 *   boyfriend, girlfriend or romantic partner can be a reference if you're not in a common-law relationship".
 * - Can renew if last passport: adult, issued at 16+, issued within 15 years, valid 5 or 10 years,
 *   same name/DOB/place of birth/gender identifier. check-who-renew.html (2026-04-27); the FR page
 *   (verifier-qui-renouveler.html) calls it « identifiant de sexe » (renew-online FR says « désignation de genre »).
 * - Online renewal: current passport is a regular (blue) one, valid 5 or 10 years, that shows your place of
 *   birth; expires within 6 months or already expired; home + mailing address in Canada; not travelling in
 *   the next 20 business days; digital photo by a commercial photographer, ≤ 6 months old; current passport
 *   cancelled when you apply; current passport not damaged, seized or surrendered, and no observations in it
 *   ("notes some people have on a separate page… like a name that was too long to be printed in full").
 *   FR: « n’est pas endommagé, saisi ou encore remis aux autorités », « aucune observation ». Sign-in link on the page: services/application/online-account.html#passport-renew
 *   (FR: services/demande/compte-en-ligne.html#passeport-renouveler). renew-online.html (2026-09-21)
 * - Urgent / express: only at a passport office. Urgent pick-up by the end of the next business day
 *   ($125.75), express pick-up in 2 to 9 business days ($50), on top of the passport fee. Proof of travel:
 *   "an airline, bus or train ticket" or "a travel itinerary showing proof of payment" (or proof of illness
 *   or death in the family, or a written statement). urgent-emergency-passport.html (2026-07-15)
 * - Emergency weekend or statutory holiday service: urgent-emergency-passport.html (2026-07-15; FR page
 *   2026-03-31) lists three options: urgent pick-up, express pick-up and "emergency weekend or statutory
 *   holiday service" (FR « service d’urgence offert la fin de semaine ou un jour férié »), and "If you already
 *   applied for a passport and now need it within the next 9 business days or less, call us… Extra fees may
 *   apply." HOW to request it is on apply-in-person.html (2026-08-24, read 2026-09-30), section "You need a
 *   passport on a weekend or statutory holiday (emergencies only)": "Call us ahead of time at 1-800-567-6868
 *   to find out how to submit the application. We answer the phone Monday to Friday from 8:30 am to 5 pm (your
 *   local time), from 9:00 am to 5:30 pm (Newfoundland), except for statutory holidays. You must provide proof
 *   you need the passport." Then "Get information on emergency passport services outside these hours: You can
 *   leave a message and ask for us to call you back on Friday or a weekday before a statutory holiday after
 *   5 pm (your local time), 5:30 pm (Newfoundland); on Saturday or Sunday. We’ll call you with information on
 *   emergency services between 9 am and 5 pm (your local time)." The call-back list does not name the
 *   statutory holiday itself, so on a weekday holiday we say the lines are closed and what the page lists.
 *   FR presenter-en-personne.html (2026-08-24): « Vous pouvez nous laisser un message et nous demander de vous
 *   rappeler : le vendredi ou un jour de semaine précédant un jour férié après 17 h (votre heure locale),
 *   17 h 30 (Terre-Neuve); le samedi ou le dimanche. Nous vous rappellerons pour vous donner des informations
 *   sur les services d’urgence entre 9 h et 17 h (votre heure locale). » « Vous devez fournir la preuve que
 *   vous avez besoin du passeport. » The service "is only for emergencies and if you have to travel over that
 *   specific weekend or statutory holiday".
 *   Fee: "you need to pay an additional $383.50 on top of the regular passport fees" (fees.json
 *   `passport-weekend`, was $335; fee-changes-passport.html 2026-07-20) and "If you need the weekend or holiday
 *   service for your family members at the same time, you need to pay an urgent service fee of $125.75 per
 *   family member" (fees.json `passport-pickup-urgent`); FR « des frais de service d’urgence de 125,75 $ par
 *   membre de la famille ».
 * - Passport Program phone lines: "We answer calls Monday to Friday, from 8:30 am to 5 pm, your local time
 *   (9:00 am to 5:30 pm in Newfoundland). We do not answer calls on statutory holidays" (Sept 30, 2026 is
 *   listed). contact-passport-program.html (2025-12-19, re-checked 2026-09-30); FR communiquer-programme-
 *   passeport.html (2026-02-25): « du lundi au vendredi, de 8 h 30 à 17 h, votre heure locale (de 9 h à 17 h 30
 *   à Terre-Neuve). Nous ne répondons pas aux appels les jours fériés ». Phone numbers are not shown (IRCC
 *   guidance): we link the page.
 * - Early renewal: "If you apply to renew your passport more than a year before it expires, we’ll ask you the
 *   reason for the early renewal. If you’re submitting your application by mail, you need to include a
 *   written explanation." check-who-renew.html (2026-04-27); FR verifier-qui-renouveler.html (2026-03-05)
 *   « plus d’un an avant son expiration, nous vous demanderons la raison de ce renouvellement anticipé ».
 * - Urgent pick-up wording (FR): delais-traitement.html (2026-03-30) « Avant la fin du jour ouvrable suivant ».
 *   Express: "Some locations take at least 3 or 4 business days" (Kelowna and Pointe-Claire 4 to 9,
 *   Charlottetown 3 to 9); proof of travel "If travelling by car, a written statement explaining why you need
 *   to travel"; "We can’t guarantee that you’ll get your passport on time… if… your application is
 *   incomplete". "You can request these services when you apply in person [or] after you apply, but you now
 *   need your passport sooner." urgent-emergency-passport.html (2026-07-15), FR passeport-urgent-express.html
 *   (2026-03-31).
 * - French service names: passeport-urgent-express.html (2026-03-31, re-read 2026-10-01) lists « service de
 *   retrait urgent (avant la fin du prochain jour ouvrable) », « service de retrait express (de 2 à 9 jours
 *   ouvrables) » and « service d’urgence offert la fin de semaine ou un jour férié ». The French strings and
 *   scripted answers use those names; only the tightest labels (a bar on the timeline) shorten them.
 * - Fee questions: IRCC guidance (vendor/cds-ai-answers context-ircc) sends them to the self-service page
 *   fees.html / frais.html (2026-09-11); amounts come from fees.json and fee-changes-passport.html.
 * - Delivery after processing usually 5 business days. get-passport.html (2026-04-27)
 * - Mail / in person form: PPTC 054. apply-by-mail.html
 * - Service notices are NOT hard-coded. The tool fetches canadian-passports.html (EN + FR) server-side and
 *   reads the uncommented .alert blocks (see notices.ts). On 2026-09-30 the page (modified 2026-07-16)
 *   shows a live alert-warning: "Wildfires in some parts of Canada may affect the mail delivery of
 *   passports or other travel documents"; the Canada Post and call-centre notices are commented out.
 *   If the fetch fails, the widget makes no claim and links to the page instead.
 */
import type { ToolSource } from '@/lib/widgets/types';

export const CHECKED = '2026-09-30';

export const PASSPORT = {
  fees: {
    adult10: 163.5,
    adult5: 122.5,
    child: 58.5,
    urgentPickup: 125.75,
    expressPickup: 50,
    standardPickup: 20,
    /** "Weekend or statutory holiday service" (fee-changes-passport.html; fees.json `passport-weekend`). */
    weekendHoliday: 383.5,
    since: '2026-03-31',
  },
  businessDays: { online: 20, mail: 20, serviceCanada: 20, passportOffice: 10 },
  deliveryBusinessDays: 5,
  onlineWindowMonths: 6,
  maxYearsSinceIssue: 15,
  references: 2,
  form: 'PPTC 054',
} as const;

type L = 'en' | 'fr';
const B = {
  en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports',
  fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens',
};

export const URLS = {
  renew: { en: `${B.en}/renew-adult-passport.html`, fr: `${B.fr}/renouvellement-passeport-adulte.html` },
  whoCanRenew: {
    en: `${B.en}/renew-adult-passport/check-who-renew.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/verifier-qui-renouveler.html`,
  },
  whatYouNeed: {
    en: `${B.en}/renew-adult-passport/required-documents-photos.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/documents-requis-photos.html`,
  },
  online: {
    en: `${B.en}/renew-adult-passport/submit-form-fees/renew-online.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/soumettre-formulaire-frais/renouveler-en-ligne.html`,
  },
  inPerson: {
    en: `${B.en}/renew-adult-passport/submit-form-fees/apply-in-person.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/soumettre-formulaire-frais/presenter-en-personne.html`,
  },
  mail: {
    en: `${B.en}/renew-adult-passport/submit-form-fees/apply-by-mail.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/soumettre-formulaire-frais/presenter-par-poste.html`,
  },
  processing: { en: `${B.en}/processing-times.html`, fr: `${B.fr}/delais-traitement.html` },
  /** Self-service fee page (where IRCC wants fee questions sent). */
  payFees: { en: `${B.en}/fees.html`, fr: `${B.fr}/frais.html` },
  fees: { en: `${B.en}/fees/fee-changes-passport.html`, fr: `${B.fr}/frais/modification-frais-passeport.html` },
  urgent: { en: `${B.en}/urgent-emergency-passport.html`, fr: `${B.fr}/passeport-urgent-express.html` },
  home: {
    en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports.html',
    fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens.html',
  },
  afterApply: {
    en: `${B.en}/renew-adult-passport/get-passport.html`,
    fr: `${B.fr}/renouvellement-passeport-adulte/obtenir-passeport.html`,
  },
  newAdult: { en: `${B.en}/new-adult-passport.html`, fr: `${B.fr}/nouveau-passeport-adulte.html` },
  contact: { en: `${B.en}/contact-passport-program.html`, fr: `${B.fr}/communiquer-programme-passeport.html` },
  offices: {
    en: 'https://ircc.canada.ca/english/passport/map/map.asp',
    fr: 'https://ircc.canada.ca/francais/passeport/map/carte.asp',
  },
} as const;

/**
 * Source titles: each page's own <title> (without " - Canada.ca"), shortened the same way the chat's
 * citation titles are (scenarios/titles.ts), so a page reads the same in the widget and in every answer.
 */
export const TITLES = {
  renew: { en: 'How to renew a passport in Canada', fr: 'Comment renouveler un passeport pour adulte' },
  whoCanRenew: { en: 'Check if you can renew your passport', fr: 'Vérifiez si vous pouvez renouveler votre passeport' },
  whatYouNeed: { en: 'What you need to renew your adult passport', fr: 'Ce dont vous avez besoin pour renouveler votre passeport' },
  online: { en: 'Renew a passport online', fr: 'Renouveler un passeport en ligne' },
  processing: { en: 'Passport service standards', fr: 'Normes de service pour les passeports' },
  fees: { en: 'Passport fee changes', fr: 'Modification des frais de passeport' },
  // The page's own title runs past 80 characters ("Pay your fees for a Canadian passport, another travel
  // document or other services"): a citation is one line in the shell's footer, so it is named by what it is for.
  payFees: { en: 'Pay your passport fees', fr: 'Payer les frais de passeport' },
  inPerson: { en: 'Renew a passport in person', fr: 'Renouveler un passeport en personne' },
  urgent: { en: 'Urgent and express passport services', fr: 'Services de passeport urgents et express' },
  contact: { en: 'Contact the Passport Program', fr: 'Communiquer avec le Programme de passeport' },
  afterApply: {
    en: 'Getting your passport after you apply for a renewal',
    fr: 'Obtenez votre passeport après avoir présenté une demande de renouvellement',
  },
} satisfies Partial<Record<keyof typeof URLS, Record<L, string>>>;
const T = TITLES;

/** Pages a plan can cite. The last two back the pick-up and emergency answers, and are listed only with them. */
export type SourceKey = 'renew' | 'online' | 'processing' | 'payFees' | 'fees' | 'whatYouNeed' | 'whoCanRenew' | 'urgent' | 'inPerson';
const ALWAYS: readonly SourceKey[] = ['renew', 'online', 'processing', 'payFees', 'fees', 'whatYouNeed', 'whoCanRenew'];

/**
 * The pages behind a plan. `lead` goes first, in its order: the shell's footer shows the first source, so it
 * must be the page that backs the answer card's numbers (the fee pages for a fee question, and so on).
 */
export function passportSources(lang: L, lead: readonly SourceKey[] = []): ToolSource[] {
  const page: Record<SourceKey, ToolSource> = {
    renew: {
      title: T.renew[lang],
      url: URLS.renew[lang],
      checked: CHECKED,
      updated: '2026-07-28',
      quote:
        lang === 'fr'
          ? 'Il est plus simple de renouveler un passeport que de présenter une nouvelle demande, parce que vous n’avez pas besoin de répondant, de preuve de citoyenneté canadienne ou de preuve d’identité.'
          : 'Renewing a passport is simpler than applying for a new one. This is because you don’t need a guarantor, proof of Canadian citizenship or supporting identification.',
    },
    online: {
      title: T.online[lang],
      url: URLS.online[lang],
      checked: CHECKED,
      updated: '2026-09-21',
      quote:
        lang === 'fr'
          ? 'Votre passeport expirera dans les 6 prochains mois ou a déjà expiré.'
          : 'Your passport will expire in the next 6 months or is expired right now.',
    },
    processing: { title: T.processing[lang], url: URLS.processing[lang], checked: CHECKED, updated: '2026-03-30' },
    payFees: { title: T.payFees[lang], url: URLS.payFees[lang], checked: CHECKED, updated: '2026-09-11' },
    fees: {
      title: T.fees[lang],
      url: URLS.fees[lang],
      checked: CHECKED,
      updated: '2026-07-20',
      quote:
        lang === 'fr'
          ? 'Au 31 mars 2026, la plupart des frais de passeport et de documents de voyage ont augmenté pour tenir compte de l’inflation et des coûts de service.'
          : 'As of March 31, 2026, most passport and travel document fees increased to reflect inflation and service delivery costs.',
    },
    whatYouNeed: { title: T.whatYouNeed[lang], url: URLS.whatYouNeed[lang], checked: CHECKED, updated: '2026-04-27' },
    whoCanRenew: { title: T.whoCanRenew[lang], url: URLS.whoCanRenew[lang], checked: CHECKED, updated: '2026-04-27' },
    urgent: { title: T.urgent[lang], url: URLS.urgent[lang], checked: CHECKED, updated: lang === 'fr' ? '2026-03-31' : '2026-07-15' },
    inPerson: { title: T.inPerson[lang], url: URLS.inPerson[lang], checked: CHECKED, updated: '2026-08-24' },
  };
  return [...lead, ...ALWAYS.filter((k) => !lead.includes(k))].map((k) => page[k]);
}

/** IRCC Portal sign-in for passport renewal (the link renew-online.html itself uses, 2026-09-21). */
export const PORTAL = {
  en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/online-account.html#passport-renew',
  fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/compte-en-ligne.html#passeport-renouveler',
};
