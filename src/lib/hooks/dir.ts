/**
 * Writing direction of a subtree, not of the page: an English island (`EnglishFallback`, `dir="ltr"`) inside
 * an Arabic page is LTR, and `?dir=rtl` mirrors everything.
 *
 *   onKeyDown={(e) => { const rtl = dirOf(e.currentTarget) === 'rtl'; … }}   // in handlers (preferred)
 *   const [ref, dir] = useDir<HTMLDivElement>();  <div ref={ref}>…</div>     // when rendering depends on it
 *
 * `useDir` reads the direction when the element mounts and again whenever `<html dir>` changes (a language
 * switch); it is 'ltr' during server rendering.
 */
import { useCallback, useState, type RefCallback } from 'react';

export type Dir = 'ltr' | 'rtl';

export const dirOf = (el: Element): Dir => (getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr');

export function useDir<T extends HTMLElement>(): [ref: RefCallback<T>, dir: Dir] {
  const [dir, setDir] = useState<Dir>('ltr');
  const ref = useCallback((el: T | null) => {
    if (!el) return;
    const read = () => setDir(dirOf(el));
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    return () => mo.disconnect();
  }, []);
  return [ref, dir];
}
