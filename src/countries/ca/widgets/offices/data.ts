/**
 * Service Canada office facts, verified on 2026-09-30 (see each URL + "Date modified").
 * Isomorphic: used by the tool (server) and the finder (client, for the live "open now" clock).
 *
 * Verified facts
 * - Office list, addresses, hours, lunch closures, languages, accessibility, parking, services offered and
 *   temporary closures: the official "Find a Service Canada Office" pages, one per office
 *   (https://offices.service.canada.ca/en/Office/<id> · https://bureaux.service.canada.ca/fr/Bureau/<id>),
 *   crawled 2026-09-30 into offices.json (574 points of service in 13 provinces and territories;
 *   "Date modified" 2026-07-28). Coordinates were geocoded once from each official address with the
 *   Government of Canada geolocator (geolocator.api.geo.ca) and checked against the postal code.
 * - Address lines were normalised from the crawl: "Floor 2" → "2nd floor" / "2e étage", "&" → "and" / "et",
 *   straight apostrophes → ’, and "(May also be accessed via …)" moved to the office's `note`.
 * - Holiday closures 2026 (all locations): Jan 1, Apr 3, Apr 6, May 18, Jun 24 (Quebec only), Jul 1,
 *   Aug 3 (except Quebec), Aug 17 (Yukon only), Sep 7, Sep 30, Oct 12, Nov 11, Dec 25, Dec 28, and Jan 1, 2027.
 *   "All locations are closed on public holidays." SearchPassport page (2026-07-28).
 * - Passport service levels shown by the finder: urgent pick-up (end of the next business day, proof of
 *   need), express pick-up (2 to 9 business days), 10 business days pick-up or by mail, 20 business days
 *   delivery by mail (mail time not included). Biometrics: "You must book an appointment before you visit."
 *   SearchPassport page (2026-07-28). Express exceptions — "Some locations take at least 3 or 4 business days to
 *   process express applications": Kelowna BC 4 to 9, Pointe-Claire QC 4 to 9, Charlottetown PEI 3 to 9 business days
 *   (`expressDays` on offices 5987, 2383, 1959 in offices.json; EXPRESS_DAYS below).
 *   https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/urgent-emergency-passport.html
 *   (Date modified 2026-07-15; FR page passeport-urgent-express.html, 2026-03-31, same ranges; checked 2026-09-30).
 *   Fees are NOT shown here: the finder's modal still says $110 for urgent
 *   while IRCC's fee page says $125.75 since 2026-03-31, so we link the IRCC fee page instead.
 * - Passport appointments "are subject to availability"; biometrics need an appointment; you can visit
 *   without one for urgent requests. SearchPassport page + eServiceCanada booking tool (2026-09-30).
 * - Booking a passport or biometrics appointment: eServiceCanada Appointment Booking Tool; takes about
 *   5 to 15 minutes; biometrics needs the application number from the Biometric Instruction Letter.
 *   https://eservices.canada.ca/en/reservation/ (checked 2026-09-30)
 * - Anything else: eServiceCanada Service Request Form — "A representative will contact you by telephone
 *   within two business days." If it can't be done by phone, they offer an appointment at a Service Canada
 *   Centre. Don't include SIN, date of birth, financial or medical details in the comments box.
 *   https://eservices.canada.ca/en/service/ (checked 2026-09-30)
 * - Walk-ins: "If no appointment is available at your preferred location, you can still visit a Service Canada
 *   location without an appointment." eServiceCanada booking tool (checked 2026-09-30). Exception found by
 *   crawling every staffed office page on 2026-09-30: "The Kingston Service Canada Centre is appointment based
 *   only … walk-in services are not supported", appointments by calling 613-856-9022 (office 3792) →
 *   `apptOnly` in offices.json. No other staffed office page carries such a notice.
 * - Urgent passport: pick-up "by the end of next business day"; bring proof of travel ("an airline, bus or
 *   train ticket" or "a travel itinerary showing proof of payment"). urgent-emergency-passport.html (2026-07-15)
 * - Program phone lines (vendor/cds-ai-answers context-edsc-esdc, each re-checked on its contact page
 *   2026-09-30): EI 1-800-206-7218 (FR line 1-800-808-6352; ei-individual.html, 2026-06-03);
 *   CPP and OAS 1-800-277-9914 (FR line 1-800-277-9915; cpp.html / oas.html, 2026-07-23);
 *   SIN 1-866-274-6627 (sin.html, 2026-05-20); Canadian Dental Care Plan 1-833-537-4342
 *   (dental-care-plan/contact.html, 2026-04-10); Canada Disability Benefit 1-833-486-3007 (TTY 1-833-467-2700;
 *   canada-disability-benefit/contact.html, 2026-09-15). Lines run Monday to Friday, 8:30 a.m. to 4:30 p.m.
 *   local time. Each row links its contact page first (the guidance for SIN: the right contact depends on the
 *   situation, so send people to the contact page), with the number as the secondary action.
 * - English short names keep French accents ("Montréal", "Québec"), like the official English names of the
 *   Montréal centres ("Montréal (Downtown) Service Canada Centre") and each office's city line; the official
 *   page title of the two passport offices drops them ("Montreal Service Canada Centre - Passport Services").
 * - 1 800 O-Canada 1-800-622-6232, TTY 1-800-926-9105 (listed under General Inquiries / Direct TTY on
 *   every office page, 2026-07-28).
 * - Which passport applications a Service Canada Centre accepts vs a passport office (urgent/express, one
 *   parent for a child, living outside Canada/US, name different from proof of citizenship):
 *   submit-passport-service-canada.html (2023-05-18). "over 300 Service Canada Centres that offer passport services".
 * - Online renewal (adults): not if you're travelling in the next 20 business days; "It can take up to 20 business
 *   days to process your application, plus mailing time." renew-online.html (Date modified 2026-09-21).
 * - Kingston is appointment-only (above), so the passport card says "most locations also serve you without
 *   one", never "always".
 * - LIVE: office status and wait times from ESDC's public wait-time feed used by the official finder:
 *   https://api.io.canada.ca/io-server/esdc-edsc/scc/wait-times/v1/office/<id> (isClosed, isHoliday,
 *   isClosedUnexpected, waitingTimeManual, lastUpdated). Postal codes → first 3 characters only, located
 *   with the Government of Canada geolocator (NRCan): https://geolocator.api.geo.ca/?q=<FSA>.
 */
