/**
 * The plan as a vertical list of dated steps (narrow containers, where the Gantt bar doesn't fit).
 * Core's Stepper with one more tone: the trip is glacier blue, as on the Gantt and its legend, so maple red
 * stays the expiry's alone. It mirrors Stepper's vertical markup and goes away once Stepper takes a glacier
 * ('info') state. Steps are keyed by what they are (`id`), so a step keeps its place when dates reorder them.
 * Titles and details are isolated (<bdi>): an English fallback line reads correctly on a right-to-left page.
 *   tone: 'done' (passed, pine line) | 'current' (today) | 'upcoming' | 'trip' (glacier) | 'end' (maple, the expiry)
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ordinal } from './shared';

export type PlanStep = { id: string; title: ReactNode; detail?: ReactNode; tone: 'done' | 'current' | 'upcoming' | 'trip' | 'end'; aside?: ReactNode };

const RING: Record<PlanStep['tone'], string> = { done: 'border-pine', current: 'border-pine', upcoming: 'border-hair-2', trip: 'border-glacier', end: 'border-maple' };
const DOT: Record<PlanStep['tone'], string> = { done: 'bg-pine', current: 'bg-pine', upcoming: 'bg-hair-2', trip: 'bg-glacier', end: 'bg-maple' };

export function PlanSteps({ steps, className }: { steps: PlanStep[]; className?: string }) {
  return (
    <ol className={cn('relative m-0 flex list-none flex-col gap-5 p-0', className)}>
      {steps.map((s, i) => (
        <li key={s.id} className="relative grid grid-cols-[24px_1fr] gap-x-3.5">
          {i < steps.length - 1 ? <span aria-hidden className={cn('absolute start-[11px] top-6 -bottom-5 w-0.5', s.tone === 'done' ? 'bg-pine' : 'bg-hair-2')} /> : null}
          <span aria-hidden className={cn('relative z-[1] grid size-6 shrink-0 place-items-center rounded-full border-2 bg-card', RING[s.tone])}>
            <span className={cn('size-2 rounded-full', DOT[s.tone])} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[14.5px] font-semibold tabular-nums leading-6 text-ink">
              <span>
                <bdi>{ordinal(s.title)}</bdi>
              </span>
              {s.aside}
            </div>
            {s.detail ? (
              <div className="text-[13.5px] leading-snug text-ink-3">
                <bdi>{ordinal(s.detail)}</bdi>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
