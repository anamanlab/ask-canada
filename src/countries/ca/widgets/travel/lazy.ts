/**
 * Code-splitting for the travel renderers. Each tool's card is its own chunk: the renderer (states and
 * skeleton) is in the widget's first chunk, and the card loads while the skeleton is on screen.
 *
 *   const card = lazyPart(() => import('./DutyCalculator').then((m) => m.DutyCalculator));
 *   if (!part.output) { card.preload(); return skeleton; }   // start loading while the tool is still working
 *   <Suspense fallback={skeleton}><card.Part … /></Suspense>
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export function lazyPart<P>(load: () => Promise<ComponentType<P>>): { Part: LazyExoticComponent<ComponentType<P>>; preload: () => void } {
  let started = false;
  return {
    Part: lazy(async () => ({ default: await load() })),
    // Safe to call while rendering: it only warms the module cache, once, and changes nothing React can see.
    preload: () => {
      if (started) return;
      started = true;
      // A failed preload is retried (and reported) by the lazy component itself.
      load().catch(() => {});
    },
  };
}