import type { ToolSource } from '@/lib/widgets/types';

export const CHECKED = '2026-09-30';
const FINDER_UPDATED = '2026-07-28';

export type L = 'en' | 'fr';

/** Usual express pick-up window (business days); some offices override it with `Office.expressDays`. */
export const EXPRESS_DAYS: [number, number] = [2, 9];

export const URLS = {
  finder: { en: 'https://offices.service.canada.ca/en/Search', fr: 'https://bureaux.service.canada.ca/fr/Recherche' },
  finderPassport: { en: 'https://offices.service.canada.ca/en/SearchPassport', fr: 'https://bureaux.service.canada.ca/fr/RecherchePasseport' },
  booking: { en: 'https://eservices.canada.ca/en/reservation/', fr: 'https://eservices.canada.ca/fr/reservation/' },
  callback: { en: 'https://eservices.canada.ca/en/service/', fr: 'https://eservices.canada.ca/fr/service/' },
  submitAtScc: {
    en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/submit-passport-service-canada.html',
    fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens/demande-passeport-service-canada.html',
  },
  renewOnline: {
    en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/renew-adult-passport/submit-form-fees/renew-online.html',
    fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens/renouvellement-passeport-adulte/soumettre-formulaire-frais/renouveler-en-ligne.html',
  },
  urgent: {
    en: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/urgent-emergency-passport.html',
    fr: 'https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens/passeport-urgent-express.html',
  },
} as const;

/** Official page for one office. */
export const officeUrl = (id: string, lang: L) =>
  lang === 'fr' ? `https://bureaux.service.canada.ca/fr/Bureau/${encodeURIComponent(id)}` : `https://offices.service.canada.ca/en/Office/${encodeURIComponent(id)}`;

export const PHONE = { oCanada: '1-800-622-6232', tty: '1-800-926-9105' } as const;

