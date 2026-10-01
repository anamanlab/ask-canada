/**
 * A sliding thumb for single-choice groups (segmented controls, tab lists): the group's `::before` is placed
 * over the chosen item from its measured box and slides with a CSS transition, so no layout-animation library
 * and no extra child are needed (layouts that target `> button:nth-child(…)` keep working).
 *
 *   const { itemProps, getItem } = useRovingFocus({ … });
 *   const group = useSlidingThumb<HTMLDivElement>(index, getItem, options.length);
 *   <div ref={group} className="relative before:absolute before:left-0 before:top-0 before:hidden data-[thumb]:before:block
 *     before:w-[var(--thumb-w)] before:h-[var(--thumb-h)] before:[transform:translate(var(--thumb-x),var(--thumb-y))] …">
 *
 * The chosen item's box is written to the group as `--thumb-x`, `--thumb-y`, `--thumb-w`, `--thumb-h` (px), and
 * the group carries `data-thumb` once measured. Until then (server HTML) the chosen item should paint its own
 * indicator. Written straight to the DOM (it's presentational) and re-measured when the group or an item
 * resizes (container queries can reflow a row into a grid).
 */
import { useLayoutEffect, useRef } from 'react';

export function useSlidingThumb<E extends HTMLElement>(index: number, getItem: (i: number) => HTMLElement | null, count: number) {
  const group = useRef<E>(null);
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    const place = () => {
      const item = getItem(index);
      if (!item) {
        delete g.dataset.thumb;
        return;
      }
      g.style.setProperty('--thumb-x', `${item.offsetLeft}px`);
      g.style.setProperty('--thumb-y', `${item.offsetTop}px`);
      g.style.setProperty('--thumb-w', `${item.offsetWidth}px`);
      g.style.setProperty('--thumb-h', `${item.offsetHeight}px`);
      g.dataset.thumb = '';
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(g);
    for (const item of g.children) ro.observe(item);
    return () => ro.disconnect();
  }, [index, getItem, count]);
  return group;
}
