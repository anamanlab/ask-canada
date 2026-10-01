/**
 * Key dates: verified facts + official sources (isomorphic; used by the tools, the scenarios and the widgets).
 * This file holds what the widgets need on the device (program metadata, official URLs, source lists); the fallback
 * tables and official names the tools build from are in ./fallback.ts, so they stay out of the client bundle.
 * Checked on 2026-09-30 against the pages below ("Date modified" in brackets).
 *
 * Benefit payment dates (live, with this verified fallback)
 * - https://www.canada.ca/en/services/benefits/calendar.html [2026-08-07] (FR: /fr/services/prestations/calendrier.html)
 *   Each program sits in `<details id="ccb-2026"><ul><li>October 20, 2026</li>…`; the tool parses it live.
 *   "Payments are issued on the dates listed, but may take a few days to arrive. Posted cheques may take longer
 *   than direct deposit. Please wait 5 to 10 business days before contacting the program."
 *   CPP includes the retirement pension and disability, children's and survivor benefits; OAS includes the
 *   pension, GIS, the Allowance and the Allowance for the Survivor. The Canada Groceries and Essentials Benefit
 *   (CGEB) replaced the GST/HST credit in July 2026 (GST/HST credit: Jan 5 + Apr 2, 2026; CGEB: Jul 3 + Oct 5, 2026).
 *   2027 dates are not published yet (as of 2026-09-30).
 * - https://www.canada.ca/en/revenue-agency/services/child-family-benefits/benefit-payment-dates.html [2026-07-31]
 *   Same CRA dates. Footnote 1 "Wait 5 working days from the payment date to contact us" (CCB, ACFB) / footnote 2
 *   "Wait 10 working days" (GST/HST credit and CGEB, OTB, ACWB, NLDB). Service Canada and Veterans Affairs programs:
 *   "wait 5 to 10 business days before contacting the program" (calendar.html). `PROGRAM_META.waitDays` holds this. A live "Wildfires impact payments" info alert is
 *   shown on the page (cheques only; direct deposit on schedule); the Canada Post strike includes are commented
 *   out. The tool reads the page's live alerts (never shows a notice it can't read).
 *
 * Tax deadlines (individuals)
 * - important-dates-individuals.html [2026-09-17]: 2025 taxes: RRSP Mar 2, 2026; file + pay Apr 30, 2026;
 *   self-employed file Jun 15, 2026.
 * - filing-dates-tax-return.html [2026-01-20]: April 30 for most people; June 15 if you or your spouse/partner were
 *   self-employed (balance still due April 30); weekend/CRA-holiday rollover to the next business day.
 * - income-tax-instalments/due-dates.html [2026-01-20]: March 15, June 15, September 15, December 15 + rollover.
 * - important-dates-rrsp-rrif-rdsp.html [2026-01-29] (re-read 2026-10-01): "March 2, 2026 is the deadline for
 *   contributing to an RRSP for the 2025 tax year." The page gives the date only, not the rule behind it. The rule is
 *   the Income Tax Act, subsection 146(5) (https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-146.html, FR
 *   /fra/lois/I-3.3/section-146.html, read 2026-10-01): a premium "paid by the taxpayer after 1990 and on or before the
 *   day that is 60 days after the end of the year" / « au plus tard le soixantième jour suivant la fin de l’année ».
 *   For 2026 the CRA hasn't published the date yet: Mar 1, 2027 is that 60th day (a Monday), so it's marked `expected`,
 *   quotes the Act and links to it (`URLS.rrspRule`); published dates link to the CRA page (`URLS.rrsp`).
 * - 2026 taxes (filed in 2027): Apr 30, 2027 is a Friday and Jun 15, 2027 a Tuesday: no rollover applies.
 * - public-holidays.html [2026-01-06]: CRA-recognized public holidays for 2026 (rollover rule).
 *
 * Statutory holidays (live, with this verified fallback)
 * - https://canada-holidays.ca/api/v1/holidays?year=2026 (and 2027), fetched 2026-09-30. Each holiday lists the
 *   provinces where it's a statutory holiday, whether it's federal, and the observed date; each province links
 *   its official source (e.g. ontario.ca). The API's `federal` flag marks the 12 federal public-service days.
 * - Canada Labour Code general holidays: https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html
 *   [2025-12-12] (FR: /fr/services/emplois/milieu-travail/normes-travail-federales/conges-jours-feries.html): "you are
 *   entitled to a day off with pay for the following 10 days, which are called general holidays: New Year’s Day, Good
 *   Friday, Victoria Day, Canada Day, Labour Day, National Day for Truth and Reconciliation, Thanksgiving Day,
 *   Remembrance Day, Christmas Day, Boxing Day". Only these apply to federally regulated workplaces (`clc`). Their French
 *   names follow the FR page (« la fête de Victoria », « le jour de l’Action de grâces », « la fête du Travail »,
 *   « le jour de Noël »), not the feed's older ones (« Fête de la Reine », « Action de grâce »): see `FR_OFFICIAL`.
 * - Quebec: https://www.cnesst.gouv.qc.ca/fr/conditions-travail/conges/jours-feries/liste-jours-feries (EN:
 *   https://www.cnesst.gouv.qc.ca/en/working-conditions/leave/statutory-holidays/statutory-holidays), checked 2026-09-30
 *   (no "date modified" shown): "le Vendredi saint ou le lundi de Pâques, au choix de l’employeur" / "Good Friday or
 *   Easter Monday, at the employer’s option". canada-holidays.ca lists Good Friday for QC and Easter Monday nowhere,
 *   so `EMPLOYER_CHOICE` adds the choice to both (`HolidayItem.choice`).
 * - Provincial pages in French (checked 2026-09-30, HTTP 200 + French holiday content): ontario.ca/fr (Jours fériés),
 *   gnb.ca/fr (Loi sur les jours de repos, FAQ), novascotia.ca holidaychart-fr.asp, ece.gov.nt.ca/fr (Foires aux
 *   questions, Jours fériés), gov.mb.ca factsheet.fr.html (Jours fériés), cnesst.gouv.qc.ca/fr, gov.nl.ca (guide in
 *   French, below). Alberta, B.C., Saskatchewan, Nunavut, P.E.I. and Yukon: no French page found (P.E.I. and Yukon
 *   block automated checks), so French readers get the English page with a French title.
 * - Newfoundland and Labrador (checked 2026-10-01): the Labour Standards guide "Your Rights at Work"
 *   (https://www.gov.nl.ca/gs/files/Your-Rights-At-Work.pdf [PDF modified 2026-03-04], linked from
 *   gov.nl.ca/gs/labour/frequently-asked-questions/) lists six "Paid Public Holidays: New Year’s Day, Good Friday,
 *   Memorial/Canada Day, Labour Day, Remembrance Day, Christmas Day". French guide « Normes d’emploi à
 *   Terre-Neuve-et-Labrador » (https://www.gov.nl.ca/gs/files/Labour-Relations-At-Work-FR.pdf [2026-03-31]): « Jours
 *   fériés payés : Jour de l’An, Vendredi saint, Memorial Day / Fête du Canada, Fête du Travail, Jour du Souvenir,
 *   Noël ». canada-holidays.ca also lists St. Patrick’s Day, St. George’s Day, Discovery Day, Orangemen’s Day, Regatta
 *   Day and Boxing Day for N.L.: those are the provincial government’s own employee holidays, not statutory ones.
 *   Treasury Board Secretariat, "2026 Paid Holidays" (https://www.gov.nl.ca/exec/tbs/2026-paid-holidays-2/, re-read
 *   2026-10-01) names 14 paid holidays: the six statutory ones and eight more, "St. Patrick’s Day Monday, March 16,
 *   2026 · St. George’s Day Monday, April 20, 2026 · Victoria Day Monday, May 18, 2026 · June Holiday Monday, June 22,
 *   2026 · Orangeman’s Day Monday, July 13, 2026 · National Day for Truth and Reconciliation Wednesday, September 30,
 *   2026 · Thanksgiving Day Monday, October 12, 2026 · Boxing Day Monday, December 28, 2026" plus "One (1) additional day […]
 *   recognized to be a civic holiday in the area in which the employee is employed" (so Regatta Day, a St. John’s civic
 *   holiday, isn’t listed at all). No 2027 schedule is published yet (2026-10-01): 2027 shows the names without dates, and an answer about one of these
 *   days in 2027 gives its calendar date only (never the feed's observed day), or no date for the June Holiday, which
 *   has none of its own (`askedView` in ./select.ts).
 *   `PROVINCE_RULES` in ./fallback.ts moves these days out of the statutory list (`HolidayItem.government`); Victoria
 *   Day, the National Day for Truth and Reconciliation and Thanksgiving (never statutory in N.L. on the feed) are added
 *   to it and also stay under "federal holidays not observed here".
 * - Statutory holidays per province, counted on each official page above and on the feed (`STAT_COUNTS` in
 *   ./fallback.ts): AB 9, BC 11, MB 9, NB 8, NL 6, NS 6, NT 11, NU 10, ON 9, PE 8, QC 8, SK 10, YT 11. A live feed
 *   that doesn’t match is not trusted (./verify.ts).
 * - French holiday names follow the official French pages (checked 2026-10-01): ontario.ca/fr and gnb.ca/fr « le jour
 *   de la Famille », gnb.ca/fr « la fête du Nouveau-Brunswick », gov.mb.ca « le jour de Louis Riel », « la Journée du
 *   chandail orange », novascotia.ca « Jour du patrimoine de la Nouvelle-Écosse », CNESST « fête nationale », CRA
 *   « Lundi de Pâques », « Congé civique »: see `FR_NAMES` in ./fallback.ts.
 * - Easter Monday and Civic Holiday are NOT Canada Labour Code holidays: they are days off for the federal public
 *   service, listed with the other public holidays the CRA recognizes (public-holidays.html [2026-01-06]: "Easter
 *   Monday – Monday, April 6, 2026", "Civic Holiday – Monday, August 3, 2026 (excluding Quebec)").
 *
 * Quebec Pension Plan
 * - https://www.canada.ca/en/services/benefits/publicpensions/cpp/eligibility.html [2026-06-18] (FR:
 *   /fr/services/prestations/pensionspubliques/rpc/admissibilite.html): "The CPP and Québec Pension Plan (QPP) work
 *   together" / "Contact Retraite Québec if […] you've only worked in Quebec; you worked in Quebec and in at least one
 *   other province/territory, and are living in Quebec". So in Quebec the CPP chip is off by default and a note points
 *   there. Retraite Québec's own payment dates aren't shown (not on canada.ca; never guessed).
 *
 * Weekend holidays in a province view
 * - Ontario ESA guide, public-holidays [checked 2026-09-30]: when a public holiday falls on a day that isn't ordinarily a
 *   working day, the employee gets "a substitute holiday off with public holiday pay" or, if they agree in writing,
 *   public holiday pay. Rules differ by province, so a province view keeps the calendar date (Boxing Day: Saturday,
 *   Dec 26, 2026) and names the feed's observed Monday only as the federal public service's day off (`substitute`).
 *
 * Never predicted here: EI payment dates (they depend on your reports; ESDC guidance) and anyone's amounts.
 */