/** Program lines for "Other" appointments (ESDC guidance: always give the program's own number). */
export type ProgramId = 'ei' | 'cppOas' | 'sin' | 'dental' | 'cdb';
export const PROGRAMS: { id: ProgramId; phone: { en: string; fr: string }; url: { en: string; fr: string }; updated: string }[] = [
  {
    id: 'ei',
    phone: { en: '1-800-206-7218', fr: '1-800-808-6352' },
    url: {
      en: 'https://www.canada.ca/en/employment-social-development/corporate/contact/ei-individual.html',
      fr: 'https://www.canada.ca/fr/emploi-developpement-social/ministere/coordonnees/assurance-emploi-individus.html',
    },
    updated: '2026-06-03',
  },
  {
    id: 'cppOas',
    phone: { en: '1-800-277-9914', fr: '1-800-277-9915' },
    url: {
      en: 'https://www.canada.ca/en/employment-social-development/corporate/contact/cpp.html',
      fr: 'https://www.canada.ca/fr/emploi-developpement-social/ministere/coordonnees/rpc.html',
    },
    updated: '2026-07-23',
  },
  {
    id: 'sin',
    phone: { en: '1-866-274-6627', fr: '1-866-274-6627' },
    url: {
      en: 'https://www.canada.ca/en/employment-social-development/corporate/contact/sin.html',
      fr: 'https://www.canada.ca/fr/emploi-developpement-social/ministere/coordonnees/nas.html',
    },
    updated: '2026-05-20',
  },
  {
    id: 'dental',
    phone: { en: '1-833-537-4342', fr: '1-833-537-4342' },
    url: {
      en: 'https://www.canada.ca/en/services/benefits/dental/dental-care-plan/contact.html',
      fr: 'https://www.canada.ca/fr/services/prestations/dentaire/regime-soins-dentaires/contactez.html',
    },
    updated: '2026-04-10',
  },
  {
    id: 'cdb',
    phone: { en: '1-833-486-3007', fr: '1-833-486-3007' },
    url: {
      en: 'https://www.canada.ca/en/services/benefits/disability/canada-disability-benefit/contact.html',
      fr: 'https://www.canada.ca/fr/services/prestations/handicap/prestation-canadienne-personnes-situation-handicap/contact.html',
    },
    updated: '2026-09-15',
  },
];

/** Live feeds (server only). */
export const LIVE = {
  waitTimes: (id: string) => `https://api.io.canada.ca/io-server/esdc-edsc/scc/wait-times/v1/office/${encodeURIComponent(id)}`,
  geolocator: (q: string) => `https://geolocator.api.geo.ca/?q=${encodeURIComponent(q)}`,
} as const;

/**
 * Service Canada holiday closures, as published on the finder for 2026 (with regional rules).
 * After the published list we fall back to the federal list, which Service Canada follows
 * ("All locations are closed on public holidays").
 */
export type Closure = { date: string; name: { en: string; fr: string }; only?: string[]; except?: string[] };

export const SC_CLOSURES: Closure[] = [
  { date: '2026-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' } },
  { date: '2026-04-03', name: { en: 'Good Friday', fr: 'Vendredi saint' } },
  { date: '2026-04-06', name: { en: 'Easter Monday', fr: 'Lundi de Pâques' } },
  { date: '2026-05-18', name: { en: 'Victoria Day', fr: 'Fête de Victoria' } },
  { date: '2026-06-24', name: { en: 'Fête nationale du Québec', fr: 'Fête nationale du Québec' }, only: ['QC'] },
  { date: '2026-07-01', name: { en: 'Canada Day', fr: 'Fête du Canada' } },
  { date: '2026-08-03', name: { en: 'Civic Holiday', fr: 'Premier lundi d’août' }, except: ['QC'] },
  { date: '2026-08-17', name: { en: 'Discovery Day', fr: 'Jour de la Découverte' }, only: ['YT'] },
  { date: '2026-09-07', name: { en: 'Labour Day', fr: 'Fête du travail' } },
  { date: '2026-09-30', name: { en: 'National Day for Truth and Reconciliation', fr: 'Journée nationale de la vérité et de la réconciliation' } },
  { date: '2026-10-12', name: { en: 'Thanksgiving', fr: 'Action de grâce' } },
  { date: '2026-11-11', name: { en: 'Remembrance Day', fr: 'Jour du Souvenir' } },
  { date: '2026-12-25', name: { en: 'Christmas Day', fr: 'Noël' } },
  { date: '2026-12-28', name: { en: 'Boxing Day', fr: 'Lendemain de Noël' } },
  { date: '2027-01-01', name: { en: 'New Year’s Day', fr: 'Jour de l’An' } },
];
export const SC_CLOSURES_THROUGH = '2027-01-01';

type T = { en: string; fr: string };
const TITLES: Record<string, T> = {
  finder: { en: 'Find a Service Canada Office', fr: 'Trouver un bureau de Service Canada' },
  finderPassport: { en: 'Passport and biometrics service locations in Canada', fr: 'Emplacements des services de passeport et de biométrie au Canada' },
  booking: { en: 'eServiceCanada Appointment Booking Tool', fr: 'Outil de prise de rendez-vous eServiceCanada' },
  callback: { en: 'eServiceCanada Service Request Form', fr: 'Formulaire de demande de services eServiceCanada' },
  submitAtScc: {
    en: 'What passport applications you can submit at a Service Canada Centre',
    fr: 'Quelles demandes de passeport vous pouvez présenter dans un Centre Service Canada',
  },
  renewOnline: { en: 'Renew a passport online in Canada', fr: 'Renouveler un passeport en ligne au Canada' },
  live: { en: 'Service Canada office status and wait times (live)', fr: 'État des bureaux et temps d’attente de Service Canada (en direct)' },
};

