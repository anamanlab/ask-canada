/**
 * The job list's on-device model (pure): filters, sort orders and the saved-jobs record. The renderer keeps
 * the state; everything derived from it is computed here during render.
 */
import { HOURS_PER_YEAR, type Province } from './data';
import { daysSince } from './parts';
import type { JobPosting, SalaryPeriod } from './types';

export type Filter = 'all' | 'new' | 'jobBank' | 'flexible' | 'pay';
export type Sort = 'relevance' | 'newest' | 'pay';
export const FILTERS: Filter[] = ['all', 'new', 'jobBank', 'flexible', 'pay'];

/** Enough of a posting to show its card again from any search (older entries may have only the first four). */
export type SavedJob = Pick<JobPosting, 'id' | 'title' | 'employer' | 'url'> &
  Partial<Pick<JobPosting, 'location' | 'province' | 'date' | 'salary' | 'workplace' | 'postedOnJobBank' | 'directApply'>>;

/** At most this many saved jobs are kept (the oldest drop off). */
const MAX_SAVED = 30;

/**
 * "New" means posted in the last 2 days, by the date people see on the card. Job Bank's own "new" flag
 * (which can be up to a week old) is used only when a posting has no date.
 */
export const isFresh = (j: JobPosting, today: string) => (j.date ? daysSince(j.date, today) <= 2 : j.isNew);

/** Hours of work behind each pay period, to compare postings by the hour (a year is 37.5 h × 52 weeks). */
const HOURS: Record<SalaryPeriod, number> = { hour: 1, week: HOURS_PER_YEAR / 52, month: HOURS_PER_YEAR / 12, year: HOURS_PER_YEAR };

/** A posting's pay by the hour, as [bottom, top] of its range; null when the pay or its period is unknown. */
function hourlyRange(j: JobPosting): [number, number] | null {
  const s = j.salary;
  if (!s?.min || !s.period) return null;
  return [s.min / HOURS[s.period], (s.max ?? s.min) / HOURS[s.period]];
}

/**
 * "Top pay": by the lowest pay a posting offers (what anyone hired is sure to get), then by the top of its
 * range; postings without readable pay come last. "$38–$40.50 an hour" leads "$26.75–$40.63 an hour".
 */
function byPay(a: JobPosting, b: JobPosting): number {
  const [ra, rb] = [hourlyRange(a), hourlyRange(b)];
  if (!ra || !rb) return (rb ? 1 : 0) - (ra ? 1 : 0);
  return rb[0] - ra[0] || rb[1] - ra[1];
}

const TESTS: Record<Filter, (j: JobPosting, today: string) => boolean> = {
  all: () => true,
  new: isFresh,
  jobBank: (j) => j.postedOnJobBank,
  flexible: (j) => j.workplace === 'remote' || j.workplace === 'hybrid',
  pay: (j) => j.salary?.min != null,
};

/** How many postings each filter would show. */
export function filterCounts(jobs: JobPosting[], today: string): Record<Filter, number> {
  const count = (f: Filter) => jobs.filter((j) => TESTS[f](j, today)).length;
  return { all: jobs.length, new: count('new'), jobBank: count('jobBank'), flexible: count('flexible'), pay: count('pay') };
}

/** Filters worth offering: ones that would match nothing or everything are left out (the active one stays, so it can be switched off). */
export const offeredFilters = (counts: Record<Filter, number>, active: Filter) =>
  FILTERS.filter((f) => f === 'all' || f === active || (counts[f] > 0 && counts[f] < counts.all));

export function visibleJobs(jobs: JobPosting[], { filter, sort, today, province }: { filter: Filter; sort: Sort; today: string; province?: Province }): JobPosting[] {
  const kept = jobs.filter((j) => TESTS[filter](j, today));
  if (sort === 'newest') return kept.toSorted((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  if (sort === 'pay') return kept.toSorted(byPay);
  // Best match keeps Job Bank's order, but a local question leads with local jobs: telework postings
  // from another province (still tagged Remote) follow them.
  if (province) return [...kept.filter((j) => !j.province || j.province === province), ...kept.filter((j) => j.province && j.province !== province)];
  return kept;
}

/** The saved list after toggling one posting (newest last). */
export function toggleSaved(saved: SavedJob[], j: JobPosting): SavedJob[] {
  if (saved.some((s) => s.id === j.id)) return saved.filter((s) => s.id !== j.id);
  const keep: SavedJob = { id: j.id, title: j.title, employer: j.employer, url: j.url, location: j.location, province: j.province, date: j.date, salary: j.salary, workplace: j.workplace, postedOnJobBank: j.postedOnJobBank, directApply: j.directApply };
  return [...saved, keep].slice(-MAX_SAVED);
}

/** Every job saved on this device, newest first, with fresh details when it is in this search too. */
export const savedPostings = (saved: SavedJob[], jobs: JobPosting[]): JobPosting[] =>
  saved.toReversed().map((s) => jobs.find((x) => x.id === s.id) ?? { location: '', postedOnJobBank: false, directApply: false, ...s, isNew: false });
