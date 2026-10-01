'use client';
/**
 * A labelled range for this widget's amounts, years and ages. It is the widget's own markup (label, value and a
 * native range input), so nothing here reaches into the core Slider's internals.
 *
 * - `entry="money"`: the value is a typed field (core MoneyInput, fr-CA "55 000" included) bound to the same
 *   state as the slider: type an exact amount, or drag to explore. Without it the value is read-only text.
 * - `state`: `set` (the person's own figure), `typical` (a default: shown quieter, never as theirs) or `unset`
 *   (nobody gave it: no amount and no filled track).
 * - `disabled`: the value depends on an answer that isn't there yet ("of that, from work" before any income): the
 *   control is shown at rest, with no field to type in, and can't be moved.
 *
 *   An unset thumb rests at the start of the track, hollow and dashed, and the input reports the minimum: nothing
 *   looks (or reads) chosen until the first drag, key press or typed amount.
 *
 * Shared with core: the `ac-range` class and its `--pct` fill. No core token is redefined here. Two things the core
 * class cannot express are styled on this input's own track and thumb, from core tokens: the hollow unset thumb, and
 * the unfilled track in dark mode (a mix of `--ink-3` and `--card`, 3:1 against the card, so the range's end can be
 * seen).
 *
 * Core request on file (this file goes when it lands): Slider props `entry` (typed money) and `state`
 * (`set` | `typical` | `unset`), and a `--track` token for the unfilled track.
 */
import { useId, type CSSProperties } from 'react';
import { MoneyInput } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';

const plain = (n: number) => String(n);

/** The core rules for `.ac-range` are unlayered, so these utilities are marked important to apply. */
const TRACK_DARK = [
  '[--range-rest:color-mix(in_oklab,var(--ink-3)_62%,var(--card))]',
  'dark:[&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,var(--pine)_var(--pct),var(--range-rest)_var(--pct))]!',
  'dark:rtl:[&::-webkit-slider-runnable-track]:bg-[linear-gradient(270deg,var(--pine)_var(--pct),var(--range-rest)_var(--pct))]!',
  'dark:[&::-moz-range-track]:bg-[linear-gradient(90deg,var(--pine)_var(--pct),var(--range-rest)_var(--pct))]!',
].join(' ');
const THUMB_UNSET = [
  '[&::-webkit-slider-thumb]:border-dashed! [&::-webkit-slider-thumb]:border-ink-3! [&::-webkit-slider-thumb]:bg-paper-2! [&::-webkit-slider-thumb]:shadow-none!',
  '[&::-moz-range-thumb]:border-dashed! [&::-moz-range-thumb]:border-ink-3! [&::-moz-range-thumb]:bg-paper-2! [&::-moz-range-thumb]:shadow-none!',
].join(' ');

export function Range({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  format = plain,
  entry,
  cents = false,
  state = 'set',
  disabled = false,
  className,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
  entry?: 'money';
  /** Money entry: accept and show cents (a monthly pension), not whole dollars. */
  cents?: boolean;
  state?: 'set' | 'typical' | 'unset';
  disabled?: boolean;
  className?: string;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const id = useId();
  const unset = state === 'unset';
  // Unset: whatever the caller holds meanwhile, the control itself sits at the minimum.
  const shown = unset ? min : Math.min(Math.max(value, min), max);
  const pct = ((shown - min) / (max - min || 1)) * 100;
  const text = unset ? t('range.notSet') : format(value);
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className={cn('flex justify-between gap-3', entry ? 'min-h-11 items-center' : 'items-baseline')}>
        <label htmlFor={id} className={cn('min-w-0 text-[14px] font-medium leading-snug', disabled ? 'text-ink-2' : 'text-ink')}>
          <bdi>{label}</bdi>
        </label>
        {entry && !disabled ? (
          // The field's own label is for screen readers (the visible one names the slider); a typical or missing
          // figure is its placeholder, so it never reads as an amount the person gave. The amount and its "$" keep
          // their own order on right-to-left pages.
          <div dir="ltr" className="-mt-1.5 w-[8.75rem] shrink-0">
            <MoneyInput
              label={<span className="sr-only">{t('range.type', { label })}</span>}
              value={state === 'set' ? value : undefined}
              onChange={(n) => {
                if (n != null) onChange(n);
              }}
              min={min}
              max={max}
              cents={cents}
              placeholder={unset ? t('range.amount') : fmt.number(value, { maximumFractionDigits: cents ? 2 : 0 })}
            />
          </div>
        ) : (
          // Values ("22 years", "67.5") keep their own reading order on right-to-left pages and never break in two.
          <output
            htmlFor={id}
            className={cn(
              'shrink-0 whitespace-nowrap tabular-nums [unicode-bidi:plaintext]',
              state === 'set' ? 'font-serif text-[22px] leading-none tracking-[-.02em] text-ink' : 'text-[15px] font-medium text-ink-3',
            )}
          >
            {text}
          </output>
        )}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={shown}
        aria-valuetext={text}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('ac-range h-11 w-full appearance-none bg-transparent', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer', TRACK_DARK, unset && THUMB_UNSET)}
        style={{ '--pct': `${pct}%` } as CSSProperties}
      />
    </div>
  );
}
