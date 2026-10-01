/**
 * Key dates: the shapes of the tools' inputs and outputs, and of a date on the calendar. Types only (nothing ships to
 * the client from here).
 */
import type { ToolSource } from '@/lib/widgets/types';
import type { HolidayItem, Lang, Program, Province, TaxKind } from './data';

export type Focus = 'all' | 'payments' | 'taxes' | 'holidays';

/** A notice read live from an official page (e.g. a CRA payment alert). */
export type LiveNotice = { tone: 'info' | 'warn'; title: string; body?: string; url: string; /** Language of the page it was read from. */ lang?: Lang };

export type TaxDate = {
  kind: TaxKind;
  date: string;
  year: number;
  /** Next business day when the due date falls on a weekend or CRA holiday. */
  onTimeBy?: string;
  /** Derived from the CRA's rule (e.g. first 60 days of the year), not yet published on its own. */
  expected?: true;
};

export type CalEvent = {
  id: string;
  /** Day it lands on the calendar (for holidays: the day off). */
  date: string;
  kind: 'payment' | 'tax' | 'holiday';
  program?: Program;
  /** A January/April 2026 GST/HST credit payment (before the CGEB replaced it). */
  gst?: boolean;
  tax?: TaxKind;
  taxYear?: number;
  onTimeBy?: string;
  expected?: true;
  /** `choice`: the employer picks this day or another (Quebec: Good Friday or Easter Monday). */
  holiday?: { name: { en: string; fr: string }; date: string; federal: boolean; clc: boolean; statutory: boolean; choice?: boolean; clcWeekend?: true; substitute?: string };
};

export type CalendarInput = {
  programs?: Program[];
  province?: Province;
  focus?: Focus;
  /** Month to open on, `YYYY-MM`. */
  month?: string;
  lang?: Lang;
};

export type CalendarFeeds = {
  payments: Partial<Record<Program, string[]>> | null;
  holidays: HolidayItem[] | null;
  notices?: LiveNotice[];
};

export type CalendarOutput = {
  version: 1;
  today: string;
  lang: Lang;
  province: Province | null;
  provinceGuessed: boolean;
  focus: Focus;
  /** Programs selected to start with. */
  programs: Program[];
  /** True when the person named programs (otherwise their saved choice on this device wins). */
  programsAsked: boolean;
  /** Lab only: keep `today` as given instead of the reader's clock. */
  pinToday?: boolean;
  showTaxes: boolean;
  showHolidays: boolean;
  month: string;
  payments: Record<Program, string[]>;
  paymentsLive: boolean;
  /** Last date the official calendar publishes (later dates aren't out yet). */
  publishedThrough: string;
  taxes: TaxDate[];
  holidays: HolidayItem[];
  holidaysLive: boolean;
  notices: LiveNotice[];
  /** Plain summary for the model: the next dates for this selection. */
  upcoming: { date: string; what: string; inDays: number }[];
  links: { signIn: string; craSignIn: string; calendar: string; eiAfter: string };
  sources: ToolSource[];
};

export type HolidaysInput = { province?: Province; year?: number; holiday?: string; /** They asked about the next long weekend. */ longWeekend?: boolean; lang?: Lang };

export type HolidaysOutput = {
  version: 1;
  /** Lab only: keep `today` as given instead of the reader's clock. */
  pinToday?: boolean;
  today: string;
  lang: Lang;
  province: Province | null;
  provinceGuessed: boolean;
  year: number;
  years: number[];
  holidays: HolidayItem[];
  live: boolean;
  /** They asked about the next long weekend: lead with it. */
  longWeekendAsked: boolean;
  /** When they asked about one holiday ("Is Remembrance Day a stat in Ontario?"). */
  asked: {
    name: { en: string; fr: string };
    date: string;
    observed?: string;
    /** Federal view: on a weekend, so the day off is the scheduled work day before or after (see `clcView`). */
    clcWeekend?: true;
    /** Province view: on a weekend; the federal public service's day off, named as a common substitute (see `provView`). */
    substitute?: string;
    /**
     * A provincial government's own day in a year it hasn't published a schedule for: no `observed` day (the feed's is
     * unofficial), and the answer says so (see `askedView`).
     */
    unscheduled?: true;
    /** That day has no calendar date of its own (N.L.'s June Holiday): unscheduled, there's no date to give. */
    floating?: true;
    statutory: boolean;
    /** In this province the employer picks this day or another (Quebec: Good Friday or Easter Monday). */
    choice: boolean;
    /** Provinces where the employer picks between this day and another. */
    choiceProvinces: Province[];
    /** Federal public-service day (canada-holidays.ca). */
    federal: boolean;
    /** Canada Labour Code general holiday (federally regulated workplaces). */
    clc: boolean;
    provinces: Province[];
    /** Provinces whose own government gives its employees the day without it being statutory there (N.L.). */
    government?: Province[];
  } | null;
  /** Plain summary for the model. */
  summary: {
    /** Today's holiday here, if any (never reported as "next"). */
    today: string | null;
    /** The next holiday after today. */
    next: { name: string; date: string; dayOff: string; inDays: number; longWeekend: { start: string; end: string; days: number } | null } | null;
    nextLongWeekend: { name: string; start: string; end: string; days: number; inDays: number } | null;
    count: number;
    list: { name: string; dayOff: string }[];
  };
  links: { federal: string; cra: string };
  sources: ToolSource[];
};
