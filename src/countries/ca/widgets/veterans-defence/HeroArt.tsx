/**
 * Decorative artwork for the career matcher's hero: three stitched patches, one per environment (Army, Navy,
 * Air Force), overlapping like badges on a sleeve. Tokens only; hidden from assistive technology.
 */
import { Anchor, Compass, Plane, Trees, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

const PATCHES: { icon: LucideIcon; cls: string }[] = [
  { icon: Trees, cls: 'translate-y-1 -rotate-[7deg] bg-pine' },
  { icon: Anchor, cls: 'z-[1] -translate-y-1 bg-ink' },
  { icon: Plane, cls: 'translate-y-1 rotate-[7deg] bg-glacier' },
];

export function ServicePatches() {
  return (
    <div aria-hidden className="flex items-center -space-x-2.5 pe-1">
      {PATCHES.map(({ icon: Icon, cls }, i) => (
        <span key={i} className={cn('relative grid size-[58px] place-items-center rounded-[17px] text-paper shadow-md ring-[3px] ring-paper-2', cls)}>
          {/* The stitching: a dashed line just inside the edge. */}
          <span className="absolute inset-1 rounded-[13px] border border-dashed border-paper/45" />
          <Icon className="size-6" strokeWidth={1.7} />
        </span>
      ))}
    </div>
  );
}

/** The matcher's header tile: neutral paper and ink, so nothing in the card's first lines reads as an alert. */
export function CareersIcon() {
  return (
    <span className="grid size-[42px] place-items-center rounded-[13px] bg-paper-2 text-ink">
      <Compass className="size-5" strokeWidth={1.8} aria-hidden />
    </span>
  );
}
