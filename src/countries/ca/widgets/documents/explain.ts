/**
 * Pure computation for the letter explainer. The tool runs it on the server (the card only imports its types,
 * so the holiday table, the redactor and the source catalogue stay out of the browser). Takes what the model
 * read on the document and adds verified guidance: deadlines (with the CRA weekend/holiday rule), next benefit
 * payment, scam signs, steps and official links.
 */
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { addDays, diffDays, isWeekend } from '@/lib/dates/business-days';
import { countdown, nextOnOrAfter, type DeadlineStatus } from './countdown';
import type { ToolSource } from '@/lib/widgets/types';
import { DOC_IDS, PHONES, SIGNALS, otherLang, type Dept, type DocId, type Lang, type Signal } from './data';
import { DEPT_HOME, DOCS, OTHER_HOME, PAYMENT_DATES, type StepWhen } from './docs';
import { scrub } from './scrub';
import { sources } from './sources';
import { url, type UrlKey } from './urls';

export type AmountKind = 'refund' | 'owing' | 'payment' | 'benefit' | 'credit' | 'limit' | 'info';
export type DateKind = 'deadline' | 'payment' | 'appointment' | 'issued' | 'effective' | 'info';
export type Issuer = Dept | 'other-federal' | 'provincial' | 'unknown';
export type Focus = 'explain' | 'verify';

export type ExplainInput = {
  docType?: DocId | 'other';
  focus?: Focus;
  issuer?: Issuer;
  title?: string;
  formCode?: string;
  taxYear?: number;
  issuedOn?: string;
  summary?: string;
  amounts?: { label: string; amount: number; kind: AmountKind }[];
  dates?: { label: string; date: string; kind: DateKind }[];
  actions?: string[];
  warningSigns?: Signal[];
  lang?: Lang;
};

export type Deadline = {
  id: string;
  /** Label printed on the letter, or empty for a rule we computed (the widget labels those). */
  label: string;
  date: string;
  /** Days from today (negative = passed). The card recounts both from the reader's date (./countdown). */
  days: number;
  status: DeadlineStatus;
  source: 'letter' | 'rule';
  /** Rule id for computed deadlines. */
  rule?: 'objection' | 'reconsideration' | 'biometrics' | 'medical' | 'balance';
  /** CRA: a date on a weekend/holiday is on time if received or postmarked by the next business day. We
   *  always lead with `date` (what the letter printed, or the rule's own date) and show this as a note. */
  onTimeBy?: string;
  /** Why `onTimeBy` moved: the date falls on a weekend or on a CRA-recognized holiday. */
  why?: 'weekend' | 'holiday';
  /** True when the rule counts from when you received the letter (we only know the letter date). */
  approx?: boolean;
};

export type Headline =
  | { kind: 'refund' | 'owing' | 'benefit' | 'payment'; amount: number; label?: string }
  | { kind: 'nil' }
  | { kind: 'deadline'; date: string }
  | { kind: 'scam'; count: number }
  | { kind: 'info' };

/** A next step, resolved for the card: prose at `doc.<docType>.step.<id>.title|detail|note`. */
export type Step = {
  id: string;
  /** The step's official page: `link` is its key (the card links it in its own language), `href` the URL in the answer's language. */
  link?: UrlKey;
  href?: string;
  /** The phone line named in the step's detail, in the answer's language. */
  phone?: string;
  /** The step carries a fact of its own (`….note`). */
  note?: boolean;
};

