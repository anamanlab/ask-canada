'use client';
/**
 * The viewer's clock for the contact cards: "now" (shared `useNow`, rounded to the minute) and their time
 * zone, plus the time formatters bound to both. Live in the chat; frozen at the output's `asOf` and zone for
 * lab fixtures (`pinned`) and during server rendering.
 */
import { useSyncExternalStore } from 'react';
import { useNow } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import type { Lang } from './data';
import { formatTime, formatWeekday, safeZone } from './hours';

const MINUTE = 60_000;
const never = () => () => {};
const browserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
};

/** The device's IANA time zone (it has no change event); `fallback` on the server, while hydrating and when pinned. */
export function useViewerZone(fallback: string, pinned?: boolean) {
  const zone = useSyncExternalStore(never, pinned ? () => fallback : browserZone, () => fallback);
  return safeZone(zone || fallback);
}

/** "Now" (checked every 20 s, changes once a minute) and the viewer's time zone. */
export function useClock(o: { asOf: string; timeZone: string; pinned?: boolean }) {
  const now = useNow(o.asOf, { tickMs: 20_000, pinned: o.pinned });
  return { now: Math.floor(now / MINUTE) * MINUTE, tz: useViewerZone(o.timeZone, o.pinned) };
}

/** The interface language, as one of the two the directory's data is written in. */
export function useLang(): Lang {
  return useLocale().locale === 'fr' ? 'fr' : 'en';
}

/** Time/weekday formatters in the viewer's locale and zone. */
export function useTimeFmt(tz: string) {
  const { intl } = useLocale();
  return { time: (ms: number) => formatTime(ms, tz, intl), weekday: (ms: number) => formatWeekday(ms, tz, intl), intl };
}
