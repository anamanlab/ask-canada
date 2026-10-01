/**
 * Browser media state as `useSyncExternalStore` subscriptions (no extra render, no tearing, SSR-safe).
 *
 *   const wide = useMediaQuery('(min-width: 900px)');
 *   const theme = useResolvedTheme();            // 'light' | 'dark' (what's actually on screen)
 *   const pref = useThemePref();                 // 'system' | 'light' | 'dark' (what the person chose)
 *   if (prefersReducedMotion()) …                // imperative checks inside event handlers
 *   if (isFinePointer()) …
 *   if (prefersDark()) …                         // the system colour scheme, ignoring the person's override
 */
import { useSyncExternalStore } from 'react';

const mqSubscribers = new Map<string, (cb: () => void) => () => void>();
function subscribeMedia(query: string) {
  let sub = mqSubscribers.get(query);
  if (!sub) {
    sub = (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    };
    mqSubscribers.set(query, sub);
  }
  return sub;
}

/** Live `matchMedia(query).matches`. `serverValue` is used during SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeMedia(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Appearance preference: follow the system (default), or force light / dark. */
export type ThemePref = 'system' | 'light' | 'dark';

/** `<html data-theme-pref>` (the choice) and `<html data-theme>` (the result) are the theme store. */
function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-pref', 'data-theme'] });
  return () => mo.disconnect();
}

function readThemePref(): ThemePref {
  const v = document.documentElement.dataset.themePref;
  return v === 'light' || v === 'dark' ? v : 'system';
}
const serverThemePref = (): ThemePref => 'system';

/** The appearance preference the person chose (`setThemePref` in components/site/theme writes it). */
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribeTheme, readThemePref, serverThemePref);
}

const readTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/** The theme actually applied to `<html data-theme>` (system preference already resolved). */
export function useResolvedTheme(): 'light' | 'dark' {
  return useSyncExternalStore(subscribeTheme, readTheme, () => 'light');
}

/** Imperative reduced-motion check for event handlers (scroll behaviour, view transitions). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Imperative check for a mouse or trackpad as the primary pointer (e.g. where focus should land: no on-screen keyboard to raise). */
export function isFinePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
}

/** Imperative check of the system colour scheme (not the person's override: that is `useThemePref`). */
export function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
