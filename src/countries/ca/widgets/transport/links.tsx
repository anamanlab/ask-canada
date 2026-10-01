'use client';
/** Phone numbers as tap-to-call links, and an official page linked on a line of its own; both with 44px touch targets. */
import type { LucideIcon } from 'lucide-react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Padding that gives a number inside a sentence a 44px target without changing the paragraph's line height. */
const INLINE_TARGET = 'py-3.5';

/** A phone number link. In a sentence it keeps the text flow; the padding gives it a 44px touch target. */
export function TelLink({ number, className, icon: Icon }: { number: string; className?: string; icon?: LucideIcon }) {
  return (
    <a
      href={tel(number)}
      className={cn(
        'whitespace-nowrap font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink-2',
        Icon ? 'inline-flex min-h-11 items-center gap-1.5' : INLINE_TARGET,
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5 text-ink-3" aria-hidden /> : null}
      <bdi dir="ltr">{number}</bdi>
    </a>
  );
}

/**
 * An official page linked on its own line. The label stays ordinary inline text inside a block, so its words keep their
 * spaces, a long French label wraps like a sentence, the ↗ stays glued to the last word, and RTL keeps the word order.
 * The line's own padding makes the 44px target; pass `py-0` where the neighbours already leave that room.
 */
export function PageLink({ href, children, className }: { href: string; children: string; className?: string }) {
  return (
    <p className={cn('m-0 py-3 leading-5', className)}>
      <ExternalLink href={href}>{children}</ExternalLink>
    </p>
  );
}

/** Format a phone number as a tel: link. */
const tel = (n: string) => `tel:${n.replace(/[^\d+]/g, '')}`;
