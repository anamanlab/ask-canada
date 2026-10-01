/**
 * Express Entry math: CRS score, the Federal Skilled Worker selection grid (out of 100, pass mark 67) and the
 * minimum requirements of the 3 Express Entry programs. What the score means (ideas to raise it, pool rank, the
 * round to compare with) is in crs-insights.ts.
 * Pure and isomorphic: the tools use it on the server, the widgets re-run it on every tap.
 * Tables: data.ts (crs-criteria.html, federal-skilled-workers.html, who-can-apply.html).
 */
import { CRS, EDUCATION, FSW, PROGRAMS, type Education } from './data';

export type Occupation = 'teer01' | 'teer23' | 'trade' | 'other';
/** Credential earned in Canada: short = 1 year, two = 2 years, long = 3+ years (or a master's/PhD). */
export type CanadianEducation = 'none' | 'short' | 'two' | 'long';

/** Everything the calculators need. Language levels are Canadian Language Benchmark (CLB/NCLC), 0 = no test. */
export type Profile = {
  age: number;
  education: Education;
  /** Official language of the main test. */
  firstLanguage: 'en' | 'fr';
  /** CLB in the first official language, applied to all 4 abilities (use the lowest for a safe estimate). */
  firstClb: number;
  /** CLB in the other official language (0 = no test). */
  secondClb: number;
  /** Years of skilled work in Canada (0–5; 5 means 5 or more). */
  canadianWork: number;
  /** Years of skilled work outside Canada in the last 10 years (0–6; 6 means 6 or more). */
  foreignWork: number;
  occupation: Occupation;
  /** Canadian certificate of qualification in a skilled trade. */
  certificate: boolean;
  /** Valid job offer (still matters for FSW and FST eligibility, no longer for CRS points). */
  jobOffer: boolean;
  /** Spouse or common-law partner coming to Canada (and not a Canadian citizen or PR). */
  spouse: boolean;
  spouseEducation: Education;
  spouseClb: number;
  spouseCanadianWork: number;
  canadianEducation: CanadianEducation;
  /** Brother or sister in Canada, 18+, citizen or PR (CRS points). */
  sibling: boolean;
  /**
   * Close relative in Canada, 18+, citizen or PR, of the person or their partner: parent, grandparent, child,
   * grandchild, sibling, aunt or uncle, niece or nephew (FSW adaptability only; a sibling also counts).
   */
  relative: boolean;
  nomination: boolean;
};

/**
 * Starting values for anything the person didn't say. Everything that earns points starts at the conservative
 * value (0 / none / no), so an unstated answer can never add points. Age, education and language have no
 * "zero", so they start at a common profile and are always flagged as assumed (see `assumedFields`).
 */
export const DEFAULT_PROFILE: Profile = {
  age: 29,
  education: 'bachelors',
  firstLanguage: 'en',
  firstClb: 9,
  secondClb: 0,
  canadianWork: 0,
  foreignWork: 0,
  occupation: 'teer01',
  certificate: false,
  jobOffer: false,
  spouse: false,
  spouseEducation: 'bachelors',
  spouseClb: 0,
  spouseCanadianWork: 0,
  canadianEducation: 'none',
  sibling: false,
  relative: false,
  nomination: false,
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(Number.isFinite(n) ? n : lo)));
const isEdu = (v: unknown): v is Education => typeof v === 'string' && (EDUCATION as readonly string[]).includes(v);

