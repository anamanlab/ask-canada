/**
 * Jobs facts, verified 2026-09-30 (see each URL + "Date modified"). Isomorphic: used by the tools (server)
 * and the renderers (client, for instant filtering and links).
 *
 * Live sources (fetched server-side by tools/jobs.ts, see ./live.ts)
 * - Job Bank job search (HTML results, 25 per page, count + province facets). Filters verified on the
 *   results page: fprov=<PR>, fskl=15141 (remote), fskl=100000 (hybrid), fjsf=1 (student jobs),
 *   fage=2 (last 48 hours), fsrc=16 (posted on Job Bank), fper=F|P, fjap=1 (apprentice), sort=D (date).
 *   City search needs locationstring="City, PR" + locationparam=<city_id> from
 *   /core/ta-cityprovsuggest_<lang>/select. https://www.jobbank.gc.ca/jobsearch/jobsearch (2026-08-07)
 *   French: https://www.guichetemplois.gc.ca/jobsearch/rechercheemplois
 * - Job titles → NOC 2021 + Job Bank profile id: /core/ta-jobtitle_<lang>/select (noc21_code,
 *   noc_job_title_concordance_id).
 * - Wages: https://www.jobbank.gc.ca/marketreport/wages-occupation/<id>/<ca|PR> (2026-08-07). Low / median /
 *   high hourly wages by province and economic region; "These wages were updated on November 19, 2025";
 *   reference period 2023-2024; source: Labour Force Survey, Statistics Canada.
 * - Outlook: https://www.jobbank.gc.ca/marketreport/outlook-occupation/<id>/ca — 0–5 stars by province
 *   (Undetermined, Very limited, Limited, Moderate, Good, Very good), 2025-2027 period.
 *
 * Programs (canada.ca pages, fetched 2026-09-30)
 * - Government of Canada jobs: most federal departments post on GC Jobs; no account needed to search.
 *   https://www.canada.ca/en/services/jobs/opportunities/government.html (2026-09-29)
 *   CDS AI Answers guidance: Job Bank = private-sector and SOME government jobs; GC Jobs search link below.
 * - Federal Student Work Experience Program (FSWEP): full-time secondary or post-secondary student,
 *   returning to full-time studies next term (or, in the final year, previously employed under FSWEP, Co-op
 *   or Research Affiliate), minimum working age of the province/territory; inventory open year-round,
 *   200+ departments and agencies. Graduates are no longer registered students, so not eligible.
 *   federal-student-work-program.html (2024-02-23, re-checked 2026-09-30)
 * - Student rates of pay (effective May 1, 2025): secondary school $17.75/h; college / CEGEP / pre-university
 *   $17.75–$23.55/h; university undergraduate $18.84–$28.30/h; master's $25.17–$31.69/h; doctorate
 *   $29.64–$38.38/h (steps by academic level; a higher provincial or territorial minimum wage applies
 *   instead). student-rates-pay.html (2025-01-28, re-checked 2026-10-01)
 * - Post-Secondary Co-op/Internship Program: full-time student in a co-op/internship program where the
 *   work term is an academic requirement; apply through the school's co-op coordinator. coop-internship.html (2023-10-24)
 * - Research Affiliate Program: full-time post-secondary student whose program requires research; apply on
 *   GC Jobs under "Student programs". research-affiliate-program.html (2026-07-10)
 * - Canada Summer Jobs: paid summer work for youth aged 15 to 30; "75,000+ jobs created" in 2025.
 *   canada-summer-jobs.html (2026-08-14). Youth participants: 15 to 30 at the start of employment; Canadian
 *   citizen, permanent resident or person with refugee protection; valid SIN; legally entitled to work.
 *   canada-summer-jobs/applicant-guide/who-can-apply.html (2026-08-21). Job Bank youth page: "Job postings go live on Job Bank each
 *   spring." https://www.jobbank.gc.ca/youth (2026-08-07)
 * - Youth Employment and Skills Strategy: "supports diverse youth (aged 15 to 30) to become job-ready";
 *   1-800-935-5555, TTY 1-800-926-9105. youth-employment-strategy.html (2026-06-10)
 * - Student Work Placement Program: students registered at a Canadian post-secondary institution;
 *   citizen, permanent resident or protected person. student-work-placements-stem-business.html (2026-04-01)
 * - International Experience Canada: "Youth aged 18 to 35 can work and travel abroad"; Parks Canada:
 *   "Youth aged 15 to 30 can apply to work with Parks Canada". https://www.canada.ca/en/services/jobs/youth.html (2026-09-28)
 * - Job Bank Plus account: match with employers from a job seeker profile; Resume Builder.
 *   https://www.jobbank.gc.ca/findajob (2026-08-07)
 */
