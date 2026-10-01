/**
 * Shapes of the career data, validated at the boundary (zod): the forces.ca API response (live.ts) and the
 * saved snapshot (careers.snapshot.json, also used by the lab fixtures).
 */
import { z } from 'zod';
import snapshot from './careers.snapshot.json';
import { CATEGORIES, type CareerRecord } from './careers';

const flag = z.union([z.boolean(), z.number()]).nullish();
const nocs = z.array(z.object({ title: z.string().nullish() })).nullish();

/** One career as https://forces.ca/api/v1/careers sends it (only the fields the matcher reads). */
export const ApiCareer = z.object({
  slug: z.string().min(1),
  slugFr: z.string().nullish(),
  name: z.string().min(1),
  nameFr: z.string().nullish(),
  environments: z.array(z.object({ id: z.number() })).nullish(),
  isFullTime: flag,
  isPartTime: flag,
  isOfficer: flag,
  reqEd: z.union([z.number(), z.string()]).nullish(),
  paidEdOptions: z.array(z.unknown()).nullish(),
  categories: z.array(z.object({ short: z.string() })).nullish(),
  hasSigningBonus: flag,
  hasRecruitingAllowance: flag,
  isFeatured: flag,
  /** 1 = priority processing for the Paid Education Entry Plan only (forces.ca career page wording). */
  featuredType: z.union([z.number(), z.string()]).nullish(),
  englishNocs: nocs,
  frenchNocs: nocs,
});
export type ApiCareer = z.infer<typeof ApiCareer>;

/** The response envelope. Careers are checked one by one, so a single odd entry never costs the whole list. */
export const ApiCareers = z.object({ data: z.array(z.unknown()) });

const Record = z.object({
  slug: z.string(),
  slugFr: z.string(),
  name: z.string(),
  nameFr: z.string(),
  envs: z.array(z.enum(['army', 'navy', 'air'])),
  fullTime: z.boolean(),
  partTime: z.boolean(),
  officer: z.boolean(),
  minEd: z.number(),
  paidEd: z.boolean(),
  categories: z.array(z.enum(CATEGORIES)),
  signingBonus: z.boolean(),
  recruitingAllowance: z.boolean(),
  priority: z.boolean(),
  priorityPaidEdOnly: z.boolean(),
  keywords: z.string().optional(),
  keywordsFr: z.string().optional(),
});

const Snapshot = z.object({ fetchedAt: z.string(), careers: z.array(Record) });

/** The careers saved on 2026-09-30, for when forces.ca has never answered (and for the lab). */
export const SNAPSHOT: { fetchedAt: string; careers: CareerRecord[] } = Snapshot.parse(snapshot);
