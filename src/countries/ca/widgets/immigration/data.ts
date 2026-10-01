/**
 * Immigration facts (IRCC), verified against canada.ca on 2026-09-30 (pages) and 2026-10-01 (live feeds). Isomorphic: used by the tools (server)
 * and the widgets (client, for instant recalculation). Every number below is from the page named next to it.
 * Server-side companions: sources.ts (page titles for the Sources list) and feeds.ts (live feed URLs + shapes).
 *
 * Express Entry: Comprehensive Ranking System (CRS)
 *   crs-criteria.html (Date modified 2026-06-22): every CRS table below (core/human capital, spouse,
 *   skill transferability, additional points). Job offer points removed as of March 25, 2025.
 *   check-score.html (2026-06-22): the official CRS calculator; its results are "for general guidance".
 * Express Entry: programs (minimum requirements)
 *   who-can-apply.html (2026-06-22): CEC CLB 7 (TEER 0/1) or CLB 5 (TEER 2/3), 1 year Canadian work in the last
 *   3 years; FSW CLB 7, 1 year continuous in the last 10 years, secondary education; FST CLB 5 speaking and
 *   listening + CLB 4 reading and writing, 2 years in the last 5 years, job offer or certificate of qualification.
 *   federal-skilled-workers.html (2026-09-24): selection grid scored out of 100, pass mark 67 (language 28, education 25, experience 15,
 *   age 12, arranged employment 10, adaptability 10). Education points: education-assessment.html (2026-06-22).
 *   proof-funds.html (2026-06-22): settlement funds table "Updated July 7, 2025" ($15,263 for 1 … +$4,112).
 * Express Entry: rounds of invitations (LIVE)
 *   https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json (and _fr): the feed behind
 *   express-entry-rounds.html. Round #447 on 2026-10-01: Trades Occupations, 3,500 invitations, cut-off 476
 *   (before it, #446 on 2026-09-29: CEC, 2,000 invitations, cut-off 518). Pool distribution (dd1…dd18) as of
 *   2026-09-27: 229,904 profiles. Band labels from rounds-invitations.html (2026-07-10).
 * Processing times (LIVE)
 *   check-processing-times.html (2026-09-24) reads:
 *   /content/dam/ircc/documents/json/flpt-en.json: forward-looking PR/citizenship estimates (updated 2026-09-03):
 *     CEC about 6 months, FSW about 7, PNP (Express Entry) about 7, PNP (base) about 13, spouse in Canada (outside
 *     Quebec) about 26, spouse abroad about 18, parents and grandparents about 28, citizenship grant about 12.
 *   /content/dam/ircc/documents/json/data-ptime-en.json: historical times by country (updated 2026-10-01),
 *     e.g. visitor visa from India 30 days, study permit from India 6 weeks.
 *   /content/dam/ircc/documents/json/data-ptime-non-country-en.json: eTA 5 minutes, visitor extension 385 days,
 *     IEC 6 weeks, PR card 34 days (new) / 37 days (renewal) (updated 2026-10-01).
 *   /content/dam/ircc/documents/json/flpt-by-week-en.json: study permit extension 8 weeks, work permit
 *     extension 12 weeks (updated 2026-09-26).
 *   Historical = how long it took to process 80% of applications; forward-looking = estimate if you apply today.
 *   Sponsorship times in flpt-en.json are split by province: *-roc (outside Quebec) and *-quebec. On 2026-09-03:
 *   parents and grandparents about 28 months outside Quebec / about 63 in Quebec (pgp-roc / pgp-quebec); spouse in
 *   Canada about 26 / 32 (spousal-canada-roc / -quebec); spouse abroad about 18 / 33 (spousal-abroad-roc / -quebec).
 * Parents and Grandparents Program: PAUSED
 *   sponsor-parents-grandparents.html (Date modified 2026-08-18), EN: "We've paused this program. We will not accept
 *   new interest to sponsor forms or invite potential sponsors to apply until further notice. We'll keep processing
 *   existing applications." Status: Paused. FR parrainer-parents-grands-parents.html: "Nous avons suspendu ce
 *   programme." Statut : En pause. The processing time applies only to applications already submitted.
 *   parent-grandparent-super-visa.html (2026-07-06): visit children or grandchildren who are PRs, citizens or
 *   registered Indians for 5 years at a time; multiple entries for up to 10 years.
 * Visa or eTA
 *   entry-requirements-country.html (2026-07-31): visa-required, eTA-required and "may be eligible for an eTA"
 *   lists; US citizens and US lawful permanent residents need neither; eTA not needed by land or sea.
 *   eta/eligibility/eta-x.html (2026-07-27): the 3 requirements for citizens of 17 visa-required countries
 *   (Canadian visa in the past 10 years or a valid US non-immigrant visa; temporary stay; flying).
 *   eta/facts.html (2024-04-23): eTA costs $7, most approved within minutes, valid up to 5 years or until the
 *   passport expires. visitor-visa.html (2026-09-02): from $100; Indonesia and Malaysia added May 26, 2026.
 * Fees: https://www.canada.ca/content/dam/ircc/documents/json/fees.json (live list used by canada.ca):
 *   eTA $7, visitor visa $100, biometrics $85, study permit $150, work permit $155, open work permit holder $100,
 *   IEC $184.75, economic PR (principal applicant incl. right of PR fee) $1,590.
 * Study and work permits
 *   study-permit.html (2026-04-24), study-permit/eligibility.html (2026-01-26), get-documents.html (2026-01-26):
 *   letter of acceptance always; PAL/TAL in most cases (CAQ in Quebec).
 *   get-documents/financial-support.html (2026-08-28): living expenses if you apply on or after Sept 1, 2026:
 *   $23,448 (1 person) … $62,054 (7), +$6,318 each additional; excludes tuition and travel; Quebec differs.
 *   work-off-campus.html (2026-04-15): up to 24 hours a week off campus; unlimited during scheduled breaks.
 *   after-graduation/about.html (2026-03-09): PGWP up to 3 years; language results required since Nov 1, 2024.
 *   work-canada.html (2026-06-01): employer-specific (job offer required) vs open (no job offer) permits.
 * Guidance: vendor/cds-ai-answers/scenarios/context-ircc: never give IRCC phone numbers; send people who already
 *   applied to "Check your application status"; prefer self-service tools (Come to Canada, check visa/eTA,
 *   study permit tool, need a work permit).
 */

