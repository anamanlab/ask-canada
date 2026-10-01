'use client';
/**
 * Pan and zoom for OfficeMap: drag with a pointer, arrow keys to move, + and − to zoom, Ctrl/⌘ + wheel to zoom.
 * The map shows the `fitted` view until the person moves it; `recentre` (or a new `viewKey`: a different set
 * of pins) drops their own view again. Pins stop their own pointer events, so only the bare map drags.
 *
 *   const g = useMapGestures(fitted, viewKey);
 *   <div ref={g.frameRef}> <div tabIndex={0} {...g.surface}> … </div> </div>     // g.view, g.zoomBy, g.recentre
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { zoomView, type View } from './mapLayout';

/** Arrow keys move the map this far (px). */
const KEY_STEP = 80;
/** A press that moves less than this is a click, not a drag. */
const DRAG_SLOP = 3;

export function useMapGestures(fitted: View, viewKey?: string) {
  const [userView, setUserView] = useState<View | null>(null);
  const [seenKey, setSeenKey] = useState(viewKey);
  if (seenKey !== viewKey) {
    setSeenKey(viewKey);
    setUserView(null);
  }
  const view = userView ?? fitted;
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);

  const zoomBy = (dz: number) => {
    const next = zoomView(view, dz);
    if (next !== view) setUserView(next);
  };
  const pan = (dx: number, dy: number) => setUserView({ ...view, cx: view.cx + dx, cy: view.cy + dy });

  // Ctrl/⌘ + wheel zooms the map. React's wheel listeners are passive (preventDefault would be ignored and the
  // page would zoom too), so this one is attached natively, on the frame the surface's wheel events bubble to.
  const frameRef = (el: HTMLDivElement | null) => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const dz = e.deltaY < 0 ? 1 : -1;
      setUserView((u) => {
        const from = u ?? fitted;
        const next = zoomView(from, dz);
        return next === from ? u : next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  };

  const surface = {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
      d.moved = true;
      setUserView({ z: view.z, cx: d.cx - dx, cy: d.cy - dy });
    },
    onPointerUp() {
      drag.current = null;
    },
    onPointerCancel() {
      drag.current = null;
    },
    onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'ArrowLeft') pan(-KEY_STEP, 0);
      else if (e.key === 'ArrowRight') pan(KEY_STEP, 0);
      else if (e.key === 'ArrowUp') pan(0, -KEY_STEP);
      else if (e.key === 'ArrowDown') pan(0, KEY_STEP);
      else if (e.key === '+' || e.key === '=') zoomBy(1);
      else if (e.key === '-' || e.key === '_') zoomBy(-1);
      else return;
      e.preventDefault();
    },
  };

  return { view, frameRef, surface, zoomBy, recentre: userView ? () => setUserView(null) : undefined };
}
