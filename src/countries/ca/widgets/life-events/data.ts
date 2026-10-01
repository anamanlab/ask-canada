/**
 * Life events: the checklist structure for each event (which steps, in what order, with which organization,
 * official page and deadline rule). Heavy with pages.ts, so it only reaches the browser with the planner
 * (planner.ts). Re-exports facts.ts (ids, verified numbers) and pages.ts (official pages), where every fact
 * is listed with the page it was verified on.
 */
import type { Agency, Channel, DateKind, DueRule, EventId, Phase } from './facts';
import { PAGES, withHash, type Bi, type PageKey } from './pages';

export * from './facts';
export * from './pages';

export type TaskDef = {
  id: string;
  agency: Agency;
  phase: Phase;
  url: Bi;
  source: PageKey;
  channels?: Channel[];
  /** "Only if…" condition key (messages: `cond.<key>`); such a task can be marked "Not for me". */
  cond?: string;
  due?: DueRule;
  /** Region filter: 'qc' = Quebec only; 'not-qc' = hidden in Quebec. */
  region?: 'qc' | 'not-qc';
  /** For region-dependent tasks: in these regions the task is handled automatically (moves to `auto`). */
  autoIn?: 'province';
};

export type EventDef = {
  id: EventId;
  /** The official life-event page the handoff button opens. */
  hub: PageKey;
  /** What the optional date means (messages: `event.<id>.date`). */
  dateKind: DateKind;
  /** The deadline shown in the hero countdown, if any. */
  keyDue?: DueRule;
  tasks: TaskDef[];
};

const P = (key: PageKey): Bi => PAGES[key].url;

