/**
 * Card: the base surface.
 * <Card as="section" tone="default|sunken|glass" padded aurora>
 *  - tone: default = white card with hairline + large soft shadow; sunken = paper-2 tile; glass = frosted.
 *  - aurora: adds the thin aurora gradient rule along the top edge.
 */
import type { HTMLAttributes, ElementType } from 'react';
import { cn } from '@/lib/cn';

type Props = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  tone?: 'default' | 'sunken' | 'glass';
  padded?: boolean;
  aurora?: boolean;
};

export function Card({ as: As = 'div', tone = 'default', padded, aurora, className, ...rest }: Props) {
  return (
    <As
      className={cn(
        'relative overflow-hidden',
        tone === 'default' && 'rounded-panel border border-hair bg-card shadow-lg',
        tone === 'sunken' && 'rounded-tile border border-hair bg-paper-2',
        tone === 'glass' && 'glass rounded-card border border-hair shadow-md',
        padded && 'p-5 sm:p-6',
        aurora && 'aurora-rule',
        className,
      )}
      {...rest}
    />
  );
}
