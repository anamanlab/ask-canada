/**
 * CAF career matcher: pure, isomorphic matching (the tool runs it on the server, the widget re-runs it on
 * the device every time an answer changes). Career data comes LIVE from forces.ca (see live.ts), with
 * careers.snapshot.json as the fallback. Building the tool output: careers-build.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { CAF, Lang } from './facts';

export type Env = 'army' | 'navy' | 'air';
export type Hours = 'full-time' | 'part-time' | 'either';
export type Path = 'ncm' | 'officer' | 'either';
/** forces.ca "Minimum Required Education": 1 Grade 10, 2 High school, 3 College, 4 Bachelor's, 5 Graduate. */
export type Education = 1 | 2 | 3 | 4 | 5;

/** forces.ca career categories, in the order the widget shows them. */
export const CATEGORIES = [
  'health',
  'computing',
  'engineering',
  'maintenance',
  'aviation',
  'naval',
  'combat',
  'safety',
  'logistics',
  'administration',
  'hospitality',
  'public-relations',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Career = {
  slug: string;
  slugFr: string;
  name: string;
  nameFr: string;
  envs: Env[];
  fullTime: boolean;
  partTime: boolean;
  officer: boolean;
  minEd: number;
  paidEd: boolean;
  categories: Category[];
  signingBonus: boolean;
  recruitingAllowance: boolean;
  /** forces.ca "Priority Application Processing" (the career browser's in-demand filter). */
  priority: boolean;
  /**
   * forces.ca `featuredType === 1`: priority processing applies only to the Paid Education Entry Plan
   * ("Priority Application Processing – Paid Education Entry Plan only"), not to direct entry.
   */
  priorityPaidEdOnly: boolean;
};
export type CareerRecord = Career & { keywords?: string; keywordsFr?: string };

export type Answers = { interests: Category[]; env: Env | 'any'; hours: Hours; education?: Education; path: Path };

export type Match = { career: Career; score: number; matched: Category[]; via: 'direct' | 'paid-ed'; queryHit: boolean };

export const DEFAULT_ANSWERS: Answers = { interests: [], env: 'any', hours: 'either', path: 'either' };

export function careerUrl(c: Pick<Career, 'slug' | 'slugFr'>, lang: Lang) {
  return lang === 'fr' ? `https://forces.ca/fr/carriere/${c.slugFr}/` : `https://forces.ca/en/career/${c.slug}/`;
}

/** Can this person enter this career, and how (directly, or through a paid education plan)? */
function entryVia(c: Career, education: Education | undefined): Match['via'] | null {
  if (education == null || education >= c.minEd) return 'direct';
  // Paid education (ROTP / NCMSTEP) needs at least high school (forces.ca how-to-join, paid-education).
  if (c.paidEd && education >= 2) return 'paid-ed';
  return null;
}

export function matchCareers(list: Career[], a: Answers, queryHits: string[] = []): Match[] {
  const hits = new Set(queryHits);
  const out: Match[] = [];
  for (const c of list) {
    if (a.hours === 'part-time' && !c.partTime) continue;
    if (a.hours === 'full-time' && !c.fullTime) continue;
    if (a.env !== 'any' && !c.envs.includes(a.env)) continue;
    if (a.path === 'ncm' && c.officer) continue;
    if (a.path === 'officer' && !c.officer) continue;
    const via = entryVia(c, a.education);
    if (!via) continue;
    const matched = c.categories.filter((k) => a.interests.includes(k));
    const queryHit = hits.has(c.slug);
    if (a.interests.length && !matched.length && !queryHit) continue;
    if (!a.interests.length && hits.size && !queryHit) continue;
    const score =
      matched.length * 10 + (queryHit ? 25 : 0) + (c.priority && (via === 'paid-ed' || !c.priorityPaidEdOnly) ? 3 : 0) + (c.recruitingAllowance ? 2 : 0) + (c.signingBonus ? 1 : 0) + (via === 'direct' ? 2 : 0);
    out.push({ career: c, score, matched, via, queryHit });
  }
  return out.sort((x, y) => y.score - x.score || x.career.name.localeCompare(y.career.name));
}

/** Count of careers per category that are still open with the other answers (for chip counts). */
export function countsByCategory(list: Career[], a: Answers): Record<Category, number> {
  const base = matchCareers(list, { ...a, interests: [] });
  const counts = Object.fromEntries(CATEGORIES.map((k) => [k, 0])) as Record<Category, number>;
  for (const m of base) for (const k of m.career.categories) counts[k] += 1;
  return counts;
}

export type CareersInput = {
  interests?: Category[];
  environment?: Env | 'any';
  hours?: Hours;
  education?: 'grade10' | 'high-school' | 'college' | 'bachelor' | 'graduate';
  path?: Path;
  query?: string;
  lang?: Lang;
};

export type CareerLinks = { apply: string; careers: string; howToJoin: string; steps: string; recruitingCentre: string; paidEducation: string; reserve: string; life: string };
/** Everything in the output that depends on the language. */
export type CareersRefs = { lang: Lang; links: CareerLinks; sources: ToolSource[] };

export type CareersOutput = {
  lang: Lang;
  live: boolean;
  /** When the career list was read (live) or saved (snapshot). */
  asOf: string;
  answers: Answers;
  query: string | null;
  queryHits: string[];
  careers: Career[];
  facts: typeof CAF;
  links: CareerLinks;
  sources: ToolSource[];
  /** The same links and sources in the other official language (see `inLanguage`). */
  alt?: CareersRefs;
};