export type Lang = 'en' | 'fr';

const E = 'https://www.canada.ca/en/immigration-refugees-citizenship';
const F = 'https://www.canada.ca/fr/immigration-refugies-citoyennete';

export const URLS = {
  expressEntry: { en: `${E}/services/immigrate-canada/express-entry.html`, fr: `${F}/services/immigrer-canada/entree-express.html` },
  crsCriteria: {
    en: `${E}/services/immigrate-canada/express-entry/check-score/crs-criteria.html`,
    fr: `${F}/services/immigrer-canada/entree-express/verifier-note/criteries-scg.html`,
  },
  crsTool: { en: `${E}/services/immigrate-canada/express-entry/check-score.html`, fr: `${F}/services/immigrer-canada/entree-express/verifier-note.html` },
  rounds: {
    en: `${E}/services/immigrate-canada/express-entry/rounds-invitations.html`,
    fr: `${F}/services/immigrer-canada/entree-express/rondes-invitations.html`,
  },
  roundsData: {
    en: `${E}/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-rounds.html`,
    fr: `${F}/organisation/mandat/politiques-directives-operationnelles-ententes-accords/instructions-ministerielles/entree-express-rondes.html`,
  },
  whoCanApply: {
    en: `${E}/services/immigrate-canada/express-entry/who-can-apply.html`,
    fr: `${F}/services/immigrer-canada/entree-express/qui-presenter-demande.html`,
  },
  fsw: {
    en: `${E}/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html`,
    fr: `${F}/services/immigrer-canada/entree-express/qui-presenter-demande/travailleurs-qualifies-federal.html`,
  },
  cec: {
    en: `${E}/services/immigrate-canada/express-entry/who-can-apply/canadian-experience-class.html`,
    fr: `${F}/services/immigrer-canada/entree-express/qui-presenter-demande/categorie-experience-canadienne.html`,
  },
  fst: {
    en: `${E}/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-trades.html`,
    fr: `${F}/services/immigrer-canada/entree-express/qui-presenter-demande/metiers-specialises.html`,
  },
  eeFunds: {
    en: `${E}/services/immigrate-canada/express-entry/documents/proof-funds.html`,
    fr: `${F}/services/immigrer-canada/entree-express/documents/preuve-fonds-suffisants.html`,
  },
  comeToCanada: {
    en: `${E}/services/come-canada-tool-immigration-express-entry.html`,
    fr: `${F}/services/outil-venir-canada-immigration-entree-express.html`,
  },
  explore: { en: 'https://ircc.canada.ca/explore-programs/index.asp', fr: 'https://ircc.canada.ca/explorer-programmes/index.asp' },
  pnp: { en: `${E}/services/immigrate-canada/provincial-nominees.html`, fr: `${F}/services/immigrer-canada/candidats-provinces.html` },
  processing: { en: `${E}/services/application/check-processing-times.html`, fr: `${F}/services/demande/verifier-delais-traitement.html` },
  status: { en: `${E}/services/application/check-status.html`, fr: `${F}/services/demande/verifier-etat.html` },
  entryByCountry: {
    en: `${E}/services/visit-canada/entry-requirements-country.html`,
    fr: `${F}/services/visiter-canada/exigences-admission-selon-pays.html`,
  },
  checkVisaEta: { en: `${E}/services/visit-canada/check-visa-eta.html`, fr: `${F}/services/visiter-canada/verifiez-visa-ave.html` },
  etaX: { en: `${E}/services/visit-canada/eta/eligibility/eta-x.html`, fr: `${F}/services/visiter-canada/ave/admissibilite/ave-x.html` },
  eta: { en: `${E}/services/visit-canada/eta.html`, fr: `${F}/services/visiter-canada/ave.html` },
  etaFacts: { en: `${E}/services/visit-canada/eta/facts.html`, fr: `${F}/services/visiter-canada/ave/faits.html` },
  visitorVisa: { en: `${E}/services/visit-canada/visitor-visa.html`, fr: `${F}/services/visiter-canada/visa-visiteur.html` },
  applyVisitorVisa: { en: `${E}/services/visit-canada/apply-visitor-visa.html`, fr: `${F}/services/visiter-canada/demande-visa-visiteur.html` },
  studyPermit: { en: `${E}/services/study-canada/study-permit.html`, fr: `${F}/services/etudier-canada/permis-etudes.html` },
  studyEligibility: {
    en: `${E}/services/study-canada/study-permit/eligibility.html`,
    fr: `${F}/services/etudier-canada/permis-etudes/admissibilite.html`,
  },
  studyDocs: {
    en: `${E}/services/study-canada/study-permit/get-documents.html`,
    fr: `${F}/services/etudier-canada/permis-etudes/obtenir-documents.html`,
  },
  studyFunds: {
    en: `${E}/services/study-canada/study-permit/get-documents/financial-support.html`,
    fr: `${F}/services/etudier-canada/permis-etudes/obtenir-documents/preuve-ressources-financieres.html`,
  },
  studyTool: {
    en: `${E}/services/study-canada/study-permit/study-permit-tool.html`,
    fr: `${F}/services/etudier-canada/permis-etudes/outil-permis-etudes.html`,
  },
  offCampus: { en: `${E}/services/study-canada/work/work-off-campus.html`, fr: `${F}/services/etudier-canada/travail/travailler-hors-campus.html` },
  pgwp: {
    en: `${E}/services/study-canada/work/after-graduation/about.html`,
    fr: `${F}/services/etudier-canada/travail/apres-obtention-diplome/au-sujet.html`,
  },
  workCanada: { en: `${E}/services/work-canada.html`, fr: `${F}/services/travailler-canada.html` },
  needWorkPermit: { en: `${E}/services/work-canada/need-permit.html`, fr: `${F}/services/travailler-canada/besoin-permis.html` },
  parents: {
    en: `${E}/services/immigrate-canada/family-sponsorship/sponsor-parents-grandparents.html`,
    fr: `${F}/services/immigrer-canada/parrainer-membre-famille/parrainer-parents-grands-parents.html`,
  },
  superVisa: {
    en: `${E}/services/visit-canada/parent-grandparent-super-visa.html`,
    fr: `${F}/services/visiter-canada/super-visa-parents-grands-parents.html`,
  },
  fees: { en: 'https://ircc.canada.ca/english/information/fees/fees.asp', fr: 'https://ircc.canada.ca/francais/information/frais/bareme.asp' },
} as const;

