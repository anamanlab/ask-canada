/** Urgent and crisis lines, and the scam warning signs (isomorphic). Verified facts: VERIFIED.md. */
import type { Bi } from './data';
import { URLS } from './urls';

/** Urgent and crisis lines (always free, most 24/7). */
export type UrgentId = '911' | '988' | 'kids' | 'hope' | 'cafc';
export type UrgentLine = {
  id: UrgentId;
  name: Bi;
  number: string;
  tel: string;
  /** SMS target and keyword, when texting is offered. */
  text?: { to: string; keyword?: Bi };
  allDay: boolean;
  page: Bi;
};

export const URGENT: Record<Exclude<UrgentId, 'cafc'>, UrgentLine> = {
  '911': { id: '911', name: { en: 'Emergency', fr: 'Urgence' }, number: '9-1-1', tel: '911', allDay: true, page: URLS.mentalHealth },
  '988': {
    id: '988',
    name: { en: '9-8-8: Suicide Crisis Helpline', fr: '9-8-8 : Ligne d’aide en cas de crise de suicide' },
    number: '9-8-8',
    tel: '988',
    text: { to: '988' },
    allDay: true,
    page: URLS.crisis988,
  },
  kids: {
    id: 'kids',
    name: { en: 'Kids Help Phone', fr: 'Jeunesse, J’écoute' },
    number: '1-800-668-6868',
    tel: '18006686868',
    text: { to: '686868', keyword: { en: 'CONNECT', fr: 'PARLER' } },
    allDay: true,
    page: URLS.mentalHealth,
  },
  hope: {
    id: 'hope',
    name: { en: 'Hope for Wellness Help Line', fr: 'Ligne d’écoute d’espoir pour le mieux-être' },
    number: '1-855-242-3310',
    tel: '18552423310',
    allDay: true,
    page: URLS.mentalHealth,
  },
};

/** The CRA's "warning signs of a scam" shown on the suspicious-call card (message keys `suspect.signs.*`). */
export const SCAM_SIGNS = ['threats', 'pay', 'refund', 'tone', 'fee', 'voicemail'] as const;
