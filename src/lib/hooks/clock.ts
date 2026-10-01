/**
 * Hydration-safe "today" and "now". The server's value is used for server rendering and hydration, then
 * the reader's own clock takes over (no mismatch, no `Date.now()` during render).
 *
 *   const today = useToday(output.today);                            // 'YYYY-MM-DD' in the reader's zone
 *   const today = useToday(output.today, { maxDriftDays: 1 });       // a replayed answer keeps its date
 *   const today = useToday(output.today, { timeZone: 'America/Toronto' });
 *   const now = useNow(output.asOf, { tickMs: 30_000 });             // epoch ms, floored to the tick
 *   const frozen = useNow(fixture.asOf, { pinned: true });           // lab fixtures: always the server value
 *
 * - `useToday` rolls over at midnight (checked every minute and whenever the tab becomes visible).
 * - `maxDriftDays`: only follow the device when it's within this many days of the server's date (the server
 *   plans in the capital region's time, so late at night in Vancouver its date can be a day ahead; an old
 *   answer restored from history keeps the date it was computed for).
 * - `useNow` returns a number that only changes once per tick, so it's safe as a memo dependency.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { diffDays } from '@/lib/dates/business-days';
import { dateFormat } from '@/lib/i18n/format';

type Subscribe = (cb: () => void) => () => void;
const tickers = new Map<number, Subscribe>();

/**
 * A subscription that fires every `ms` (and when the tab becomes visible again). One interval per period is
 * shared by every hook using it, and the same function is returned for the same period (stable for
 * `useSyncExternalStore`).
 */
function tickEvery(ms: number): Subscribe {
  let subscribe = tickers.get(ms);
  if (subscribe) return subscribe;
  const listeners = new Set<() => void>();
  let stop = () => {};
  subscribe = (cb) => {
    if (!listeners.size) {
      const fire = () => listeners.forEach((l) => l());
      const onVisible = () => document.visibilityState === 'visible' && fire();
      const id = window.setInterval(fire, ms);
      document.addEventListener('visibilitychange', onVisible);
      stop = () => {
        window.clearInterval(id);
        document.removeEventListener('visibilitychange', onVisible);
      };
    }
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
      if (!listeners.size) stop();
    };
  };
  tickers.set(ms, subscribe);
  return subscribe;
}

const MINUTE = 60_000;
const subscribeMinute = tickEvery(MINUTE);
const subscribeNever = () => () => {};

/** Today as `YYYY-MM-DD` on this device (or in `timeZone`; an unknown zone falls back to the device's). */
export function localTodayISO(timeZone?: string): string {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  try {
    return dateFormat('en-CA', { ...opts, timeZone }).format(new Date());
  } catch {
    return dateFormat('en-CA', opts).format(new Date());
  }
}

export function useToday(serverToday: string, { timeZone, pinned, maxDriftDays }: { timeZone?: string; pinned?: boolean; maxDriftDays?: number } = {}): string {
  const read = useCallback(() => (pinned ? serverToday : localTodayISO(timeZone)), [pinned, serverToday, timeZone]);
  const today = useSyncExternalStore(pinned ? subscribeNever : subscribeMinute, read, () => serverToday);
  return maxDriftDays != null && Math.abs(diffDays(serverToday, today)) > maxDriftDays ? serverToday : today;
}

export function useNow(serverNow: string | number, { tickMs = MINUTE, pinned }: { tickMs?: number; pinned?: boolean } = {}): number {
  const server = typeof serverNow === 'number' ? serverNow : Date.parse(serverNow);
  const read = useCallback(() => (pinned ? server : Math.floor(Date.now() / tickMs) * tickMs), [pinned, server, tickMs]);
  return useSyncExternalStore(pinned ? subscribeNever : tickEvery(tickMs), read, () => server);
}
