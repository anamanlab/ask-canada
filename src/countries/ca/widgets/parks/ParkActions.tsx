'use client';
/** Follow-up actions under a park: ask a follow-up in the chat, or open an official page. */
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';

export type ParkAction = { key: string; icon: LucideIcon; label: string; onClick?: () => void; href?: string };

/** Phones: a full-width row in one grouped list. Wider containers: a pill. */
const ITEM =
  'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-start text-[15px] font-medium text-ink no-underline transition-colors hover:bg-paper-2/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ' +
  '@xl:min-h-11 @xl:w-auto @xl:gap-2 @xl:rounded-chip @xl:border @xl:border-hair @xl:bg-card @xl:px-4 @xl:py-2 @xl:text-[14px] @xl:hover:border-hair-2 @xl:focus-visible:outline-offset-2';

/**
 * Follow-up actions for a park, as one list: on phones a grouped list of full-width rows with a trailing
 * chevron (questions) or arrow (official pages, in a new tab); on wider containers the same items wrap as
 * a row of pills.
 */
export function ParkActions({ items, className }: { items: ParkAction[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul
      className={cn(
        'm-0 list-none divide-y divide-hair overflow-hidden rounded-tile border border-hair bg-card p-0',
        '@xl:flex @xl:flex-wrap @xl:gap-2 @xl:divide-y-0 @xl:overflow-visible @xl:rounded-none @xl:border-0 @xl:bg-transparent',
        className,
      )}
    >
      {items.map(({ key, icon: Icon, label, onClick, href }) => {
        const inner = (
          <>
            <Icon className="size-[18px] shrink-0 text-ink-2 @xl:size-4" aria-hidden strokeWidth={1.7} />
            <span className="min-w-0 flex-1 leading-snug">{label}</span>
          </>
        );
        return (
          <li key={key}>
            {href ? (
              <ExternalLink href={href} standalone className={cn(ITEM, '[&>span>svg]:ms-0 [&>span>svg]:size-4 [&>span>svg]:text-ink-3')}>
                {inner}
              </ExternalLink>
            ) : (
              <button type="button" onClick={onClick} className={ITEM}>
                {inner}
                <ChevronRight className="size-4 shrink-0 text-ink-3 flip-rtl @xl:hidden" aria-hidden strokeWidth={1.8} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
