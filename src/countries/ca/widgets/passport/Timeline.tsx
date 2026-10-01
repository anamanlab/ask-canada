'use client';
/**
 * The plan's timeline: the big number (months until the expiry, or days until the trip), a track of named
 * segments with labelled pins on wide containers (Gantt.tsx) and a vertical stepper on phones, plus the estimate note. Express or urgent
 * pick-up replaces regular processing. A trip within four weeks switches the axis to days (see axis.ts), and
 * that view also works before the expiry month is known. What it shows is derived in timelineModel.ts.
 */
import { AlertTriangle, Check, Info, Plane } from 'lucide-react';
import { Badge, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { addMonths } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { URLS } from './data';
import { Gantt, type Segment } from './Gantt';
import messages from './messages';
import type { Method, PlannerOutput } from './types';
import { PlanSteps, type PlanStep } from './PlanSteps';
import { focusOnMount, isolate, nb, ordinal, sentenceCase } from './shared';
import { timelineModel, type Rush } from './timelineModel';

/** Solid, tinted segments: one hue each, no hatching, so the track reads at a glance on both themes. */
const MAPLE_BAR =
  'bg-[linear-gradient(90deg,var(--maple),color-mix(in_oklab,var(--maple)_62%,var(--a-rose)))] rtl:bg-[linear-gradient(270deg,var(--maple),color-mix(in_oklab,var(--maple)_62%,var(--a-rose)))]';
const LATE_BAR = 'bg-[color-mix(in_oklab,var(--maple)_30%,var(--card))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--maple)_50%,transparent)]';
const MAIL_BAR = 'bg-[color-mix(in_oklab,var(--ink-2)_42%,var(--card))]';
const DELIVERY_BAR = 'bg-[color-mix(in_oklab,var(--maple)_36%,var(--card))]';
const WINDOW_BAR = 'bg-[color-mix(in_oklab,var(--pine)_17%,transparent)] dark:bg-[color-mix(in_oklab,var(--pine)_30%,transparent)]';
const ON_BAR = 'text-white';
const ROUND = 'rounded-[7px]';

export function Timeline({
  plan,
  method,
  rush,
  onChange,
  focusChange,
}: {
  plan: PlannerOutput;
  method: Method;
  rush: Rush | null;
  /** "Change expiry month": absent while the expiry month isn't known (the planner offers to add it instead). */
  onChange?: () => void;
  /** Mounted because the person just picked or kept a month: put focus back on "Change expiry month". */
  focusChange?: boolean;
}) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();

  const m = plan.methods[method];
  const exp = plan.expiry;
  const trip = plan.travelDate;
  const expired = plan.expired;
  const d = (iso: string) => nb(fmt.date(iso, { month: 'short', day: 'numeric' }));
  // Inside a sentence the month is written out: French short months end in a period (« 1er oct.. »).
  const dl = (iso: string) => nb(fmt.date(iso, { month: 'long', day: 'numeric' }));
  const { axis, pos, pick, emergency, winStart, expAt, expOff, showWindow, badge, big, unit, pins } = timelineModel({ plan, method, rush, t, fmt });
  const readyBy = rush ? rush.readyBy : m.readyBy;

  // The plan is computed in the language the planner shows (see PassportPlanner), so holiday names follow it.
  const lang = plan.lang;
  const holidays = plan.skippedHolidays.map((h) => t('estimate.holiday', { date: d(h.date), name: h.name[lang] })).join(t('estimate.and'));
  // Renewing more than a year before the expiry: the application asks for the reason.
  const early = !!exp && !expired && exp.start > addMonths(plan.today, 12);

  // Stepper (phones): chronological, today is where you are.
  type Dated = { at: string; step: PlanStep };
  const hol = plan.todayHoliday;
  // Offices can't take an application today (weekend, holiday or late in the day): in person starts `opens`.
  const opens = plan.officeOpensOn;
  const closedNow = opens !== plan.today;
  const todayDetail =
    hol && method !== 'mail'
      ? t(method === 'online' && m.available ? 'step.todayHoliday.online' : 'step.todayHoliday.office', { name: hol.name[lang], date: d(opens) })
      : emergency
        ? t('step.emergencyToday')
        : pick
          ? t(closedNow ? 'step.rushLater' : 'step.rushToday', { date: d(opens) })
          : closedNow && method === 'in-person'
            ? t('step.todayLater', { date: d(opens) })
            : t('step.todayDetail');
  // Why in-person dates don't count from today, beside the estimate (phones read it in the stepper's first step).
  const officeNote = hol
    ? t('estimate.holidayToday', { name: hol.name[lang], date: dl(opens) })
    : closedNow && method === 'in-person'
      ? t(plan.afterHours ? 'estimate.afterHours' : 'estimate.closedToday', { date: dl(opens) })
      : null;
  // Where processing starts: today online; next business day in person on a holiday; on arrival by mail.
  const procStart = m.arrivesBy ?? (method === 'in-person' ? opens : plan.today);
  const up = 'upcoming' as const;
  const later: Dated[] = [
    ...(rush
      ? [
          pick
            ? { at: pick.readyBy, step: { id: 'ready', title: t('step.pickUp', { date: d(pick.readyBy) }), detail: t(`step.pickUpDetail.${pick.kind}`), tone: up } }
            : { at: `${rush.readyBy}~`, step: { id: 'ready', title: t('step.urgentReady', { date: d(rush.readyBy) }), detail: t('step.urgentLate'), tone: up } },
        ]
      : [
          ...(m.arrivesBy ? [{ at: m.arrivesBy, step: { id: 'arrives', title: t('step.mailIn', { date: d(m.arrivesBy) }), detail: t('step.mailInDetail'), tone: up } }] : []),
          { at: m.readyBy, step: { id: 'ready', title: t('step.processing', { count: m.businessDays }), detail: t('step.processingDetail', { date: d(m.readyBy) }), tone: up } },
          { at: m.inHandBy, step: { id: 'in-hand', title: t('step.inHand', { date: d(m.inHandBy) }), detail: t('step.inHandDetail'), tone: up } },
        ]),
    ...(trip
      ? [{ at: trip, step: { id: 'trip', title: t('step.trip', { date: d(trip) }), detail: t('step.tripDetail'), tone: 'trip' as const, aside: <Plane className="size-4 text-glacier flip-rtl" aria-hidden /> } }]
      : []),
    ...(exp && !expired
      ? [{ at: exp.start, step: { id: 'expiry', title: sentenceCase(nb(fmt.date(exp.start, { month: 'long', year: 'numeric' })), locale), detail: t('step.expiresDetail'), tone: 'end' as const } }]
      : []),
  ];
  const steps: PlanStep[] = [
    ...(exp && expired ? [{ id: 'expiry', title: sentenceCase(t('step.expires', { date: nb(fmt.date(exp.end, { month: 'long', year: 'numeric' })) }), locale), detail: t('step.expiredDetail'), tone: 'done' as const }] : []),
    { id: 'today', title: t('step.today', { date: d(plan.today) }), detail: todayDetail, tone: 'current' },
    ...[...later].sort((a, b) => a.at.localeCompare(b.at)).map((s) => s.step),
  ];

  const srDates = { today: dl(plan.today), opens: dl(opens), ready: dl(readyBy), inHand: dl(m.inHandBy), trip: trip ? dl(trip) : '', expiry: exp ? fmt.date(exp.start, { month: 'long', year: 'numeric' }) : '' };
  // In person while offices are closed, the dates count from the day they open: the sentence says so up front
  // (the visible key reads "Processing, if you apply on Oct 2"), never "if you apply today".
  const srKey = `timeline.${closedNow && method === 'in-person' ? 'srOpens' : 'sr'}${!exp ? 'NoExpiry' : expired ? 'Expired' : ''}`;
  const sr = rush && trip ? t(pick ? `timeline.srRush.${pick.kind}` : 'timeline.srEmergency', srDates) : `${t(srKey, srDates)}${trip ? ` ${t('timeline.srTrip', srDates)}` : ''}`;

  // The track, back to front: the online window, then what happens to the application.
  const winAt = { from: pos(winStart), to: expired || expOff || !expAt ? 100 : pos(expAt) };
  // The window's name goes where nothing is drawn over it: before the application starts or after the
  // passport is in hand, whichever stretch is wider.
  const busy = { from: pos(rush ? rush.from : m.arrivesBy ? plan.today : procStart), to: pos(rush ? rush.readyBy : m.inHandBy, rush ? 'end' : 'start') };
  const before = { labelFrom: winAt.from, labelTo: Math.min(winAt.to, busy.from) };
  const after = { labelFrom: Math.max(winAt.from, busy.to), labelTo: winAt.to };
  const winLabel = after.labelTo - after.labelFrom >= before.labelTo - before.labelFrom ? after : before;
  const segments: Segment[] = [
    ...(showWindow
      ? [
          {
            key: 'window',
            ...winAt,
            ...winLabel,
            className: WINDOW_BAR,
            label: t('bar.window'),
            labelClassName: 'text-pine',
            legend: t('legend.window'),
          },
        ]
      : []),
    ...(pick
      ? [{ key: 'rush', from: pos(pick.from), to: pos(pick.readyBy, 'end'), minWidth: 10, veil: true, className: cn(MAPLE_BAR, ROUND), label: t(`bar.rush.${pick.kind}`), labelClassName: ON_BAR, legend: t(`legend.rush.${pick.kind}`) }]
      : rush
        ? [{ key: 'rush', from: pos(rush.from), to: pos(rush.readyBy, 'end'), minWidth: 10, veil: true, className: cn(LATE_BAR, ROUND), label: t('bar.rush.urgent'), labelClassName: 'text-maple-ink', legend: t('legend.rush.emergency') }]
        : [
            ...(m.arrivesBy
              ? [{ key: 'mail', from: pos(plan.today), to: pos(m.arrivesBy), veil: true, className: cn(MAIL_BAR, 'rounded-s-[7px]'), label: t('bar.mailIn'), labelClassName: ON_BAR, legend: t('legend.mailIn') }]
              : []),
            {
              key: 'processing',
              from: pos(procStart),
              to: pos(m.readyBy),
              veil: true,
              className: cn(MAPLE_BAR, !m.arrivesBy && 'rounded-s-[7px]'),
              label: t('bar.processing'),
              labelClassName: ON_BAR,
              legend: m.arrivesBy ? t('legend.processingMail') : closedNow && method === 'in-person' ? t('legend.processingFrom', { date: d(opens) }) : t('legend.processing'),
            },
            { key: 'delivery', from: pos(m.readyBy), to: pos(m.inHandBy), veil: true, className: cn(DELIVERY_BAR, 'rounded-e-[7px]'), label: t('bar.delivery'), labelClassName: 'text-maple-ink', legend: t('legend.delivery') },
          ]),
  ];

  return (
    <div className="px-5 pt-7 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="m-0 font-serif text-[44px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
          <bdi dir="ltr">{big}</bdi>
          <span className="ms-2.5 font-sans text-[15px] font-medium tracking-[-.005em] text-ink-2">{isolate(unit)}</span>
        </p>
        <span className="flex flex-wrap items-center gap-2">
          {badge ? (
            <Badge tone={badge.tone} icon={badge.tone === 'ok' ? Check : trip ? Plane : AlertTriangle}>
              {isolate(badge.text)}
            </Badge>
          ) : null}
          {onChange ? (
            <button
              ref={focusChange ? focusOnMount : undefined}
              type="button"
              onClick={onChange}
              className="min-h-11 rounded-chip px-3 text-[13.5px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink"
            >
              {t('timeline.change')}
            </button>
          ) : null}
        </span>
      </div>

      <Gantt axis={axis} pins={pins} segments={segments} closedLabel={t('legend.closed')} />

      {/* Vertical stepper (narrow containers, e.g. phones) */}
      <PlanSteps className="mt-6 @xl:hidden" steps={steps} />
      <p className="sr-only">{sr}</p>
      <p className="m-0 mt-4 text-pretty text-[13.5px] leading-snug text-ink-3">
        <bdi>
          {/* Phones read this in the stepper's first step. */}
          {officeNote ? <span className="hidden @xl:inline">{ordinal(officeNote)} </span> : null}
          {rush
            ? `${t('estimate.rush')}${pick?.kind === 'express' ? ` ${t('estimate.express')}` : ''}`
            : holidays
              ? t('estimate.withHolidays', { holidays })
              : t('estimate.plain')}
          {method === 'mail' ? ` ${t('estimate.mail')}` : ''}
        </bdi>
      </p>
      {early ? (
        // check-who-renew.html: more than a year before it expires, IRCC asks why (by mail, in writing).
        <p className="m-0 mt-3 flex gap-2 text-[14px] leading-snug text-ink-2">
          <Info className="mt-[2px] size-3.5 shrink-0 text-ink-3" aria-hidden />
          <span>
            <bdi>
              {t('estimate.early')}
              {method === 'mail' ? ` ${t('estimate.earlyMail')}` : ''}{' '}
              <ExternalLink href={URLS.whoCanRenew[lang]} className="font-normal text-ink-2">
                {t('estimate.earlyLink')}
              </ExternalLink>
            </bdi>
          </span>
        </p>
      ) : null}
    </div>
  );
}
