/**
 * Youth, student and government job programs (isomorphic, pure). Facts in data.ts; the renderer re-runs
 * `evaluatePrograms` instantly when the person changes their age or stage.
 */
import { URLS, YESS_PHONE } from './data';
import type { Stage } from './types';

export type ProgramId = 'gcjobs' | 'fswep' | 'csj' | 'coop' | 'research' | 'swpp' | 'yess' | 'parks' | 'iec' | 'apprentice';
export type Fit = 'yes' | 'maybe' | 'no';

export type Program = {
  id: ProgramId;
  government: boolean;
  summer: boolean;
  url: { en: string; fr: string };
  /** Extra link (e.g. where to search the postings). */
  search?: { en: string; fr: string };
  ages?: [number, number];
};

export const PROGRAMS: Program[] = [
  { id: 'gcjobs', government: true, summer: false, url: URLS.gcJobs, search: URLS.gcJobsSearch },
  { id: 'fswep', government: true, summer: true, url: URLS.fswep, search: URLS.gcJobsSearch },
  { id: 'csj', government: false, summer: true, url: URLS.csj, search: URLS.jobBankYouth, ages: [15, 30] },
  { id: 'coop', government: true, summer: false, url: URLS.coop },
  { id: 'research', government: true, summer: false, url: URLS.research, search: URLS.gcJobsSearch },
  { id: 'swpp', government: false, summer: false, url: URLS.swpp },
  { id: 'yess', government: false, summer: false, url: URLS.yess, ages: [15, 30] },
  { id: 'parks', government: true, summer: true, url: URLS.parksYouth, ages: [15, 30] },
  { id: 'iec', government: false, summer: false, url: URLS.iec, ages: [18, 35] },
  { id: 'apprentice', government: false, summer: false, url: URLS.apprentice, search: { en: 'https://www.jobbank.gc.ca/jobsearch/jobsearch?fjap=1&sort=D', fr: 'https://www.guichetemplois.gc.ca/jobsearch/rechercheemplois?fjap=1&sort=D' } },
];

export type Evaluated = Program & { fit: Fit; /** Message key suffix explaining the fit. */ why: string };

const inAges = (p: Program, age?: number) => (p.ages && age != null ? age >= p.ages[0] && age <= p.ages[1] : true);

export function evaluatePrograms({ age, stage, interest = 'any' }: { age?: number; stage?: Stage; interest?: 'government' | 'summer' | 'any' }): Evaluated[] {
  const student = stage === 'high-school' || stage === 'post-secondary';
  const ev = PROGRAMS.map((p): Evaluated => {
    let fit: Fit = 'maybe';
    let why = 'default';
    switch (p.id) {
      case 'gcjobs':
        fit = 'yes';
        why = 'anyone';
        break;
      case 'fswep':
        if (student) [fit, why] = ['yes', 'student'];
        // Graduates are no longer registered students (the final-year rule is for students still in school).
        else if (stage === 'graduate') [fit, why] = ['no', 'graduated'];
        else if (stage === 'not-student') [fit, why] = ['no', 'notStudent'];
        else why = 'needStudent';
        break;
      case 'coop':
        if (stage === 'post-secondary') [fit, why] = ['maybe', 'coopProgram'];
        else if (stage) [fit, why] = ['no', 'postSecondaryOnly'];
        else why = 'coopProgram';
        break;
      case 'research':
        if (stage === 'post-secondary') [fit, why] = ['maybe', 'researchProgram'];
        else if (stage) [fit, why] = ['no', 'postSecondaryOnly'];
        else why = 'researchProgram';
        break;
      case 'swpp':
        if (stage === 'post-secondary') [fit, why] = ['yes', 'postSecondary'];
        else if (stage) [fit, why] = ['no', 'postSecondaryOnly'];
        else why = 'postSecondary';
        break;
      case 'yess':
        // For youth facing barriers to employment: age alone never makes it a sure fit.
        if (age == null) why = 'ages';
        else if (inAges(p, age)) [fit, why] = ['maybe', 'inAgesBarriers'];
        else [fit, why] = ['no', 'outAges'];
        break;
      case 'csj':
        // Age is the deciding test; the status rule (citizen, PR or protected person) is spelled out in the why.
        if (age == null) why = 'ages';
        else if (inAges(p, age)) [fit, why] = ['yes', 'inAges'];
        else [fit, why] = ['no', 'outAges'];
        break;
      case 'parks':
        // Each Parks Canada posting sets its own requirements (many hire through FSWEP): never a sure fit.
        if (age == null) why = 'ages';
        else if (inAges(p, age)) [fit, why] = ['maybe', 'inAges'];
        else [fit, why] = ['no', 'outAges'];
        break;
      case 'iec':
        if (age == null) why = 'ages';
        else if (inAges(p, age)) [fit, why] = ['maybe', 'citizens'];
        else [fit, why] = ['no', 'outAges'];
        break;
      case 'apprentice':
        [fit, why] = ['maybe', 'trades'];
        break;
    }
    return { ...p, fit, why };
  });
  const rank = (e: Evaluated) =>
    (e.fit === 'yes' ? 0 : e.fit === 'maybe' ? 10 : 20) -
    (interest === 'government' && e.government ? 5 : 0) -
    (interest === 'summer' && e.summer ? 5 : 0) -
    // A summer-jobs question is about Canada Summer Jobs first (when it can fit at all).
    (interest === 'summer' && e.id === 'csj' && e.fit !== 'no' ? 30 : 0) +
    PROGRAMS.findIndex((p) => p.id === e.id) * 0.1;
  return ev.sort((a, b) => rank(a) - rank(b));
}

/** Facts shown on each card (values for the message templates). */
export function programFacts(id: ProgramId): Record<string, string> {
  return id === 'yess' ? { phone: YESS_PHONE.phone, tty: YESS_PHONE.tty } : {};
}
