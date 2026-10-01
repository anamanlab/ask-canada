/** The finder's types: the answers (no identifiers, only ranges and yes/no facts) and what each program returns. */
import type { PayKey, Province } from '../rates';

export type Household = 'single' | 'couple';
export type AgeBand = 'under-19' | '19-59' | '60-64' | '65-74' | '75-plus';

/** Answers to the life-situation questionnaire. No identifiers, only ranges and yes/no facts. */
export type Profile = {
  household: Household;
  age: AgeBand;
  childrenUnder6: number;
  children6to17: number;
  /** Adjusted family net income (line 23600, both partners). */
  income: number;
  /** Family income from work (employment + self-employment). */
  workIncome: number;
  /** Approved for the disability tax credit. */
  disability: boolean;
  /** Children approved for the disability tax credit. */
  childDisability: number;
  jobLoss: boolean;
  /** The person's own yearly earnings from the job they lost (asked of couples: EI is never based on family income). */
  jobEarnings?: number;
  student: boolean;
  dentalInsurance: boolean;
  /** Years lived in Canada since age 18 (for OAS). */
  yearsInCanada: number;
  province?: Province;
};

export const DEFAULT_PROFILE: Profile = {
  household: 'single',
  age: '19-59',
  childrenUnder6: 0,
  children6to17: 0,
  income: 40_000,
  workIncome: 40_000,
  disability: false,
  childDisability: 0,
  jobLoss: false,
  student: false,
  dentalInsurance: false,
  yearsInCanada: 40,
};

export type ProgramId = 'ccb' | 'childDisability' | 'cgeb' | 'cwb' | 'cdcp' | 'oas' | 'gis' | 'cpp' | 'cdb' | 'ei' | 'student';
/**
 * likely: you probably get it, and we estimated an amount.
 * apply: you probably qualify, but you have to apply.
 * check: it depends on something we didn't ask (contributions, status, province rules).
 * no: not for your situation right now (reason says why, gently).
 */
export type Status = 'likely' | 'apply' | 'check' | 'no';
export type Cadence = 'monthly' | 'quarterly' | 'weekly' | 'coverage' | 'yearly';
export type Estimator = 'ccb' | 'ei' | 'oas' | 'cpp';

export type Match = {
  id: ProgramId;
  status: Status;
  /** Reason code, rendered from messages as `program.<id>.<reason>`. */
  reason: string;
  /** Estimated amount per year (already net of income reductions). */
  annual?: number;
  /** Estimated amount per payment period, when the program pays weekly (EI). */
  weekly?: number;
  /** A ceiling, not an estimate (GIS, student grant, CPP typical). */
  upTo?: number;
  cadence: Cadence;
  /** Values for the reason message: money is formatted as currency, nums as numbers. */
  money?: Record<string, number>;
  nums?: Record<string, number>;
  estimator?: Estimator;
  pay?: PayKey;
  /** Extra sentence appended to the reason (`program.<id>.note.<note>`). */
  note?: string;
  /** Overrides the card's "how you get it" line: `now` = apply within 4 weeks, `already` = should already be paid. */
  how?: 'now' | 'already';
};

export type FindOptions = {
  /** False when the person hasn't told us their income: EI shows its ceiling instead of a weekly estimate. */
  earningsKnown?: boolean;
  /** False when "of that, from work" is an assumption (all of it): the workers benefit is only worth checking. */
  workKnown?: boolean;
};
