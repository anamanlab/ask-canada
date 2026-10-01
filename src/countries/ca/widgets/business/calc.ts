/**
 * Pure business calculations (isomorphic: the tools run them on the server, the widgets re-run them on
 * every tap). Rules and numbers come from data.ts, which cites the official pages.
 */
import { addMonths, diffDays, lastDayOfMonth } from '@/lib/dates/business-days';
import { EXPORT, GST, IMPORT, PROVINCE, type AgencyKey, type Province } from './data';

/* ------------------------------------------------------------------ GST/HST small supplier ---------- */

export type OrgType = 'business' | 'charity' | 'psb';
export type QuarterSlot = { start: string; end: string; current: boolean };
export type Quarter = QuarterSlot & { amount: number };
export type GstStatus = 'small' | 'over-quarter' | 'over-four' | 'must';

/** The four most recent calendar quarters (oldest first); the last one is the quarter `today` is in. */
export function lastFourQuarters(today: string): QuarterSlot[] {
  const [y, m] = today.split('-').map(Number);
  const qStartMonth = Math.floor((m - 1) / 3) * 3 + 1;
  const current = `${y}-${String(qStartMonth).padStart(2, '0')}-01`;
  return [-9, -6, -3, 0].map((offset) => {
    const start = addMonths(current, offset);
    return { start, end: lastDayOfMonth(addMonths(start, 2).slice(0, 7)), current: offset === 0 };
  });
}

/**
 * A yearly figure laid over the four quarters when that is all we were given: evenly over the three that have
 * ended, and the current quarter only for the days already completed. On the first day of a quarter the
 * current one stays empty, instead of showing three months of sales in a quarter that is a day old.
 */
export function spreadYear(annual: number, today: string): number[] {
  const year = Math.max(0, Math.round(annual));
  const current = lastFourQuarters(today)[3];
  const elapsed = diffDays(current.start, today) / (diffDays(current.start, current.end) + 1);
  const each = Math.round(year / (3 + elapsed));
  const now = elapsed === 0 ? 0 : Math.max(0, year - 3 * each);
  // The dollar left over by rounding goes to the most recent quarter that has ended.
  return [each, each, year - 2 * each - now, now];
}

/** Days completed in the current quarter on `today` (0 on its first day). */
export const daysIntoQuarter = (today: string) => diffDays(lastFourQuarters(today)[3].start, today);

export const thresholdFor = (org: OrgType) => (org === 'business' ? GST.threshold : GST.publicServiceThreshold);

export type GstCheck = {
  org: OrgType;
  threshold: number;
  quarters: Quarter[];
  total: number;
  status: GstStatus;
  /** Index of the quarter in which the threshold was exceeded (single quarter or running total). */
  crossedIndex: number | null;
  /** Over four quarters: the last day as a small supplier (end of the month after the crossing quarter). */
  smallUntil: string | null;
  /** How much more can be sold over these four quarters before registering is required. */
  headroom: number;
};

/**
 * CRA small supplier test for the latest four calendar quarters.
 * - Over the threshold in ONE quarter → register now (on the supply that put you over).
 * - Over it across the four quarters (not in one) → small supplier until the end of the month following
 *   the quarter in which the running total went over.
 * - Taxi and commercial rideshare drivers must register whatever they earn.
 * "Exceed" is strict: exactly $30,000 is still a small supplier.
 * `today` fixes the four quarters (the day the question was asked: the figures belong to those quarters);
 * `now` is the reader's date, which may be later when an answer is reopened: it only decides which quarter, if
 * any, is still running.
 */
export function gstCheck({ amounts, org = 'business', rideshare = false, today, now = today }: { amounts: number[]; org?: OrgType; rideshare?: boolean; today: string; now?: string }): GstCheck {
  const threshold = thresholdFor(org);
  const slots = lastFourQuarters(today).map((s) => ({ ...s, current: s.start <= now && now <= s.end }));
  const clean = slots.map((_, i) => Math.max(0, Math.round(Number(amounts[i] ?? 0) || 0)));
  const quarters = slots.map((s, i) => ({ ...s, amount: clean[i] }));
  const total = clean.reduce((a, b) => a + b, 0);

  const single = clean.findIndex((a) => a > threshold);
  let running = 0;
  let cumulative = -1;
  for (let i = 0; i < clean.length; i++) {
    running += clean[i];
    if (running > threshold) {
      cumulative = i;
      break;
    }
  }

  let status: GstStatus = 'small';
  let crossedIndex: number | null = null;
  let smallUntil: string | null = null;
  if (single >= 0 && (cumulative < 0 || single <= cumulative)) {
    status = 'over-quarter';
    crossedIndex = single;
  } else if (cumulative >= 0) {
    status = 'over-four';
    crossedIndex = cumulative;
    smallUntil = lastDayOfMonth(addMonths(quarters[cumulative].end.slice(0, 7) + '-01', 1).slice(0, 7));
  }
  if (rideshare && org === 'business') status = 'must';

  return { org, threshold, quarters, total, status, crossedIndex, smallUntil, headroom: Math.max(0, threshold - total) };
}

/* ------------------------------------------------------------------ CRA program accounts ------------ */

export type AccountCode = 'RT' | 'RP' | 'RC' | 'RM';
export type AccountNeed = 'required' | 'optional' | 'auto';
export type Account = { code: AccountCode; need: AccountNeed };
export type Activities = { employees?: boolean; incorporated?: boolean; trade?: boolean };

