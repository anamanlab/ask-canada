'use client';
/**
 * Fields for the taxes widgets, on the core controls.
 *   <MoneyField label hint value={n | null} onChange={(n | null) => …} max? overNote? />   whole dollars, typed the way the locale writes them
 *   <YearField label hint value onChange min max rangeNote />               a 4-digit year (never grouped like a number); says so when it can't use the entry
 * YearField is a plain `Input`, not the shared `NumberInput`: that one formats with the locale ("1,990" / "1 990") and
 * a year must stay "1990". It is not on `Field` either: `Field` puts the hint above the control, and these fields sit
 * in two-column rows beside MoneyField, whose hint comes after it (same order here, so the rows line up).
 */
import { useId, useState, type ReactNode } from 'react';
import { CircleAlert, Info } from 'lucide-react';
import { Input, MoneyInput } from '@/components/ui';
import { cn } from '@/lib/cn';

/** The most a money field accepts (nine digits). */
const MAX_AMOUNT = 999_999_999;

/**
 * Whole-dollar field: "$65,000" / "65 000 $" when idle, what was typed while editing. Empty reports `null`.
 * An entry above `max` reports `max`; with `overNote` the field also says so, on screen and to screen readers.
 */
export function MoneyField({
  label,
  hint,
  value,
  onChange,
  max = MAX_AMOUNT,
  overNote,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number | null;
  onChange: (n: number | null) => void;
  /** The most the field reports (a larger entry is brought back to it); nine digits by default. */
  max?: number;
  /** Shown under the field after an entry above `max` was brought back to it. */
  overNote?: string;
  className?: string;
}) {
  const [over, setOver] = useState(false);
  const note = over && overNote ? overNote : null;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <MoneyInput
        label={label}
        hint={hint}
        value={value ?? undefined}
        // The limit is applied here, not by the input, so the field knows when it changed what was typed.
        onChange={(n) => {
          setOver(n != null && n > max);
          onChange(n == null ? null : Math.min(n, max));
        }}
        cents={false}
        max={MAX_AMOUNT}
        // Same 48px control as the province picker and the date field beside it; hints keep the widget's 12.5px, the
        // size its two-column rows and loading skeletons are measured for (longer French hints stay on their lines).
        className="[&>div]:min-h-12 [&>p]:text-[12.5px]"
      />
      {overNote ? (
        <p role="status" className={note ? 'm-0 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-ink' : 'sr-only'}>
          {note ? (
            <>
              <Info className="mt-px size-3.5 shrink-0 text-glacier" strokeWidth={2.2} aria-hidden />
              <span>{note}</span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Year field: reports a year once four digits within `min`–`max` are typed, `null` when cleared. An entry it can't
 * use (too few digits, or outside the range) stays in the field after the person leaves it, reports `null` so no
 * earlier year is silently used in its place, and is explained under the field, on screen and to screen readers.
 */
export function YearField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  rangeNote,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number | null;
  onChange: (n: number | null) => void;
  min: number;
  max: number;
  /** The sentence shown under an entry that isn't a year from `min` to `max`. */
  rangeNote: string;
  className?: string;
}) {
  const id = useId();
  // What is being typed, or what was typed and can't be used (kept so the person sees what the note is about).
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const usable = (d: string) => d.length === 4 && Number(d) >= min && Number(d) <= max;
  const shown = draft ?? (value == null ? '' : String(value));
  // While typing, only a full year can be wrong; once the person has left the field, anything unusable is.
  const bad = draft != null && draft !== '' && !usable(draft) && (!focused || draft.length === 4);
  const describedBy = [hint ? `${id}-h` : null, bad ? `${id}-e` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[14px] font-medium leading-snug text-ink">
        {label}
      </label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={shown}
        aria-invalid={bad || undefined}
        aria-describedby={describedBy}
        onFocus={() => {
          setFocused(true);
          setDraft(shown);
        }}
        onBlur={() => {
          setFocused(false);
          if (draft == null || draft === '' || usable(draft)) return setDraft(null);
          onChange(null);
        }}
        onChange={(e) => {
          const d = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
          setDraft(d);
          onChange(usable(d) ? Number(d) : d === '' ? null : value);
        }}
        className="min-h-12 tabular-nums"
      />
      {hint ? (
        <p id={`${id}-h`} className="m-0 text-[12.5px] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      <p id={`${id}-e`} role="status" className={bad ? 'm-0 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-maple-ink' : 'sr-only'}>
        {bad ? (
          <>
            <CircleAlert className="mt-px size-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
            <span>{rangeNote}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