export const EVENT_DEFS: Record<EventId, EventDef> = {
  moving: {
    id: 'moving',
    hub: 'changeAddress',
    dateKind: 'move',
    tasks: [
      { id: 'cra', agency: 'cra', phase: 'now', url: P('craAddress'), source: 'craAddress', channels: ['online', 'phone', 'mail'] },
      { id: 'sc', agency: 'sc', phase: 'now', url: P('scPersonal'), source: 'scPersonal', channels: ['online', 'phone', 'in-person'], cond: 'scBenefits' },
      { id: 'elections', agency: 'elections', phase: 'now', url: P('ereg'), source: 'elections', channels: ['online', 'mail'] },
      { id: 'passport', agency: 'passport', phase: 'now', url: P('passportHelp'), source: 'passportHelp', channels: ['kitchen-table'] },
      { id: 'ircc', agency: 'ircc', phase: 'now', url: P('irccAddress'), source: 'irccAddress', channels: ['online'], cond: 'irccApplication' },
      { id: 'province', agency: 'province', phase: 'next', url: P('changeAddress'), source: 'changeAddress' },
      { id: 'others', agency: 'federal', phase: 'next', url: P('changeAddress'), source: 'changeAddress', cond: 'otherPrograms' },
      { id: 'expenses', agency: 'cra', phase: 'later', url: P('movingExpenses'), source: 'movingExpenses', cond: 'workSchool' },
      { id: 'sin', agency: 'sc', phase: 'auto', url: P('sinUpdate'), source: 'sinUpdate' },
    ],
  },
  baby: {
    id: 'baby',
    hub: 'child',
    dateKind: 'birth',
    keyDue: 'maternity-12-weeks',
    tasks: [
      { id: 'register', agency: 'province', phase: 'now', url: P('registerBirth'), source: 'registerBirth' },
      { id: 'ccb', agency: 'cra', phase: 'now', url: P('ccbApply'), source: 'ccbApply', channels: ['online', 'mail'] },
      { id: 'sin', agency: 'sc', phase: 'now', url: withHash('registerBirth', 'h2.4'), source: 'registerBirth' },
      { id: 'ei', agency: 'sc', phase: 'now', url: P('eiParentalApply'), source: 'eiParentalApply', channels: ['online'], cond: 'leave', due: 'maternity-12-weeks', region: 'not-qc' },
      { id: 'qpip', agency: 'province', phase: 'now', url: withHash('childSupport', 'h2.1'), source: 'childSupport', cond: 'leave', region: 'qc' },
      { id: 'health', agency: 'province', phase: 'next', url: withHash('registerBirth', 'h2.3'), source: 'registerBirth' },
      { id: 'passport', agency: 'passport', phase: 'next', url: P('childPassport'), source: 'childPassport', cond: 'travel' },
      { id: 'resp', agency: 'bank', phase: 'later', url: P('resp'), source: 'resp' },
      { id: 'provincial', agency: 'cra', phase: 'auto', url: P('ccbApply'), source: 'ccbApply' },
    ],
  },
  marriage: {
    id: 'marriage',
    hub: 'craPersonal',
    dateKind: 'change',
    keyDue: 'marital-next-month',
    tasks: [
      { id: 'marital', agency: 'cra', phase: 'now', url: P('craMarital'), source: 'craMarital', channels: ['online', 'phone', 'mail'], due: 'marital-next-month' },
      { id: 'sin', agency: 'sc', phase: 'now', url: P('sinUpdate'), source: 'sinUpdate', channels: ['online', 'mail', 'in-person'], cond: 'newName' },
      { id: 'craName', agency: 'cra', phase: 'now', url: P('craName'), source: 'craName', channels: ['phone', 'mail'], cond: 'newName' },
      { id: 'passport', agency: 'passport', phase: 'next', url: P('newPassport'), source: 'newPassport', cond: 'newName' },
      { id: 'elections', agency: 'elections', phase: 'next', url: P('ereg'), source: 'elections', channels: ['online'] },
      { id: 'recalc', agency: 'cra', phase: 'auto', url: P('craMarital'), source: 'craMarital' },
    ],
  },
  'job-loss': {
    id: 'job-loss',
    hub: 'eiEligibility',
    dateKind: 'last-day',
    keyDue: 'ei-4-weeks',
    tasks: [
      { id: 'apply', agency: 'sc', phase: 'now', url: P('eiApply'), source: 'eiApply', channels: ['online'], due: 'ei-4-weeks' },
      { id: 'estimate', agency: 'sc', phase: 'now', url: P('eiEstimator'), source: 'eiEstimator', channels: ['online'] },
      { id: 'msca', agency: 'sc', phase: 'next', url: P('mscaEi'), source: 'mscaEi', channels: ['online'] },
      { id: 'report', agency: 'sc', phase: 'next', url: P('eiReporting'), source: 'eiReporting', channels: ['online', 'phone'] },
      { id: 'jobbank', agency: 'jobbank', phase: 'next', url: P('jobBank'), source: 'jobBank', channels: ['online'] },
      { id: 'finder', agency: 'federal', phase: 'later', url: P('benefitsFinder'), source: 'benefitsFinder', channels: ['online'] },
      { id: 'roe', agency: 'sc', phase: 'auto', url: P('mscaEi'), source: 'mscaEi' },
    ],
  },
  retiring: {
    id: 'retiring',
    hub: 'retirement',
    dateKind: 'cpp-start',
    keyDue: 'cpp-apply-12-months',
    tasks: [
      { id: 'estimate', agency: 'sc', phase: 'now', url: P('retirementCalculator'), source: 'retirementCalculator', channels: ['online'] },
      { id: 'when', agency: 'sc', phase: 'now', url: P('cppWhen'), source: 'cppWhen' },
      { id: 'msca', agency: 'sc', phase: 'now', url: P('msca'), source: 'msca', channels: ['online'] },
      { id: 'cpp', agency: 'sc', phase: 'next', url: P('cppApply'), source: 'cppApply', channels: ['online', 'mail'], due: 'cpp-apply-12-months' },
      { id: 'oas', agency: 'sc', phase: 'next', url: P('oasApply'), source: 'oasApply' },
      { id: 'gis', agency: 'sc', phase: 'next', url: P('gis'), source: 'gis', cond: 'lowIncome' },
      { id: 'rrsp', agency: 'bank', phase: 'later', url: P('rrspIncome'), source: 'rrspIncome', cond: 'rrsp' },
      { id: 'scams', agency: 'federal', phase: 'later', url: P('scams'), source: 'scams' },
    ],
  },
  death: {
    id: 'death',
    hub: 'death',
    dateKind: 'death',
    keyDue: 'final-return',
    tasks: [
      { id: 'cra', agency: 'cra', phase: 'now', url: P('craDeath'), source: 'craDeath', channels: ['phone', 'mail'] },
      { id: 'cppOas', agency: 'sc', phase: 'now', url: P('cppCancel'), source: 'cppCancel', channels: ['phone', 'mail'], cond: 'cppOas' },
      { id: 'deathBenefit', agency: 'sc', phase: 'now', url: P('cppDeath'), source: 'cppDeath', channels: ['online', 'mail'], due: 'cpp-death-60-days' },
      { id: 'passport', agency: 'passport', phase: 'next', url: withHash('deathNotify', 'passport'), source: 'deathNotify', channels: ['mail'], cond: 'validPassport' },
      { id: 'survivor', agency: 'sc', phase: 'next', url: P('cppSurvivor'), source: 'cppSurvivor', cond: 'family' },
      { id: 'allowance', agency: 'sc', phase: 'next', url: P('survivorAllowance'), source: 'survivorAllowance', cond: 'age60' },
      { id: 'sin', agency: 'sc', phase: 'next', url: P('sinDeath'), source: 'deathNotify', channels: ['mail', 'in-person'], cond: 'territory', autoIn: 'province' },
      { id: 'finalReturn', agency: 'cra', phase: 'later', url: P('finalReturn'), source: 'finalReturn', due: 'final-return' },
      { id: 'represent', agency: 'cra', phase: 'later', url: P('representDeceased'), source: 'representDeceased' },
      { id: 'benefits', agency: 'cra', phase: 'auto', url: P('craDeath'), source: 'craDeath' },
    ],
  },
};
