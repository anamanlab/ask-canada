/**
 * Pure selectors for the directory card: which number leads for this viewer, each line's live status, and what
 * the card says above the list (badge, notices). Computed once per render in `Directory` and handed to the
 * rows, the overview cards, the header badge and the loading skeleton.
 */
import type { Holiday } from '@/lib/dates/business-days';
import { LINES, type AltNumber, type Bi, type Hours, type Lang, type Line, type LineId, type Topic } from './data';
import { URLS } from './urls';
import { daySegments, holidayToday, isOpen, statusOf, wallClock, type Status } from './hours';

/** What every row needs to know about the viewer: their clock, zone, holidays nearby and language. */
export type Viewer = { now: number; tz: string; holidays: Holiday[]; lang: Lang };

/** Which number to lead with for this viewer, and why. */
export type NumberPick = {
  number?: string;
  hours?: Hours;
  kind: 'main' | 'fr' | 'tty' | 'abroad' | 'north';
  collect?: boolean;
  /** An abroad number the page lists for "Outside Canada" (not "…and the United States"). */
  outside?: 'canada';
};
/**
 * `abroad`: calling from outside Canada and the United States. `us`: calling from the United States, where the
 * toll-free numbers still work, so only a number listed for "Outside Canada" replaces the main one.
 */
export type PickOptions = { tty: boolean; abroad: boolean; us: boolean; north: boolean; lang: Lang };

/**
 * TTY numbers lead when the answer asked for them or the person switched them on. The saved device preference
 * can only turn them on: an old "off" never hides the TTY numbers from someone who has just asked for them.
 * `override` is this card's own toggle (null until it is touched).
 */
export const ttyFirst = (asked: boolean, saved: boolean | undefined, override: boolean | null) => override ?? (asked || saved === true);

const ttyNumber = (id: LineId) => LINES[id].alt?.find((a) => a.kind === 'tty')?.number;
/**
 * The three CRA lines share one TTY number. With TTY first, only the first of them on screen leads with it; this
 * returns that line for the others, which keep their own number, say where the TTY line is, and list it under
 * "more options" (same rule as `leadsNorth`: the card never leads with one number twice).
 */
export function ttySharedWith(id: LineId, ids: LineId[]): LineId | undefined {
  const n = ttyNumber(id);
  const first = n ? ids.find((x) => ttyNumber(x) === n) : undefined;
  return first && first !== id ? first : undefined;
}

export function pickNumber(line: Line, o: PickOptions): NumberPick {
  const alt = (k: AltNumber['kind']) => line.alt?.find((a) => a.kind === k);
  if (o.tty) {
    const a = alt('tty');
    if (a) return { number: a.number, hours: a.hours ?? line.agents, kind: 'tty' };
  }
  if (o.abroad || o.us) {
    const a = alt('abroad');
    if (a && (o.abroad || a.outside === 'canada')) return { number: a.number, hours: a.hours ?? line.agents, kind: 'abroad', collect: a.collect, outside: a.outside };
  }
  if (o.north) {
    const a = alt('north');
    if (a) return { number: a.number, hours: a.hours ?? line.agents, kind: 'north' };
  }
  if (o.lang === 'fr' && line.numberFr) return { number: line.numberFr, hours: line.agents, kind: 'fr' };
  return { number: line.number, hours: line.agents, kind: 'main' };
}

/**
 * In Yukon, the N.W.T. and Nunavut the CRA answers personal tax and benefit calls on one northern number. When
 * both rows are on screen, only the personal-tax row leads with it; the benefits row keeps its own number (and
 * its automated line) and lists the northern one under "more options", so the card never shows the same number twice.
 */
export const leadsNorth = (id: LineId, ids: LineId[]) => !(id === 'cra-benefits' && ids.includes('cra-individuals'));

/** One line as this viewer sees it right now. */
export type LineView = {
  line: Line;
  pick: NumberPick;
  /** Agents on the picked number (null: no phone hours, an online-only contact). */
  status: Status | null;
  /** Automated hours belong to the main CRA / CPP numbers only (never the northern, TTY or international lines). */
  autoRule?: Hours;
  auto: Status | null;
  /** TTY first, but this row leads with a voice number: its TTY line already leads another row (`with`), or it has none. */
  ttyNote?: { with: LineId } | { none: true };
  /** Calling from outside Canada and the U.S., and the line has per-country numbers: the page that lists them. */
  abroadPage?: Line['abroadPage'];
};

