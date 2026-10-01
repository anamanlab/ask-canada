'use client';
/** Small pieces shared by the health renderers. */
import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Badge, Card, Skeleton, WidgetIcon, type WidgetTone } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useNow, useSettled } from '@/lib/hooks';
import { formatRelativeDays } from '@/lib/i18n/format';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Lang } from './facts';
import messages from './messages';

const DAY_MS = 86_400_000;

/** The official language the links, sources and wording helpers use: French for a French interface, English otherwise. */
export function useLang(): Lang {
  return useLocale().locale === 'fr' ? 'fr' : 'en';
}

/** "Live · 7:48 a.m." badge for live feeds, or an honest "Couldn’t refresh" when the feed failed. */
export function LiveBadge({ live, at }: { live: boolean; at: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // The time is shown in the reader's own zone, so it's only rendered on the device (no hydration mismatch):
  // the shared clock gives its server value (0) while server-rendering and hydrating, the device's clock after.
  const onDevice = useNow(0, { tickMs: DAY_MS }) > 0;
  if (!live) return <Badge tone="warn">{t('live.off')}</Badge>;
  return <Badge tone="live">{onDevice ? t('live.on', { time: fmt.date(new Date(at), { hour: 'numeric', minute: '2-digit' }) }) : t('live.plain')}</Badge>;
}

/**
 * `sentenceStart` capitalizes a relative day ("Today") for a heading or a label that stands alone; without it
 * the day reads mid-sentence ("newest today", « Mis à jour aujourd’hui »).
 */
export type DayLabel = (iso: string, opts?: Intl.DateTimeFormatOptions & { sentenceStart?: boolean }) => string;

const SHORT_DAY: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

/** "today" / "yesterday" / "Sep 28" for a YYYY-MM-DD date, relative to `today`. */
export function useDayLabel(today: string): DayLabel {
  const { fmt, intl } = useLocale();
  return (iso, { sentenceStart = false, ...format } = {}) => {
    const d = diffDays(today, iso);
    if (d === 0 || d === -1) {
      // Intl writes « aujourd'hui » with a straight apostrophe; the rest of the widget uses typographic ones.
      const s = formatRelativeDays(d, intl).replace(/'/g, '’');
      return sentenceStart ? s.charAt(0).toLocaleUpperCase(intl) + s.slice(1) : s;
    }
    const opts = Object.keys(format).length ? format : SHORT_DAY;
    return fmt.date(iso, { ...opts, ...(iso.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}) });
  };
}

/** "Copied" feedback: `copied` stays true for a moment after each `copy(text)`, then clears itself. */
export function useCopied(ms = 1600) {
  const [count, setCount] = useState(0);
  const settled = useSettled(count, ms);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCount((n) => n + 1);
    } catch {
      /* clipboard blocked: the value is still selectable text */
    }
  };
  return [count !== settled, copy] as const;
}

/**
 * Items separated by a middle dot that never starts or ends a line: each item carries its own leading dot, and
 * the dot of whichever item starts a line sits in the clipped negative margin.
 */
export function DotList({ items, className }: { items: ReactNode[]; className?: string }) {
  const t = useMessages(messages);
  return (
    <span className={cn('min-w-0 overflow-hidden', className)}>
      <span className="-ms-4 flex flex-wrap items-center gap-y-0.5">
        {items.map((b, i) => (
          <span key={i} className="inline-flex min-w-0 items-baseline">
            <span aria-hidden className="inline-block w-4 shrink-0 text-center">
              {t('common.dot')}
            </span>
            {b}
          </span>
        ))}
      </span>
    </span>
  );
}

const VERDICT = {
  ok: { box: 'border-pine/15 bg-pine-wash', dot: 'bg-pine text-paper' },
  no: { box: 'border-maple/20 bg-maple-wash', dot: 'bg-maple text-paper' },
  open: { box: 'border-glacier/15 bg-glacier-wash', dot: 'bg-glacier text-paper' },
  caution: { box: 'border-amber/20 bg-amber-wash', dot: 'bg-amber text-paper' },
} as const;
export type VerdictTone = keyof typeof VERDICT;
export const verdictTone = (tone: VerdictTone) => VERDICT[tone];

/** The tinted panel a result leads with (a verdict, a travel level): shared with its placeholder, so paddings can't drift. */
export const HERO_BOX = 'mx-5 rounded-card border px-5 py-5 sm:mx-6';

/**
 * The answer in one tinted panel: an icon, the verdict in serif, one line of why. `live` makes the panel itself a
 * polite status region, for a verdict that arrives once; a verdict that changes as the person types or drags is
 * announced by a debounced LiveRegion next to it instead, so it is read once, not twice.
 */
