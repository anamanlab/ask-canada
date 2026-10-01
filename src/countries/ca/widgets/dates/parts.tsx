'use client';
/**
 * Local primitives for the key dates widgets: program colour dots and marks, the tear-off date tiles in the nine
 * program tones (the core DateTile knows three), relative-day wording and the "Add to calendar" button.
 * The month grid is in ./MonthGrid.tsx.
 */
import { Fragment } from 'react';
import { CalendarCheck, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { diffDays } from '@/lib/dates/business-days';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Tone } from './data';
import messages from './messages';
import { frFirst } from './names';

/** Marker colour per tone (also the month grid's dots). */
export const DOT: Record<Tone, string> = {
  glacier: 'bg-glacier',
  pine: 'bg-pine',
  violet: 'bg-aurora-violet',
  amber: 'bg-amber',
  teal: 'bg-aurora-teal',
  rose: 'bg-aurora-rose',
  ink: 'bg-ink-2',
  maple: 'bg-maple',
  plum: 'bg-[color-mix(in_oklab,var(--a-violet)_45%,var(--maple))]',
};
/**
 * Month band on the date tiles, per tone, always read with `text-paper`. Pastel tones are mixed with `--ink`, which
 * darkens them in light mode and lightens them in dark mode, so the band text stays ≥ 4.5:1 in both schemes
 * (measured: light 4.7–8.3:1 against --paper, dark 7.4–13:1).
 */
const BAND: Record<Tone, string> = {
  glacier: 'bg-glacier',
  pine: 'bg-pine',
  violet: 'bg-[color-mix(in_oklab,var(--a-violet)_60%,var(--ink))]',
  amber: 'bg-amber',
  teal: 'bg-[color-mix(in_oklab,var(--a-teal)_50%,var(--ink))]',
  rose: 'bg-[color-mix(in_oklab,color-mix(in_oklab,var(--a-rose)_55%,var(--maple))_62%,var(--ink))]',
  ink: 'bg-ink-2',
  maple: 'bg-maple-ink',
  plum: 'bg-[color-mix(in_oklab,color-mix(in_oklab,var(--a-violet)_45%,var(--maple))_72%,var(--ink))]',
};

export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full', DOT[tone], className)} />;
}

/**
 * The mark for each kind of date, the same in the filter chips, the "next for each" tiles and the agenda: a program's
 * colour dot for a payment, a maple diamond for a tax deadline, a maple ring for a holiday.
 */
export function Mark({ kind, tone = 'maple', className }: { kind: 'payment' | 'tax' | 'holiday'; tone?: Tone; className?: string }) {
  if (kind === 'tax') return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rotate-45 rounded-[2px] bg-maple', className)} />;
  if (kind === 'holiday') return <span aria-hidden className={cn('inline-block size-2.5 shrink-0 rounded-full border-[1.5px] border-maple bg-maple-wash', className)} />;
  return <Dot tone={tone} className={className} />;
}

/* ------------------------------------------------------------------ wording */

/**
 * `fmt.date` as Canada.ca writes French dates: the first of the month is « 1er » (« jeudi 1er janvier »). Every date
 * the widgets show goes through this.
 */
export function useDate() {
  const { fmt, locale } = useLocale();
  return (value: string | Date, opts?: Intl.DateTimeFormatOptions) => frFirst(fmt.date(value, opts), locale);
}

/**
 * French ordinals as Canada.ca sets them: « 1<sup>er</sup> juillet », « Jeudi 1<sup>er</sup> janvier ». Wraps any text
 * the reader sees that may carry a date from `useDate`; labels for screen readers and the .ics file keep plain « 1er ».
 * The raised letters sit inside the line box (no extra leading on the line that has them).
 */