export const CHECKED = '2026-09-30';
export const WAGES_UPDATED = '2025-11-19';
export const WAGES_REF_PERIOD = '2023-2024';
/** Hours used for the "per year" estimate shown next to hourly wages (37.5 h × 52 weeks). */
export const HOURS_PER_YEAR = 1950;

export type Lang = 'en' | 'fr';
export type L10n = { en: string; fr: string };

/* ------------------------------------------------------------------ provinces */

export const PROVINCES = {
  AB: { en: 'Alberta', fr: 'Alberta' },
  BC: { en: 'British Columbia', fr: 'Colombie-Britannique' },
  MB: { en: 'Manitoba', fr: 'Manitoba' },
  NB: { en: 'New Brunswick', fr: 'Nouveau-Brunswick' },
  NL: { en: 'Newfoundland and Labrador', fr: 'Terre-Neuve-et-Labrador' },
  NS: { en: 'Nova Scotia', fr: 'Nouvelle-Écosse' },
  NT: { en: 'Northwest Territories', fr: 'Territoires du Nord-Ouest' },
  NU: { en: 'Nunavut', fr: 'Nunavut' },
  ON: { en: 'Ontario', fr: 'Ontario' },
  PE: { en: 'Prince Edward Island', fr: 'Île-du-Prince-Édouard' },
  QC: { en: 'Quebec', fr: 'Québec' },
  SK: { en: 'Saskatchewan', fr: 'Saskatchewan' },
  YT: { en: 'Yukon', fr: 'Yukon' },
} as const satisfies Record<string, L10n>;
export type Province = keyof typeof PROVINCES;
export const PROVINCE_CODES = Object.keys(PROVINCES) as Province[];

/** Lower-case, accent-free, punctuation-free text for matching ("Développeuse C#" → "developpeuse c"). */
export const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const PROVINCE_ALIASES: [RegExp, Province][] = [
  [/^(ab|alta|alberta)$/, 'AB'],
  [/^(bc|b c|british columbia|colombie britannique|cb)$/, 'BC'],
  [/^(mb|man|manitoba)$/, 'MB'],
  [/^(nb|new brunswick|nouveau brunswick)$/, 'NB'],
  [/^(nl|nfld|newfoundland|newfoundland and labrador|labrador|terre neuve|terre neuve et labrador|tnl)$/, 'NL'],
  [/^(ns|nova scotia|nouvelle ecosse|ne)$/, 'NS'],
  [/^(nt|nwt|northwest territories|territoires du nord ouest|tno)$/, 'NT'],
  [/^(nu|nunavut)$/, 'NU'],
  [/^(on|ont|ontario)$/, 'ON'],
  [/^(pe|pei|p e i|prince edward island|ile du prince edouard|ipe)$/, 'PE'],
  [/^(qc|que|quebec|province de quebec)$/, 'QC'],
  [/^(sk|sask|saskatchewan)$/, 'SK'],
  [/^(yt|yukon)$/, 'YT'],
];

/** "Ontario", "ont.", "Québec", "PEI" → province code (whole string only; "Quebec City" is a city). */
export function provinceFrom(text: string | undefined | null): Province | undefined {
  if (!text) return undefined;
  const f = fold(text).replace(/^(the )?province (of|de) /, '');
  if ((PROVINCE_CODES as string[]).includes(f.toUpperCase()) && f.length === 2) return f.toUpperCase() as Province;
  return PROVINCE_ALIASES.find(([re]) => re.test(f))?.[1];
}

/** "en Ontario", "au Québec", "à l’Île-du-Prince-Édouard", "au Canada" (French place prepositions). */
export const FR_IN: Record<Province | 'CA', string> = {
  AB: 'en Alberta', BC: 'en Colombie-Britannique', MB: 'au Manitoba', NB: 'au Nouveau-Brunswick', NL: 'à Terre-Neuve-et-Labrador',
  NS: 'en Nouvelle-Écosse', NT: 'dans les Territoires du Nord-Ouest', NU: 'au Nunavut', ON: 'en Ontario', PE: 'à l’Île-du-Prince-Édouard',
  QC: 'au Québec', SK: 'en Saskatchewan', YT: 'au Yukon', CA: 'au Canada',
};

/** "in Ontario" / "au Québec"; Canada when no province. */
export const inProvince = (lang: Lang, p?: Province) => (lang === 'fr' ? FR_IN[p ?? 'CA'] : `in ${p ? PROVINCES[p].en : 'Canada'}`);

