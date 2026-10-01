/**
 * What the timeline shows (pure): the axis, the pins on it, the badge and the big number, derived from the
 * plan, the chosen way to apply and the express or urgent pick-up the trip calls for. Timeline.tsx draws it.
 */
import { diffDays, monthsBetween } from '@/lib/dates/business-days';
import type { Formatters } from '@/lib/i18n/provider-formatters';
import type { MessageValues } from '@/lib/i18n/format';
import { axisPos, buildAxis } from './axis';
import type { PinSpec } from './Gantt';
import { nb } from './shared';
import type { Method, PlannerOutput } from './types';

/**
 * In person, with a trip that regular processing can't make: the pick-up service the plan recommends
 * (express or urgent), or 'emergency' when even urgent pick-up is ready only on or after the departure.
 */
export type Rush = { kind: 'express' | 'urgent' | 'emergency'; from: string; readyBy: string; trip: string };
export const rushOf = (plan: PlannerOutput): Rush | null => {
  const tr = plan.trip;
  if (!tr || tr.option === 'regular') return null;
  return { kind: tr.option, from: plan.officeOpensOn, readyBy: tr.option === 'express' ? tr.expressBy : tr.urgentBy, trip: tr.date };
};

export type TimelineBadge = { tone: 'ok' | 'warn' | 'danger'; text: string };

export function timelineModel({
  plan,
  method,
  rush,
  t,
  fmt,
}: {
  plan: PlannerOutput;
  method: Method;
  rush: Rush | null;
  t: (key: string, values?: MessageValues) => string;
  fmt: Formatters;
}) {
  const m = plan.methods[method];
  const exp = plan.expiry;
  const trip = plan.travelDate;
  const expired = plan.expired;
  const d = (iso: string) => nb(fmt.date(iso, { month: 'short', day: 'numeric' }));
  const monthYear = (iso: string) => nb(fmt.date(iso, { month: 'short', year: 'numeric' }));
  // Express or urgent pick-up: ready at the office, picked up in person (no mail leg).
  const pick = rush && rush.kind !== 'emergency' ? rush : null;
  const emergency = rush?.kind === 'emergency' ? rush : null;
  // Where the "in hand" pin goes: the pick-up date, urgent's (too-late) ready date, or regular delivery.
  const inHandBy = rush ? rush.readyBy : m.inHandBy;

  const axis = buildAxis({ today: plan.today, expiryEnd: exp?.end ?? null, expired, inHandBy, trip });
  const days = axis.scale === 'days';
  const pos = (iso: string, edge?: 'start' | 'end') => axisPos(axis, iso, edge);
  const winStart = plan.onlineOpensOn && plan.onlineOpensOn > axis.start ? plan.onlineOpensOn : axis.start;
  const expAt = exp ? (exp.monthOnly ? exp.start : exp.end) : null;
  const expOff = !!expAt && !expired && expAt >= axis.end;
  const handOff = !rush && m.inHandBy >= axis.end;
  // Only what's on the axis gets a bar (and a legend entry). A day axis is about the trip, not the window.
  const showWindow = !!exp && !days && winStart < axis.end;

  // Badge: time to spare before the trip (if any), else before the expiry. Never "ok" when it's late.
  let badge: TimelineBadge | null = null;
  if (trip && emergency) badge = { tone: 'danger', text: t('timeline.emergency') };
  else if (trip && pick) {
    const spare = diffDays(pick.readyBy, trip);
    badge = { tone: spare < 2 ? 'warn' : 'ok', text: t('timeline.readyTrip', { count: spare }) };
  } else if (trip) {
    const spare = diffDays(m.inHandBy, trip);
    badge = spare < 0 ? { tone: 'danger', text: t('timeline.lateTrip') } : { tone: spare < 7 ? 'warn' : 'ok', text: t('timeline.spareTrip', { count: spare }) };
  } else if (exp && !expired) {
    const spare = Math.max(0, Math.round(diffDays(m.inHandBy, exp.start) / 30.44));
    badge = { tone: spare <= 0 ? 'warn' : 'ok', text: t('timeline.spare', { count: spare }) };
  }

  // The big number answers the question asked: days (or weeks) until the trip, else months around the expiry.
  const range = (min: number, max: number) => (min === max ? fmt.number(min) : `${fmt.number(min)}–${fmt.number(max)}`);
  const monthsLeft = plan.monthsLeft ?? { min: 0, max: 0 };
  // Whole calendar months since it expired (Nov 30 -> Sep 30 is 10, not 9 by 30.44-day months). When only the
  // month is known, the day could be its first or its last, so it is a range like the months left ("5–6").
  const since = exp ? { min: Math.max(0, monthsBetween(exp.end, plan.today)), max: Math.max(0, monthsBetween(exp.start, plan.today)) } : { min: 0, max: 0 };
  const tripDays = trip ? diffDays(plan.today, trip) : 0;
  const tripWeeks = Math.floor(tripDays / 7);
  const [big, unit] = trip
    ? days
      ? [fmt.number(tripDays), t('timeline.daysLeft', { count: tripDays })]
      : [fmt.number(tripWeeks), t('timeline.weeksLeft', { count: tripWeeks })]
    : expired
      ? [range(since.min, since.max), t('timeline.monthsSince', { count: since.max })]
      : [range(monthsLeft.min, monthsLeft.max), t('timeline.monthsLeft', { count: monthsLeft.max })];

  const pins: PinSpec[] = [
    ...(exp && expAt && expired
      ? [{ key: 'exp', at: pos(expAt), label: t(axis.brokenStart ? 'timeline.expiredBefore' : 'timeline.expired', { date: monthYear(exp.end) }), tone: 'maple' as const, solid: true }]
      : []),
    { key: 'today', at: pos(plan.today), label: t('timeline.today'), tone: 'ink' },
    {
      key: 'hand',
      // "By the end of" a day sits at that day's end, so a same-day departure (at its start) reads as earlier.
      at: pos(inHandBy, rush ? 'end' : 'start'),
      label: pick
        ? t('timeline.pickUp', { date: d(pick.readyBy) })
        : emergency
          ? t('timeline.urgentReady', { date: d(emergency.readyBy) })
          : t(handOff ? 'timeline.inHandAfter' : 'timeline.inHand', { date: d(m.inHandBy) }),
      tone: 'maple',
    },
    ...(trip ? [{ key: 'trip', at: pos(trip), label: t('timeline.trip', { date: d(trip) }), tone: 'glacier' as const, solid: true }] : []),
    ...(expAt && !expired
      ? [{ key: 'exp', at: pos(expAt), label: expOff ? t('timeline.expiresAfter', { date: monthYear(expAt) }) : t('timeline.expires'), tone: 'maple' as const, solid: true }]
      : []),
  ];

  return { axis, days, pos, pick, emergency, winStart, expAt, expOff, showWindow, badge, big, unit, pins };
}
