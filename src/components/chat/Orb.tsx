/** The brand mark in its aurora ring: the avatar of an answer (and of a fixture in the lab). */
import { pack } from '@/countries/active';
import { cn } from '@/lib/cn';

export function Orb({ className }: { className?: string }) {
  const Mark = pack.brand.Mark;
  return (
    <span className={cn('ac-orb', className)} aria-hidden>
      <Mark className="size-[15px] text-maple" />
    </span>
  );
}
