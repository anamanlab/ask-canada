/**
 * Glides the parks map from the view it is showing to the view it should settle on, with CSS transforms only.
 * The base map is drawn once, for the whole country, and never redrawn: `worldTransform(box)` places it so
 * `box` fills the frame, and the pins are translated to their place in that box. A change of `viewKey` turns
 * the transitions on (`glideStyle`), so the map and every pin travel together on the compositor; a change of
 * size alone (the column resizing) just reframes; reduced motion always jumps. Nothing is written to the DOM
 * outside React: the glide ends in the map's `transitionend` handler, with a timer behind it for the case where
 * the browser never starts the transition (the tab was hidden when the view changed), so the names always return.
 *
 *   const { gliding, onSettle } = useGlide(target, viewKey);
 *   <div style={glideStyle(gliding)}>
 *     <div className={GLIDE} style={{ transform: worldTransform(target) }} onTransitionEnd={onSettle} onTransitionCancel={onSettle} />
 *
 * `gliding` is true until the view has settled (names and outlines are hidden meanwhile).
 */
import { useEffect, useState, type CSSProperties, type TransitionEvent } from 'react';
import { useReducedMotion } from 'motion/react';
import { MAP } from './canada-map-data';
import type { Box } from './map-geometry';

const GLIDE_MS = 520;
/** Transform transition for the map and everything that travels with it; the duration comes from `glideStyle`. */
export const GLIDE = '[transition:transform_var(--glide)_cubic-bezier(.33,1,.68,1)] motion-reduce:transition-none';
/** Set on the map's frame: the glide lasts 520 ms while the view is changing, and no time at all otherwise. */
export const glideStyle = (gliding: boolean) => ({ '--glide': gliding ? `${GLIDE_MS}ms` : '0s' }) as CSSProperties;

/**
 * Places the whole-country drawing (as wide as the frame, top left corner at the frame's) so `box` fills the
 * frame. Percentages are of the drawing's own size, so this holds at any width.
 */
export const worldTransform = (b: Box) => `translate(${(-b.x / b.w) * 100}%, ${((-b.y * MAP.w) / (b.w * MAP.h)) * 100}%) scale(${MAP.w / b.w})`;

const sameBox = (a: Box, b: Box) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

export function useGlide(target: Box, viewKey: string) {
  const reduce = useReducedMotion();
  const [view, setView] = useState({ key: viewKey, box: target, moving: false });
  // A new view glides if it shows a different box; a new size alone keeps whatever is under way.
  if (view.key !== viewKey) setView({ key: viewKey, box: target, moving: !sameBox(view.box, target) });
  else if (!sameBox(view.box, target)) setView({ ...view, box: target });

  // No `transitionend` arrives for a transition that never ran: settle shortly after the glide would have ended.
  const { key, moving } = view;
  useEffect(() => {
    if (!moving) return;
    const timer = setTimeout(() => setView((v) => (v.moving ? { ...v, moving: false } : v)), GLIDE_MS + 180);
    return () => clearTimeout(timer);
  }, [key, moving]);

  /** For the map's `onTransitionEnd` and `onTransitionCancel`. */
  const onSettle = (e: TransitionEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    // A glide that was redirected on the way reports the leg it abandoned: wait for the one still running.
    if (e.currentTarget.getAnimations().length) return;
    setView((v) => (v.moving ? { ...v, moving: false } : v));
  };

  return { gliding: !reduce && view.moving, onSettle };
}
