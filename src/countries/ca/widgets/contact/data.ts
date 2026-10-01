/**
 * Contact & urgent help: verified phone lines, hours and official pages (isomorphic).
 * Verified against the official pages on 2026-09-30 ("Date modified" in brackets).
 *
 * Department rules followed (vendor/cds-ai-answers/scenarios):
 * - CRA (context-cra-arc): no single "CRA number". Offer self-service first (CRA account, chat, automated
 *   lines), then the number for the specific service. NEVER state a wait time.
 * - ESDC (context-edsc-esdc): when a Service Canada program is involved ALWAYS give the program number with
 *   its contact page. Agents Mon–Fri 8:30 am–4:30 pm local time; on weekends mention the call-back request
 *   (eServiceCanada, answer within 2 business days). Only numbers verified on the page.
 * - IRCC (context-ircc): NEVER give an IRCC or Passport Program phone number. Passport contact questions go to
 *   the self-service contact page (status checker first). So the passport card has links and no number.
 * - Safety (safety.js + pack): danger → 911; suicide or mental health crisis → call or text 9-8-8.
 *
 * Verified facts (numbers, hours, quotes, dates modified): VERIFIED.md, beside this file.
 */
import { URLS } from './urls';

export const CHECKED = '2026-09-30';

export type Lang = 'en' | 'fr';
export type Bi = { en: string; fr: string };

/** 1 = Monday … 7 = Sunday (ISO weekday). */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
/**
 * Opening hours. `open`/`close` are minutes after midnight in `zone`; `close` may exceed 1440 for windows
 * that run past midnight (CRA's automated line: 6 am to 3 am ET = 360 → 1620).
 * `zone: 'local'` means "your local time" (the caller's own time zone, in Canada or the United States); `'ET'` is Ottawa time.
 */
export type Hours = { days: Weekday[]; open: number; close: number; zone: 'local' | 'ET'; closedOnHolidays: boolean };

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5];
const EVERY_DAY: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const h = (hh: number, mm = 0) => hh * 60 + mm;

export const TOPICS = ['taxes', 'benefits', 'service-canada', 'ei', 'pensions', 'dental', 'business', 'passports', 'general', 'fraud'] as const;
export type Topic = (typeof TOPICS)[number];
/** The topic chips, in display order ("Service Canada" joins only when the answer was about Service Canada). */
export const FILTERS: (Topic | 'all')[] = ['all', 'taxes', 'benefits', 'ei', 'pensions', 'dental', 'business', 'passports', 'fraud', 'general'];

export type AltKind = 'north' | 'abroad' | 'tty' | 'reporting';
/**
 * `outside` (abroad numbers only): who the page says the number is for. Most read "Outside Canada and the United
 * States" (the toll-free line covers both countries); the dental plan's reads "Outside Canada", so it also leads
 * for callers in the U.S.
 */
export type AltNumber = { kind: AltKind; number: string; numberFr?: string; hours?: Hours; collect?: boolean; outside?: 'canada' };

export type LineId =
  | 'cra-individuals'
  | 'cra-benefits'
  | 'cra-business'
  | 'ei'
  | 'cpp-oas'
  | 'dental'
  | 'o-canada'
  | 'passport'
  | 'cafc';

export type Line = {
  id: LineId;
  org: 'cra' | 'esdc' | 'ircc' | 'gc' | 'cafc';
  topics: Topic[];
  name: Bi;
  /** What to call about, in a few words. */
  covers: Bi;
  /** Main number (English line when `numberFr` differs). Absent for web-only contacts (Passport Program). */
  number?: string;
  numberFr?: string;
  agents?: Hours;
  automated?: Hours;
  alt?: AltNumber[];
  /** Try this first (self-service before the phone, per department guidance). */
  selfServe?: { label: Bi; href: Bi };
  /**
   * Callers outside Canada and the U.S. dial a different toll-free number in each country: the official list of
   * numbers by country, and the hours that service answers. A link, never a number.
   */
  abroadPage?: { href: Bi; hours: Hours };
  page: Bi;
  updated: string;
};

const CRA_AGENTS: Hours = { days: WEEKDAYS, open: h(8), close: h(20), zone: 'ET', closedOnHolidays: true };
const CRA_AUTO: Hours = { days: EVERY_DAY, open: h(6), close: h(27), zone: 'ET', closedOnHolidays: false };
const SC_AGENTS: Hours = { days: WEEKDAYS, open: h(8, 30), close: h(16, 30), zone: 'local', closedOnHolidays: true };

