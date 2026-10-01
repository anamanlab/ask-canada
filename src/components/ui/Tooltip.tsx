/**
 * Tooltip: hover/focus hint for icon-only controls or terms. Content is also exposed via aria-describedby.
 * <Tooltip content="Business days skip weekends and holidays"><button>…</button></Tooltip>
 * Keep tooltip text short and non-essential (never hide required info in a tooltip).
 */
'use client';
import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Tooltip({ content, children, side = 'top' }: { content: ReactNode; children: ReactElement<Record<string, unknown>>; side?: 'top' | 'bottom' }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!isValidElement(children)) return children;
  const trigger = cloneElement(children, {
    'aria-describedby': id,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false),
  });
  return (
    <span className="relative inline-flex">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute start-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-[10px] bg-ink px-2.5 py-1.5 text-[12.5px] leading-snug text-paper shadow-md transition-opacity duration-150 rtl:translate-x-1/2',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'opacity-100' : 'opacity-0',
        )}
      >
        {content}
      </span>
    </span>
  );
}