/** Fills gaps and clamps values so a partial or odd input still gives a sensible profile. */
export function normalizeProfile(p: Partial<Profile> = {}): Profile {
  const d = DEFAULT_PROFILE;
  const clb = (v: number | undefined, fallback: number) => {
    const n = clamp(v ?? fallback, 0, 12);
    return n > 0 && n < 4 ? 0 : Math.min(n, 10);
  };
  return {
    age: clamp(p.age ?? d.age, 17, 60),
    education: isEdu(p.education) ? p.education : d.education,
    firstLanguage: p.firstLanguage === 'fr' ? 'fr' : 'en',
    firstClb: clb(p.firstClb, d.firstClb),
    secondClb: clb(p.secondClb, 0),
    canadianWork: clamp(p.canadianWork ?? d.canadianWork, 0, 5),
    foreignWork: clamp(p.foreignWork ?? d.foreignWork, 0, 6),
    occupation: (['teer01', 'teer23', 'trade', 'other'] as Occupation[]).includes(p.occupation as Occupation) ? (p.occupation as Occupation) : d.occupation,
    certificate: !!p.certificate,
    jobOffer: !!p.jobOffer,
    spouse: !!p.spouse,
    spouseEducation: isEdu(p.spouseEducation) ? p.spouseEducation : d.spouseEducation,
    spouseClb: clb(p.spouseClb, 0),
    spouseCanadianWork: clamp(p.spouseCanadianWork ?? 0, 0, 5),
    canadianEducation: (['short', 'two', 'long'] as const).includes(p.canadianEducation as 'short') ? (p.canadianEducation as CanadianEducation) : 'none',
    sibling: !!p.sibling,
    relative: !!p.relative || !!p.sibling,
    nomination: !!p.nomination,
  };
}

/* ─────────────── What the person told us ─────────────── */

/** The answers without which there is no honest estimate: age, education, language level and some work history. */
export type RequiredAnswer = 'age' | 'education' | 'language' | 'work';
export const REQUIRED_ANSWERS: RequiredAnswer[] = ['age', 'education', 'language', 'work'];

export function missingAnswers(given: readonly (keyof Profile)[]): RequiredAnswer[] {
  const has = (k: keyof Profile) => given.includes(k);
  return REQUIRED_ANSWERS.filter((r) =>
    r === 'age' ? !has('age') : r === 'education' ? !has('education') : r === 'language' ? !has('firstClb') : !has('canadianWork') && !has('foreignWork'),
  );
}

/** Answers that change the result and that we filled in (shown as "We assumed: …" and tagged in the editor). */
export type AssumedField = 'age' | 'education' | 'firstClb' | 'secondClb' | 'canadianWork' | 'foreignWork' | 'occupation';
export function assumedFields(given: readonly (keyof Profile)[], scope: 'crs' | 'eligibility' = 'crs'): AssumedField[] {
  const fields: AssumedField[] = ['age', 'education', 'firstClb', 'secondClb', 'canadianWork', 'foreignWork', ...(scope === 'eligibility' ? (['occupation'] as const) : [])];
  return fields.filter((f) => !given.includes(f));
}

/** Which profile answers an input actually carries (a tool input, or one still streaming in); other keys are ignored. */
export const givenKeys = (input: Partial<Profile> | undefined): (keyof Profile)[] =>
  input ? (Object.keys(DEFAULT_PROFILE) as (keyof Profile)[]).filter((k) => input[k] !== undefined) : [];

/** Which profile keys differ between two profiles (marks an answer as given once the person changes it). */
export const changedKeys = (a: Profile, b: Profile) => (Object.keys(b) as (keyof Profile)[]).filter((k) => a[k] !== b[k]);

/* ─────────────── CRS ─────────────── */

export type CrsLine = { key: string; points: number; max: number };
export type CrsResult = {
  total: number;
  core: { total: number; max: number; lines: CrsLine[] };
  spouse: { total: number; max: number; lines: CrsLine[] } | null;
  transferability: { total: number; max: number; lines: CrsLine[] };
  additional: { total: number; max: number; lines: CrsLine[] };
};

const eduTier = (e: Education) => (e === 'none' || e === 'secondary' ? 0 : e === 'one-year' || e === 'two-year' || e === 'bachelors' ? 1 : 2);

