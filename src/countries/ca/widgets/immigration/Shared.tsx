'use client';
/** Small building blocks shared by the immigration widgets (tokens only, RTL-safe). */
import { useId, type ComponentProps, type CSSProperties, type ReactNode, type Ref } from 'react';
import { ArrowRight, Check, History, Minus, Plus, X, type LucideIcon } from 'lucide-react';
import { Badge, Disclosure, Field, Select } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { countryName } from './country-name';
import messages from './messages';
import type { Duration } from './times';

/** "About 6 months", "58 days", "More than 10 years", « Environ 6 mois ». */
export function useDuration() {
  const t = useMessages(messages);
  return (d: Duration | null | undefined, opts: { short?: boolean } = {}) => {
    if (!d) return t('time.none');
    const base = t(`unit.${d.unit}`, { count: d.n });
    if (opts.short || !d.q) return base;
    return t(d.q === 'more' ? 'time.more' : 'time.about', { value: base });
  };
}

/** A duration split for a stat tile: the number set large, the unit word small ("10" + "weeks"). */
export function useDurationParts() {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (d: Duration) => ({ n: fmt.number(d.n), unit: t(`unitWord.${d.unit}`, { count: d.n }) });
}

/**
 * A stat value with a small unit, isolated as one run so it keeps its order in RTL ("10 weeks", not "weeks 10").
 * Same unit style as the `Stat` primitive's `unit`.
 */
export function StatValue({ value, unit }: { value: ReactNode; unit?: ReactNode }) {
  return (
    <bdi>
      <span className="whitespace-nowrap">{value}</span>
      {unit ? <span className="ms-1.5 font-sans text-[13.5px] font-medium tracking-normal text-ink-3">{unit}</span> : null}
    </bdi>
  );
}

/**
 * `fmt.date`, plus Canadian French ordinal for the first of the month: « 1er septembre 2026 », not « 1 septembre ».
 * Dates are ISO days, so the day is read from the string (no time-zone shift).
 */
export function useDate() {
  const { fmt, intl } = useLocale();
  return (iso: string, opts: Intl.DateTimeFormatOptions) => {
    const s = fmt.date(iso, opts);
    return intl.startsWith('fr') && opts.day && Number(iso.slice(8, 10)) === 1 ? s.replace(/(^|\s)1(?=[\s  ])/, '$11er') : s;
  };
}

/** Live-feed badge for the shell header (the shell shows its badge from the `sm` breakpoint up). */
export function LiveBadge() {
  const t = useMessages(messages);
  return <Badge tone="live">{t('live.on')}</Badge>;
}

/**
 * The feed is down and the numbers are the last known ones: said in the body, under the headline number, so it
 * shows at every width (a header badge is hidden on phones). Calm, not an alert: the numbers are still IRCC's.
 */
export function LastKnown({ date, what = 'times', className }: { date?: string | null; what?: 'times' | 'rounds'; className?: string }) {
  const t = useMessages(messages);
  const fdate = useDate();
  return (
    <p className={cn('m-0 mx-5 mt-3 flex items-start gap-2.5 text-[13px] leading-snug sm:mx-6', className)}>
      <History className="mt-px size-4 shrink-0 text-amber" strokeWidth={2} aria-hidden />
      <span>
        <b className="block font-semibold text-ink">{date ? <bdi>{t('live.offDate', { date: fdate(date, { month: 'short', day: 'numeric' }) })}</bdi> : t('live.off')}</b>
        <span className="block text-ink-2">{t(`live.stale.${what}`)}</span>
      </span>
    </p>
  );
}

/** Classes of the hint beside the primary action (shared with its loading placeholder, Skeletons.tsx `SkActions`). */
export const HANDOFF_HINT =
  'm-0 ms-auto max-w-[28ch] text-end text-[13px] leading-snug text-balance max-sm:ms-0 max-sm:max-w-none max-sm:text-start max-sm:[text-wrap:wrap]';

/**
 * What happens after the primary action, beside the button. Passed as the shell's `secondaryAction` instead of
 * `handoff.note`: same place and look, but on a phone, where it stacks under the full-width button, it runs the
 * full width as ordinary text (the shell's own note stays balanced there, which leaves two short lines).
 */
