/**
 * Roving tabindex for a group of controls (radio groups, tab lists, chip rails, option grids): one Tab stop
 * for the whole group, arrow keys move between items, Home/End jump to the ends. Direction-aware per
 * subtree (see `dirOf`), and disabled items are skipped.
 *
 *   const roving = useRovingFocus({ count: options.length, index: selected, onMove: (i) => pick(options[i]) });
 *   options.map((o, i) => <button key={o.id} {...roving.itemProps(i)} …/>)
 *
 * Options:
 * - `count`, `index`: number of items and the current one (the Tab stop; -1 = none, the first enabled item).
 * - `onMove(i)`: called with the item the keyboard moved to; focus follows automatically.
 * - `orientation`: 'horizontal' (←/→), 'vertical' (↑/↓) or 'both' (default 'horizontal').
 * - `loop`: wrap around at the ends (default true).
 * - `isDisabled(i)`: items to skip.
 * Returns `itemProps(i)` (ref, tabIndex, onKeyDown) and `getItem(i)` for measuring (e.g. a sliding thumb).
 */
import { useCallback, useRef, type KeyboardEvent } from 'react';
import { dirOf } from './dir';

type Options = {
  count: number;
  index: number;
  onMove: (i: number) => void;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  isDisabled?: (i: number) => boolean;
};

export function useRovingFocus({ count, index, onMove, orientation = 'horizontal', loop = true, isDisabled }: Options) {
  const items = useRef<(HTMLElement | null)[]>([]);
  const enabled = (i: number) => !isDisabled?.(i);
  const first = Array.from({ length: count }, (_, i) => i).find(enabled) ?? -1;
  const stop = index >= 0 && index < count && enabled(index) ? index : first;

  /** The next enabled item from `from`, stepping by `step` (±1). */
  const seek = (from: number, step: 1 | -1) => {
    for (let n = 1; n <= count; n++) {
      let i = from + step * n;
      if (loop) i = (i + count) % count;
      else if (i < 0 || i >= count) return from;
      if (enabled(i)) return i;
    }
    return from;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const rtl = dirOf(e.currentTarget) === 'rtl';
    const h = orientation !== 'vertical';
    const v = orientation !== 'horizontal';
    let next: number | null = null;
    if (h && e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) next = seek(stop, 1);
    else if (h && e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) next = seek(stop, -1);
    else if (v && e.key === 'ArrowDown') next = seek(stop, 1);
    else if (v && e.key === 'ArrowUp') next = seek(stop, -1);
    else if (e.key === 'Home') next = first;
    else if (e.key === 'End') next = seek(count, -1);
    if (next == null || next < 0) return;
    e.preventDefault();
    if (next !== stop) onMove(next);
    items.current[next]?.focus();
  };

  const getItem = useCallback((i: number) => items.current[i] ?? null, []);

  return {
    itemProps: (i: number) => ({
      ref: (el: HTMLElement | null) => {
        items.current[i] = el;
      },
      tabIndex: i === stop ? 0 : -1,
      onKeyDown,
    }),
    getItem,
  };
}
