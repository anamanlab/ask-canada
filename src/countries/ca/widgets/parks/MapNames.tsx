'use client';
/** The text on the parks map: province names, reference towns, park chips, the starting place, the selected park and the pin under the pointer or the keyboard focus. Decorative for assistive technology (the pins carry the names). */
import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import type { Rect } from './map-geometry';
import type { MapLayout } from './map-labels';

const place = (r: Rect): CSSProperties => ({ left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0 });

export function MapNames({ layout, hidden, origin, peek }: { layout: MapLayout; /** While the map glides. */ hidden: boolean; origin?: string; peek: { r: Rect; text: string } | null }) {
  // Names belong to the settled view: hidden while the map glides, then faded in.
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', hidden ? 'opacity-0' : 'opacity-100 transition-opacity duration-200 motion-reduce:transition-none')}>
      {layout.provinces.map((l) => (
        <span
          key={l.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9.5px] font-medium uppercase tracking-[.16em] text-ink-3 [text-shadow:0_0_2px_var(--card),0_0_4px_var(--card),0_0_6px_var(--card)]"
          style={{ left: l.x, top: l.y }}
        >
          {l.text}
        </span>
      ))}
      {layout.towns.map((c) => (
        <span key={c.id} className="absolute z-[5]" style={{ left: c.x, top: c.y }}>
          <span className="absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-3/70 ring-2 ring-card" />
          <span
            className="absolute top-0 -translate-y-1/2 whitespace-nowrap text-[10.5px] font-medium leading-none text-ink-3 [text-shadow:1px_0_0_var(--card),-1px_0_0_var(--card),0_1px_0_var(--card),0_-1px_0_var(--card),1px_1px_0_var(--card),-1px_-1px_0_var(--card),1px_-1px_0_var(--card),-1px_1px_0_var(--card),0_0_3px_var(--card),0_0_5px_var(--card)]"
            style={c.end ? { left: 6 } : { right: 6 }}
          >
            {c.text}
          </span>
        </span>
      ))}
      {layout.chips.map((l) => (
        <span key={l.id} className="absolute z-[15] grid place-items-center whitespace-nowrap rounded-full bg-card/90 text-[11.5px] font-medium leading-none text-ink-2 shadow-sm ring-1 ring-hair" style={place(l.r)}>
          {l.text}
        </span>
      ))}
      {layout.origin && origin ? (
        <span className="absolute z-[25] grid place-items-center whitespace-nowrap rounded-full bg-ink text-[11px] font-medium leading-none text-paper shadow-sm" style={place(layout.origin)}>
          {origin}
        </span>
      ) : null}
      {layout.selected ? (
        <span className="absolute z-30 grid place-items-center whitespace-nowrap rounded-full border border-hair bg-card text-[12px] font-semibold leading-none text-ink shadow-md" style={place(layout.selected.r)}>
          {layout.selected.text}
        </span>
      ) : null}
      {peek ? (
        <span className="absolute z-40 grid place-items-center whitespace-nowrap rounded-full border border-ink bg-card text-[11.5px] font-semibold leading-none text-ink shadow-md" style={place(peek.r)}>
          {peek.text}
        </span>
      ) : null}
    </div>
  );
}
