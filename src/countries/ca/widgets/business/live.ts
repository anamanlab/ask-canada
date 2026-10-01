/**
 * LIVE Bank of Canada daily exchange rates (Valet API), fetched on the server by the businessTrade tool.
 * Cached for 30 minutes and validated at the boundary; any failure returns null so the widget falls back to
 * Canadian-dollar entry and links the official rates page.
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import type { FxRates } from './build';
import { CURRENCIES, type Currency } from './data';

const VALET = `https://www.bankofcanada.ca/valet/observations/${CURRENCIES.map((c) => `FX${c}CAD`).join(',')}/json?recent=1`;

/**
 * One row per day: `d` is the date and every series is `{ v: "1.4188" }`. Series are checked one by one, so a
 * currency that is missing or malformed on a given day drops out without losing the others.
 */
const Valet = z.object({ observations: z.array(z.looseObject({ d: z.iso.date() })).min(1) });
const Cell = z.object({ v: z.coerce.number().positive() });

export async function fetchFxRates(signal?: AbortSignal): Promise<FxRates | null> {
  const res = await fetchJson(VALET, Valet, { revalidate: 1800, timeout: 4000, signal });
  if (!res.ok) return null;
  const obs = res.data.observations[res.data.observations.length - 1];
  const rates: Partial<Record<Currency, number>> = {};
  for (const c of CURRENCIES) {
    const cell = Cell.safeParse(obs[`FX${c}CAD`]);
    if (cell.success && Number.isFinite(cell.data.v)) rates[c] = cell.data.v;
  }
  return Object.keys(rates).length ? { date: obs.d, rates } : null;
}
