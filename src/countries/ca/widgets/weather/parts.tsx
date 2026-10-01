'use client';
/** Small pieces shared by the weather renderers: the freshness badge (and its phone line), the detail tile and its line of facts. */
import type { ComponentType, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import { isStale } from './data';
import { useLocalTime } from './format';
import messages from './messages';

/**
 * "Live · 11:03 a.m." when the data is inside the freshness window at fetch time (data.ts `isStale`),
 * otherwise "Updated 7:02 a.m." (with the day when it isn't today): an old copy is never presented as live.
 * A caller that also shows a reading (the forecast's hero) passes its own `live`, so the badge and the
 * hero's "Now / Latest" come from one boolean and cannot disagree.
 */
function useFresh({ at, fetchedAt, tz, live = !isStale(at, fetchedAt) }: Fresh) {
  const t = useMessages(messages);
  const time = useLocalTime(tz);
  const sameDay = time.ymd(at) === time.ymd(fetchedAt);
  return { live, text: live ? t('live.updated', { time: time.time(at) }) : t('live.old', { time: sameDay ? time.time(at) : time.dayTime(at) }) };
}

type Fresh = { at: string; fetchedAt: string; tz: string; live?: boolean };

/** The freshness badge for the shell header (the shell shows badges from `sm` up). */
export function FreshBadge(props: Fresh) {
  const { live, text } = useFresh(props);
  return (
    <Badge tone={live ? 'live' : 'neutral'} mono>
      {/* Isolated so "6:03 a.m." keeps its final period at the end inside right-to-left text. */}
      <bdi>{text}</bdi>
    </Badge>
  );
}

/**
 * The same freshness on phones, where the shell hides its badge: one quiet line at the top of the widget, so
 * the time of the data is always on screen.
 */
export function PhoneFresh({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <p className="-mt-1.5 mb-3 flex items-center gap-2 px-5 font-mono text-[12px] leading-none text-ink-2 sm:hidden">
      <span className={cn('size-1.5 shrink-0 rounded-full', live ? 'bg-pine' : 'bg-ink-3')} aria-hidden />
      <bdi>{children}</bdi>
    </p>
  );
}

export function FreshLine(props: Fresh) {
  const { live, text } = useFresh(props);
  return <PhoneFresh live={live}>{text}</PhoneFresh>;
}

type TileIcon = ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>;

/**
 * Small labelled tile (details grid). All inner markup is phrasing content (spans), so a tile can sit inside
 * a <button> (see `action`) without breaking the content model.
 */
export function Tile({
  icon: Icon,
  label,
  value,
  note,
  children,
  className,
  action,
}: {
  icon: TileIcon;
  label: ReactNode;
  value: ReactNode;
  note?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Makes the whole tile a button (the accessible name comes from `label` + value + note unless given). */
  action?: { onClick: () => void; 'aria-label'?: string };
}) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 self-start font-mono text-[11px] font-medium uppercase tracking-[.1em] text-ink-2">
        <Icon className="size-3.5 shrink-0" strokeWidth={1.9} aria-hidden />
        <span className="min-w-0 leading-tight">{label}</span>
      </span>
      {/*
        A tile that asks a follow-up question says so without hover: a chevron in a small disc. It sits beside
        the value (out of the flow), so the label keeps the whole first row and lines up with its neighbours'.
      */}
      {action ? (
        <span className="absolute end-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-hair-2 bg-card text-ink">
          <ChevronRight className="size-3.5 flip-rtl" strokeWidth={2.2} aria-hidden />
        </span>
      ) : null}
      <span className="mt-1.5 block font-serif text-[24px] leading-[1.1] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36]">{value}</span>
      {note ? <span className="mt-1 block text-[12.5px] leading-snug text-ink-3">{note}</span> : null}
      {children}
    </>
  );
  const frame = 'min-w-0 rounded-tile border border-hair bg-paper-2 px-3.5 py-3';
  if (action) {
    return (
      <button
        type="button"
        onClick={action.onClick}
        aria-label={action['aria-label']}
        className={cn(frame, 'relative block w-full text-start transition-colors hover:border-hair-2 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', className)}
      >
        {body}
      </button>
    );
  }
  return <div className={cn(frame, className)}>{body}</div>;
}

/**
 * Short facts on one line with a middle dot between them ("NNW · Gusts 30 km/h"). When the line is too narrow
 * a fact moves down whole and its dot goes with it out of sight (it hangs in the gap before the fact, which
 * the clipped start edge hides on a new line), so no line ever ends or starts with a stray separator.
 */
export function Facts({ items }: { items: ReactNode[] }) {
  const shown = items.filter((x) => x != null && x !== false && x !== '');
  return (
    <span className="flex flex-wrap gap-x-[.8em] overflow-hidden">
      {shown.map((item, i) => (
        <span key={i} className={cn('relative', i > 0 && "before:absolute before:-start-[.54em] before:content-['·']")}>
          {item}
        </span>
      ))}
    </span>
  );
}
