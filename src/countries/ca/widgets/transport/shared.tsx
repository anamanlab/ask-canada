'use client';
/** Small text building blocks shared by the transport widgets (tokens only; RTL-safe). */
import { Fragment, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';

/**
 * Interpolate React nodes into a translated string: `rich(t('a.b', { vehicle: SLOT }), { [SLOT]: <bdi>…</bdi> })`.
 * Lets names and numbers keep their own direction (<bdi>) inside RTL text without splitting the sentence into keys.
 */
export const SLOT = '\uE000';
export function rich(text: string, node: ReactNode): ReactNode {
  const parts = text.split(SLOT);
  if (parts.length === 1) return text;
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 ? node : null}
    </Fragment>
  ));
}

/**
 * French ordinals set as on Canada.ca: « 1er avril » becomes « 1<sup>er</sup> avril » (other text is returned as is).
 * Split on capture groups rather than a lookbehind, which older Safari can't parse.
 */
export function ordinals(text: string): ReactNode {
  const parts = text.split(/\b(1)(er|re)\b/);
  if (parts.length === 1) return text;
  // [text, "1", "er", text, "1", "re", text, …]: every third part, from index 2, is the suffix.
  return parts.map((p, i) => (i % 3 === 2 ? <sup key={i} className="text-[.7em] leading-none">{p}</sup> : <Fragment key={i}>{p}</Fragment>));
}

/**
 * `fmt.date` for a calendar day, with the first of the month written the French way: « 1er sept. 2026 », never
 * « 1 sept. 2026 » (Intl has no ordinal day). Pass the result through `ordinals()` where it is rendered.
 */
export function useDay() {
  const { fmt, locale } = useLocale();
  return (date: string | Date, options: Intl.DateTimeFormatOptions) => {
    const text = fmt.date(date, options);
    return locale === 'fr' ? text.replace(/^1(?=[\s\u00a0\u202f])/, '1er') : text;
  };
}

/** Wrap a value in first-strong isolates so "13 years" or "90 hp" keeps its order inside RTL text (plain strings only). */
export const iso = (s: string) => `\u2068${s}\u2069`;

/** A bulleted list with the subtle dot bullets used across widgets. */
export function Bullets({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn('m-0 grid list-none gap-2 p-0', className)}>
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
          <span className="mt-[8px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
          <span className="min-w-0">{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The vertical Stepper, with one difference: the aside (a fee) never wraps under the title. A long title wraps beside
 * it, so every fee stays end-aligned on the title's first line.
 */
type StepState = 'done' | 'current' | 'upcoming' | 'end';
export function AsideSteps({ steps }: { steps: { title: ReactNode; detail?: ReactNode; state: StepState; aside?: ReactNode }[] }) {
  return (
    <ol className="relative m-0 flex list-none flex-col gap-5 p-0">
      {steps.map((s, i) => (
        <li key={i} className="relative grid grid-cols-[24px_1fr] gap-x-3.5">
          {i < steps.length - 1 ? <span aria-hidden className={cn('absolute start-[11px] top-6 -bottom-5 w-0.5', s.state === 'done' ? 'bg-pine' : 'bg-hair-2')} /> : null}
          <span
            className={cn(
              'relative z-[1] grid size-6 shrink-0 place-items-center rounded-full border-2',
              s.state === 'end' ? 'border-pine bg-pine text-card' : s.state === 'done' || s.state === 'current' ? 'border-pine bg-card' : 'border-hair-2 bg-card',
            )}
            aria-hidden
          >
            {/* The destination is a filled pine check: red stays for recalls, limits and "not allowed". */}
            {s.state === 'end' ? <Check className="size-3.5" strokeWidth={3} /> : <span className={cn('size-2 rounded-full', s.state === 'upcoming' ? 'bg-hair-2' : 'bg-pine')} />}
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-x-3 text-[14.5px] font-semibold tabular-nums leading-6 text-ink">
              <span className="min-w-0">{s.title}</span>
              {s.aside ? <span className="shrink-0">{s.aside}</span> : null}
            </div>
            {s.detail ? <div className="text-[13.5px] leading-snug text-ink-3">{s.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
