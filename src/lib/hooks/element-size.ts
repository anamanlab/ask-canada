/**
 * Live content-box size of an element (ResizeObserver on your own node; no DOM queries).
 *
 *   const [ref, { w, h }] = useElementSize<HTMLDivElement>({ w: 600, h: 320 });
 *   <div ref={ref}>…</div>
 *
 * `fallback` is the size used for server rendering and before the first measurement (default 0×0).
 * Sizes are rounded to whole pixels, so sub-pixel jitter doesn't re-render.
 */
import { useCallback, useState, type RefCallback } from 'react';

export type Size = { w: number; h: number };

export function useElementSize<T extends HTMLElement>(fallback: Size = { w: 0, h: 0 }): [ref: RefCallback<T>, size: Size] {
  const [size, setSize] = useState(fallback);
  const ref = useCallback((el: T | null) => {
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}