import { pack } from '@/countries/active';
import type { ToolSource } from '@/lib/widgets/types';
import { PROVINCE_SOURCES } from './sources';

const CHECKED = '2026-09-30';
export type Lang = 'en' | 'fr';

export const PROVINCES = ['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'] as const;
export type Province = (typeof PROVINCES)[number];
export const isProvince = (v: unknown): v is Province => typeof v === 'string' && (PROVINCES as readonly string[]).includes(v);

/* ------------------------------------------------------------------ programs */

export const PROGRAMS = ['ccb', 'cgeb', 'oas', 'cpp', 'cwb', 'cdb', 'vdp', 'otb', 'acfb', 'nldb'] as const;
export type Program = (typeof PROGRAMS)[number];
/** Programs everyone sees as choices; the provincial ones appear when the province matches. */
export const CORE_PROGRAMS: Program[] = ['ccb', 'cgeb', 'oas', 'cpp', 'cwb', 'cdb', 'vdp'];
export const PROVINCIAL_PROGRAM: Partial<Record<Province, Program>> = { ON: 'otb', AB: 'acfb', NL: 'nldb' };

export type Tone = 'glacier' | 'pine' | 'violet' | 'amber' | 'teal' | 'rose' | 'ink' | 'maple' | 'plum';

/** Who pays it, and how long to wait for a late payment before contacting them (null = 5 to 10 business days, calendar.html). */
export const PROGRAM_META: Record<Program, { tone: Tone; admin: 'cra' | 'sc' | 'vac'; waitDays: 5 | 10 | null; province?: Province }> = {
  ccb: { tone: 'glacier', admin: 'cra', waitDays: 5 },
  cgeb: { tone: 'pine', admin: 'cra', waitDays: 10 },
  oas: { tone: 'violet', admin: 'sc', waitDays: null },
  cpp: { tone: 'amber', admin: 'sc', waitDays: null },
  cwb: { tone: 'teal', admin: 'cra', waitDays: 10 },
  cdb: { tone: 'rose', admin: 'sc', waitDays: null },
  vdp: { tone: 'ink', admin: 'vac', waitDays: null },
  otb: { tone: 'plum', admin: 'cra', waitDays: 10, province: 'ON' },
  acfb: { tone: 'plum', admin: 'cra', waitDays: 5, province: 'AB' },
  nldb: { tone: 'plum', admin: 'cra', waitDays: 10, province: 'NL' },
};