export function Ord({ children }: { children: string }) {
  const parts = children.split(/(?<!\d)1er(?!\p{L})/u);
  if (parts.length === 1) return children;
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i ? (
            <>
              1<sup className="relative -top-[.42em] align-baseline text-[.68em] leading-none">er</sup>
            </>
          ) : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

/** "today", "tomorrow", "in 12 days", "3 days ago" for a date, counted from the reader's today. */
export function useRel() {
  const t = useMessages(messages);
  return (today: string, iso: string) => {
    const n = diffDays(today, iso);
    if (n === 0) return t('rel.today');
    if (n === 1) return t('rel.tomorrow');
    return n > 0 ? t('rel.in', { count: n }) : t('rel.ago', { count: -n });
  };
}

/**
 * The countdown after a date ("Monday, October 12 · in 12 days"). The separator and the countdown are one unbreakable
 * unit, so a wrapped line never ends on a dangling « · »; in a phone-width column the countdown takes its own line.
 */
export function Countdown({ children }: { children: string }) {
  return (
    <>
      {' '}
      <span className="whitespace-nowrap @max-md:block">
        <span aria-hidden className="@max-md:hidden">
          ·{' '}
        </span>
        <b className="font-semibold text-ink">{children}</b>
      </span>
    </>
  );
}

/** Keep phone numbers (1-800-387-1193) on one line inside wrapped text. */
export function NoBreakPhones({ text }: { text: string }) {
  const parts = text.split(/(\b1-\d{3}-\d{3}-\d{4}\b)/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/**
 * An `ExternalLink` alone on its line, as a 44px target.
 * TODO(core-ui/ExternalLink-standalone-space): delete this workaround once core lands the fix.
 * Core issue (src/components/ui/ExternalLink.tsx, reported to core in round 2): `standalone` renders an inline-flex
 * container, and a flex item's trailing space collapses, so the label loses the space before its last word ("Read the
 * notice oncanada.ca"). Until that's fixed there, an inline-block keeps the words and the glued arrow intact, and
 * `content-center` centres one or two lines in the 44px box. Remove this and pass `standalone` once core is fixed.
 */
export const LINK_LINE = 'inline-block min-h-11 content-center py-0';

/**
 * TODO(core-ui/WidgetShell-handoff-note): delete this workaround once core lands the fix.
 * The handoff's note ("Your own amounts are in CRA My Account…"), as the first line of the shell's footnote: one
 * start-aligned line under the buttons. Passed as `handoff.note`, the shell sets it at the far end of the button row,
 * 28 characters wide and right-aligned, where a full sentence breaks into three short ragged lines with the row empty
 * beside it (reported to core in round 3; pass it as `handoff.note` again once the shell lays the note out under the
 * primary button).
 */
export function ActionNote({ children }: { children: string }) {
  return <span className="mb-1 block text-ink-2">{children}</span>;
}

/** First letter up (for "Tomorrow" at the start of a line in languages that lowercase relative words). */
export const cap = (s: string) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

/* ------------------------------------------------------------------ add to calendar */

/**
 * "Add to calendar" with the number of dates in a quiet pill: one line at 360px in English and French (the count
 * lives in the pill, not the sentence), and "Add to calendar (33 dates)" for screen readers.
 */
export function AddButton({ ready, count, srCount, onClick }: { ready: boolean; count: number; srCount: (n: number) => string; onClick: () => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <Button icon={ready ? CalendarCheck : CalendarPlus} size="lg" variant="secondary" className="max-sm:w-full" onClick={onClick}>
      <span className="whitespace-nowrap">{t('action.add')}</span>
      <span aria-hidden className="rounded-full bg-paper-2 px-2 py-px font-mono text-[12.5px] font-medium tabular-nums text-ink-2">
        {fmt.number(count)}
      </span>
      <span className="sr-only"> ({srCount(count)})</span>
    </Button>
  );
}

/* ------------------------------------------------------------------ big date */

export function BigDate({ date, tone = 'maple', className }: { date: string; tone?: Tone; className?: string }) {
  const fmtDate = useDate();
  return (
    <span
      aria-hidden
      className={cn('inline-flex w-[76px] shrink-0 flex-col overflow-hidden rounded-[18px] border border-hair bg-card text-center shadow-md', className)}
    >
      <b className={cn('block py-1 text-[11px] font-semibold uppercase tracking-[.1em] text-paper', BAND[tone])}>
        {fmtDate(date, { month: 'short' }).replace('.', '')}
      </b>
      <span className="block pt-1 font-serif text-[38px] leading-[1.05] tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
        {Number(date.slice(8, 10))}
      </span>
      <span className="block pb-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[.06em] text-ink-3">
        {fmtDate(date, { weekday: 'short' }).replace('.', '')}
      </span>
    </span>
  );
}

/** Small tile (list rows). */
export function MiniDate({ date, tone = 'maple', muted }: { date: string; tone?: Tone; muted?: boolean }) {
  const fmtDate = useDate();
  return (
    <span
      aria-hidden
      className={cn('inline-flex w-[46px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-hair bg-card text-center shadow-sm', muted && 'opacity-60')}
    >
      <b className={cn('block py-0.5 text-[10px] font-semibold uppercase tracking-[.08em] text-paper', BAND[tone])}>
        {fmtDate(date, { month: 'short' }).replace('.', '')}
      </b>
      <span className="block font-serif text-[21px] leading-[1.3] text-ink [font-variation-settings:'opsz'_36]">{Number(date.slice(8, 10))}</span>
    </span>
  );
}