type SourceKind = 'passport' | 'general';

export function officeSources(lang: L, opts: { kind: SourceKind; live: boolean; officeId?: string; officeName?: string }): ToolSource[] {
  const finder = opts.kind === 'passport' ? 'finderPassport' : 'finder';
  const out: ToolSource[] = [
    {
      title: TITLES[finder][lang],
      url: URLS[finder][lang],
      checked: CHECKED,
      updated: FINDER_UPDATED,
      quote:
        opts.kind === 'passport'
          ? lang === 'fr'
            ? 'Vous pouvez prendre rendez-vous pour présenter une demande de passeport ou fournir vos données biométriques.'
            : 'You can book an appointment to apply for a passport or to give biometrics.'
          : undefined,
    },
  ];
  if (opts.live && opts.officeId) {
    out.push({ title: opts.officeName ?? TITLES.live[lang], url: officeUrl(opts.officeId, lang), checked: CHECKED, live: true });
  }
  if (opts.kind === 'passport') {
    out.push({ title: TITLES.submitAtScc[lang], url: URLS.submitAtScc[lang], checked: CHECKED, updated: '2023-05-18' });
  }
  out.push({
    title: TITLES.booking[lang],
    url: URLS.booking[lang],
    checked: CHECKED,
  });
  if (opts.kind !== 'passport') {
    out.push({
      title: TITLES.callback[lang],
      url: URLS.callback[lang],
      checked: CHECKED,
      quote:
        lang === 'fr'
          ? 'Un représentant communiquera avec vous par téléphone dans les deux jours ouvrables.'
          : 'A representative will contact you by telephone within two business days.',
    });
  }
  return out;
}

export function appointmentSources(lang: L, focus: 'passport' | 'biometrics' | 'other' = 'passport'): ToolSource[] {
  const booking: ToolSource = {
    title: TITLES.booking[lang],
    url: URLS.booking[lang],
    checked: CHECKED,
    quote:
      lang === 'fr'
        ? 'Si aucun rendez-vous n’est disponible à l’emplacement de votre choix, vous pouvez tout de même visiter un emplacement de Service Canada sans rendez-vous.'
        : 'If no appointment is available at your preferred location, you can still visit a Service Canada location without an appointment.',
  };
  const callback: ToolSource = {
    title: TITLES.callback[lang],
    url: URLS.callback[lang],
    checked: CHECKED,
    quote:
      lang === 'fr'
        ? 'Un représentant communiquera avec vous par téléphone dans les deux jours ouvrables.'
        : 'A representative will contact you by telephone within two business days.',
  };
  const finder: ToolSource = { title: TITLES.finderPassport[lang], url: URLS.finderPassport[lang], checked: CHECKED, updated: FINDER_UPDATED };
  const renew: ToolSource = { title: TITLES.renewOnline[lang], url: URLS.renewOnline[lang], checked: CHECKED, updated: '2026-09-21' };
  if (focus === 'passport') return [booking, finder, renew, callback];
  if (focus === 'biometrics') return [booking, finder, callback];
  const programs: ToolSource[] = PROGRAMS.map((p) => ({ title: PROGRAM_TITLES[p.id][lang], url: p.url[lang], checked: CHECKED, updated: p.updated }));
  // The office finder is cited for the appointment-only centres ("like Kingston"), under its own title.
  const offices: ToolSource = { title: TITLES.finder[lang], url: URLS.finder[lang], checked: CHECKED, updated: FINDER_UPDATED };
  return [callback, booking, offices, ...programs];
}

const PROGRAM_TITLES: Record<ProgramId, T> = {
  ei: { en: 'Contact Employment Insurance', fr: 'Communiquer avec l’assurance-emploi' },
  cppOas: { en: 'Contact the Canada Pension Plan and Old Age Security', fr: 'Communiquer avec le Régime de pensions du Canada et la Sécurité de la vieillesse' },
  sin: { en: 'Contact the Social Insurance Number program', fr: 'Communiquer avec le programme du numéro d’assurance sociale' },
  dental: { en: 'Contact the Canadian Dental Care Plan', fr: 'Communiquer avec le Régime canadien de soins dentaires' },
  cdb: { en: 'Canada Disability Benefit: Contact us', fr: 'Prestation canadienne pour les personnes handicapées : Contactez-nous' },
};