/** The CGEB replaced the GST/HST credit on this date: earlier `cgeb` dates are GST/HST credit payments. */
export const CGEB_START = '2026-07-01';

/* ------------------------------------------------------------------ taxes */

export type TaxKind = 'rrsp' | 'file' | 'selfEmployed' | 'instalment';

/* ------------------------------------------------------------------ holidays */

export type HolidayItem = {
  /** Calendar date of the holiday. */
  date: string;
  /** Day off when it differs (e.g. Boxing Day on a Saturday, observed Monday). */
  observed?: string;
  name: { en: string; fr: string };
  /** Federal public-service holiday (canada-holidays.ca `federal`): the 10 CLC holidays + Easter Monday + Civic Holiday. */
  federal: boolean;
  /** A general holiday under the Canada Labour Code: a day off for federally regulated workplaces (see `isClcHoliday`). */
  clc: boolean;
  /** Provinces and territories where it's a statutory holiday. */
  provinces: Province[];
  /**
   * Provinces whose own government gives its employees the day, without it being a statutory holiday there
   * (Newfoundland and Labrador: St. Patrick's Day, St. George's Day, Victoria Day, the June Holiday, Orangemen's Day,
   * the National Day for Truth and Reconciliation, Thanksgiving, Boxing Day).
   */
  government?: Province[];
  /**
   * Not on the Canada Labour Code list under this name, but it is one of its general holidays: N.L.'s Memorial Day is
   * July 1, Canada Day. The province's row says "Also federal", like July 1 everywhere else; the federal list keeps
   * Canada Day (`clc`) and never shows this one.
   */
  clcDay?: true;
  /**
   * Federal (Canada Labour Code) view only: it falls on a Saturday or Sunday, so federally regulated employees get
   * "a holiday with pay on the scheduled work day immediately before or after" (vacations-holidays.html). Set by
   * `holidaysFor` in place of the feed's `observed` Monday, which is the federal public service's practice.
   */
  clcWeekend?: true;
  /**
   * Province view only: it falls on a Saturday or Sunday. The list keeps the calendar date, and this is the feed's
   * observed day (the federal public service's day off), shown as a common substitute day, never as the entitlement:
   * each province sets its own rule (Ontario: a substitute day off with pay, or holiday pay by written agreement).
   */
  substitute?: string;
  /**
   * A provincial government's own day that has no calendar date of its own: its schedule sets the day each year (N.L.'s
   * June Holiday: Monday, June 22, 2026). Without a published schedule for the year it has no date to show.
   */
  floating?: true;
  /** Where the employer picks one of two days (Quebec: Good Friday or Easter Monday), with the combined name. */
  choice?: { provinces: Province[]; name: { en: string; fr: string } };
};