export function VerdictHero({ tone, icon: Icon, title, live = false, children }: { tone: VerdictTone; icon: LucideIcon; title: ReactNode; live?: boolean; children: ReactNode }) {
  return (
    <div role={live ? 'status' : undefined} className={cn(HERO_BOX, VERDICT[tone].box)}>
      <div className="flex items-start gap-3.5">
        <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded-full', VERDICT[tone].dot)}>
          <Icon className="size-[18px]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <p className="m-0 font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">{title}</p>
          <p className="m-0 mt-1 text-[15px] leading-snug text-ink-2">{children}</p>
        </div>
      </div>
    </div>
  );
}

/** Line heights of the widgets' text sizes (font size × leading), as the placeholder bars use them. */
export const TEXT = {
  /** 25px serif verdict, leading 1.15. */
  verdict: 'h-[28.75px]',
  /** 26px serif level, leading 1.12. */
  level: 'h-[29.12px]',
  /** 24px serif, leading-tight. */
  head: 'h-[30px]',
  /** 20px serif, leading-tight. */
  brand: 'h-[25px]',
  /** 15px, leading-snug. */
  body: 'h-[20.625px]',
  /** 14.5px, leading-snug (a Notice, the level's reason). */
  notice: 'h-[19.94px]',
  /** 14px, leading-snug. */
  sub: 'h-[19.25px]',
  /** 13px to 13.5px, leading-snug. */
  small: 'h-[18px]',
  /** Mono uppercase section label (WidgetSection title). */
  label: 'h-[17px]',
  /** A 44px control row. */
  control: 'h-11',
} as const;

/**
 * Text standing in for text: one bar per line, each in a box as tall as the line it replaces (`line` is that
 * text's line height), so a skeleton is built from the result's own paddings and line counts instead of a
 * measured pixel height. An entry is the bar's width, plus a container variant when the result wraps
 * differently there ('w-4/5 @xl:hidden' is a line phones have and desktop doesn't).
 */
export function Lines({ line, rows, className }: { line: string; rows: string[]; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {rows.map((row, i) => (
        <div key={i} className={cn('flex items-center', line, row)}>
          <Skeleton className="h-[62%] w-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Rows for `Lines` by line count: `phone` lines below the @xl container width and `wide` lines from it (text
 * wraps more on a phone, and French runs longer), the last line of each shorter than the rest.
 */
export function rows(phone: number, wide = phone): string[] {
  const n = Math.max(phone, wide);
  return Array.from({ length: n }, (_, i) =>
    cn(
      'w-full',
      i === phone - 1 && '@max-xl:w-3/5',
      i === wide - 1 && '@xl:w-3/5',
      i >= wide && '@xl:hidden',
      i >= phone && 'hidden @xl:flex',
    ),
  );
}

/** A `Notice` while loading: the banner's own box (padding, icon, gap) with bars for its lines of text. */
export function NoticeSkeleton({ rows }: { rows: string[] }) {
  return (
    <div className="flex gap-3 rounded-tile bg-paper-2 px-4 py-3.5" aria-hidden>
      <Skeleton className="mt-px size-[18px] shrink-0" round />
      <Lines line={TEXT.notice} rows={rows} className="min-w-0 flex-1" />
    </div>
  );
}

/**
 * Loading frame that mirrors WidgetShell (header, body, action bar, source footer), so a widget can lay out
 * a skeleton with its own final shape and height: no jump when the output arrives.
 */
export function ShellSkeleton({
  title,
  subtitle,
  icon,
  tone,
  label,
  actions = 2,
  badge = true,
  footnote = false,
  heights,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon: LucideIcon;
  tone: WidgetTone;
  label: string;
  actions?: number;
  /** The result has a badge in its header (false for a card without one, so no pill disappears on arrival). */
  badge?: boolean;
  /** The result has a footnote line under its actions. */
  footnote?: boolean;
  /** Height classes for the handoff note, the footnote and the source footer, when they run longer than one line. */
  heights?: { note?: string; footnote?: string; source?: string };
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
        {badge ? <Skeleton className="hidden h-6 w-24 sm:block" round /> : null}
      </header>
      <div role="status">
        <span className="sr-only">{label}</span>
        <div aria-hidden>{children}</div>
      </div>
      <div className="mt-5 border-t border-hair px-5 py-5 sm:px-6" aria-hidden>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-12 w-full rounded-full sm:w-56" />
          {actions > 1 ? <Skeleton className="h-12 w-full rounded-full sm:w-44" /> : null}
          <Skeleton className={cn('h-[18px] w-full sm:ms-auto sm:w-40', heights?.note)} />
        </div>
        {footnote ? <Skeleton className={cn('mt-4 h-3.5 w-3/4 sm:w-1/2', heights?.footnote)} /> : null}
      </div>
      <div className={cn('h-14 bg-paper-2', heights?.source)} aria-hidden />
    </Card>
  );
}
