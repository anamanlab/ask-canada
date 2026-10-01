/**
 * Disclosure: a titled part that starts collapsed ("show more"), keeping long widgets short while the detail
 * stays one tap away.
 * <Disclosure title="Fees and payment" summary="$163.50 online · 3 ways to pay">…</Disclosure>
 * <Disclosure title="All 42 offices" count={42} lazy>…</Disclosure>                    // mounted on first open
 * <Disclosure title="Details" open={open} onOpenChange={setOpen}>…</Disclosure>        // controlled
 *
 * - `summary`: one line shown under the title while closed (what's inside).
 * - `count`: a small number badge after the title.
 * - `defaultOpen` / `open` + `onOpenChange`: uncontrolled or controlled.
 * - `lazy`: don't render the children until the first open (heavy or rarely opened content); once opened they
 *   stay mounted, so their state survives closing.
 * - `headingLevel`: the heading wrapping the toggle (default 4, under a widget's h3 title).
 * The toggle is a real button with `aria-expanded` / `aria-controls`; the panel is `hidden` while closed.
 */
'use client';
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Disclosure({
  title,
  summary,
  count,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  lazy,
  headingLevel = 4,
  className,
  children,
}: {
  title: ReactNode;
  summary?: ReactNode;
  count?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  lazy?: boolean;
  headingLevel?: 2 | 3 | 4 | 5;
  className?: string;
  children: ReactNode;
}) {
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  const toggle = () => {
    setOwn(!open);
    onOpenChange?.(!open);
  };
  const Heading = `h${headingLevel}` as const;
  return (
    <section className={cn('border-t border-hair', className)}>
      <Heading className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
          className="group flex min-h-14 w-full items-center gap-3 py-2 text-start focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[15px] font-semibold leading-snug tracking-[-.005em] text-ink">
              {title}
              {count != null ? (
                <span className="rounded-full bg-paper-2 px-2 py-px font-mono text-[11.5px] font-medium tabular-nums text-ink-2">{count}</span>
              ) : null}
            </span>
            {summary && !open ? <span className="mt-0.5 line-clamp-2 block text-[13.5px] font-normal leading-snug text-ink-2">{summary}</span> : null}
          </span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-hair bg-card text-ink-2 transition group-hover:bg-paper-2">
            <ChevronDown className={cn('size-4 transition-transform duration-300 motion-reduce:transition-none', open && 'rotate-180')} aria-hidden />
          </span>
        </button>
      </Heading>
      <div id={id} hidden={!open} className="pb-1 pt-2">
        {lazy && !opened ? null : children}
      </div>
    </section>
  );
}
