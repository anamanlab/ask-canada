/**
 * Types for the passport renewal plan: the tool's input and output, shared by the pure computation (plan.ts),
 * the notice reader (notices.ts) and the widget's parts. All dates are ISO (YYYY-MM-DD).
 */
import type { Holiday } from '@/lib/dates/business-days';
import type { ToolSource } from '@/lib/widgets/types';
import type { PASSPORT } from './data';

export type Method = 'online' | 'in-person' | 'mail';
export type Focus = 'fees' | 'processing' | 'online';
export type Lang = 'en' | 'fr';

export type PlannerInput = {
  /** Expiry of the current passport: 'YYYY-MM' (month only) or 'YYYY-MM-DD'. */
  expiry?: string;
  issuedAt16OrOlder?: boolean;
  issuedWithin15Years?: boolean;
  validFor5or10Years?: boolean;
  sameDetails?: boolean;
  livesInCanada?: boolean;
  /** Planned departure date, if any (YYYY-MM-DD). */
  travelDate?: string;
  validityYears?: 5 | 10;
  /**
   * What the question was about, so the planner leads with that answer instead of the expiry picker:
   * 'fees' (the fee summary), 'processing' (how long each way takes), 'online' (who can renew online).
   */
  focus?: Focus;
  lang?: Lang;
};

export type MethodPlan = {
  method: Method;
  businessDays: number;
  readyBy: string;
  inHandBy: string;
  /**
   * By mail only: when the application is estimated to reach IRCC. canada.ca gives no inbound mailing time,
   * so we assume the same ~5 business days it gives for delivering the passport back (labelled an estimate).
   */
  arrivesBy?: string;
  available: boolean;
  /** Why online isn't available right now. */
  reason?: 'too-early' | 'travel-soon' | 'outside-canada' | 'unknown-expiry';
  handoff: string;
};

/** A canada.ca alert: title, lead sentence, and its bullet list (canada.ca writes most conditions as a list). */
export type Notice = { tone: 'warn' | 'info'; title: string; body?: string; list?: string[]; url?: string };

/**
 * Service notices read from canadian-passports.html (see notices.ts). `live: false` means we couldn't read
 * the page just now, so the widget makes no claim either way and links to it instead.
 */
export type NoticeFeed = { live: boolean; checked: string; page: string; items: Notice[] };
export type NoticeFeeds = Record<Lang, NoticeFeed>;

/**
 * Travel planned: can regular in-person processing (mailed back) get the passport there in time?
 * Otherwise the fastest fit: express pick-up (2–9 business days) or urgent pick-up (end of next business day),
 * both only at a passport office, with proof of travel. When even urgent pick-up is ready only on or after
 * the departure day ('emergency'), no standard service fits: the plan says so and points to the Passport
 * Program and canada.ca's emergency weekend or statutory holiday service (apply-in-person.html).
 */
export type TripOption = 'regular' | 'express' | 'urgent' | 'emergency';
export type TripPlan = {
  date: string;
  option: TripOption;
  /** Regular in-person processing + mail delivery. */
  regularInHandBy: string;
  /** Latest date express pick-up is ready (9 business days). */
  expressBy: string;
  /** Earliest date express pick-up can be ready (2 business days). */
  expressFrom: string;
  /**
   * The plan recommends urgent pick-up, yet express pick-up could be ready before the departure if the office
   * manages it faster than its 9-business-day limit: the cheaper service is worth asking about.
   */
  expressMayFit: boolean;
  /** Urgent pick-up: end of the next business day. */
  urgentBy: string;
  urgentUrl: string;
  /**
   * apply-in-person.html: its "You need a passport on a weekend or statutory holiday (emergencies only)"
   * section holds the phone number, the hours and the leave-a-message call-back steps.
   */
  emergencyUrl: string;
  /**
   * A weekend or statutory holiday falls between today and the departure (inclusive): the time when
   * canada.ca's emergency weekend or statutory holiday service ($383.50) is the one that applies.
   */
  offHours: boolean;
  /**
   * The Passport Program's phone line right now (apply-in-person.html, weekend or statutory holiday section):
   * - 'open': a weekday; it answers 8:30 am to 5 pm local time (9 am to 5:30 pm in Newfoundland).
   * - 'callback': Saturday or Sunday, or after 5 pm on a Friday or a weekday before a statutory holiday:
   *   "You can leave a message and ask for us to call you back… We'll call you with information on emergency
   *   services between 9 am and 5 pm (your local time)."
   * - 'holiday': a weekday statutory holiday. Calls aren't answered, and the page's call-back list names
   *   weekends and the evening before a holiday, not the holiday itself: we say exactly that.
   * - 'closed': after 5 pm on any other weekday (no call-back offered); lines open `callsOn`.
   */
  phone: 'open' | 'callback' | 'holiday' | 'closed';
  /** Today is a Friday or a weekday before a statutory holiday: after 5 pm the call-back message applies. */
  callbackTonight: boolean;
  /** Next weekday the Passport Program answers calls (today while its lines are open). */
  callsOn: string;
};

/**
 * The reader's clock, when it is known: `hour` is their local time of day (17.5 = 5:30 pm). The Passport
 * Program's phone lines close at 5 pm local time, 5:30 pm in Newfoundland.
 */
export type Clock = { hour: number; newfoundland?: boolean };

export type PlannerOutput = {
  version: 1;
  today: string;
  /** Today is a federal statutory holiday: passport offices are closed, in-person service starts `officeOpensOn`. */
  todayHoliday: Holiday | null;
  /** The first day a passport office can take the application: today, or the next business day (see `afterHours`). */
  officeOpensOn: string;
  /** A business day, but too late to apply in person today (plan.ts OFFICE_CUTOFF_HOUR): dates count from `officeOpensOn`. */
  afterHours: boolean;
  focus: Focus | null;
  lang: Lang;
  expiry: { start: string; end: string; monthOnly: boolean } | null;
  monthsLeft: { min: number; max: number } | null;
  expired: boolean;
  eligibility: {
    issuedAt16OrOlder: boolean;
    issuedWithin15Years: boolean;
    validFor5or10Years: boolean;
    sameDetails: boolean;
  };
  canRenew: boolean;
  /** Online renewal opens this date (expiry − 6 months); online is open if expiry is on/before `onlineOpenIfExpiresBy`. */
  onlineOpensOn: string | null;
  onlineOpenIfExpiresBy: string;
  methods: Record<Method, MethodPlan>;
  recommended: Method;
  skippedHolidays: Holiday[];
  /** Days between the recommended method's in-hand date and the trip (if any), else the expiry. */
  spareDays: number | null;
  spareAgainst: 'trip' | 'expiry' | null;
  travelDate: string | null;
  trip: TripPlan | null;
  validityYears: 5 | 10;
  fees: typeof PASSPORT.fees;
  references: number;
  form: string;
  serviceNotices: NoticeFeeds;
  renewUrl: string;
  newPassportUrl: string;
  officesUrl: string;
  sources: ToolSource[];
  /**
   * Lab fixtures only: the planner keeps the fixture's date and this time of day (17.5 = 5:30 pm) instead of
   * following the device's clock, so a state like "today is a statutory holiday" stays the state it names.
   * The tool never sets it.
   */
  pinned?: Clock;
};