/** `ids`: every line on screen, so shared numbers (the CRA's TTY line) lead only once. */
export function viewLine(id: LineId, o: PickOptions, v: Viewer, ids: LineId[] = [id]): LineView {
  const line = LINES[id];
  const shared = o.tty ? ttySharedWith(id, ids) : undefined;
  const picked = pickNumber(line, shared ? { ...o, tty: false } : o);
  const abroadPage = o.abroad ? line.abroadPage : undefined;
  // From abroad the voice line is answered by the international service, which keeps its own (Eastern) hours.
  const pick = abroadPage && (picked.kind === 'main' || picked.kind === 'fr') ? { ...picked, hours: abroadPage.hours } : picked;
  const autoRule = pick.kind === 'main' || pick.kind === 'fr' ? line.automated : undefined;
  const ttyNote = !o.tty || !line.number || pick.kind === 'tty' ? undefined : shared ? { with: shared } : { none: true as const };
  return { line, pick, status: statusOf(pick.hours, v.now, v.tz, v.holidays), autoRule, auto: statusOf(autoRule, v.now, v.tz, v.holidays), ...(ttyNote ? { ttyNote } : {}), ...(abroadPage ? { abroadPage } : {}) };
}

/** Does this row draw a day bar (a phone number with published hours)? */
const hasBar = (x: LineView) => !!x.pick.hours && !!x.line.number;

/** The "Agents" legend goes on the first row that actually draws a day bar (every bar has the same ticks and "now" marker). */
export const legendLine = (views: LineView[]) => views.find(hasBar)?.line.id;

const sameRule = (a?: Hours, b?: Hours) => (!a && !b) || sameHours(a, b);

/**
 * A row whose agents and automated line keep exactly the hours of an earlier row on screen (the CRA's two personal
 * lines): that earlier line. The later row says "Same hours as …" instead of repeating the hours and the day bar.
 */
export function sameHoursAs(views: LineView[], i: number): LineId | undefined {
  const x = views[i];
  if (!hasBar(x)) return undefined;
  return views.slice(0, i).find((y) => hasBar(y) && sameRule(x.pick.hours, y.pick.hours) && sameRule(x.autoRule, y.autoRule))?.line.id;
}

/** The "Automated line" legend goes on the first bar that actually draws an automated window today. */
export const autoLegendLine = (views: LineView[], v: Viewer) =>
  views.find((x) => hasBar(x) && daySegments(x.autoRule, v.now, v.tz, v.holidays).length > 0)?.line.id;

/**
 * What the header says about the lines on screen. One phone line: its own status. Two or more: "2 of 3 open"
 * (`closing` when every open line closes within the half hour), or "All closed · first opens at 5 a.m.". A lone phone line beside an online-only row
 * (passports) is still `single`, and the caller hides the badge so the header never seems to say the
 * online-only service is "open".
 */
export function openSummary(views: LineView[]) {
  const phones = views.filter((x) => x.line.number);
  const open = phones.filter((x) => isOpen(x.status)).length;
  return {
    total: phones.length,
    open,
    /** Several phone lines and none is answering: the header says so, with the first reopening time. */
    allClosed: phones.length > 1 && open === 0,
    single: phones.length === 1 ? phones[0] : null,
    closing: open > 0 && phones.every((x) => !isOpen(x.status) || x.status?.state === 'closing'),
  };
}

/** When the first closed line reopens. */
export function nextOpening(statuses: (Status | null)[]) {
  const times = statuses.flatMap((s) => (s?.state === 'closed' && s.opensAt ? [s.opensAt] : []));
  return times.length ? Math.min(...times) : undefined;
}

/** The banner above the list: a federal holiday today, or a weekend with Service Canada lines on screen. */
export function dayNotice(ids: LineId[], v: Pick<Viewer, 'now' | 'tz' | 'holidays'>): { kind: 'holiday'; holiday: Holiday } | { kind: 'weekend' } | null {
  const holiday = holidayToday(v.now, v.tz, v.holidays);
  if (holiday) return { kind: 'holiday', holiday };
  const weekend = wallClock(v.now, v.tz).weekday >= 6;
  return weekend && ids.some((id) => LINES[id].org === 'esdc') ? { kind: 'weekend' } : null;
}

/** The official page behind "All contact options": the one line in focus, the topic's department, or canada.ca. */
export function handoffPage(ids: LineId[], topic: Topic | 'all', focus: LineId | null): Bi {
  if (focus) return LINES[focus].page;
  if (topic === 'all' || topic === 'general') return URLS.contactGc;
  if (topic === 'service-canada') return URLS.esdc;
  return ids[0] ? LINES[ids[0]].page : URLS.contactGc;
}

export function sameHours(a?: Hours, b?: Hours) {
  return !!a && !!b && a.open === b.open && a.close === b.close && a.zone === b.zone && a.closedOnHolidays === b.closedOnHolidays && a.days.join() === b.days.join();
}