export function crsScore(input: Partial<Profile>): CrsResult {
  const p = normalizeProfile(input);
  const s = p.spouse ? 0 : 1; // column: 0 = with spouse, 1 = without
  const age = CRS.age[Math.min(45, Math.max(17, p.age))][s];
  const edu = CRS.education[p.education][s];
  const lang1 = CRS.firstLanguage(p.firstClb)[s] * 4;
  const lang2 = Math.min(CRS.secondLanguage(p.secondClb) * 4, CRS.secondLanguageCap[s]);
  const work = CRS.canadianWork[p.canadianWork][s];
  const coreLines: CrsLine[] = [
    { key: 'age', points: age, max: s ? 110 : 100 },
    { key: 'education', points: edu, max: s ? 150 : 140 },
    { key: 'firstLanguage', points: lang1, max: s ? 136 : 128 },
    { key: 'secondLanguage', points: lang2, max: CRS.secondLanguageCap[s] },
    { key: 'canadianWork', points: work, max: s ? 80 : 70 },
  ];

  let spouse: CrsResult['spouse'] = null;
  if (p.spouse) {
    const lines: CrsLine[] = [
      { key: 'spouseEducation', points: CRS.spouse.education[p.spouseEducation], max: 10 },
      { key: 'spouseLanguage', points: CRS.spouse.language(p.spouseClb) * 4, max: 20 },
      { key: 'spouseCanadianWork', points: CRS.spouse.canadianWork[p.spouseCanadianWork], max: 10 },
    ];
    spouse = { total: lines.reduce((a, l) => a + l.points, 0), max: CRS.max.spouse, lines };
  }

  // Skill transferability (max 50 per factor, 100 overall).
  const tier = eduTier(p.education);
  const high = p.firstClb >= 9;
  const mid = p.firstClb >= 7;
  const pick = (t: number, lo: number, hi: number) => (t === 0 ? 0 : t === 1 ? lo : hi);
  const eduLang = high ? pick(tier, 25, 50) : mid ? pick(tier, 13, 25) : 0;
  const eduWork = p.canadianWork >= 2 ? pick(tier, 25, 50) : p.canadianWork === 1 ? pick(tier, 13, 25) : 0;
  const fTier = p.foreignWork >= 3 ? 2 : p.foreignWork >= 1 ? 1 : 0;
  const forLang = high ? pick(fTier, 25, 50) : mid ? pick(fTier, 13, 25) : 0;
  const forWork = p.canadianWork >= 2 ? pick(fTier, 25, 50) : p.canadianWork === 1 ? pick(fTier, 13, 25) : 0;
  const cert = p.certificate ? (p.firstClb >= 7 ? 50 : p.firstClb >= 5 ? 25 : 0) : 0;
  const tLines: CrsLine[] = [
    { key: 'transferEducation', points: Math.min(50, eduLang + eduWork), max: 50 },
    { key: 'transferForeign', points: Math.min(50, forLang + forWork), max: 50 },
    { key: 'transferCertificate', points: cert, max: 50 },
  ];
  const tTotal = Math.min(CRS.transferability.total, tLines.reduce((a, l) => a + l.points, 0));

  // Additional points.
  const frenchClb = p.firstLanguage === 'fr' ? p.firstClb : p.secondClb;
  const englishClb = p.firstLanguage === 'fr' ? p.secondClb : p.firstClb;
  const french = frenchClb >= 7 ? (englishClb >= 5 ? CRS.additional.frenchAndEnglish : CRS.additional.frenchOnly) : 0;
  const aLines: CrsLine[] = [
    { key: 'nomination', points: p.nomination ? CRS.additional.nomination : 0, max: 600 },
    { key: 'french', points: french, max: 50 },
    { key: 'canadianEducation', points: p.canadianEducation === 'long' ? 30 : p.canadianEducation !== 'none' ? 15 : 0, max: 30 },
    { key: 'sibling', points: p.sibling ? CRS.additional.sibling : 0, max: 15 },
  ];
  const aTotal = Math.min(CRS.additional.max, aLines.reduce((a, l) => a + l.points, 0));
  const coreTotal = coreLines.reduce((a, l) => a + l.points, 0);

  return {
    total: coreTotal + (spouse?.total ?? 0) + tTotal + aTotal,
    core: { total: coreTotal, max: CRS.max.core[s], lines: coreLines },
    spouse,
    transferability: { total: tTotal, max: CRS.max.transferability, lines: tLines },
    additional: { total: aTotal, max: CRS.max.additional, lines: aLines },
  };
}

/* ─────────────── FSW selection grid (out of 100, pass mark 67) ─────────────── */