export const LINES: Record<LineId, Line> = {
  'cra-individuals': {
    id: 'cra-individuals',
    org: 'cra',
    topics: ['taxes'],
    name: { en: 'CRA · Personal taxes', fr: 'ARC · Impôt des particuliers' },
    covers: {
      en: 'Tax returns, refunds, notices of assessment, CRA account, RRSP and TFSA',
      fr: 'Déclarations, remboursements, avis de cotisation, compte de l’ARC, REER et CELI',
    },
    number: '1-800-959-8281',
    agents: CRA_AGENTS,
    automated: CRA_AUTO,
    alt: [
      { kind: 'north', number: '1-866-426-1527', hours: CRA_AGENTS },
      { kind: 'abroad', number: '1-613-940-8495', collect: true, hours: CRA_AGENTS },
      { kind: 'tty', number: '1-800-665-0354', hours: CRA_AGENTS },
    ],
    selfServe: { label: { en: 'Faster: CRA account, chat and automated lines', fr: 'Plus rapide : compte de l’ARC, clavardage et lignes automatisées' }, href: URLS.craFast },
    page: URLS.cra,
    updated: '2026-09-23',
  },
  'cra-benefits': {
    id: 'cra-benefits',
    org: 'cra',
    topics: ['taxes', 'benefits'],
    name: { en: 'CRA · Benefits and credits', fr: 'ARC · Prestations et crédits' },
    covers: {
      en: 'Canada Child Benefit, Canada Groceries and Essentials Benefit, other credits',
      fr: 'Allocation canadienne pour enfants, Allocation canadienne pour l’épicerie et les besoins essentiels, autres crédits',
    },
    number: '1-800-387-1193',
    agents: CRA_AGENTS,
    automated: CRA_AUTO,
    alt: [
      { kind: 'north', number: '1-866-426-1527', hours: CRA_AGENTS },
      { kind: 'tty', number: '1-800-665-0354', hours: CRA_AGENTS },
    ],
    selfServe: { label: { en: 'Faster: CRA account, chat and automated lines', fr: 'Plus rapide : compte de l’ARC, clavardage et lignes automatisées' }, href: URLS.craFast },
    page: URLS.cra,
    updated: '2026-09-23',
  },
  'cra-business': {
    id: 'cra-business',
    org: 'cra',
    topics: ['business'],
    name: { en: 'CRA · Businesses', fr: 'ARC · Entreprises' },
    covers: {
      en: 'GST/HST, payroll, business taxes, My Business Account',
      fr: 'TPS/TVH, retenues sur la paie, impôt des entreprises, Mon dossier d’entreprise',
    },
    number: '1-800-959-5525',
    agents: CRA_AGENTS,
    alt: [
      { kind: 'north', number: '1-866-841-1876', hours: CRA_AGENTS },
      { kind: 'abroad', number: '1-613-940-8497', collect: true, hours: CRA_AGENTS },
      { kind: 'tty', number: '1-800-665-0354', hours: CRA_AGENTS },
    ],
    selfServe: { label: { en: 'Faster: CRA account, chat and automated lines', fr: 'Plus rapide : compte de l’ARC, clavardage et lignes automatisées' }, href: URLS.craFast },
    page: URLS.cra,
    updated: '2026-09-23',
  },
  ei: {
    id: 'ei',
    org: 'esdc',
    topics: ['ei', 'benefits'],
    name: { en: 'Employment Insurance', fr: 'Assurance-emploi' },
    covers: {
      en: 'Your EI claim, payments, reports and Records of Employment',
      fr: 'Votre demande d’AE, vos paiements, vos déclarations et relevés d’emploi',
    },
    number: '1-800-206-7218',
    numberFr: '1-800-808-6352',
    agents: SC_AGENTS,
    alt: [
      { kind: 'reporting', number: '1-800-531-7555', numberFr: '1-800-431-5595' },
      { kind: 'abroad', number: '1-877-486-1650', hours: SC_AGENTS },
      { kind: 'tty', number: '1-800-529-3742', hours: SC_AGENTS },
    ],
    selfServe: { label: { en: 'Request a call back (within 2 business days)', fr: 'Demander un rappel (dans les 2 jours ouvrables)' }, href: URLS.callback },
    page: URLS.ei,
    updated: '2026-06-03',
  },
  'cpp-oas': {
    id: 'cpp-oas',
    org: 'esdc',
    topics: ['pensions', 'benefits'],
    name: { en: 'CPP and Old Age Security', fr: 'RPC et Sécurité de la vieillesse' },
    covers: {
      en: 'Canada Pension Plan, Old Age Security and the Guaranteed Income Supplement',
      fr: 'Régime de pensions du Canada, Sécurité de la vieillesse et Supplément de revenu garanti',
    },
    number: '1-800-277-9914',
    numberFr: '1-800-277-9915',
    agents: SC_AGENTS,
    automated: { days: EVERY_DAY, open: 0, close: 1440, zone: 'local', closedOnHolidays: false },
    alt: [
      { kind: 'abroad', number: '1-613-957-1954', collect: true, hours: { ...SC_AGENTS, zone: 'ET' } },
      { kind: 'tty', number: '1-800-255-4786', hours: SC_AGENTS },
    ],
    selfServe: { label: { en: 'My Service Canada Account, open 24/7', fr: 'Mon dossier Service Canada, ouvert en tout temps' }, href: URLS.msca },
    page: URLS.cpp,
    updated: '2026-07-23',
  },
  dental: {
    id: 'dental',
    org: 'esdc',
    topics: ['dental', 'benefits'],
    name: { en: 'Canadian Dental Care Plan', fr: 'Régime canadien de soins dentaires' },
    covers: {
      en: 'Applying, renewing, coverage and your member card',
      fr: 'Demande, renouvellement, couverture et carte de membre',
    },
    number: '1-833-537-4342',
    agents: SC_AGENTS,
    alt: [
      { kind: 'abroad', number: '1-613-221-3227', outside: 'canada', hours: { days: WEEKDAYS, open: h(7), close: h(19, 30), zone: 'ET', closedOnHolidays: true } },
      { kind: 'tty', number: '1-833-677-6262', hours: { days: WEEKDAYS, open: h(7), close: h(19, 30), zone: 'ET', closedOnHolidays: true } },
    ],
    page: URLS.dental,
    updated: '2026-04-10',
  },
  'o-canada': {
    id: 'o-canada',
    org: 'gc',
    topics: ['general', 'benefits'],
    name: { en: '1 800 O-Canada', fr: '1 800 O-Canada' },
    covers: {
      en: 'Not sure who to call? General help with any federal program',
      fr: 'Vous ne savez pas qui appeler? Aide générale sur tous les programmes fédéraux',
    },
    number: '1-800-622-6232',
    agents: { days: WEEKDAYS, open: h(8), close: h(17), zone: 'local', closedOnHolidays: true },
    alt: [{ kind: 'tty', number: '1-800-926-9105', hours: { days: WEEKDAYS, open: h(8), close: h(17), zone: 'local', closedOnHolidays: true } }],
    abroadPage: { href: URLS.oCanadaAbroad, hours: { days: WEEKDAYS, open: h(8), close: h(20), zone: 'ET', closedOnHolidays: true } },
    page: URLS.oCanada,
    updated: '2026-09-09',
  },
  passport: {
    id: 'passport',
    org: 'ircc',
    topics: ['passports'],
    name: { en: 'Passport Program', fr: 'Programme de passeport' },
    covers: {
      en: 'Questions about a passport application',
      fr: 'Questions sur une demande de passeport',
    },
    selfServe: { label: { en: 'Check your application status', fr: 'Vérifier l’état de votre demande' }, href: URLS.passportStatus },
    page: URLS.passport,
    updated: '2025-12-19',
  },
  cafc: {
    id: 'cafc',
    org: 'cafc',
    topics: ['fraud'],
    name: { en: 'Canadian Anti-Fraud Centre', fr: 'Centre antifraude du Canada' },
    covers: {
      en: 'Report a scam or fraud, even if you didn’t lose money',
      fr: 'Signaler une arnaque ou une fraude, même sans perte d’argent',
    },
    number: '1-888-495-8501',
    agents: { days: WEEKDAYS, open: h(10), close: h(16, 45), zone: 'ET', closedOnHolidays: true },
    selfServe: { label: { en: 'Report online, any time', fr: 'Signaler en ligne, en tout temps' }, href: URLS.cafcReport },
    page: URLS.cafc,
    updated: '2025-11-27',
  },
};

