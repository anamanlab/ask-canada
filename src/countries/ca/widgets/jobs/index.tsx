'use client';
/**
 * Renderers for the `jobs` widget: { [toolName]: Component }. See docs/WIDGET_GUIDE.md.
 *   jobsSearch → live Job Bank postings · jobsWages → wage explorer · jobsResumeMatch → career match
 *   jobsPrograms → youth, student and government job programs
 */
import type { Renderers } from '@/lib/widgets/types';
import { JobsPrograms } from './JobsPrograms';
import { JobsResumeMatch } from './JobsResumeMatch';
import { JobsSearch } from './JobsSearch';
import { JobsWages } from './JobsWages';

export const renderers: Renderers = {
  jobsSearch: JobsSearch,
  jobsWages: JobsWages,
  jobsResumeMatch: JobsResumeMatch,
  jobsPrograms: JobsPrograms,
};
export default renderers;