export type FswLine = { key: 'language' | 'education' | 'experience' | 'age' | 'arrangedEmployment' | 'adaptability'; points: number; max: number };

export function fswGrid(input: Partial<Profile>): { total: number; passMark: number; lines: FswLine[] } {
  const p = normalizeProfile(input);
  const lang = Math.min(28, FSW.firstLanguage(p.firstClb) * 4 + (p.secondClb >= 5 ? FSW.secondLanguage : 0));
  const years = p.canadianWork + p.foreignWork;
  const adapt = Math.min(
    FSW.adaptability.max,
    (p.spouse && p.spouseClb >= 4 ? FSW.adaptability.spouseLanguage : 0) +
      // At least 2 academic years of full-time study in Canada.
      (p.canadianEducation === 'two' || p.canadianEducation === 'long' ? FSW.adaptability.pastStudy : 0) +
      (p.canadianWork >= 1 ? FSW.adaptability.pastWork : 0) +
      (p.spouse && p.spouseCanadianWork >= 1 ? FSW.adaptability.spouseWork : 0) +
      (p.jobOffer ? FSW.adaptability.arrangedEmployment : 0) +
      (p.relative || p.sibling ? FSW.adaptability.relative : 0),
  );
  const lines: FswLine[] = [
    { key: 'language', points: lang, max: FSW.max.language },
    { key: 'education', points: FSW.education[p.education], max: FSW.max.education },
    { key: 'experience', points: FSW.experience(years), max: FSW.max.experience },
    { key: 'age', points: FSW.age(p.age), max: FSW.max.age },
    { key: 'arrangedEmployment', points: p.jobOffer ? FSW.arrangedEmployment : 0, max: FSW.max.arrangedEmployment },
    { key: 'adaptability', points: adapt, max: FSW.max.adaptability },
  ];
  return { total: lines.reduce((a, l) => a + l.points, 0), passMark: FSW.passMark, lines };
}

/* ─────────────── Program minimums ─────────────── */

export type ProgramId = 'cec' | 'fsw' | 'fst';
export type Check = { key: string; ok: boolean; values?: Record<string, string | number> };
export type ProgramResult = { id: ProgramId; eligible: boolean; checks: Check[] };

export function programs(input: Partial<Profile>): ProgramResult[] {
  const p = normalizeProfile(input);
  const skilled = p.occupation !== 'other';
  const cecClb = p.occupation === 'teer01' ? PROGRAMS.cec.clbTeer01 : PROGRAMS.cec.clbTeer23;
  const cec: Check[] = [
    { key: 'cec.work', ok: skilled && p.canadianWork >= PROGRAMS.cec.years },
    { key: 'cec.language', ok: p.firstClb >= cecClb, values: { clb: cecClb } },
  ];
  const grid = fswGrid(p);
  const fsw: Check[] = [
    { key: 'fsw.work', ok: skilled && p.canadianWork + p.foreignWork >= PROGRAMS.fsw.years },
    { key: 'fsw.language', ok: p.firstClb >= PROGRAMS.fsw.clb, values: { clb: PROGRAMS.fsw.clb } },
    { key: 'fsw.education', ok: p.education !== 'none' },
    { key: 'fsw.points', ok: grid.total >= FSW.passMark, values: { points: grid.total, pass: FSW.passMark } },
  ];
  const fst: Check[] = [
    { key: 'fst.trade', ok: p.occupation === 'trade' },
    { key: 'fst.work', ok: p.occupation === 'trade' && p.canadianWork + p.foreignWork >= PROGRAMS.fst.years },
    { key: 'fst.language', ok: p.firstClb >= PROGRAMS.fst.clbSpeakListen, values: { clb: PROGRAMS.fst.clbSpeakListen } },
    { key: 'fst.offer', ok: p.jobOffer || p.certificate },
  ];
  return [
    { id: 'cec', eligible: cec.every((c) => c.ok), checks: cec },
    { id: 'fsw', eligible: fsw.every((c) => c.ok), checks: fsw },
    { id: 'fst', eligible: fst.every((c) => c.ok), checks: fst },
  ];
}
