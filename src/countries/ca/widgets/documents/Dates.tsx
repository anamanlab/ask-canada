'use client';
/**
 * Key dates: each deadline (with its countdown, the holiday grace and add-to-calendar) and the next payment.
 * The rows get the answer re-dated to the reader's today (`useLiveDates`), so the counts are never stale.
 */
import type { ReactNode } from 'react';
import { CalendarClock, CalendarPlus, OctagonAlert } from 'lucide-react';
import { Badge, DateTile, Disclosure, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useMessages } from '@/lib/i18n/widget';
import type { Lang } from './data';
import type { Deadline, ExplainOutput } from './explain';
import { deadlineIcs, downloadIcs } from './ics';
import { BADGE_TEXT, LEADS_INTO_DATE, useDates } from './local';
import messages from './messages';
import { url, type UrlKey } from './urls';

const BAR_MAX_DAYS = 120;
/** Keeps "Oct 21" together when a row title wraps. */
const NBSP = '\u00a0';

/** Red only once a date has passed; a date coming up soon is a caution (amber), like the verdict. */
const STATUS = {
  passed: { tile: 'maple', bar: 'bg-maple', badge: 'danger' },
  soon: { tile: 'glacier', bar: 'bg-amber', badge: 'warn' },
  upcoming: { tile: 'glacier', bar: 'bg-glacier', badge: 'neutral' },
} as const;

const NOTE = 'm-0 mt-2 max-w-[62ch] text-[14.5px] leading-[1.45] text-ink-2';
const ACTION =
  'inline-flex min-h-11 items-center gap-1.5 rounded-full text-[14.5px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

/**
 * One dated row: the calendar tile, what the date is, the date in words and how far away it is. In a wide
 * column the countdown sits at the end of the title's line; on a phone it follows the date, as its status.
 */
function Row({ tile, title, when, badge, children }: { tile: ReactNode; title: string; when: ReactNode; badge: ReactNode; children?: ReactNode }) {
  return (
    <li className="flex items-start gap-4 border-t border-hair py-4 first:border-t-0 first:pt-0 last:pb-0">
      {tile}
      <div className="min-w-0 flex-1">
        <div className="grid gap-x-3 gap-y-0.5 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-center">
          <p className="m-0 text-[16px] font-semibold leading-snug text-pretty text-ink">{title}</p>
          <p className="m-0 text-[15px] leading-snug text-ink-2 @md:col-span-2 @md:row-start-2">{when}</p>
          <div className="mt-1.5 flex @md:col-start-2 @md:row-start-1 @md:mt-0">{badge}</div>
        </div>
        {children}
      </div>
    </li>
  );
}

/**
 * Where a date comes from, after the date. The dot never ends a line: it is bound to the word after it. A
 * short origin ("Calculated", "From your letter") stays whole (`keep`) and, on a phone, takes its own line
 * without the dot, so the separator never leads or trails a line; a long program name wraps as text.
 */
function Origin({ children, keep }: { children: string; keep?: boolean }) {
  return (
    <>
      {' '}
      <span className={cn('text-ink-3', keep && 'whitespace-nowrap @max-md:block')}>
        <span aria-hidden className={cn(keep && '@max-md:hidden')}>
          ·{NBSP}
        </span>
        {children}
      </span>
    </>
  );
}

