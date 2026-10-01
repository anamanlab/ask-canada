'use client';
/**
 * Loading states shaped like the finished immigration widgets: the shell, and blocks with the real sections'
 * padding and rhythm. Each widget composes its own skeleton from these so nothing jumps when the output arrives.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, LinkButton, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';
import { HANDOFF_HINT, HERO_RADIUS } from './Shared';

/**
 * Loading state shaped like the finished widget (header, the widget's own body blocks, action bar, source
 * footer), so nothing jumps when the output arrives. Pass the body as children built from `Skeleton`.
 */
export function ShellSkeleton({
  title,
  subtitle,
  icon,
  tone,
  label,
  actions = 'h-[121px]',
  actionBar,
  sourceBar = 'h-14 max-sm:h-[83px]',
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  tone: WidgetTone;
  label: string;
  /** Height class of the action bar (handoff + note + footnote), e.g. taller when there is a secondary button. */
  actions?: false | string;
  /** The action bar itself (`SkActions`), sized by its real labels and footnote; replaces `actions`. */
  actionBar?: ReactNode;
  /** Height class of the sources footer: one row, or two when the first source's title is long (always on a phone). */
  sourceBar?: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" aurora aria-busy="true" className="@container text-start">
      <header className="flex items-center gap-3.5 px-5 pb-4 pt-5 sm:px-6 sm:pt-[22px]">
        <WidgetIcon icon={icon} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[17px] font-semibold leading-tight tracking-[-.01em] text-ink">{title}</p>
          {subtitle ? <p className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3">{subtitle}</p> : null}
        </div>
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        {children}
      </div>
      {actionBar ? (
        actionBar
      ) : actions ? (
        <div className={cn('mt-5 flex flex-wrap content-start items-center gap-2.5 border-t border-hair px-5 py-5 sm:px-6', actions)} aria-hidden>
          <Skeleton className="h-11 w-60 rounded-chip max-sm:w-full" />
          <Skeleton className="h-12 w-40 rounded-chip" />
          <Skeleton className="ms-auto h-3.5 w-44 max-sm:ms-0" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ) : null}
      <div className={cn('bg-paper-2', sourceBar)} aria-hidden />
    </Card>
  );
}

/*
 * Skeletons sized by the layout itself. The loading state lays out the real copy and the real controls, hidden,
 * and draws the placeholder over them: its height follows the result in every language and at every width,
 * with no measured pixel values to keep in step with the copy.
 */

/** Lines of real copy drawn as placeholder bars: same font, same wrapping, so the same height as the text. */
export function SkText({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="shimmer select-none rounded-sm bg-repeat-x box-decoration-clone text-transparent [background-size:800px_78%] [&_*]:text-transparent!">
      {children}
    </span>
  );
}

/** A real block (a field, a row of toggles, a button) laid out invisibly under one placeholder of its exact size. */
export function Ghost({ children, className, shape = 'rounded-tile' }: { children: ReactNode; className?: string; shape?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden inert>
      {/* A flex column: an inline child (a button, a badge) gets no line box, so no stray descender space. */}
      <div className="invisible flex flex-col">{children}</div>
      <Skeleton className={cn('absolute inset-0', shape)} />
    </div>
  );
}

/**
 * Placeholder art over the real thing: `real` (a part of the result, rendered from what the input already tells
 * us) is laid out invisibly and sets the size; the art fills that box and is clipped to it.
 */
export function Sized({ real, children, className }: { real: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)} aria-hidden inert>
      <div className="invisible">{real}</div>
      <div className="absolute inset-0 overflow-hidden">{children}</div>
    </div>
  );
}

/**
 * The shell's action bar (same structure as `WidgetShell`): the real buttons as ghosts, the note and the
 * footnote as bars of their own text. `secondary` is the second button, already wrapped in a `Ghost`.
 */
export function SkActions({ primary, secondary, note, footnote }: { primary: string; secondary?: ReactNode; note?: string; footnote?: string }) {
  return (
    <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden inert>
      <div className="flex flex-wrap items-center gap-2.5">
        <Ghost shape="rounded-chip" className="max-sm:w-full">
          <LinkButton href="#" external variant="primary" className="max-sm:w-full">
            {primary}
          </LinkButton>
        </Ghost>
        {secondary}
        {note ? (
          <p className={HANDOFF_HINT}>
            <SkText>{note}</SkText>
          </p>
        ) : null}
      </div>
      {footnote ? (
        <p className="m-0 mt-3 text-[13px]">
          <SkText>{footnote}</SkText>
        </p>
      ) : null}
    </div>
  );
}

/* Building blocks with the same padding as the real sections. */

/** Hero outline with the real inner rhythm (label, number, verdict lines) instead of one grey slab. */
export function SkHeroFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-3 overflow-hidden border border-hair bg-paper-2/60 px-5 py-5 sm:mx-4', HERO_RADIUS, className)} aria-hidden>
      {children}
    </div>
  );
}

/** Form fields as label + control outline (ProfileEditor's rhythm): one full-width slider, then pairs, then toggles. */
export function SkEditor({ fields, toggles = 4 }: { fields: number; toggles?: number }) {
  return (
    <div className="grid gap-5 @xl:grid-cols-2" aria-hidden>
      <div className="flex flex-col gap-3 @xl:col-span-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex h-[116px] flex-col justify-end gap-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="mb-1 h-3 w-3/5 opacity-70" />
          <div className="h-12 rounded-field border border-hair" />
        </div>
      ))}
      <div className="flex flex-col divide-y divide-hair rounded-tile border border-hair px-4 @xl:col-span-2">
        {Array.from({ length: toggles }, (_, i) => (
          <div key={i} className="flex min-h-[64px] items-center gap-4 py-2">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-3/4 opacity-70" />
            </div>
            <Skeleton className="h-7 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-7 sm:px-6', className)} aria-hidden>
      {/* Same box as the real section heading (Shared.tsx `Section`). */}
      <div className="mb-3 flex min-h-6 items-center">
        <Skeleton className="h-3.5 w-40" />
      </div>
      {children}
    </div>
  );
}
export function SkRows({ rows, className }: { rows: number; className?: string }) {
  return (
    <div className={cn('flex flex-col', className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-hair py-3 first:border-t-0">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-10" />
        </div>
      ))}
    </div>
  );
}
export function SkDisclosure({ className }: { className?: string }) {
  return (
    <div className={cn('mx-5 mt-6 flex h-[61px] items-center gap-3 border-t border-hair py-2 sm:mx-6', className)} aria-hidden>
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-44" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="size-9" round />
    </div>
  );
}