/** Is this holiday the employer's pick between two days in this province? */
export const isChoiceIn = (h: Pick<HolidayItem, 'choice'>, province: Province | null) => Boolean(province && h.choice?.provinces.includes(province));

/* ------------------------------------------------------------------ URLs + sources */

const C = 'https://www.canada.ca';
const L = (en: string, fr: string) => ({ en: `${C}${en}`, fr: `${C}${fr}` });
const CRA = '/en/revenue-agency/services';
const ARC = '/fr/agence-revenu/services';

export const URLS = {
  calendar: L('/en/services/benefits/calendar.html', '/fr/services/prestations/calendrier.html'),
  craPayDates: L(`${CRA}/child-family-benefits/benefit-payment-dates.html`, `${ARC}/prestations-enfants-familles/dates-versement-prestations.html`),
  taxDates: L(`${CRA}/tax/individuals/topics/important-dates-individuals.html`, `${ARC}/impot/particuliers/sujets/dates-importantes-particuliers.html`),
  filing: L(
    `${CRA}/tax/individuals/topics/important-dates-individuals/filing-dates-tax-return.html`,
    `${ARC}/impot/particuliers/sujets/dates-importantes-particuliers/dates-limites-production-declaration-revenus.html`,
  ),
  instalments: L(
    `${CRA}/payments/payments-cra/individual-payments/income-tax-instalments/due-dates.html`,
    `${ARC}/paiements/paiements-arc/paiements-particuliers/impots-acomptes-provisionnels/dates-limites.html`,
  ),
  rrsp: L(`${CRA}/tax/individuals/topics/rrsps-related-plans/important-dates-rrsp-rrif-rdsp.html`, `${ARC}/impot/particuliers/sujets/reer-regimes-connexes/dates-importantes-reer-reei-reep.html`),
  /** Income Tax Act, s. 146(5): the 60-day rule behind the RRSP deadline (the CRA page gives each year's date only). */
  rrspRule: { en: 'https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-146.html', fr: 'https://laws-lois.justice.gc.ca/fra/lois/I-3.3/section-146.html' },
  publicHolidays: L(`${CRA}/tax/public-holidays.html`, `${ARC}/impot/jours-feries.html`),
  federalHolidays: L('/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html', '/fr/services/emplois/milieu-travail/normes-travail-federales/conges-jours-feries.html'),
  signIn: L('/en/government/sign-in-online-account.html', '/fr/gouvernement/ouvrir-session-dossier-compte-en-ligne.html'),
  /** "Sign in to your CRA account" (My Account) [2026-08-05]. */
  craSignIn: L('/en/revenue-agency/services/e-services/cra-login-services.html', '/fr/agence-revenu/services/services-electroniques/services-ouverture-session-arc.html'),
  eiAfter: L('/en/services/benefits/ei/ei-regular-benefit/after-applying.html', '/fr/services/prestations/ae/assurance-emploi-reguliere/apres-demande.html'),
  cpp: L('/en/services/benefits/publicpensions/cpp.html', '/fr/services/prestations/pensionspubliques/rpc.html'),
  /** CPP eligibility [2026-06-18]: who contacts Retraite Québec (Quebec Pension Plan) instead. */
  cppQuebec: L('/en/services/benefits/publicpensions/cpp/eligibility.html', '/fr/services/prestations/pensionspubliques/rpc/admissibilite.html'),
  oas: L('/en/services/benefits/publicpensions/old-age-security.html', '/fr/services/prestations/pensionspubliques/securite-vieillesse.html'),
} as const;

