/** The wage chart's shared scale (pure): one axis for the headline bar, every province and every region. */
import type { WageRow } from './types';

/** How far the scale reaches past a lone row's low and high wage. */
const SOLO = { lo: 0.85, hi: 1.1 };
/** Ticks closer than this (in % of the axis) to either end are dropped: their labels would hang off the chart. */
const EDGE = 4;

export type WageScale = {
  /** Position (0–100) of a wage on the axis. */
  pos: (n: number | null) => number;
  lo: number;
  hi: number;
};

/** Min of the lows to max of the highs. A lone row (national figures only) gets headroom on both sides. */
export function wageScale(rows: (WageRow | undefined)[], solo: boolean): WageScale {
  const pad = solo ? SOLO : { lo: 1, hi: 1 };
  const lo = Math.min(...rows.map((r) => r?.low ?? Infinity)) * pad.lo;
  const hi = Math.max(...rows.map((r) => r?.high ?? 0)) * pad.hi;
  const ok = Number.isFinite(lo) && hi > lo;
  return { lo, hi, pos: (n) => (n == null || !ok ? 0 : ((n - lo) / (hi - lo)) * 100) };
}

/** Round values ("$30, $40, $50" or "$60K, $80K, $100K") between `min` and `max`, about `target` of them. */
export function niceTicks(min: number, max: number, target = 5): { value: number; at: number }[] {
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return [];
  const rough = span / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const ticks: { value: number; at: number }[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    const at = ((value - min) / span) * 100;
    if (at >= EDGE && at <= 100 - EDGE) ticks.push({ value, at });
  }
  return ticks;
}
