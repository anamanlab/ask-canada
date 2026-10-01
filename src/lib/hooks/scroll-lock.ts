/**
 * Page scroll lock shared by every modal surface. Counted, so a sheet opened from another sheet (Menu →
 * Language) doesn't unlock the page when the inner one closes while the outer one is still open.
 *
 *   const release = lockScroll();   // …later: release() (idempotent)
 *   useScrollLock(open);            // declarative form for custom overlays
 *   isScrollLocked()                // "is a modal open?" (e.g. to let Esc belong to the dialog)
 */
import { useEffect } from 'react';

let locks = 0;
let previous = '';

export function lockScroll(): () => void {
  if (locks++ === 0) {
    const root = document.documentElement;
    previous = root.style.overflow;
    root.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) document.documentElement.style.overflow = previous;
  };
}

export const isScrollLocked = () => locks > 0;

export function useScrollLock(active: boolean) {
  useEffect(() => (active ? lockScroll() : undefined), [active]);
}