export type UrlKey = keyof typeof URLS;

/**
 * Programs IRCC has paused (not accepting new applications). Not in any feed: read from the program page,
 * so re-check it whenever `CHECKED` (sources.ts) moves. Times for these rows apply only to applications already submitted.
 */
export const PAUSED: Partial<Record<string, { pageModified: string; source: UrlKey }>> = {
  parents: { pageModified: '2026-08-18', source: 'parents' },
};

/** IRCC fees (CAD) as published in fees.json on 2026-09-30. Refreshed live by the tools when the feed answers. */
export const FEES = {
  eta: 7,
  visitorVisa: 100,
  biometrics: 85,
  studyPermit: 150,
  workPermit: 155,
  openWorkPermitHolder: 100,
  iec: 184.75,
  economicPr: 1590,
};
export type Fees = typeof FEES;

/* ───────────────────────── Express Entry: CRS (crs-criteria.html) ───────────────────────── */

export const EDUCATION = ['none', 'secondary', 'one-year', 'two-year', 'bachelors', 'two-or-more', 'masters', 'phd'] as const;
export type Education = (typeof EDUCATION)[number];

export const CRS = {
  /** Age points [with spouse, without spouse]; index = age 17…45 (17 or less → 0, 45+ → 0). */
  age: {
    17: [0, 0], 18: [90, 99], 19: [95, 105], 20: [100, 110], 21: [100, 110], 22: [100, 110], 23: [100, 110], 24: [100, 110],
    25: [100, 110], 26: [100, 110], 27: [100, 110], 28: [100, 110], 29: [100, 110], 30: [95, 105], 31: [90, 99], 32: [85, 94],
    33: [80, 88], 34: [75, 83], 35: [70, 77], 36: [65, 72], 37: [60, 66], 38: [55, 61], 39: [50, 55], 40: [45, 50],
    41: [35, 39], 42: [25, 28], 43: [15, 17], 44: [5, 6], 45: [0, 0],
  } as Record<number, [number, number]>,
  education: {
    none: [0, 0], secondary: [28, 30], 'one-year': [84, 90], 'two-year': [91, 98], bachelors: [112, 120],
    'two-or-more': [119, 128], masters: [126, 135], phd: [140, 150],
  } as Record<Education, [number, number]>,
  /** First official language, per ability, by CLB [with, without]. */
  firstLanguage: (clb: number): [number, number] =>
    clb >= 10 ? [32, 34] : clb === 9 ? [29, 31] : clb === 8 ? [22, 23] : clb === 7 ? [16, 17] : clb === 6 ? [8, 9] : clb >= 4 ? [6, 6] : [0, 0],
  /** Second official language, per ability (same with or without spouse); capped at 22 / 24 in total. */
  secondLanguage: (clb: number) => (clb >= 9 ? 6 : clb >= 7 ? 3 : clb >= 5 ? 1 : 0),
  secondLanguageCap: [22, 24] as [number, number],
  canadianWork: [[0, 0], [35, 40], [46, 53], [56, 64], [63, 72], [70, 80]] as [number, number][],
  spouse: {
    education: { none: 0, secondary: 2, 'one-year': 6, 'two-year': 7, bachelors: 8, 'two-or-more': 9, masters: 10, phd: 10 } as Record<Education, number>,
    language: (clb: number) => (clb >= 9 ? 5 : clb >= 7 ? 3 : clb >= 5 ? 1 : 0),
    canadianWork: [0, 5, 7, 8, 9, 10],
  },
  transferability: { perFactor: 50, total: 100 },
  additional: { sibling: 15, frenchOnly: 25, frenchAndEnglish: 50, canadianEducationShort: 15, canadianEducationLong: 30, nomination: 600, max: 600 },
  max: { core: [460, 500] as [number, number], spouse: 40, transferability: 100, additional: 600, total: 1200 },
  jobOfferPointsRemoved: '2025-03-25',
};