/** "in Toronto" / "à Québec" / "au Québec" / "across Canada" / "partout au Canada" for any search location. */
export function inLocation(lang: Lang, loc: SearchLocation): string {
  if (loc.kind === 'city') return lang === 'fr' ? `à ${loc.name}` : `in ${loc.name}`;
  if (loc.kind === 'province') return inProvince(lang, loc.province);
  if (loc.kind === 'postal') return lang === 'fr' ? `près de ${loc.postal}` : `near ${loc.postal}`;
  return lang === 'fr' ? 'partout au Canada' : 'across Canada';
}

/** The searched place inside a sentence: "in Toronto, ON" / "à Montréal (QC)" / "au Québec" / "near K1A 0B1". */
export function inSearchPlace(lang: Lang, loc: SearchLocation): string {
  if (loc.kind === 'city') return lang === 'fr' ? `à ${loc.name} (${loc.province})` : `in ${loc.name}, ${loc.province}`;
  if (loc.kind === 'postal') {
    const pc = `${loc.postal.slice(0, 3)} ${loc.postal.slice(3)}`;
    return lang === 'fr' ? `près de ${pc}` : `near ${pc}`;
  }
  return inLocation(lang, loc);
}

/** French "de soudeur" / "d’infirmière" (elision before a vowel or mute h). */
export const frDe = (word: string) => (/^[aeiouyhâàéèêëîïôöûùü]/i.test(word.trim()) ? `d’${word.trim()}` : `de ${word.trim()}`);

export const CANADIAN_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

/* ------------------------------------------------------------------ URLs */

export const JB = {
  en: 'https://www.jobbank.gc.ca',
  fr: 'https://www.guichetemplois.gc.ca',
} as const;

export type SearchFilters = {
  /** Remote-only (fskl=15141). */
  remote?: boolean;
  /** Hybrid (fskl=100000). */
  hybrid?: boolean;
  /** Jobs flagged for students (fjsf=1). */
  student?: boolean;
  /** Posted in the last 48 hours (fage=2). */
  recent?: boolean;
  /** Posted directly on Job Bank by the employer (fsrc=16). */
  jobBankOnly?: boolean;
  /** Apprentice positions (fjap=1). */
  apprentice?: boolean;
  /** Full time (F) or part time (P). */
  hours?: 'F' | 'P';
};

export type SearchLocation =
  | { kind: 'canada' }
  | { kind: 'province'; province: Province }
  | { kind: 'city'; name: string; province: Province; cityId: string }
  | { kind: 'postal'; postal: string };

/** Deep link to a Job Bank search (the same query our tool ran, or a refined one). */
export function jobBankSearchUrl(lang: Lang, q: string, loc: SearchLocation = { kind: 'canada' }, f: SearchFilters = {}, sort: 'D' | 'M' = 'M') {
  const p = new URLSearchParams();
  p.set('searchstring', q);
  if (loc.kind === 'city') {
    p.set('locationstring', `${loc.name}, ${loc.province}`);
    p.set('locationparam', loc.cityId);
  } else if (loc.kind === 'postal') {
    const pc = loc.postal.replace(/\s+/g, '').toUpperCase();
    p.set('locationstring', pc);
    p.set('locationparam', pc);
  } else if (loc.kind === 'province') {
    p.set('fprov', loc.province);
  }
  if (f.remote) p.append('fskl', '15141');
  if (f.hybrid) p.append('fskl', '100000');
  if (f.student) p.set('fjsf', '1');
  if (f.recent) p.set('fage', '2');
  if (f.jobBankOnly) p.set('fsrc', '16');
  if (f.apprentice) p.set('fjap', '1');
  if (f.hours) p.set('fper', f.hours);
  p.set('sort', sort);
  return `${JB[lang]}${lang === 'fr' ? '/jobsearch/rechercheemplois' : '/jobsearch/jobsearch'}?${p.toString()}`;
}

export const jobPostingUrl = (lang: Lang, id: string) =>
  lang === 'fr' ? `${JB.fr}/rechercheemplois/offredemploi/${id}` : `${JB.en}/jobsearch/jobposting/${id}`;

export const wagesUrl = (lang: Lang, profileId: string, geo: Province | 'ca' = 'ca') =>
  lang === 'fr' ? `${JB.fr}/rapportmarche/salaire-profession/${profileId}/${geo}` : `${JB.en}/marketreport/wages-occupation/${profileId}/${geo}`;

export const outlookUrl = (lang: Lang, profileId: string, geo: Province | 'ca' = 'ca') =>
  lang === 'fr' ? `${JB.fr}/rapportmarche/perspectives-profession/${profileId}/${geo}` : `${JB.en}/marketreport/outlook-occupation/${profileId}/${geo}`;

