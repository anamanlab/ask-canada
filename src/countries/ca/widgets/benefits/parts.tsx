'use client';
/**
 * Local primitives for the benefits widget: a counter (− n +), a toggle chip, a wrapping choice grid, and the
 * next-payment pill. Built on the design tokens only.
 */
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, Check, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMediaQuery, useRovingFocus, useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { ToolSource } from '@/lib/widgets/types';
import type { LeadTitle } from './lead';
import type { PaymentDates } from './payments';
import messages from './messages';

/** `fmt.money` options: whole dollars for estimates, cents for official "up to" amounts. */
export const WHOLE = { cents: 'never' } as const;
export const CENTS = { cents: 'always' } as const;

/**
 * The payment dates still ahead on the reader's own calendar: an answer reopened weeks later never shows a date
 * that has passed as the "next payment". Lab fixtures pin the clock to the day they were built for.
 */
export function useUpcoming(next: PaymentDates['next'], serverToday: string, pinned = false): PaymentDates['next'] {
  const today = useToday(serverToday, { pinned });
  if (today <= serverToday) return next;
  const out: PaymentDates['next'] = {};
  for (const key of PAY_KEYS) {
    const dates = next[key];
    if (dates) out[key] = dates.filter((d) => d >= today);
  }
  return out;
}
const PAY_KEYS = ['ccb', 'cgeb', 'cwb', 'cpp', 'oas', 'cdb'] as const;

/** The longest title the shell's one-line source footer shows whole on a wide screen (after "canada.ca ›"). */
const FOOTER_FITS = 70;

/**
 * Sources for the shell, with a first title that fits its one-line footer instead of being cut with "…": the
 * official title where it fits, a shorter name on phones (and for the longest French titles). The link, the
 * checked date and the answer's own Sources list are unchanged.
 */
export function useFooterSources(sources: ToolSource[], lead: LeadTitle | undefined): ToolSource[] {
  const wide = useMediaQuery('(min-width: 900px)');
  const [first, ...rest] = sources;
  if (!first || !lead) return sources;
  const title = !wide ? lead.short : first.title.length <= FOOTER_FITS ? first.title : (lead.brief ?? lead.short);
  return [{ ...first, title }, ...rest];
}

export function Counter({
  label,
  value,
  onChange,
  min = 0,
  max = 9,
  live = false,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  /** Announce the count itself. Off where a summary of the result is already announced (the finder, the estimators). */
  live?: boolean;
  className?: string;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const btn =
    'grid size-11 shrink-0 place-items-center rounded-full border border-hair-2 bg-card text-ink shadow-sm transition-[transform,box-shadow,opacity] duration-200 ease-spring hover:-translate-y-px hover:shadow-md disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
  return (
    <div className={cn('flex min-h-[60px] items-center justify-between gap-3 rounded-tile border border-hair bg-paper-2 py-2 pe-2 ps-4', className)} role="group" aria-label={label}>
      <span className="min-w-0 text-[14.5px] font-medium leading-snug text-ink">
        <bdi>{label}</bdi>
      </span>
      <span className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('counter.less', { label })}>
          <Minus className="size-4" strokeWidth={2} aria-hidden />
        </button>
        <output className="w-7 text-center font-serif text-[24px] leading-none tabular-nums text-ink" aria-live={live ? 'polite' : 'off'}>
          {fmt.number(value)}
        </output>
        <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('counter.more', { label })}>
          <Plus className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </span>
    </div>
  );
}

export function FlagChip({ icon: Icon, label, on, onChange }: { icon: LucideIcon; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-chip border px-3.5 text-start text-[14.5px] font-medium leading-snug transition-[background-color,border-color,box-shadow,transform] duration-200 ease-spring hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        on ? 'border-pine/40 bg-pine-wash text-ink shadow-sm' : 'border-hair-2 bg-card text-ink-2 hover:text-ink',
      )}
    >
      <span className={cn('grid size-5 shrink-0 place-items-center rounded-full transition-colors', on ? 'bg-pine text-card' : 'text-ink-3')} aria-hidden>
        {on ? <Check className="size-3.5" strokeWidth={3} /> : <Icon className="size-[17px]" strokeWidth={1.8} />}
      </span>
      {label}
    </button>
  );
}