export type ExplainOutput = {
  mode: 'explained' | 'identify';
  focus: Focus;
  lang: Lang;
  today: string;
  docType: DocId | 'other' | null;
  dept: Dept | null;
  issuer: Issuer;
  extracted: {
    title?: string;
    formCode?: string;
    taxYear?: number;
    issuedOn?: string;
    summary?: string;
    amounts: { label: string; amount: number; kind: AmountKind }[];
    dates: { label: string; date: string; kind: DateKind }[];
    actions: string[];
  };
  /** Anything that looked like a personal identifier was removed before display. */
  redacted: boolean;
  headline: Headline;
  deadlines: Deadline[];
  /** `upcoming`: every verified payment date from `date` on, so the card can move to the next one as days pass. */
  nextPayment: { program: 'ccb' | 'cgeb'; date: string; days: number; upcoming?: string[] } | null;
  /** Lab fixtures: keep "today" at `today` (a real answer follows the reader's own date). */
  pinned?: boolean;
  scam: { level: 'high' | 'check' | 'none'; signs: Signal[] };
  balance: 'owing' | 'refund' | 'nil' | null;
  steps: Step[];
  /** How many "where to look" callouts this document has (0: none). */
  look: number;
  links: { key: UrlKey; href: string }[];
  handoff: { key: UrlKey; href: string } | null;
  phone: string | null;
  sources: ToolSource[];
  /** The same sources in the other official language, for a card shown in that language. */
  altSources: ToolSource[];
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isHoliday = (iso: string) => FEDERAL_HOLIDAYS.some((h) => h.date === iso);

/** The next business day on or after `iso` (weekends + federal holidays). */
export function nextBusinessDay(iso: string) {
  let d = iso;
  for (let i = 0; i < 10 && (isWeekend(d) || isHoliday(d)); i++) d = addDays(d, 1);
  return d;
}

function deadline(today: string, d: Omit<Deadline, 'days' | 'status' | 'onTimeBy' | 'why'>, cra: boolean): Deadline {
  const onTime = cra ? nextBusinessDay(d.date) : d.date;
  const moved = onTime !== d.date ? { onTimeBy: onTime, why: isWeekend(d.date) ? ('weekend' as const) : ('holiday' as const) } : {};
  return { ...d, ...countdown(today, d.date, moved.onTimeBy), ...moved };
}

/** CRA objection deadline for individuals: the later of notice + 90 days and filing deadline + 1 year. */
export function objectionDeadline(issuedOn?: string, taxYear?: number): string | null {
  const ninety = issuedOn ? addDays(issuedOn, 90) : null;
  const oneYear = taxYear ? `${taxYear + 2}-04-30` : null;
  if (ninety && oneYear) return ninety > oneYear ? ninety : oneYear;
  return ninety ?? oneYear;
}

function resolveDoc(input: ExplainInput): DocId | 'other' | null {
  if (input.docType && (DOC_IDS as readonly string[]).includes(input.docType)) return input.docType;
  if (input.docType === 'other') return 'other';
  return null;
}

export function explainDocument(input: ExplainInput, today: string): ExplainOutput {
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const focus: Focus = input.focus === 'verify' ? 'verify' : 'explain';
  const docType = resolveDoc(input);
  const def = docType && docType !== 'other' ? DOCS[docType] : null;
  const issuer: Issuer = input.issuer ?? def?.dept ?? 'unknown';
  const dept: Dept | null = def?.dept ?? (issuer === 'cra' || issuer === 'esdc' || issuer === 'ircc' ? issuer : null);
  const cra = dept === 'cra';

  // Clean what the model extracted.
  let redacted = false;
  const clean = (s: string | undefined, max?: number) => {
    const r = scrub(s, max);
    redacted ||= r.hit;
    return r.text;
  };
  const amounts = (input.amounts ?? [])
    .filter((a) => Number.isFinite(a.amount) && Math.abs(a.amount) < 10_000_000)
    .slice(0, 8)
    .map((a) => ({ label: clean(a.label, 80) ?? '', amount: Math.round(Math.abs(a.amount) * 100) / 100, kind: a.kind }));
  const dates = (input.dates ?? [])
    .filter((d) => ISO.test(d.date))
    .slice(0, 6)
    .map((d) => ({ label: clean(d.label, 80) ?? '', date: d.date, kind: d.kind }));
  const actions = (input.actions ?? []).map((a) => clean(a, 160)).filter((a): a is string => !!a).slice(0, 5);
  const issuedOn = input.issuedOn && ISO.test(input.issuedOn) ? input.issuedOn : dates.find((d) => d.kind === 'issued')?.date;
  const taxYear = input.taxYear && input.taxYear > 1990 && input.taxYear < 2100 ? input.taxYear : undefined;
  const extracted = {
    title: clean(input.title, 140),
    formCode: clean(input.formCode, 24),
    taxYear,
    issuedOn,
    summary: clean(input.summary, 600),
    amounts,
    dates,
    actions,
  };

  const hasContent = !!(extracted.summary || amounts.length || dates.length || actions.length || extracted.title);
  const mode: ExplainOutput['mode'] = !docType && !hasContent && focus === 'explain' ? 'identify' : 'explained';

  // Balance on the document.
  const owing = amounts.filter((a) => a.kind === 'owing').reduce((s, a) => s + a.amount, 0);
  const refund = amounts.filter((a) => a.kind === 'refund').reduce((s, a) => s + a.amount, 0);
  const hasBalanceLine = amounts.some((a) => a.kind === 'owing' || a.kind === 'refund');
  const balance: ExplainOutput['balance'] = owing > 0 ? 'owing' : refund > 0 ? 'refund' : hasBalanceLine ? 'nil' : null;

  // Deadlines: dates printed on the letter, then rules we know.
  const deadlines: Deadline[] = [];
  for (const d of dates) {
    if (d.kind === 'deadline' || d.kind === 'appointment') {
      deadlines.push(deadline(today, { id: `letter-${deadlines.length}`, label: d.label, date: d.date, source: 'letter' }, cra));
    }
  }
  if (def?.deadline?.kind === 'objection') {
    const date = objectionDeadline(issuedOn, taxYear);
    if (date) deadlines.push(deadline(today, { id: 'objection', label: '', date, source: 'rule', rule: 'objection' }, true));
  } else if (def?.deadline?.kind === 'days-after' && issuedOn) {
    const r = def.deadline;
    deadlines.push(deadline(today, { id: r.id, label: '', date: addDays(issuedOn, r.days), source: 'rule', rule: r.id, approx: true }, false));
  }
  if (def?.balanceDue && balance === 'owing' && taxYear && !deadlines.some((d) => d.source === 'letter')) {
    deadlines.push(deadline(today, { id: 'balance', label: '', date: `${taxYear + 1}-04-30`, source: 'rule', rule: 'balance' }, true));
  }
  deadlines.sort((a, b) => a.date.localeCompare(b.date));

  // Next benefit payment from the verified calendar.
  let nextPayment: ExplainOutput['nextPayment'] = null;
  if (def?.payments) {
    const dates = PAYMENT_DATES[def.payments];
    const next = nextOnOrAfter(dates, today);
    if (next) nextPayment = { program: def.payments, date: next, days: diffDays(today, next), upcoming: dates.filter((d) => d >= next) };
  }

  // Scam signs.
  const signs = [...new Set((input.warningSigns ?? []).filter((s) => (SIGNALS as readonly string[]).includes(s)))];
  const scam: ExplainOutput['scam'] = {
    level: signs.length ? 'high' : focus === 'verify' ? 'check' : 'none',
    signs,
  };

  // Headline.
  const firstBenefit = amounts.find((a) => a.kind === 'benefit' || a.kind === 'credit') ?? amounts.find((a) => a.kind === 'payment');
  const upcoming = deadlines.find((d) => d.days >= 0);
  // A fee to pay with a date to pay it by: the date is what people must not miss, so it leads.
  const feeWithDate = firstBenefit?.kind === 'payment' && !!upcoming;
  const headline: Headline = signs.length
    ? { kind: 'scam', count: signs.length }
    : balance === 'owing'
      ? { kind: 'owing', amount: Math.round(owing * 100) / 100 }
      : balance === 'refund'
        ? { kind: 'refund', amount: Math.round(refund * 100) / 100 }
        : balance === 'nil'
          ? { kind: 'nil' }
          : firstBenefit && !feeWithDate
            ? { kind: firstBenefit.kind === 'payment' ? 'payment' : 'benefit', amount: firstBenefit.amount, label: firstBenefit.label }
            : upcoming
              ? { kind: 'deadline', date: upcoming.date }
              : { kind: 'info' };

  // Steps (filtered by what the document says).
  const when = (w?: StepWhen) => !w || w === 'always' || (w === 'owing' && balance === 'owing') || (w === 'refund' && balance === 'refund');
  const steps: Step[] = (def?.steps ?? [])
    .filter((s) => when(s.when))
    .map((s) => ({
      id: s.id,
      ...(s.href ? { link: s.href, href: url(s.href, lang) } : {}),
      ...(s.phone ? { phone: PHONES[s.phone][lang] } : {}),
      ...(s.note ? { note: true } : {}),
    }));

  const home = dept ? DEPT_HOME[dept] : issuer === 'provincial' ? OTHER_HOME.provincial : issuer === 'other-federal' ? OTHER_HOME['other-federal'] : null;
  // Provincial or other federal senders: point to the official directory so people can confirm with the sender.
  const baseLinks: UrlKey[] = def ? def.links : home ? home.links : issuer === 'unknown' ? ['recognizeScam', 'craContact'] : [];
  // Checking whether it's real: "Recognize a scam" always leads, whoever the sender seems to be.
  const linkKeys: UrlKey[] = focus === 'verify' && baseLinks.includes('recognizeScam') ? ['recognizeScam', ...baseLinks.filter((k) => k !== 'recognizeScam')] : baseLinks;
  const handoffKey: UrlKey | null = focus === 'verify' || signs.length ? 'reportScam' : def ? def.handoff : home ? home.handoff : null;
  const srcKeys: UrlKey[] =
    focus === 'verify' || signs.length
      ? ['recognizeScam', 'reportScam', 'verifyCra', 'craContact', 'cafc']
      : [
          ...(balance === 'owing' && def?.balanceDue ? (['payments'] as UrlKey[]) : []),
          // The objection page leads only when the card shows a computed objection deadline.
          ...(deadlines.some((d) => d.rule === 'objection') ? (['objection'] as UrlKey[]) : []),
          ...linkKeys,
          ...(def?.steps.flatMap((s) => (s.href ? [s.href] : [])) ?? []),
          ...(cra || issuer === 'unknown' ? (['recognizeScam'] as UrlKey[]) : []),
        ];

  const cited: UrlKey[] = mode === 'identify' ? ['noa', 'recognizeScam', 'eiRecon', 'bioWhere'] : srcKeys.length ? srcKeys : ['recognizeScam'];

  return {
    mode,
    focus,
    lang,
    today,
    docType,
    dept,
    issuer,
    extracted,
    redacted,
    headline,
    deadlines,
    nextPayment,
    scam,
    balance,
    steps,
    look: def?.look ?? 0,
    links: linkKeys.map((k) => ({ key: k, href: url(k, lang) })),
    handoff: handoffKey ? { key: handoffKey, href: url(handoffKey, lang) } : null,
    phone: def?.phone ? PHONES[def.phone][lang] : null,
    sources: sources(cited, lang),
    altSources: sources(cited, otherLang(lang)),
  };
}
