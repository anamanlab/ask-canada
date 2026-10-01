/**
 * Document catalogue: for each letter we have a guide for, its steps, deadline rule, payment calendar and
 * official pages, as keys only (prose is in messages/*.json, URLs in ./urls). Verification notes: ./data.
 */
import type { Dept, DocId, PhoneKey } from './data';
import type { UrlKey } from './urls';

/** Benefit payment dates (verified lists; nothing is shown past the last verified date). */
export const PAYMENT_DATES: Record<'ccb' | 'cgeb', string[]> = {
  ccb: ['2026-01-20', '2026-02-20', '2026-03-20', '2026-04-20', '2026-05-20', '2026-06-19', '2026-07-20', '2026-08-20', '2026-09-18', '2026-10-20', '2026-11-20', '2026-12-11'],
  cgeb: ['2026-07-03', '2026-10-05'],
};


/** Conditions a step can depend on (computed from what the document says). */
export type StepWhen = 'owing' | 'refund' | 'always';

/** `note`: a fact that belongs with the step (not a task of its own), at `doc.<id>.step.<stepId>.note`. */
export type StepDef = { id: string; href?: UrlKey; when?: StepWhen; phone?: PhoneKey; note?: boolean };

export type DeadlineRule =
  /** CRA objection: later of (notice date + 90 days) and (filing deadline + 1 year). */
  | { kind: 'objection' }
  /** A fixed number of days after the letter date (approximate: the clock starts when you get it). */
  | { kind: 'days-after'; days: number; id: 'reconsideration' | 'biometrics' | 'medical' };

export type DocDef = {
  id: DocId;
  dept: Dept;
  /** Steps in order; prose at `doc.<id>.step.<stepId>.title|detail`. */
  steps: StepDef[];
  deadline?: DeadlineRule;
  /** Next benefit payment from the verified calendar. */
  payments?: 'ccb' | 'cgeb';
  /** "Where to look" callouts; prose at `doc.<id>.look.<n>`. */
  look?: number;
  handoff: UrlKey;
  /** Official pages shown as links (and cited). */
  links: UrlKey[];
  phone?: PhoneKey;
  /** Balance due on April 30 after the tax year (individuals). */
  balanceDue?: boolean;
};

export const DOCS: Record<DocId, DocDef> = {
  'cra-noa': {
    id: 'cra-noa',
    dept: 'cra',
    steps: [
      { id: 'compare' },
      { id: 'refund', when: 'refund', href: 'refunds' },
      { id: 'pay', when: 'owing', href: 'makePayment' },
      { id: 'change', href: 'changeReturn' },
      { id: 'object', href: 'objection' },
      { id: 'keep' },
    ],
    deadline: { kind: 'objection' },
    look: 6,
    handoff: 'craSignIn',
    links: ['noa', 'objection', 'changeReturn', 'payments'],
    balanceDue: true,
  },
  'cra-nor': {
    id: 'cra-nor',
    dept: 'cra',
    steps: [
      { id: 'why' },
      { id: 'refund', when: 'refund', href: 'refunds' },
      { id: 'pay', when: 'owing', href: 'makePayment' },
      { id: 'newInfo', href: 'changeReturn' },
      { id: 'object', href: 'objection' },
    ],
    deadline: { kind: 'objection' },
    look: 3,
    handoff: 'craSignIn',
    links: ['noa', 'objection', 'payments'],
  },
  'cra-review': {
    id: 'cra-review',
    dept: 'cra',
    steps: [{ id: 'deadline' }, { id: 'reference' }, { id: 'upload', href: 'submitDocs' }, { id: 'missing' }, { id: 'time' }],
    look: 3,
    handoff: 'craSignIn',
    links: ['respond', 'submitDocs', 'review'],
  },
  'cra-ccb-notice': {
    id: 'cra-ccb-notice',
    dept: 'cra',
    steps: [{ id: 'check', href: 'ccbGet' }, { id: 'file' }, { id: 'overpaid', when: 'owing', href: 'payments' }, { id: 'update', href: 'craSignIn' }],
    payments: 'ccb',
    handoff: 'craSignIn',
    links: ['ccbGet', 'ccbDates'],
  },
  'cra-cgeb-notice': {
    id: 'cra-cgeb-notice',
    dept: 'cra',
    steps: [{ id: 'quarterly' }, { id: 'small' }, { id: 'missing', href: 'cgebDates' }, { id: 'update', href: 'craSignIn' }],
    payments: 'cgeb',
    handoff: 'craSignIn',
    links: ['cgeb', 'cgebDates'],
  },
  'esdc-ei-decision': {
    id: 'esdc-ei-decision',
    dept: 'esdc',
    steps: [{ id: 'read' }, { id: 'newInfo' }, { id: 'reconsider', href: 'eiReconForm' }, { id: 'late' }, { id: 'call', phone: 'ei', href: 'eiContact' }],
    deadline: { kind: 'days-after', days: 30, id: 'reconsideration' },
    handoff: 'eiRecon',
    links: ['eiRecon', 'eiContact'],
    phone: 'ei',
  },
  'esdc-ei-statement': {
    id: 'esdc-ei-statement',
    dept: 'esdc',
    steps: [{ id: 'code' }, { id: 'every2' }, { id: 'how', href: 'eiReporting', phone: 'eiReport' }, { id: 'calendar', href: 'eiReporting' }],
    handoff: 'eiReporting',
    links: ['eiReporting', 'eiContact'],
    phone: 'eiReport',
  },
  'esdc-oas-enrolment': {
    id: 'esdc-oas-enrolment',
    dept: 'esdc',
    steps: [{ id: 'nothing' }, { id: 'check' }, { id: 'delay', href: 'oasApply' }, { id: 'call', phone: 'cppOas', href: 'oasContact' }],
    handoff: 'msca',
    links: ['oasApply', 'oasContact'],
    phone: 'cppOas',
  },
  'ircc-biometrics': {
    id: 'ircc-biometrics',
    dept: 'ircc',
    steps: [{ id: 'book', href: 'bioWhere', note: true }, { id: 'bring', href: 'bioHow' }, { id: 'more', href: 'irccWebForm' }],
    deadline: { kind: 'days-after', days: 30, id: 'biometrics' },
    look: 2,
    handoff: 'bioWhere',
    links: ['bioWhere', 'bioHow', 'irccWebForm'],
  },
  'ircc-medical': {
    id: 'ircc-medical',
    dept: 'ircc',
    steps: [{ id: 'panel', href: 'panelPhysician' }, { id: 'within' }, { id: 'follow' }, { id: 'status', href: 'irccStatus' }],
    deadline: { kind: 'days-after', days: 30, id: 'medical' },
    handoff: 'panelPhysician',
    links: ['medical', 'irccStatus'],
  },
};

/** Where to go for a document we have no specific guide for, by department. */
export const DEPT_HOME: Record<Dept, { handoff: UrlKey; links: UrlKey[] }> = {
  cra: { handoff: 'craSignIn', links: ['craContact', 'recognizeScam'] },
  esdc: { handoff: 'msca', links: ['eiContact', 'oasContact'] },
  ircc: { handoff: 'irccStatus', links: ['irccStatus', 'irccWebForm'] },
};

/** Senders we have no guide for: the official directory, so people can confirm with whoever sent it. */
export const OTHER_HOME: Record<'provincial' | 'other-federal', { handoff: UrlKey; links: UrlKey[] }> = {
  provincial: { handoff: 'provinces', links: ['provinces'] },
  'other-federal': { handoff: 'departments', links: ['departments'] },
};

/* ───────────────────────── Scam warning signs (CRA) ───────────────────────── */