export function NextPay({ date, className }: { date: string; className?: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] font-medium text-pine', className)}>
      <CalendarClock className="size-3.5" strokeWidth={2} aria-hidden />
      {t('est.nextPay', { date: fmt.date(date, { month: 'short', day: 'numeric' }) })}
    </span>
  );
}

const COLS: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' };

/**
 * A single-choice row (ARIA radiogroup) of equal cells, for more options than Segmented holds. It stays one row
 * on phones: each option can give a `short` label for the narrow column (the full one is still its accessible name).
 * Arrow keys move the selection (RTL-aware), like Segmented.
 */
export function ChoiceGrid<T extends string>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; short?: string }[]; className?: string }) {
  const roving = useRovingFocus({ count: options.length, index: options.findIndex((o) => o.value === value), onMove: (i) => onChange(options[i].value), orientation: 'horizontal' });
  return (
    <div role="radiogroup" aria-label={label} className={cn('grid gap-[3px] rounded-field bg-paper-2 p-1', COLS[options.length] ?? 'grid-cols-5', className)}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            {...roving.itemProps(i)}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.short ? o.label : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              // Same "selected" as Segmented: a raised pill on the tray, no outline.
              'min-h-11 min-w-0 whitespace-nowrap rounded-[calc(var(--radius-field)-3px)] px-1 text-[14px] font-medium leading-tight transition-[background-color,box-shadow,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink @md:px-2 @md:text-[14.5px]',
              on ? 'bg-seg-on text-ink shadow-[var(--sh-sm),0_0_0_1px_var(--hair)]' : 'bg-transparent text-ink-2 hover:text-ink',
            )}
          >
            {o.short ? (
              <>
                <bdi className="@md:hidden">{o.short}</bdi>
                <bdi className="@max-md:hidden">{o.label}</bdi>
              </>
            ) : (
              <bdi>{o.label}</bdi>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** They said how many children but not how old: one question, right where the amount changes. */
export function AgesPrompt({ kids, under6, done, onChange, className }: { kids: number; under6: number; done: boolean; onChange: (n: number) => void; className?: string }) {
  const t = useMessages(messages);
  return (
    <div className={cn('rounded-tile border px-3 py-3 transition-colors', done ? 'border-pine/20 bg-pine-wash' : 'border-amber/30 bg-amber-wash', className)}>
      <Counter live label={t('kids.ask', { count: kids })} value={under6} onChange={onChange} max={kids} className="border-transparent bg-card" />
      <p className="m-0 mt-2 flex items-start gap-2 px-1 text-[13px] leading-snug text-ink-2" aria-live="polite">
        {done ? <Check className="mt-0.5 size-3.5 shrink-0 text-pine" strokeWidth={2.4} aria-hidden /> : null}
        <bdi>{done ? t('kids.askDone') : t('kids.askHint')}</bdi>
      </p>
    </div>
  );
}

/**
 * Marker under an estimator value the person hasn't set yet (the finder's dashed "assumed" style): "Typical" for a
 * real average, or another `label` ("Example") for a placeholder. The hero usually says what to do about it; where
 * it doesn't, `hint` adds that sentence here.
 */
export function AssumedHint({ label, hint = false, className }: { label?: string; /** Say "type or slide to yours" here (the hero doesn't). */ hint?: boolean; className?: string }) {
  const t = useMessages(messages);
  return (
    // Phones: the marker, then the sentence on its own line. Wider: side by side, the marker on the first line.
    <p className={cn('m-0 mt-1 flex flex-col items-start gap-x-2 gap-y-1 text-[13px] leading-snug text-ink-3 @md:flex-row @md:items-baseline', className)}>
      <span className="shrink-0 rounded-chip border border-dashed border-ink-3/60 px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[.08em] text-ink-2">
        <bdi>{label ?? t('est.assumed')}</bdi>
      </span>
      {hint ? <bdi>{t('est.assumedHintTyped')}</bdi> : null}
    </p>
  );
}

/**
 * A string for a slot that only takes text (the shell's handoff note): wrapped in first-strong isolates (FSI…PDI),
 * so English or French in a right-to-left page keeps its punctuation at the end, like `<bdi>` does for nodes.
 */
export const isolate = (s: string) => `⁨${s}⁩`;
