'use client';
/**
 * A landing block whose CSS animations pause while it is off-screen (landing.css: `[data-offscreen]`), so the
 * aurora, the canoe and the other loops cost nothing once scrolled past. The block renders on the server as
 * usual; without JavaScript its animations simply never pause.
 */
import { createElement, type ComponentProps } from 'react';

let observer: IntersectionObserver | undefined;

/** One observer for every block: each entry marks its own target. */
function watch(el: Element) {
  observer ??= new IntersectionObserver((entries) => {
    for (const e of entries) e.target.toggleAttribute('data-offscreen', !e.isIntersecting);
  });
  observer.observe(el);
  return () => observer?.unobserve(el);
}

type Tag = 'div' | 'section' | 'ol';

export function Animated<T extends Tag = 'div'>({ as, ...props }: { as?: T } & ComponentProps<T>) {
  return createElement(as ?? 'div', { ...props, ref: watch });
}
