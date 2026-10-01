/**
 * LIVE Bank of Canada rates (Valet API), fetched on the server by the moneyMortgageStressTest tool:
 *   V80691335  5-year conventional mortgage rate (chartered banks' posted rate, weekly)
 *   V39079     target for the overnight rate (policy rate, daily)
 *   V80691311  prime rate (weekly)
 * Each series is cached for 30 minutes with a 4-second timeout and validated at the boundary; any failure
 * yields `live: false` and the widget links the Bank of Canada rates page instead.
 */
import 'server-only';
import { z } from 'zod';
import { fetchJson } from '@/lib/server/fetch-json';
import { NO_RATES, type LiveRates, type Rate } from './rates';

const SERIES = { posted5y: 'V80691335', policy: 'V39079', prime: 'V80691311' } as const;

/** One observation: `{ d: '2026-09-23', V80691335: { v: '6.09' } }`. Only the date and the asked series are read. */
const Feed = z.object({ observations: z.array(z.looseObject({ d: z.iso.date() })).min(1) });
const Cell = z.object({ v: z.coerce.number().gt(0).max(30) });

async function series(id: string, signal?: AbortSignal): Promise<Rate | null> {
  const res = await fetchJson(`https://www.bankofcanada.ca/valet/observations/${id}/json?recent=1`, Feed, { revalidate: 1800, timeout: 4000, signal });
  if (!res.ok) return null;
  const last = res.data.observations[res.data.observations.length - 1];
  const cell = Cell.safeParse(last[id]);
  return cell.success ? { value: cell.data.v, date: last.d } : null;
}

export async function fetchRates(signal?: AbortSignal): Promise<LiveRates> {
  const [posted5y, policy, prime] = await Promise.all([series(SERIES.posted5y, signal), series(SERIES.policy, signal), series(SERIES.prime, signal)]);
  if (!posted5y && !policy && !prime) return NO_RATES;
  return { live: true, posted5y, policy, prime };
}
