/**
 * Whether the page has scrolled past `px` from the top (for sticky chrome that changes once content slides
 * under it). A `useSyncExternalStore` subscription to the window's scroll: re-renders only when the answer flips.
 *
 *   const scrolled = useWindowScrolled(8);
 *   const scrolled = useWindowScrolled(8, variant === 'chat');   // `active: false` → always false, no listener
 *
 * False during SSR and hydration.
 */
import { useSyncExternalStore } from 'react';

function subscribeScroll(cb: () => void) {
  window.addEventListener('scroll', cb, { passive: true });
  return () => window.removeEventListener('scroll', cb);
}
const subscribeNothing = () => () => {};
const notScrolled = () => false;

export function useWindowScrolled(px = 0, active = true): boolean {
  return useSyncExternalStore(active ? subscribeScroll : subscribeNothing, active ? () => window.scrollY > px : notScrolled, notScrolled);
}