export function HandoffHint({ children }: { children: ReactNode }) {
  return <p className={cn(HANDOFF_HINT, 'text-ink-3')}>{children}</p>;
}

/** Thin horizontal meter (points out of max, days out of the longest…). */
export function Meter({ value, max, tone = 'pine', className, marker }: { value: number; max: number; tone?: 'pine' | 'maple' | 'glacier' | 'amber' | 'ink' | 'muted'; className?: string; marker?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const fill = { pine: 'bg-pine', maple: 'bg-maple', glacier: 'bg-glacier', amber: 'bg-amber', ink: 'bg-ink', muted: 'bg-ink-3/45' }[tone];
  return (
    <span className={cn('relative block h-1.5 rounded-full bg-paper-3', className)} aria-hidden>
      {/* The fill is full width and slides in (transform only, no layout); the clip keeps the track's round ends. */}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <span
          className={cn('absolute inset-0 rounded-full transition-transform duration-500 ease-out [transform:translateX(var(--meter-x))] rtl:[transform:translateX(calc(var(--meter-x)*-1))] motion-reduce:transition-none', fill)}
          style={{ '--meter-x': `${pct - 100}%` } as CSSProperties}
        />
      </span>
      {marker != null && max > 0 ? (
        <span className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-ink" style={{ insetInlineStart: `${Math.min(100, (marker / max) * 100)}%` }} />
      ) : null}
    </span>
  );
}

/** Pass/fail line used in eligibility lists; `ok: null` is "can't say yet" (neutral, no tick or cross). */
export function CheckLine({ ok, children, detail }: { ok: boolean | null; children: ReactNode; detail?: ReactNode }) {
  const t = useMessages(messages);
  return (
    <li className="flex items-start gap-2.5 text-[14px] leading-snug">
      <span
        className={cn(
          'mt-px grid size-5 shrink-0 place-items-center rounded-full',
          ok == null ? 'border border-dashed border-ink-3 text-ink-3' : ok ? 'bg-pine text-card' : 'bg-maple-wash text-maple-ink',
        )}
        aria-hidden
      >
        {ok == null ? <Minus className="size-3" strokeWidth={2.6} /> : ok ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      </span>
      <span className="sr-only">{t(ok == null ? 'check.sr.pending' : ok ? 'check.sr.met' : 'check.sr.missing')}</span>
      {/* Isolated runs: a line that starts with a number ("1 year of…", "76 points") keeps its order in RTL. */}
      <span className="min-w-0">
        <bdi className="text-ink">{children}</bdi>
        {detail ? <bdi className="block text-[12.5px] text-ink-3">{detail}</bdi> : null}
      </span>
    </li>
  );
}

/** Labelled native select (keyboard + screen reader friendly on every phone). */
export function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  className,
  controlRef,
}: {
  label: ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: ReactNode;
  className?: string;
  controlRef?: Ref<HTMLSelectElement>;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(p) => <Select {...p} ref={controlRef} value={value} onChange={(e) => onChange(e.target.value as T)} options={options} />}
    </Field>
  );
}

/** Country picker with names in the reader's language, sorted for that language. */
export function CountryChoice({
  label,
  value,
  onChange,
  codes,
  placeholder,
  hint,
  className,
}: {
  label: ReactNode;
  value: string;
  onChange: (code: string) => void;
  codes: string[];
  placeholder: string;
  hint?: ReactNode;
  className?: string;
}) {
  const { intl } = useLocale();
  const collator = new Intl.Collator(intl);
  // CLDR lowercases some French names (« îles Vierges britanniques »); a list entry starts with a capital.
  const cap = (s: string) => s.charAt(0).toLocaleUpperCase(intl) + s.slice(1);
  const names = codes.map((c) => ({ value: c, label: cap(countryName(c, intl)) })).sort((a, b) => collator.compare(a.label, b.label));
  return <Choice label={label} value={value} onChange={onChange} options={[{ value: '', label: placeholder }, ...names]} hint={hint} className={className} />;
}