/* ───────────────────────── Express Entry: FSW selection grid, out of 100, pass mark 67 (federal-skilled-workers.html) ───────────────────────── */

export const FSW = {
  passMark: 67,
  firstLanguage: (clb: number) => (clb >= 9 ? 6 : clb === 8 ? 5 : clb === 7 ? 4 : 0),
  secondLanguage: 4, // CLB 5+ in all 4 abilities
  education: { none: 0, secondary: 5, 'one-year': 15, 'two-year': 19, bachelors: 21, 'two-or-more': 22, masters: 23, phd: 25 } as Record<Education, number>,
  experience: (years: number) => (years >= 6 ? 15 : years >= 4 ? 13 : years >= 2 ? 11 : years >= 1 ? 9 : 0),
  age: (age: number) => (age < 18 ? 0 : age <= 35 ? 12 : age >= 47 ? 0 : 12 - (age - 35)),
  arrangedEmployment: 10,
  adaptability: { spouseLanguage: 5, pastStudy: 5, pastWork: 10, spouseWork: 5, arrangedEmployment: 5, relative: 5, max: 10 },
  max: { language: 28, education: 25, experience: 15, age: 12, arrangedEmployment: 10, adaptability: 10 },
};

/** Minimum requirements (who-can-apply.html). */
export const PROGRAMS = {
  cec: { clbTeer01: 7, clbTeer23: 5, years: 1, windowYears: 3 },
  fsw: { clb: 7, years: 1, windowYears: 10 },
  fst: { clbSpeakListen: 5, clbReadWrite: 4, years: 2, windowYears: 5 },
};

