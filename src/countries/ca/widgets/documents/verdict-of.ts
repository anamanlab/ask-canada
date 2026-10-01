/**
 * What an explained document means for the person, in one line: the pure decision behind the verdict banner
 * (./Verdict draws it). No React, no dates read from the device: everything comes in through the arguments.
 */
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, Check, CircleDollarSign, FileText, OctagonAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import type { DocId } from './data';
import type { ExplainOutput } from './explain';
import { LEADS_INTO_DATE } from './local';

export type Tone = 'pine' | 'amber' | 'maple' | 'glacier';
type VerdictView = {
  tone: Tone;
  Icon: LucideIcon;
  head: string;
  sub: string;
  /** 1-based zone to mark on the letter art (the place to look first), if any. */
  highlight?: number;
};
/** Live scam check state (verify mode): the verdict follows what the person ticks. */
export type ScamState = { count: number; touched: boolean };
/** The card's words and formats (`useMessages`, `fmt.money`, `useDates`). */
type VerdictFormat = {
  t: (key: string, values?: Record<string, string | number>) => string;
  money: (n: number) => string;
  long: (iso: string) => string;
  day: (iso: string) => string;
};

type Amount = ExplainOutput['extracted']['amounts'][number];

/** Which extracted amounts the verdict already states (so they aren't repeated as tiles). */
export function statedAmount(data: ExplainOutput) {
  const h = data.headline;
  const fee = verdictFee(data);
  return (a: Amount) =>
    ((h.kind === 'refund' || h.kind === 'owing') && (a.kind === 'refund' || a.kind === 'owing')) ||
    (h.kind === 'nil' && (a.kind === 'refund' || a.kind === 'owing') && a.amount === 0) ||
    ((h.kind === 'benefit' || h.kind === 'payment') && a.amount === h.amount && (a.kind === h.kind || (h.kind === 'benefit' && a.kind === 'credit'))) ||
    (!!fee && a === fee);
}

/** A fee to pay, stated under a deadline headline ("Renewal fee: $120"), when nothing more urgent is. */
function verdictFee(data: ExplainOutput) {
  const h = data.headline;
  if (h.kind !== 'deadline') return null;
  const d = data.deadlines.find((x) => x.date === h.date);
  if (!d || d.source !== 'letter' || d.onTimeBy) return null;
  return data.extracted.amounts.find((a) => a.kind === 'payment') ?? null;
}

/**
 * How often a benefit amount is paid, from the label printed next to it ("Monthly payment", "Montant
 * trimestriel"), else from the program: the CCB notice lists monthly amounts. Unknown: say nothing.
 */
function benefitFrequency(label: string | undefined, program?: 'ccb' | 'cgeb'): 'month' | 'quarter' | 'year' | null {
  const l = (label ?? '').toLowerCase();
  if (/month|mensuel|par mois/.test(l)) return 'month';
  if (/quarter|trimest/.test(l)) return 'quarter';
  if (/year|annual|annuel|par an/.test(l)) return 'year';
  return program === 'ccb' ? 'month' : null;
}

/** "What to look at first" zone on the letter art, when the document is only named (no details yet). */
const FIRST_ZONE: Partial<Record<DocId, number>> = { 'cra-noa': 2, 'cra-nor': 3, 'cra-review': 2, 'ircc-biometrics': 2 };

/** The zone a verdict about the letter's own figures points to: the account summary, or the reply date. */
function figuresZone(data: ExplainOutput, doc: DocId | null): number | undefined {
  if (doc === 'cra-noa' || doc === 'cra-nor') return data.balance ? 2 : undefined;
  return doc === 'cra-review' ? 2 : undefined;
}

function scamVerdict(data: ExplainOutput, scam: ScamState, { t }: VerdictFormat): VerdictView {
  if (scam.count > 0) return { tone: 'maple', Icon: OctagonAlert, head: t('head.scam', { count: scam.count }), sub: t('sub.scam') };
  if (scam.touched) return { tone: 'glacier', Icon: ShieldCheck, head: t('head.check'), sub: t('sub.check') };
  return { tone: 'amber', Icon: ShieldQuestion, head: t('head.verify', { dept: data.dept ?? 'none' }), sub: t('sub.verify') };
}