export const HOLIDAYS_SITE = { en: 'https://canada-holidays.ca/', fr: 'https://canada-holidays.ca/?lang=fr' };

const TITLES = {
  calendar: { en: 'Benefits payment dates', fr: 'Dates de paiement des prestations' },
  craPayDates: { en: 'Payment dates for CRA administered benefits and credits', fr: 'Dates de versements des prestations et crédits administrés par l’ARC' },
  taxDates: { en: 'Due dates and payment dates: personal income tax', fr: 'Dates d’échéance et dates de paiement : impôt des particuliers' },
  filing: { en: 'Filing due dates for your tax return', fr: 'Dates limites de production de votre déclaration de revenus' },
  instalments: { en: 'Tax instalments: payment due dates', fr: 'Acomptes provisionnels : dates limites de paiement' },
  rrsp: { en: 'Important dates for RRSPs, HBP, LLP, FHSAs and more', fr: 'Dates importantes pour les REER, le RAP, le REEP, les CELIAPP et plus' },
  rrspRule: { en: 'Income Tax Act, subsection 146(5): RRSP premiums deductible', fr: 'Loi de l’impôt sur le revenu, paragraphe 146(5) : primes versées à un REER' },
  publicHolidays: { en: 'Public holidays recognized by the CRA', fr: 'Jours fériés reconnus par l’ARC' },
  federalHolidays: { en: 'General holidays for federally regulated employees', fr: 'Jours fériés pour les employés d’employeurs sous réglementation fédérale' },
  /** The host already shows as the footer's crumb, so the title doesn't repeat it. */
  holidaysApi: { en: 'Holiday data feed (community-maintained)', fr: 'Données sur les jours fériés (site communautaire)' },
};

