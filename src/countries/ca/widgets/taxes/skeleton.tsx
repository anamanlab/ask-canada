'use client';
/**
 * Loading state for the taxes widgets: the widget itself, drawn as a skeleton.
 *   <TaxSkeleton label={t('loading')}>
 *     <Countdown initial={buildDeadlines(deadlinesArgs(part.input, lang), today)} />
 *   </TaxSkeleton>
 * The child is the real widget, built from what is known of the input so far by the same pure functions the
 * tool runs (./build), then made inert and painted as grey bars. Its height is the final layout's height by
 * construction, in every language and at every width: nothing is measured, so nothing can drift.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/*
 * Class names are written out in full (the stylesheet is generated from the source text). Two scopes:
 *   [&>section>:not(header)]     everything under the card's header: sections, action bar, sources footer
 *   [&>section>:not(header)_*]   every element inside those
 */
const paint = cn(
  // One opaque grey for every bar, mixed from the theme's own ink and card (light and dark).
  '[--bar:color-mix(in_oklab,var(--ink)_11%,var(--card))]',
  // Accents and ink become that grey, so tiles, rings, buttons and charts read as placeholders.
  '[&>section>:not(header)]:[--ink:var(--bar)] [&>section>:not(header)]:[--maple:var(--bar)] [&>section>:not(header)]:[--maple-ink:var(--bar)] [&>section>:not(header)]:[--pine:var(--bar)] [&>section>:not(header)]:[--glacier:var(--bar)] [&>section>:not(header)]:[--amber:var(--bar)]',
  '[&>section>:not(header)]:[--maple-wash:var(--paper-2)] [&>section>:not(header)]:[--pine-wash:var(--paper-2)] [&>section>:not(header)]:[--glacier-wash:var(--paper-2)] [&>section>:not(header)]:[--amber-wash:var(--paper-2)]',
  '[&>section>:not(header)]:[--a-green:var(--bar)] [&>section>:not(header)]:[--a-teal:var(--bar)] [&>section>:not(header)]:[--a-violet:var(--bar)] [&>section>:not(header)]:[--a-rose:var(--bar)]',
  // Text keeps its box and its line breaks, but shows as a bar exactly as wide as the words it replaces.
  '[&>section>:not(header)_*]:text-transparent! [&>section>:not(header)_*]:line-through! [&>section>:not(header)_*]:decoration-[color:var(--bar)]! [&>section>:not(header)_*]:decoration-[.62em]! [&>section>:not(header)_*]:[text-decoration-skip-ink:none]! [&>section>:not(header)_*]:placeholder:text-transparent! [&>section>:not(header)_*]:shadow-none!',
  // A switch's white knob steps back with the rest.
  '[&>section>:not(header)_[role=switch]]:opacity-40',
  // A date field's calendar glyph is drawn by the browser, not by text: hide it with the words.
  '[&>section>:not(header)_input[type=date]]:[&::-webkit-calendar-picker-indicator]:opacity-0',
  '[&>section>:not(header)]:motion-safe:animate-pulse',
);

export function TaxSkeleton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        {label}
      </p>
      <div inert className={cn('pointer-events-none select-none', paint)}>
        {children}
      </div>
    </div>
  );
}
