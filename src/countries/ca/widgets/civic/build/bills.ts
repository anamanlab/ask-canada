/** Bill helpers for civicParliament (pure): a LEGISinfo bill → its track through both chambers. */
import { HOUSE, billUrl, type Lang } from '../data';
import type { BillSummary, StageKey, TrackStep } from '../types';
import { curly } from './text';

/** The subset of a LEGISinfo bill we read (validated in live/parliament.ts). */
export type RawBill = {
  NumberCode: string;
  LongTitleEn?: string | null;
  LongTitleFr?: string | null;
  ShortTitleEn?: string | null;
  ShortTitleFr?: string | null;
  StatusNameEn?: string | null;
  StatusNameFr?: string | null;
  BillDocumentTypeNameEn?: string | null;
  ParliamentNumber?: number | null;
  SessionNumber?: number | null;
  PassedHouseFirstReadingDateTime?: string | null;
  PassedHouseSecondReadingDateTime?: string | null;
  PassedHouseThirdReadingDateTime?: string | null;
  PassedSenateFirstReadingDateTime?: string | null;
  PassedSenateSecondReadingDateTime?: string | null;
  PassedSenateThirdReadingDateTime?: string | null;
  ReceivedRoyalAssentDateTime?: string | null;
  ReceivedRoyalAssent?: boolean | null;
  IsProForma?: boolean | null;
};

const day = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) && !s.startsWith('0001') ? s.slice(0, 10) : undefined);

const STAGES: StageKey[] = ['first', 'second', 'committee', 'report', 'third'];

/** "At consideration in committee in the House of Commons" → { chamber: 'house', stage: 'committee' }. */
function stageFromStatus(statusEn?: string | null): { chamber: 'house' | 'senate'; stage: StageKey } | undefined {
  if (!statusEn || !/^At /i.test(statusEn)) return undefined;
  const chamber = /\bSenate\b/i.test(statusEn) ? 'senate' : /\bHouse of Commons\b/i.test(statusEn) ? 'house' : undefined;
  const stage: StageKey | undefined = /committee/i.test(statusEn)
    ? 'committee'
    : /report stage/i.test(statusEn)
      ? 'report'
      : /third reading/i.test(statusEn)
        ? 'third'
        : /second reading/i.test(statusEn)
          ? 'second'
          : /first reading/i.test(statusEn)
            ? 'first'
            : undefined;
  return chamber && stage ? { chamber, stage } : undefined;
}

/**
 * Private members' bills "Outside the Order of Precedence" / "Ne fait pas partie de l'Ordre de priorité" are
 * parked: not eligible for debate until they're placed on the order. Checked on LEGISinfo JSON, 2026-09-30.
 */
export const isPausedStatus = (status?: string | null) => /outside the order of precedence|ordre de priorit/i.test(status ?? '');

const KINDS: [RegExp, BillSummary['kind']][] = [
  [/House Government/i, 'government'],
  [/Senate Government/i, 'senate-government'],
  [/Private Member/i, 'private-member'],
  [/Senate Public/i, 'senate-public'],
];

/**
 * A bill's path: 1st reading, 2nd reading, committee, report stage and 3rd reading in each chamber, then royal
 * assent. LEGISinfo dates the readings; committee and report stage are known from the official status line
 * (the bill is there now) or because a later reading in the same chamber has passed.
 */
export function summarizeBill(b: RawBill, lang: Lang): BillSummary {
  const origin: 'house' | 'senate' = /^S-/i.test(b.NumberCode) ? 'senate' : 'house';
  const readings = {
    house: { first: day(b.PassedHouseFirstReadingDateTime), second: day(b.PassedHouseSecondReadingDateTime), third: day(b.PassedHouseThirdReadingDateTime) },
    senate: { first: day(b.PassedSenateFirstReadingDateTime), second: day(b.PassedSenateSecondReadingDateTime), third: day(b.PassedSenateThirdReadingDateTime) },
  };
  const now = stageFromStatus(b.StatusNameEn);
  const chamber = (c: 'house' | 'senate'): TrackStep[] => {
    const r = readings[c];
    const nowAt = now?.chamber === c ? STAGES.indexOf(now.stage) : -1;
    return STAGES.map((stage, i) => {
      const date = stage === 'first' || stage === 'second' || stage === 'third' ? r[stage] : undefined;
      // Committee and report stage are done once third reading has passed, or once the bill has moved past them.
      const done = !!date || ((stage === 'committee' || stage === 'report') && (!!r.third || nowAt > i));
      return { chamber: c, stage, done, ...(date ? { date } : {}) };
    });
  };
  const assent = day(b.ReceivedRoyalAssentDateTime);
  const track: TrackStep[] = [
    ...chamber(origin),
    ...chamber(origin === 'house' ? 'senate' : 'house'),
    { chamber: 'assent', done: !!(b.ReceivedRoyalAssent || assent), ...(assent ? { date: assent } : {}) },
  ];
  const statusAt = now ? track.findIndex((s) => s.chamber === now.chamber && s.stage === now.stage) : -1;
  const firstOpen = track.findIndex((s) => !s.done);
  const at = statusAt > -1 && !track[statusAt].done ? statusAt : firstOpen === -1 ? track.length : firstOpen;
  const law = firstOpen === -1;
  const short = lang === 'fr' ? b.ShortTitleFr : b.ShortTitleEn;
  const long = lang === 'fr' ? b.LongTitleFr : b.LongTitleEn;
  const lastMoved = track
    .flatMap((s) => (s.date ? [s.date] : []))
    .sort()
    .at(-1);
  return {
    code: b.NumberCode,
    title: curly((short || long || b.LongTitleEn || b.NumberCode).trim()),
    status: curly((lang === 'fr' ? b.StatusNameFr : b.StatusNameEn) ?? b.StatusNameEn ?? ''),
    kind: KINDS.find(([re]) => re.test(b.BillDocumentTypeNameEn ?? ''))?.[1] ?? 'other',
    origin,
    track,
    at,
    law,
    defeated: /defeated|rejeté/i.test(b.StatusNameEn ?? ''),
    ...(!law && isPausedStatus(b.StatusNameEn) ? { paused: true } : {}),
    ...(lastMoved ? { lastMoved } : {}),
    url: billUrl(b.NumberCode, lang, b.ParliamentNumber ?? HOUSE.parliament, b.SessionNumber ?? HOUSE.session),
  };
}

/** "c38", "Bill C-38", "projet de loi s-2" → "C-38". */
export function normalizeBillCode(input?: string): string | undefined {
  const m = input?.toUpperCase().match(/\b([CS])\s*-?\s*(\d{1,4})\b/);
  return m ? `${m[1]}-${Number(m[2])}` : undefined;
}