export function DeadlineRow({
  d,
  label,
  issuedOn,
  today,
  docTitle,
  handoff,
  graceInVerdict,
}: {
  d: Deadline;
  label: string;
  issuedOn?: string;
  /** The reader's today: the row's count, status and bar all follow it. */
  today: string;
  docTitle: string;
  handoff: string;
  graceInVerdict?: boolean;
}) {
  const t = useMessages(messages);
  const { short, day } = useDates(today);
  // Lead with the date the letter printed (or the rule's own date); the holiday grace is only a note.
  const shown = d.date;
  // "Send your documents by" reads as a sentence cut short on its own: finish it with the date.
  // ("Balance due" is already a complete label.)
  const title = d.rule !== 'balance' && LEADS_INTO_DATE.test(label.trim()) ? t('dl.phrase', { label: label.trim(), date: short(shown).replace(/ /g, NBSP) }) : label;
  const count = d.days >= 0 ? t('dl.left', { count: d.days }) : t('dl.ago', { count: -d.days });
  const span = issuedOn ? diffDays(issuedOn, shown) : 0;
  // A bar only says something over a short window; across a year or more it barely moves.
  const pct = issuedOn && span > 0 && span <= BAR_MAX_DAYS ? Math.max(2, Math.min(100, (diffDays(issuedOn, today) / span) * 100)) : null;
  const tone = STATUS[d.status];
  const addToCalendar = () =>
    downloadIcs(
      `${docTitle}-${shown}.ics`.replace(/[^\p{L}\p{N}.-]+/gu, '-'),
      deadlineIcs({ date: shown, title: t('cal.title', { name: docTitle, label: title }), body: t('cal.body', { url: handoff }), uid: `${d.id}-${shown}` }),
    );
  return (
    <Row
      tile={<DateTile date={shown} tone={tone.tile} className="mt-0.5" />}
      title={title}
      when={
        <>
          {day(shown, 'always')}
          <Origin keep>{d.source === 'letter' ? t('dl.letter') : t('dl.rule')}</Origin>
        </>
      }
      badge={
        <Badge tone={tone.badge} icon={d.status === 'passed' ? OctagonAlert : CalendarClock} className={BADGE_TEXT}>
          <bdi>{count}</bdi>
        </Badge>
      }
    >
      {pct != null ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          <span className={cn('block h-full rounded-full', tone.bar)} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      {d.onTimeBy && !graceInVerdict ? <p className={NOTE}>{t('dl.onTime', { why: d.why ?? 'holiday', date: day(d.onTimeBy, 'never') })}</p> : null}
      {d.approx ? <p className={NOTE}>{t('dl.approx')}</p> : null}
      {d.days >= 0 ? (
        <div className="-mb-2 mt-1 flex flex-wrap gap-x-5">
          <button type="button" onClick={addToCalendar} className={ACTION}>
            <CalendarPlus className="size-[17px]" strokeWidth={1.8} aria-hidden />
            {t('action.calendar')}
          </button>
        </div>
      ) : null}
      {/* How the objection date was worked out: there for anyone who wants it, out of the way otherwise. */}
      {d.rule === 'objection' ? (
        <Disclosure title={<span className="font-medium text-ink-2">{t('dl.how')}</span>} headingLevel={5} className="-mb-3 mt-3">
          <p className={cn(NOTE, 'mt-0 pb-2')}>{t('dl.rule.objection')}</p>
        </Disclosure>
      ) : null}
    </Row>
  );
}

export function PaymentRow({ p, today, lang }: { p: NonNullable<ExplainOutput['nextPayment']>; today: string; lang: Lang }) {
  const t = useMessages(messages);
  const { day } = useDates(today);
  const calendar: UrlKey = p.program === 'ccb' ? 'ccbDates' : 'cgebDates';
  return (
    <Row
      tile={<DateTile date={p.date} tone="pine" className="mt-0.5" />}
      title={t('pay.next')}
      when={
        <>
          {day(p.date)}
          <Origin>{t(`pay.${p.program}`)}</Origin>
        </>
      }
      badge={
        <Badge tone="ok" icon={CalendarClock} className={BADGE_TEXT}>
          <bdi>{t('pay.in', { count: p.days })}</bdi>
        </Badge>
      }
    >
      <p className="m-0 -mb-2 py-2.5 text-[14.5px] leading-6">
        <ExternalLink href={url(calendar, lang)} className="text-ink-2 hover:text-ink">
          {t('pay.calendar')}
        </ExternalLink>
      </p>
    </Row>
  );
}
