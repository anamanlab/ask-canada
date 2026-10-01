/**
 * Stepper: vertical (default) or horizontal sequence of steps.
 * <Stepper steps={[{ title: 'Today · Sep 29', detail: 'Check, gather, apply', state: 'done' }, …]} orientation="vertical" />
 * state: 'done' (filled pine) | 'current' (ring) | 'upcoming' (hairline) | 'end' (maple, e.g. an expiry).
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Step = { title: ReactNode; detail?: ReactNode; state?: 'done' | 'current' | 'upcoming' | 'end'; aside?: ReactNode };

const dot = (s: Step['state']) =>
  cn(
    'relative z-[1] grid size-6 shrink-0 place-items-center rounded-full border-2 bg-card',
    s === 'done' && 'border-pine',
    s === 'current' && 'border-pine',
    (s === 'upcoming' || !s) && 'border-hair-2',
    s === 'end' && 'border-maple',
  );
const inner = (s: Step['state']) =>
  cn('size-2 rounded-full', s === 'done' || s === 'current' ? 'bg-pine' : s === 'end' ? 'bg-maple' : 'bg-hair-2');

export function Stepper({ steps, orientation = 'vertical', className }: { steps: Step[]; orientation?: 'vertical' | 'horizontal'; className?: string }) {
  if (orientation === 'horizontal') {
    return (
      <ol className={cn('relative m-0 grid list-none p-0', className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0,1fr))` }}>
        {steps.map((s, i) => (
          <li key={i} className="relative pe-3">
            {i < steps.length - 1 ? <span aria-hidden className="absolute start-3 top-[11px] h-0.5 w-full bg-hair-2" /> : null}
            <span className={dot(s.state)}><span className={inner(s.state)} /></span>
            <div className="mt-3 text-[13px] font-semibold tabular-nums text-ink">{s.title}</div>
            {s.detail ? <div className="mt-0.5 text-[13px] leading-snug text-ink-3">{s.detail}</div> : null}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className={cn('relative m-0 flex list-none flex-col gap-5 p-0', className)}>
      {steps.map((s, i) => (
        <li key={i} className="relative grid grid-cols-[24px_1fr] gap-x-3.5">
          {i < steps.length - 1 ? (
            <span aria-hidden className={cn('absolute start-[11px] top-6 -bottom-5 w-0.5', s.state === 'done' ? 'bg-pine' : 'bg-hair-2')} />
          ) : null}
          <span className={dot(s.state)}><span className={inner(s.state)} /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[14.5px] font-semibold tabular-nums leading-6 text-ink">
              <span>{s.title}</span>
              {s.aside}
            </div>
            {s.detail ? <div className="text-[13.5px] leading-snug text-ink-3">{s.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
