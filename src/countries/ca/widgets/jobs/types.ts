/** Output shapes shared by tools/jobs.ts (server) and the renderers (client). */
import type { ToolSource } from '@/lib/widgets/types';
import type { L10n, Lang, Province, SearchFilters, SearchLocation } from './data';
import type { Sector } from './occupations';

/**
 * An occupation's title and Job Bank search keyword in both languages, so the renderers can follow the
 * interface language without the catalog. Optional: answers saved before these were added only have `title`.
 */
export type OccupationNames = { titles?: L10n; search?: L10n };

export type SalaryPeriod = 'hour' | 'year' | 'week' | 'month';
export type Salary = { min?: number; max?: number; period?: SalaryPeriod; negotiable?: boolean; raw: string };

export type JobPosting = {
  id: string;
  title: string;
  employer: string;
  location: string;
  province?: Province;
  /** ISO date posted. */
  date?: string;
  salary?: Salary;
  workplace?: 'onsite' | 'remote' | 'hybrid' | 'road';
  postedOnJobBank: boolean;
  isNew: boolean;
  directApply: boolean;
  url: string;
};

/* ---------------------------------------------------------------- jobsSearch */

export type SearchInput = {
  /** Empty for a filter-only search (all student jobs in a place). */
  query?: string;
  location?: string;
  remote?: boolean;
  student?: boolean;
  recent?: boolean;
  fullTime?: boolean;
  lang?: Lang;
};

export type SearchOutput = {
  lang: Lang;
  /** Keyword searched; empty for a filter-only search (e.g. all student jobs). */
  query: string;
  location: SearchLocation;
  /** What the person typed, when we couldn't resolve it (we then search all of Canada). */
  unresolvedLocation?: string;
  filters: SearchFilters;
  live: boolean;
  /** Total matching postings on Job Bank (null when unknown / offline). */
  total: number | null;
  jobs: JobPosting[];
  /** Reposts of the same job folded into one card (the list is shorter than Job Bank's page by this much). */
  duplicates?: number;
  /** Postings by province (only for Canada-wide searches). */
  byProvince: { code: Province; count: number }[];
  searchUrl: string;
  /** Catalog occupation matching the query (for pay context and a wages follow-up). */
  occupation?: { key: string; profileId: string; title: string; median: number } & OccupationNames;
  fetchedAt: string;
  sources: ToolSource[];
};

/* ---------------------------------------------------------------- jobsWages */

export type WageRow = { low: number | null; median: number | null; high: number | null };
export type Outlook = { stars: number; label: string };

export type WagesInput = { occupation: string; province?: string; lang?: Lang };

export type WagesOutput = {
  lang: Lang;
  status: 'ok' | 'not-found';
  query: string;
  occupation?: { profileId: string; noc: string; title: string } & OccupationNames;
  province?: Province;
  unit: 'hour' | 'year';
  live: boolean;
  /** ISO date Job Bank last updated the wages. */
  updated?: string;
  refPeriod?: string;
  national?: WageRow;
  provinces: (WageRow & { code: Province; outlook?: Outlook })[];
  /**
   * Economic regions of `province` (when one was asked for). `name` is in `lang`; `names` carries both
   * languages when Job Bank's two pages were read, so the widget can follow the interface language.
   */
  regions: (WageRow & { name: string; geo?: string; names?: { en?: string; fr?: string } })[];
  links: { wages: string; outlook: string; jobs: string };
  /** Other occupations to try when nothing matched. */
  suggestions: { key: string; title: string; titles?: L10n }[];
  sources: ToolSource[];
};

/* ---------------------------------------------------------------- jobsResumeMatch */

export type MatchInput = { skills?: string[]; titles?: string[]; years?: number; province?: string; lang?: Lang };

export type OccupationMatch = {
  key: string;
  profileId: string;
  noc: string;
  title: string;
  /** Title in both languages, so the card follows the interface language (older answers have only `title`). */
  titles?: L10n;
  sector: Sector;
  /** 0–100. */
  score: number;
  matchedTitles: string[];
  matchedSkills: string[];
  median: number;
  searchUrl: string;
  /** The Job Bank search in both languages (older answers have only `searchUrl`). */
  searchUrls?: L10n;
  wagesUrl: string;
};

export type MatchOutput = {
  lang: Lang;
  province?: Province;
  /** Signals the model passed (never the resume itself). */
  given: {
    skills: string[];
    titles: string[];
    /** Years in the titles given, when the person said. */
    years?: number;
    /** Of those words, the ones (folded) an occupation recognises; the rest show dimmed. Older answers lack it. */
    known?: string[];
  };
  matches: OccupationMatch[];
  links: { resumeBuilder: string; signUp: string; findAJob: string };
  sources: ToolSource[];
};

/* ---------------------------------------------------------------- jobsPrograms */

export type Stage = 'high-school' | 'post-secondary' | 'graduate' | 'not-student';
export type ProgramsInput = { age?: number; stage?: Stage; interest?: 'government' | 'summer' | 'any'; lang?: Lang };
export type ProgramsOutput = {
  lang: Lang;
  age?: number;
  stage?: Stage;
  interest: 'government' | 'summer' | 'any';
  /** Month (1–12) today, to say whether summer postings are live. */
  month: number;
  sources: ToolSource[];
};