function deadlineVerdict(data: ExplainOutput, doc: DocId | null, date: string, { t, money, day }: VerdictFormat): Omit<VerdictView, 'highlight'> {
  const d = data.deadlines.find((x) => x.date === date);
  const passed = d?.status === 'passed';
  const label = d?.source === 'letter' ? d.label.trim() : '';
  const fee = verdictFee(data);
  const letterSub = () => (fee ? t('headsub.amount', { label: fee.label || t('amt.payment'), amount: money(fee.amount) }) : t(doc === 'cra-review' ? 'headsub.review' : 'headsub.letter'));
  return {
    tone: passed ? 'maple' : d?.status === 'soon' ? 'amber' : 'glacier',
    Icon: passed ? OctagonAlert : CalendarClock,
    head: passed
      ? t('head.deadline.passed', { date: day(date) })
      : label && LEADS_INTO_DATE.test(label)
        ? t('head.deadline.label', { label, date: day(date) })
        : t(d?.approx ? 'head.deadline.approx' : doc === 'cra-review' ? 'head.deadline.reply' : 'head.deadline', { date: day(date) }),
    sub: !d
      ? ''
      : passed
        ? t('sub.deadline.passed')
        : d.onTimeBy
          ? t('dl.onTime', { why: d.why ?? 'holiday', date: day(d.onTimeBy) })
          : d.source === 'letter'
            ? letterSub()
            : t(`headsub.${d.rule}`),
  };
}

/** The verdict for the letter's own headline (money, a date), without the place to look. */
function letterVerdict(data: ExplainOutput, doc: DocId | null, f: VerdictFormat): Omit<VerdictView, 'highlight'> | null {
  const { t, money, long } = f;
  const h = data.headline;
  switch (h.kind) {
    case 'refund':
      return { tone: 'pine', Icon: Check, head: t('head.refund', { amount: money(h.amount) }), sub: t('sub.refund') };
    case 'owing': {
      const payBy = data.deadlines.find((d) => d.rule === 'balance' || d.source === 'letter');
      const passed = !!payBy && payBy.days < 0;
      return {
        tone: passed ? 'maple' : 'amber',
        Icon: CircleDollarSign,
        head: t('head.owing', { amount: money(h.amount) }),
        sub: payBy ? t(passed ? 'sub.owing.passed' : 'sub.owing.due', { date: long(payBy.date) }) : t('sub.owing'),
      };
    }
    case 'nil':
      return { tone: 'pine', Icon: Check, head: t('head.nil'), sub: t('sub.nil') };
    case 'benefit': {
      const freq = benefitFrequency(h.label, data.nextPayment?.program);
      // The next payment has its own row just below: the verdict adds something that row doesn't say.
      const recalc = doc === 'cra-ccb-notice' || doc === 'cra-cgeb-notice' ? t('sub.benefit.recalc') : '';
      return { tone: 'pine', Icon: CircleDollarSign, head: t('head.benefit', { amount: money(h.amount), freq: freq ?? 'none' }), sub: !freq && h.label ? h.label : recalc };
    }
    case 'payment':
      // Money the person is asked to pay: a caution, never the "you get money" green.
      return { tone: 'amber', Icon: CircleDollarSign, head: t('head.payment', { amount: money(h.amount) }), sub: h.label ?? '' };
    case 'deadline':
      return deadlineVerdict(data, doc, h.date, f);
    default:
      return null;
  }
}

/**
 * The verdict: its colour, icon, headline and sub line, and where to look on the letter.
 * `data` is the answer re-dated to the reader's today (`useLiveDates`); `scam` is set in verify mode only.
 */
export function verdictOf(data: ExplainOutput, doc: DocId | null, scam: ScamState | null, f: VerdictFormat): VerdictView {
  if (scam) return scamVerdict(data, scam, f);
  const stated = letterVerdict(data, doc, f);
  if (stated) return { ...stated, highlight: figuresZone(data, doc) };
  // Only the document's name is known: the answer already says what it is, so lead with what to check first.
  if (!doc) return { tone: 'glacier', Icon: FileText, head: f.t('head.other'), sub: '' };
  return {
    tone: 'glacier',
    Icon: FileText,
    head: f.t(`doc.${doc}.first`),
    // The headline stays verdict-length; the detail (what counts, from when) is the sub line.
    sub: f.t(`doc.${doc}.first.sub`),
    highlight: FIRST_ZONE[doc] ?? figuresZone(data, doc),
  };
}
