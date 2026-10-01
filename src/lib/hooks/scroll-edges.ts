/**
 * Whether a scroller has more content hidden before / after what's visible, for edge fades and
 * "scroll for more" arrows. Direction-aware (in RTL a horizontal row starts on the right).
 *
 *   const { ref: railRef, end, maskStyle, scrollBy } = useScrollEdges<HTMLDivElement>();   // horizontal chip rail
 *   <div ref={railRef} style={maskStyle} className="overflow-x-auto">…</div>
 *   {end ? <button onClick={() => scrollBy(1)}>…</button> : null}
 *
 *   const { ref, end: more } = useScrollEdges<HTMLDivElement>({ axis: 'y', threshold: 4 });  // "more below"
 *
 * Destructure the result: the React Compiler lint treats `x.ref` on a hook result as a ref read during render.
 *
 * Returns `{ ref, start, end, maskStyle, scrollBy }`:
 * - `start` / `end`: content is hidden before / after the visible part (by more than `threshold` px, default 1).
 * - `maskStyle`: a CSS mask that fades whichever edge still has content (undefined when nothing is hidden).
 * - `scrollBy(1 | -1)`: scroll about one view forward / back (smooth unless reduced motion is on).
 * Updates on scroll and on resize of the scroller or its children; re-renders only when an edge flips.
 */
import { useCallback, useRef, useState, type CSSProperties, type RefCallback } from 'react';
import { dirOf } from './dir';
import { prefersReducedMotion } from './media';

type Edges = { start: boolean; end: boolean; rtl: boolean };

export function useScrollEdges<T extends HTMLElement>({ axis = 'x', threshold = 1 }: { axis?: 'x' | 'y'; threshold?: number } = {}) {
  const [edges, setEdges] = useState<Edges>({ start: false, end: false, rtl: false });
  const node = useRef<T | null>(null);

  const ref: RefCallback<T> = useCallback(
    (el: T | null) => {
      node.current = el;
      if (!el) return;
      const update = () => {
        const rtl = axis === 'x' && dirOf(el) === 'rtl';
        const max = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
        const pos = Math.abs(axis === 'x' ? el.scrollLeft : el.scrollTop); // RTL scrollLeft runs 0 → -max
        const next = { start: pos > threshold, end: max - pos > threshold, rtl };
        setEdges((e) => (e.start === next.start && e.end === next.end && e.rtl === next.rtl ? e : next));
      };
      const ro = new ResizeObserver(update); // also fires once on observe: the initial edges
      ro.observe(el);
      for (const child of el.children) ro.observe(child);
      el.addEventListener('scroll', update, { passive: true });
      return () => {
        ro.disconnect();
        el.removeEventListener('scroll', update);
      };
    },
    [axis, threshold],
  );

  const scrollBy = useCallback(
    (dir: 1 | -1) => {
      const el = node.current;
      if (!el) return;
      const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
      if (axis === 'y') el.scrollBy({ top: dir * el.clientHeight * 0.8, behavior });
      else el.scrollBy({ left: dir * el.clientWidth * 0.8 * (dirOf(el) === 'rtl' ? -1 : 1), behavior });
    },
    [axis],
  );

  let maskStyle: CSSProperties | undefined;
  if (edges.start || edges.end) {
    const stops = `${edges.start ? 'transparent 0, black 28px' : 'black 0'}, ${edges.end ? 'black calc(100% - 40px), transparent 100%' : 'black 100%'}`;
    const to = axis === 'y' ? 'bottom' : edges.rtl ? 'left' : 'right';
    const mask = `linear-gradient(to ${to}, ${stops})`;
    maskStyle = { maskImage: mask, WebkitMaskImage: mask };
  }

  return { ref, start: edges.start, end: edges.end, maskStyle, scrollBy };
}