/** Settlement funds (proof-funds.html, table "Updated July 7, 2025"). Index = family size 1…7. */
export const EE_FUNDS = { updated: '2025-07-07', bySize: [15263, 19001, 23360, 28362, 32168, 36280, 40392], extra: 4112 };

/* ───────────────────────── Study permits (financial-support.html) ───────────────────────── */

/** Living expenses for the first year, applications on or after Sept 1, 2026 (all provinces and territories except Quebec). */
export const STUDY_FUNDS = { from: '2026-09-01', bySize: [23448, 29192, 35888, 43572, 49419, 55736, 62054], extra: 6318 };
export const STUDY = { offCampusHoursPerWeek: 24, pgwpMaxYears: 3, pgwpMinMonths: 8, pgwpLanguageSince: '2024-11-01' };

export const fundsFor = (table: { bySize: number[]; extra: number }, size: number) =>
  size <= table.bySize.length ? table.bySize[Math.max(1, size) - 1] : table.bySize[table.bySize.length - 1] + (size - table.bySize.length) * table.extra;

/* ───────────────────────── Visa or eTA (entry-requirements-country.html, 2026-07-31) ───────────────────────── */

/** Citizens need a visitor visa (any way of travelling). */
export const VISA_REQUIRED = new Set(
  'AF AL DZ AO AG AR AM AZ BH BD BY BZ BJ BT BO BA BW BR BF BI KH CM CV CF TD CN CO KM CD CG CR CU DJ DM DO EC EG SV GQ ER SZ ET FJ GA GM GE GH GD GN GW GY HT HN IN ID IR IQ CI JM JO KZ KE KI KP XK KW KG LA LB LS LR LY MO MG MW MY MV ML MH MR MU MX FM MD MN ME MA MZ MM NA NR NP NI NE NG MK OM PK PW PS PA PY PE PH RU RW ST SA SN RS SC SL SO ZA SS LK KN LC VC SD SR SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA UY UZ VU VE VN YE ZM ZW'.split(' '),
);
/** Visa-required countries whose citizens may get an eTA instead when flying (eta-x.html). */
export const ETA_CONDITIONAL = new Set('AG AR BR CR ID MY MX MA PA PH KN LC VC SC TH TT UY'.split(' '));
/** Citizens need an eTA to fly to Canada (not by land or sea). Includes British overseas territories. */
export const ETA_REQUIRED = new Set(
  'AD AU AT BS BB BE GB BN BG CL HR CY CZ DK EE FI FR DE GR HK HU IS IE IL IT JP LV LI LT LU MT MC NL NZ NO PG PL PT QA KR RO WS SM SG SK SI SB ES SE CH TW AE VA AI BM VG KY FK GI MS PN SH TC'.split(' '),
);
/** Passport-type rules printed next to some countries on the official list. */
export const PASSPORT_NOTES: Record<string, 'israel' | 'taiwan' | 'romania' | 'hong-kong' | 'vatican' | 'british-territory'> = {
  IL: 'israel',
  TW: 'taiwan',
  RO: 'romania',
  HK: 'hong-kong',
  VA: 'vatican',
  AI: 'british-territory', BM: 'british-territory', VG: 'british-territory', KY: 'british-territory', FK: 'british-territory',
  GI: 'british-territory', MS: 'british-territory', PN: 'british-territory', SH: 'british-territory', TC: 'british-territory',
};

/** Every nationality the checker knows (for the picker). */
export const ENTRY_COUNTRIES = [...new Set(['US', 'CA', ...VISA_REQUIRED, ...ETA_REQUIRED])];

/* ───────────────────────── Express Entry pool distribution (rounds-invitations.html) ───────────────────────── */

/** CRS bands for dd1…dd17 (bold totals dd3, dd9 and dd18 are left out). */
export const POOL_BANDS: [number, number][] = [
  [601, 1200], [501, 600], [491, 500], [481, 490], [471, 480], [461, 470], [451, 460],
  [441, 450], [431, 440], [421, 430], [411, 420], [401, 410], [351, 400], [301, 350], [0, 300],
];
