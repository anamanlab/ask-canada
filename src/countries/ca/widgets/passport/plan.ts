/**
 * Passport renewal plan: pure, isomorphic computation used by the `passportPlanner` tool.
 * All dates are ISO (YYYY-MM-DD). Business days skip weekends and federal statutory holidays. Types: types.ts.
 */
import {
  addBusinessDays,
  addDays,
  addMonths,
  diffDays,
  isWeekend,
  lastDayOfMonth,
  monthsBetween,
  type Holiday,
} from '@/lib/dates/business-days';
import { FEDERAL_HOLIDAYS } from '../../data/holidays';
import { PASSPORT, PORTAL, URLS, passportSources, type SourceKey } from './data';

import type { Clock, Focus, Lang, Method, MethodPlan, NoticeFeeds, PlannerInput, PlannerOutput, TripOption, TripPlan } from './types';

export const FOCUSES: readonly Focus[] = ['fees', 'processing', 'online'];

/** Next occurrence of a month (1–12) on/after today, as 'YYYY-MM'. */
export function nextMonthOccurrence(month: number, today: string) {
  const [y, m] = today.split('-').map(Number);
  const year = month >= m ? y : y + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Most recent occurrence of a month (1–12) on/before today, as 'YYYY-MM' ("it expired in March"). */
export function lastMonthOccurrence(month: number, today: string) {
  const [y, m] = today.split('-').map(Number);
  const year = month <= m ? y : y - 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** No live read: the widget makes no claim about service notices and links to the page. */
export function offlineFeeds(today: string): NoticeFeeds {
  return {
    en: { live: false, checked: today, page: URLS.home.en, items: [] },
    fr: { live: false, checked: today, page: URLS.home.fr, items: [] },
  };
}

/**
 * From this local hour on a business day, in-person dates count from the next business day. canada.ca gives no
 * single closing time for passport offices (each office lists its own hours, and walk-in waits "may be long"),
 * so this is our cautious cut-off, not a published fact: a plan made late in the afternoon must never promise
 * a pick-up date that needs an application handed in the same day. The note beside the dates says so.
 */
export const OFFICE_CUTOFF_HOUR = 16;

/**
 * `clock` decides two things: whether passport offices can still take an application today (else every
 * in-person, express and urgent date counts from the next business day) and the phone-line state. Without it
 * (the tool has no time zone) the plan assumes office hours; the widget re-plans with the reader's own clock.
 */
export function planRenewal(input: PlannerInput, today: string, feeds: NoticeFeeds = offlineFeeds(today), clock?: Clock): PlannerOutput {
  const hour = clock?.hour;
  const lang: Lang = input.lang === 'fr' ? 'fr' : 'en';
  const eligibility = {
    issuedAt16OrOlder: input.issuedAt16OrOlder ?? true,
    issuedWithin15Years: input.issuedWithin15Years ?? true,
    validFor5or10Years: input.validFor5or10Years ?? true,
    sameDetails: input.sameDetails ?? true,
  };
  const canRenew = Object.values(eligibility).every(Boolean);

  let expiry: PlannerOutput['expiry'] = null;
  if (input.expiry && /^\d{4}-\d{2}(-\d{2})?$/.test(input.expiry)) {
    const monthOnly = input.expiry.length === 7;
    expiry = monthOnly
      ? { start: `${input.expiry}-01`, end: lastDayOfMonth(input.expiry), monthOnly }
      : { start: input.expiry, end: input.expiry, monthOnly };
  }

  const windowLimit = addMonths(today, PASSPORT.onlineWindowMonths);
  const expired = expiry ? expiry.end < today : false;
  const onlineOpensOn = expiry ? addMonths(expiry.start, -PASSPORT.onlineWindowMonths) : null;

  const holidays = FEDERAL_HOLIDAYS;
  // On a statutory holiday passport offices are closed: in-person service (and urgent/express) starts next business day.
  const todayHoliday = holidays.find((h) => h.date === today) ?? null;
  // Weekends too: offices and phone lines open the next business day.
  const closedOn = (iso: string) => isWeekend(iso) || holidays.some((h) => h.date === iso);
  // Late on a business day it is too late to hand in an application: in-person service starts the next one.
  const afterHours = !closedOn(today) && hour != null && hour >= OFFICE_CUTOFF_HOUR;
  const officeOpensOn = closedOn(today) || afterHours ? addBusinessDays(today, 1, holidays).date : today;
  const mk = (days: number, from = today) => {
    const ready = addBusinessDays(from, days, holidays);
    const inHand = addBusinessDays(ready.date, PASSPORT.deliveryBusinessDays, holidays);
    return { ready, inHand };
  };
  const online = mk(PASSPORT.businessDays.online);
  const office = mk(PASSPORT.businessDays.passportOffice, officeOpensOn);
  // By mail, processing starts when the application arrives (estimated like the return delivery).
  const mailArrives = addBusinessDays(today, PASSPORT.deliveryBusinessDays, holidays).date;
  const mail = mk(PASSPORT.businessDays.mail, mailArrives);

  const travelDate = input.travelDate && /^\d{4}-\d{2}-\d{2}$/.test(input.travelDate) ? input.travelDate : null;
  const travelSoon = travelDate ? travelDate <= online.inHand.date : false;
  const livesInCanada = input.livesInCanada ?? true;

  let onlineReason: MethodPlan['reason'];
  if (!livesInCanada) onlineReason = 'outside-canada';
  else if (travelSoon) onlineReason = 'travel-soon';
  else if (!expiry) onlineReason = 'unknown-expiry';
  else if (expiry.start > windowLimit) onlineReason = 'too-early';

  const methods: Record<Method, MethodPlan> = {
    online: {
      method: 'online',
      businessDays: PASSPORT.businessDays.online,
      readyBy: online.ready.date,
      inHandBy: online.inHand.date,
      available: canRenew && !onlineReason,
      reason: onlineReason,
      // Only send people to sign in when online renewal is actually open to them.
      handoff: canRenew && !onlineReason ? PORTAL[lang] : URLS.online[lang],
    },
    'in-person': {
      method: 'in-person',
      businessDays: PASSPORT.businessDays.passportOffice,
      readyBy: office.ready.date,
      inHandBy: office.inHand.date,
      available: canRenew,
      handoff: URLS.inPerson[lang],
    },
    mail: {
      method: 'mail',
      businessDays: PASSPORT.businessDays.mail,
      readyBy: mail.ready.date,
      inHandBy: mail.inHand.date,
      arrivesBy: mailArrives,
      available: canRenew && livesInCanada,
      handoff: URLS.mail[lang],
    },
  };

  // Unknown expiry: we can't say online is open yet, so default to in person (works any time).
  const recommended: Method = methods.online.available ? 'online' : 'in-person';

  let trip: TripPlan | null = null;
  if (travelDate) {
    const expressFrom = addBusinessDays(officeOpensOn, 2, holidays).date;
    const expressBy = addBusinessDays(officeOpensOn, 9, holidays).date;
    const urgentBy = addBusinessDays(officeOpensOn, 1, holidays).date;
    // Urgent is ready "by the end of" urgentBy: only a fit when that's before the departure day.
    const option: TripOption =
      office.inHand.date < travelDate ? 'regular' : expressBy < travelDate ? 'express' : urgentBy < travelDate ? 'urgent' : 'emergency';
    let offHours = false;
    if (option === 'emergency') for (let d = today; d <= travelDate && !offHours; d = addDays(d, 1)) offHours = closedOn(d);
    const callbackTonight = !closedOn(today) && closedOn(addDays(today, 1));
    const after5 = hour != null && hour >= (clock?.newfoundland ? 17.5 : 17);
    const phone: TripPlan['phone'] = isWeekend(today) ? 'callback' : todayHoliday ? 'holiday' : !after5 ? 'open' : callbackTonight ? 'callback' : 'closed';
    trip = {
      date: travelDate,
      option,
      regularInHandBy: office.inHand.date,
      expressFrom,
      expressMayFit: option === 'urgent' && expressFrom < travelDate,
      expressBy,
      urgentBy,
      urgentUrl: URLS.urgent[lang],
      emergencyUrl: URLS.inPerson[lang],
      offHours,
      phone,
      callbackTonight,
      callsOn: phone === 'open' ? today : addBusinessDays(today, 1, holidays).date,
    };
  }

  const focus = input.focus && FOCUSES.includes(input.focus) ? input.focus : null;
  // The first source is the one the shell's footer shows: the page behind the answer card's numbers.
  const rushTrip = canRenew && trip && trip.option !== 'regular' ? trip.option : null;
  const lead: SourceKey[] =
    rushTrip === 'emergency'
      ? ['urgent', 'inPerson']
      : rushTrip
        ? ['urgent']
        : expiry
          ? []
          : focus === 'fees'
            ? ['payFees', 'fees']
            : focus === 'processing'
              ? ['processing']
              : focus === 'online'
                ? ['online']
                : [];

  const skipped = new Map<string, Holiday>();
  [...online.ready.skipped, ...online.inHand.skipped].forEach((h) => skipped.set(h.date, h));

  return {
    version: 1,
    today,
    todayHoliday,
    officeOpensOn,
    afterHours,
    focus,
    lang,
    expiry,
    monthsLeft: expiry && !expired ? { min: Math.max(0, monthsBetween(today, expiry.start)), max: Math.max(0, monthsBetween(today, expiry.end)) } : null,
    expired,
    eligibility,
    canRenew,
    onlineOpensOn,
    onlineOpenIfExpiresBy: windowLimit,
    methods,
    recommended,
    skippedHolidays: [...skipped.values()].sort((a, b) => a.date.localeCompare(b.date)),
    spareDays: travelDate
      ? diffDays(methods[recommended].inHandBy, travelDate)
      : expiry && !expired
        ? diffDays(methods[recommended].inHandBy, expiry.start)
        : null,
    spareAgainst: travelDate ? 'trip' : expiry && !expired ? 'expiry' : null,
    travelDate,
    trip,
    validityYears: input.validityYears === 5 ? 5 : 10,
    fees: PASSPORT.fees,
    references: PASSPORT.references,
    form: PASSPORT.form,
    serviceNotices: feeds,
    renewUrl: URLS.renew[lang],
    newPassportUrl: URLS.newAdult[lang],
    officesUrl: URLS.offices[lang],
    sources: passportSources(lang, lead),
  };
}