/** Sources for the calendar; a taxes-only calendar leads with the CRA's tax dates pages. */
export function calendarSources(lang: Lang, live: boolean, taxesFirst = false): ToolSource[] {
  const all: ToolSource[] = [
    {
      title: TITLES.calendar[lang],
      url: URLS.calendar[lang],
      checked: CHECKED,
      updated: '2026-08-07',
      live: live || undefined,
      quote:
        lang === 'fr'
          ? 'Les paiements sont émis aux dates indiquées, mais peuvent prendre quelques jours avant d’arriver.'
          : 'Payments are issued on the dates listed, but may take a few days to arrive.',
    },
    { title: TITLES.craPayDates[lang], url: URLS.craPayDates[lang], checked: CHECKED, updated: '2026-07-31' },
    { title: TITLES.taxDates[lang], url: URLS.taxDates[lang], checked: CHECKED, updated: '2026-09-17' },
    { title: TITLES.filing[lang], url: URLS.filing[lang], checked: CHECKED, updated: '2026-01-20' },
    { title: TITLES.instalments[lang], url: URLS.instalments[lang], checked: CHECKED, updated: '2026-01-20' },
    { title: TITLES.rrsp[lang], url: URLS.rrsp[lang], checked: CHECKED, updated: '2026-01-29' },
    {
      title: TITLES.rrspRule[lang],
      url: URLS.rrspRule[lang],
      checked: '2026-10-01',
      quote: lang === 'fr' ? 'au plus tard le soixantième jour suivant la fin de l’année' : 'on or before the day that is 60 days after the end of the year',
    },
  ];
  return taxesFirst ? [...all.slice(2), ...all.slice(0, 2)] : all;
}

/** Is this URL on a domain the chat treats as official (the pack's allowlist)? */
export const isAllowlisted = (url: string) => {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return pack.sources.allowlist.some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
};

/**
 * Sources for the holidays. Federal view: the Canada Labour Code page (which rules apply to whom), the CRA's public
 * holidays, then canada-holidays.ca, the community-maintained feed the dates are read from. Province view: the first
 * source is the one that backs the provincial list, so the footer and the "Live" badge agree: the province's own page
 * when the chat treats its domain as official (the pack's allowlist), otherwise the feed, with the province's page as
 * the link above the list and the handoff button (it would be flagged "not an official source" in the chat's list).
 */
export function holidaySources(lang: Lang, province: Province | null, live: boolean): ToolSource[] {
  const api: ToolSource = { title: TITLES.holidaysApi[lang], url: HOLIDAYS_SITE[lang], checked: CHECKED, live: live || undefined };
  const federal: ToolSource = { title: TITLES.federalHolidays[lang], url: URLS.federalHolidays[lang], checked: CHECKED, updated: '2025-12-12' };
  const cra: ToolSource = { title: TITLES.publicHolidays[lang], url: URLS.publicHolidays[lang], checked: CHECKED, updated: '2026-01-06' };
  const p = province ? PROVINCE_SOURCES[province][lang] : null;
  if (!p) return [federal, cra, api];
  // A province's list leads with the page that backs it: its own when the chat can cite it, otherwise the feed the
  // dates are read from (the province's page is then the link above the list and the handoff button).
  return isAllowlisted(p.url) ? [{ title: p.title, url: p.url, checked: CHECKED }, federal, cra, api] : [api, federal, cra];
}
