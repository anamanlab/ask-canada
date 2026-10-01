/**
 * Electric Vehicle Affordability Program (EVAP): the incentive calculator and the vehicle-list search, pure and
 * isomorphic (the renderer recalculates with them on the device). Page parsers: ev-parse.ts; output: build.ts.
 */
import type { ToolSource } from '@/lib/widgets/types';
import { EVAP, type Lang } from './constants';

export type Fuel = 'BEV' | 'PHEV' | 'FCEV';
/** [model year, make, model, trim, fuel, made in Canada (1/0)] — compact for the wire. */
export type EvRow = [number, string, string, string, Fuel, 0 | 1];

export type EvInput = {
  query?: string | null;
  fuel?: Fuel | null;
  price?: number | null;
  canadianMade?: boolean | null;
  leaseMonths?: number | null;
  lang?: Lang;
};

export type EvOutput = {
  version: 1;
  lang: Lang;
  today: string;
  query: string | null;
  fuel: Fuel;
  price: number | null;
  canadianMade: boolean;
  /** 0 = buying; otherwise the lease term in months. */
  leaseMonths: number;
  /** The whole official list (for on-device search); `matches` are row indexes for the query. */
  vehicles: EvRow[];
  matches: number[];
  listLive: boolean;
  funds: { remaining: number; asOf: string; total: number; live: boolean };
  levels: typeof EVAP.levels;
  links: { program: string; overview: string; list: string; qa: string };
  sources: ToolSource[];
};

/** Round half to even (reproduces Transport Canada's lease table: 5000 ÷ 48 × 39 = 4062.5 → $4,062). */
const roundHalfEven = (n: number) => {
  const f = Math.floor(n);
  const d = n - f;
  if (Math.abs(d - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(n);
};

export const levelFor = (year: number) => EVAP.levels.find((l) => l.year === year) ?? (year < 2026 ? EVAP.levels[0] : EVAP.levels[EVAP.levels.length - 1]);

type EvReason = 'price' | 'lease-short' | 'not-started' | 'ended';
type EvResult = { eligible: boolean; amount: number; full: number; reasons: EvReason[] };

/** Incentive for a transaction assessed on `date` (ISO). leaseMonths 0 = purchase. */
export function evapIncentive({ fuel, price, canadianMade, leaseMonths, date }: { fuel: Fuel; price: number | null; canadianMade: boolean; leaseMonths: number; date: string }): EvResult {
  const lvl = levelFor(Number(date.slice(0, 4)));
  const full = fuel === 'PHEV' ? lvl.phev : lvl.zev;
  const reasons: EvReason[] = [];
  if (date < EVAP.start) reasons.push('not-started');
  if (date > EVAP.end) reasons.push('ended');
  if (!canadianMade && price != null && price > EVAP.cap) reasons.push('price');
  if (leaseMonths > 0 && leaseMonths < EVAP.minLease) reasons.push('lease-short');
  const eligible = reasons.length === 0;
  const amount = !eligible ? 0 : leaseMonths === 0 || leaseMonths >= EVAP.fullLease ? full : roundHalfEven((full / EVAP.fullLease) * leaseMonths);
  return { eligible, amount, full, reasons };
}

/* ─────────────── Search ─────────────── */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Row indexes whose make/model/trim/year contain every word of the query. */
export function searchEv(rows: EvRow[], query: string | null | undefined): number[] {
  const q = norm(query ?? '');
  if (!q) return [];
  const words = q.split(' ').filter((w) => w.length > 0 && !['ev', 'electric', 'electrique', 'the', 'le', 'la', 'a'].includes(w));
  if (!words.length) return [];
  const out: number[] = [];
  rows.forEach((r, i) => {
    const hay = ` ${norm(`${r[0]} ${r[1]} ${r[2]} ${r[3]} ${r[4]}`)} `;
    const hayJoined = hay.replace(/ /g, '');
    if (words.every((w) => hay.includes(` ${w}`) || hayJoined.includes(w))) out.push(i);
  });
  return out;
}

/** Group rows by make + model (newest model year first). */
export function groupModels(rows: EvRow[], idx?: number[]) {
  const map = new Map<string, { make: string; model: string; fuel: Fuel; ca: boolean; years: number[]; trims: string[] }>();
  for (const i of idx ?? rows.map((_, k) => k)) {
    const [year, make, model, trim, fuel, ca] = rows[i];
    const key = `${make}|${model.toLowerCase()}`;
    const g = map.get(key) ?? { make, model, fuel, ca: !!ca, years: [], trims: [] };
    if (!g.years.includes(year)) g.years.push(year);
    if (trim && !g.trims.includes(trim)) g.trims.push(trim);
    g.ca = g.ca || !!ca;
    map.set(key, g);
  }
  return [...map.values()].map((g) => ({ ...g, years: g.years.sort((a, b) => b - a) }));
}