const CA = { en: 'https://www.canada.ca/en', fr: 'https://www.canada.ca/fr' };
const PSC = {
  en: `${CA.en}/public-service-commission/jobs/services/recruitment/students`,
  fr: `${CA.fr}/commission-fonction-publique/emplois/services/recrutement/etudiants`,
};

export const URLS = {
  jobBankFind: { en: `${JB.en}/findajob`, fr: `${JB.fr}/trouverunemploi` },
  jobBankSearch: { en: `${JB.en}/jobsearch/jobsearch`, fr: `${JB.fr}/jobsearch/rechercheemplois` },
  jobBankYouth: { en: `${JB.en}/youth`, fr: `${JB.fr}/jeunesse` },
  resumeBuilder: { en: `${JB.en}/findajob/resume-builder`, fr: `${JB.fr}/trouverunemploi/concepteur-cv` },
  jobBankSignUp: { en: `${JB.en}/reg/instructions`, fr: `${JB.fr}/reg/instructions` },
  trendAnalysis: { en: `${JB.en}/trend-analysis`, fr: `${JB.fr}/analyse-tendances` },
  foreignCandidates: { en: `${JB.en}/findajob/foreign-candidates`, fr: `${JB.fr}/trouverunemploi/candidats-etrangers` },
  gcJobs: { en: `${CA.en}/services/jobs/opportunities/government.html`, fr: `${CA.fr}/services/emplois/opportunites/gouvernement.html` },
  gcJobsSearch: {
    en: 'https://emploisfp-psjobs.cfp-psc.gc.ca/psrs-srfp/applicant/page2440?fromMenu=true&toggleLanguage=en',
    fr: 'https://emploisfp-psjobs.cfp-psc.gc.ca/psrs-srfp/applicant/page2440?fromMenu=true&toggleLanguage=fr',
  },
  youthJobs: { en: `${CA.en}/services/jobs/youth.html`, fr: `${CA.fr}/services/emplois/jeunesse.html` },
  fswep: { en: `${PSC.en}/federal-student-work-program.html`, fr: `${PSC.fr}/programme-federal-experience-travail-etudiant.html` },
  coop: { en: `${PSC.en}/coop-internship.html`, fr: `${PSC.fr}/coop.html` },
  research: { en: `${PSC.en}/research-affiliate-program.html`, fr: `${PSC.fr}/programme-adjoints-recherche.html` },
  studentPay: {
    en: `${CA.en}/treasury-board-secretariat/services/pay/rates-pay/student-rates-pay.html`,
    fr: `${CA.fr}/secretariat-conseil-tresor/services/remuneration/taux-remuneration/taux-remuneration-etudiants.html`,
  },
  csj: {
    en: `${CA.en}/employment-social-development/services/funding/canada-summer-jobs.html`,
    fr: `${CA.fr}/emploi-developpement-social/services/financement/emplois-ete-canada.html`,
  },
  yess: {
    en: `${CA.en}/employment-social-development/programs/youth-employment-strategy.html`,
    fr: `${CA.fr}/emploi-developpement-social/programmes/strategie-emploi-jeunesse.html`,
  },
  swpp: {
    en: `${CA.en}/employment-social-development/services/student-work-placements-stem-business.html`,
    fr: `${CA.fr}/emploi-developpement-social/services/stages-pratiques-etudiants-stim-administration.html`,
  },
  iec: {
    en: `${CA.en}/immigration-refugees-citizenship/services/canadians/international-experience-canada/about.html`,
    fr: `${CA.fr}/immigration-refugies-citoyennete/services/canadiens/experience-internationale-canada/apropos.html`,
  },
  parksYouth: {
    en: 'https://parks.canada.ca/agence-agency/emplois-jobs/etudiants-students',
    fr: 'https://parcs.canada.ca/agence-agency/emplois-jobs/etudiants-students',
  },
  apprentice: {
    en: `${CA.en}/services/jobs/training/support-skilled-trades-apprentices.html`,
    fr: `${CA.fr}/services/emplois/formation/soutien-metiers-specialises-apprentis.html`,
  },
} as const;

export const YESS_PHONE = { phone: '1-800-935-5555', tty: '1-800-926-9105' };

/* ------------------------------------------------------------------ student pay (TBS, effective 2025-05-01) */

export const STUDENT_PAY = {
  effective: '2025-05-01',
  secondary: 17.75,
  college: { min: 17.75, max: 23.55 },
  undergrad: { min: 18.84, max: 28.3 },
  masters: { min: 25.17, max: 31.69 },
  doctorate: { min: 29.64, max: 38.38 },
};
