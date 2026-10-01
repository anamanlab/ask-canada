/**
 * Locale-aware number fields. People type numbers the way their language writes them: "1 234,56" and "5,5" in
 * French, "1,234.56" in English (a dot typed in French is still read as a decimal; see `parseLocaleNumber`).
 * While focused the field shows exactly what was typed; on blur it shows the formatted value.
 *
 * <MoneyInput label="Monthly rent" value={rent} onChange={setRent} unit="/ month" />      // "$" or " $" by locale
 * <MoneyInput label="Savings" value={n} onChange={setN} cents={false} max={1_000_000} />
 * <PercentInput label="Interest rate" value={rate} onChange={setRate} max={25} />
 * <NumberInput label="People in the household" value={n} onChange={setN} min={1} max={12} decimals={0} />
 *
 * Common props: `label`, `value` (number | undefined), `onChange(n | undefined)` (undefined when cleared),
 * `hint`, `error`, `min`, `max` (the reported value is clamped), `placeholder`, `inline` (label and field on one
 * row, for dense lists), `className`. NumberInput also takes `decimals` (default 2), `prefix` / `suffix` (inside
 * the field) and `unit` (after it, e.g. "/ month"). MoneyInput takes `cents` (default true) and `unit`.
 */
'use client';
import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { numberFormat } from '@/lib/i18n/format';
import { parseLocaleNumber } from '@/lib/i18n/number';
import { useLocale } from '@/lib/i18n/provider';

type Common = {
  label: ReactNode;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
  hint?: ReactNode;
  error?: ReactNode;
  min?: number;
  max?: number;
  placeholder?: string;
  inline?: boolean;
  className?: string;
};

type NumberInputProps = Common & {
  /** Most fraction digits accepted and shown (default 2; 0 for whole numbers). */
  decimals?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  unit?: ReactNode;
};

export function NumberInput({
  label,
  value,
  onChange,
  hint,
  error,
  min,
  max,
  placeholder,
  inline,
  className,
  decimals = 2,
  prefix,
  suffix,
  unit,
}: NumberInputProps) {
  const id = useId();
  const { intl } = useLocale();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? '' : numberFormat(intl, { maximumFractionDigits: decimals }).format(value));
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  return (
    <div className={cn('flex min-w-0', inline ? 'items-center gap-3' : 'flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-[14px] font-medium leading-snug text-ink', inline && 'min-w-0 flex-1 font-normal')}>
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-11 items-center gap-1.5 rounded-field border border-hair-2 bg-card px-3.5 text-[15px] text-ink-3 transition-[border-color] duration-200 focus-within:border-ink-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ink',
          error && 'border-maple',
          inline ? 'w-[100px] shrink-0 @md:w-[124px]' : 'w-full',
        )}
      >
        {prefix ? <span aria-hidden>{prefix}</span> : null}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          placeholder={placeholder}
          aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          onFocus={() => setDraft(value == null ? '' : numberFormat(intl, { maximumFractionDigits: decimals, useGrouping: false }).format(value))}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim() === '') return onChange(undefined);
            const n = parseLocaleNumber(e.target.value, intl);
            if (n != null) onChange(clamp(decimals ? n : Math.round(n)));
          }}
          onBlur={() => setDraft(null)}
          className={cn('min-h-10 w-full min-w-0 flex-1 bg-transparent text-[16px] tabular-nums text-ink outline-none placeholder:text-ink-3', suffix && !prefix && 'text-end')}
        />
        {suffix ? <span aria-hidden>{suffix}</span> : null}
        {unit ? <span className="shrink-0 whitespace-nowrap text-[13px]">{unit}</span> : null}
      </div>
      {hint ? (
        <p id={hintId} className="m-0 text-[13px] leading-snug text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="m-0 text-[13px] font-medium text-maple-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Where the locale puts a sign ("$1" / "1 $", "5%" / "5 %"): as NumberInput prefix or suffix props. */
function signProps(intl: string, opts: Intl.NumberFormatOptions, type: 'currency' | 'percentSign') {
  const parts = numberFormat(intl, opts).formatToParts(1);
  const at = parts.findIndex((p) => p.type === type);
  const sign = parts[at]?.value ?? '';
  return at > parts.findIndex((p) => p.type === 'integer') ? { suffix: sign } : { prefix: sign };
}

export function MoneyInput({ cents = true, min = 0, ...rest }: Common & { cents?: boolean; unit?: ReactNode }) {
  const { intl, currency } = useLocale();
  return <NumberInput {...rest} min={min} decimals={cents ? 2 : 0} {...signProps(intl, { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }, 'currency')} />;
}

export function PercentInput({ min = 0, max = 100, ...rest }: Common & { decimals?: number }) {
  const { intl } = useLocale();
  return <NumberInput {...rest} min={min} max={max} {...signProps(intl, { style: 'percent' }, 'percentSign')} />;
}