export function accountsFor(status: GstStatus, a: Activities): Account[] {
  const out: Account[] = [{ code: 'RT', need: status === 'small' ? 'optional' : 'required' }];
  if (a.employees) out.push({ code: 'RP', need: 'required' });
  if (a.incorporated) out.push({ code: 'RC', need: 'auto' });
  if (a.trade) out.push({ code: 'RM', need: 'required' });
  return out;
}

/** A BN is needed when any program account is needed (or the business is incorporated). */
export const needsBn = (accounts: Account[], incorporated?: boolean) => Boolean(incorporated) || accounts.some((a) => a.need !== 'optional');

export function taxRateFor(p: Province) {
  const f = PROVINCE[p];
  return { rate: f.rate, kind: f.kind, pst: f.pst ?? null, quebec: p === 'QC', bnWithProvince: f.bnWithProvince };
}

/* ------------------------------------------------------------------ Business structure ------------- */

export type Owners = 'solo' | 'partners';
export type Priority = 'protect' | 'simple' | 'invest' | 'name';
export type StructureKey = 'sole' | 'partnership' | 'corporation';
export const STRUCTURES: StructureKey[] = ['sole', 'partnership', 'corporation'];
export const PRIORITIES: Priority[] = ['protect', 'simple', 'invest', 'name'];

export type StructureFit = {
  best: StructureKey;
  /** Suggest federal incorporation (name protected across Canada) rather than provincial. */
  federal: boolean;
  scores: Record<StructureKey, number>;
  unavailable: StructureKey[];
};

/**
 * A transparent rule of thumb, not advice: owners decide which unincorporated form is possible; liability
 * protection, raising money and a Canada-wide name all point to a corporation; simplicity points away.
 */
export function recommendStructure({ owners = 'solo', priorities = [] }: { owners?: Owners; priorities?: Priority[] }): StructureFit {
  const has = (p: Priority) => priorities.includes(p);
  const s: Record<StructureKey, number> = { sole: 60, partnership: 60, corporation: 50 };
  const add = (d: Record<StructureKey, number>) => STRUCTURES.forEach((k) => (s[k] += d[k]));
  if (has('simple')) add({ sole: 30, partnership: 25, corporation: -10 });
  if (has('protect')) add({ sole: -25, partnership: -25, corporation: 35 });
  if (has('invest')) add({ sole: -15, partnership: -15, corporation: 35 });
  if (has('name')) add({ sole: 0, partnership: 0, corporation: 25 });
  const unavailable: StructureKey[] = owners === 'solo' ? ['partnership'] : ['sole'];
  const scores = Object.fromEntries(
    STRUCTURES.map((k) => [k, unavailable.includes(k) ? 0 : Math.max(8, Math.min(97, s[k]))]),
  ) as Record<StructureKey, number>;
  const order: StructureKey[] = owners === 'solo' ? ['sole', 'corporation'] : ['partnership', 'corporation'];
  const best = order.reduce((a, b) => (scores[b] > scores[a] ? b : a));
  return { best, federal: best === 'corporation' && (has('name') || has('invest')), scores, unavailable };
}

/* ------------------------------------------------------------------ Funding ------------------------ */

export type Need = 'start' | 'grow' | 'export' | 'innovate' | 'tariffs';
export const NEEDS: Need[] = ['start', 'grow', 'export', 'innovate', 'tariffs'];
export type ProgramKey = 'csbfp' | 'irap' | 'tcs' | 'canadaStrong' | 'canexport' | 'dutiesRelief' | 'drawback';

const PROGRAMS: Record<Need, ProgramKey[]> = {
  start: ['csbfp'],
  grow: ['csbfp', 'irap'],
  export: ['tcs', 'canexport', 'csbfp'],
  innovate: ['irap', 'csbfp'],
  tariffs: ['canadaStrong', 'dutiesRelief', 'drawback'],
};

export function fundingFor({ province, need = 'start' }: { province?: Province | null; need?: Need }): { agencies: AgencyKey[]; programs: ProgramKey[] } {
  return { agencies: province ? PROVINCE[province].agencies : [], programs: PROGRAMS[need] };
}

/* ------------------------------------------------------------------ Import / export ---------------- */

export type Destination = 'us' | 'other';
export type ExportCheck = { declaration: boolean; permit: boolean; reason: 'restricted' | 'us' | 'under' | 'over' | 'unknown' };

/** CBSA export reporting table (Exporters' guide to reporting). */
export function exportCheck({ destination = 'other', restricted = false, value = 0 }: { destination?: Destination; restricted?: boolean; value?: number }): ExportCheck {
  if (restricted) return { declaration: destination !== 'us', permit: true, reason: 'restricted' };
  if (destination === 'us') return { declaration: false, permit: false, reason: 'us' };
  // No value yet: the answer depends on it, so don't guess.
  if (!value) return { declaration: false, permit: false, reason: 'unknown' };
  return value >= EXPORT.declarationValue ? { declaration: true, permit: false, reason: 'over' } : { declaration: false, permit: false, reason: 'under' };
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Duty and GST estimate the way the CBSA example does it: invoice × exchange rate = value for duty (CAD);
 * duty = value × duty rate; GST (5%) on value + duty. Rounded to the cent at each step.
 */
export function importEstimate({ amount, rate, dutyRate }: { amount: number; rate: number; dutyRate: number }) {
  const valueCad = cents(Math.max(0, amount) * rate);
  const duty = cents(valueCad * (Math.max(0, dutyRate) / 100));
  const gst = cents((valueCad + duty) * (IMPORT.gstRate / 100));
  return { valueCad, duty, gst, total: cents(duty + gst), landed: cents(valueCad + duty + gst) };
}