/** − 2 + stepper for small counts (family size). 44px targets. */
export function Counter({ label, value, onChange, min = 1, max = 10, format }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; format: (n: number) => string }) {
  const t = useMessages(messages);
  const btn =
    'grid size-11 place-items-center rounded-full border border-hair-2 bg-card text-ink transition hover:bg-paper-2 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t('counter.less')}>
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-[7ch] text-center text-[14.5px] font-medium tabular-nums text-ink">
        <bdi>{format(value)}</bdi>
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t('counter.more')}>
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/** The answer panel's corner: not a token on purpose. It sits 12px inside the shell, between `rounded-tile` (18) and `rounded-card` (24). */
export const HERO_RADIUS = 'rounded-[22px]';

/** Soft gradient hero panel at the top of a widget (same language as the passport verdict). */
export function Hero({
  tone = 'pine',
  children,
  className,
  focusRef,
}: {
  tone?: 'pine' | 'maple' | 'glacier' | 'amber';
  children: ReactNode;
  className?: string;
  /** Makes the panel a focus target: when a button swaps the panel in, focus moves here so the result is read out. */
  focusRef?: Ref<HTMLDivElement>;
}) {
  const bg = {
    pine: 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_50%,color-mix(in_oklab,var(--color-aurora-violet)_12%,transparent))]',
    glacier: 'border-glacier/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--glacier)_16%,transparent),color-mix(in_oklab,var(--pine)_10%,transparent)_55%,color-mix(in_oklab,var(--color-aurora-violet)_10%,transparent))]',
    maple: 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_10%,transparent),color-mix(in_oklab,var(--color-aurora-rose)_14%,transparent))]',
    amber: 'border-amber/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--amber)_14%,transparent),color-mix(in_oklab,var(--color-aurora-rose)_10%,transparent))]',
  }[tone];
  const focusable = focusRef !== undefined;
  return (
    <div
      ref={focusRef}
      tabIndex={focusable ? -1 : undefined}
      className={cn('relative mx-3 overflow-hidden border px-5 py-5 sm:mx-4', HERO_RADIUS, focusable && 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink', bg, className)}
    >
      {children}
    </div>
  );
}

/**
 * A next step that asks the follow-up for the person, with what they already answered written into the question
 * ("Check my eligibility with these answers"). One full-width row, 44px or taller.
 */
export function AskRow({ icon: Icon, children, onClick, className }: { icon: LucideIcon; children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div className={cn('px-5 pt-4 sm:px-6', className)}>
      <button
        type="button"
        onClick={onClick}
        className="group flex min-h-12 w-full items-center gap-3 rounded-field bg-paper-2 px-4 py-3 text-start text-[14.5px] font-medium leading-snug text-ink transition-colors hover:bg-paper-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none"
      >
        <Icon className="size-[18px] shrink-0 text-glacier" strokeWidth={1.9} aria-hidden />
        <span className="min-w-0 flex-1">{children}</span>
        <ArrowRight className="size-[18px] shrink-0 text-ink-3 transition-transform flip-rtl group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </button>
    </div>
  );
}

/**
 * A titled part of a widget: a calm sans heading (no tracked-out micro-labels) and generous space above,
 * instead of hairlines between sections (the kit's WidgetSection is the mono, ruled variant). The heading id is
 * generated, so the same widget can appear twice in a conversation. On a narrow card the aside drops under a long title.
 */
export function Section({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section className={cn('px-5 pt-7 sm:px-6', className)} aria-labelledby={title ? id : undefined}>
      {title || aside ? (
        <div className="mb-3 flex min-h-6 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {title ? (
            <h4 id={id} className="m-0 text-[15px] font-semibold leading-snug tracking-[-.005em] text-ink">
              {title}
            </h4>
          ) : (
            <span />
          )}
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Small label above a big number or verdict ("Your estimated score"), with a little air before tall numerals. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('m-0 pb-1 text-[13.5px] font-semibold leading-snug text-ink-2', className)}>{children}</p>;
}

/**
 * A part that starts collapsed (the kit's Disclosure at this widget's inset). Its content is mounted the first
 * time it opens and then kept, so what the person did inside survives closing it.
 */
export function Fold({ className, ...rest }: ComponentProps<typeof Disclosure>) {
  return <Disclosure lazy className={cn('mx-5 mt-6 first:mt-0 sm:mx-6', className)} {...rest} />;
}