/**
 * The CRA's line for suspected fraud, identity theft or a compromised CRA account (individual accounts): protections
 * can go on the account during the call. Listed on the CRA contact page and on "Report a scam or identity theft"
 * [2026-03-20], re-checked 2026-10-01: Monday to Friday 6:30 am to 7 pm ET, closed weekends and public holidays.
 * Not a directory line: it appears where a SIN or CRA sign-in may have been given (the suspicious-call card).
 */
export const CRA_FRAUD_LINE = {
  name: { en: 'CRA · Suspected fraud or identity theft', fr: 'ARC · Fraude ou vol d’identité soupçonnés' } as Bi,
  number: '1-833-995-2336',
  hours: { days: WEEKDAYS, open: h(6, 30), close: h(19), zone: 'ET', closedOnHolidays: true } as Hours,
};

/** Lines shown for each topic, most useful first. */
export const TOPIC_LINES: Record<Topic | 'all', LineId[]> = {
  all: ['cra-individuals', 'cra-benefits', 'ei', 'cpp-oas', 'dental', 'cra-business', 'o-canada', 'passport', 'cafc'],
  taxes: ['cra-individuals', 'cra-benefits'],
  benefits: ['cra-benefits', 'ei', 'cpp-oas', 'dental', 'o-canada'],
  /** Service Canada only (no CRA lines): "Is Service Canada open right now?" */
  'service-canada': ['ei', 'cpp-oas', 'dental', 'o-canada'],
  business: ['cra-business'],
  ei: ['ei'],
  pensions: ['cpp-oas'],
  dental: ['dental'],
  passports: ['passport', 'o-canada'],
  general: ['o-canada', 'cra-individuals', 'ei', 'cpp-oas'],
  fraud: ['cafc', 'cra-individuals'],
};

/** The CRA "try this first" banner leads only when a CRA line leads (never above the Anti-Fraud Centre). */
export const craLeads = (ids: LineId[]) => !!ids[0] && LINES[ids[0]].org === 'cra';
