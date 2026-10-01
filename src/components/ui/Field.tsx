/**
 * Form fields. Every control is labelled; hints and errors are wired with aria-describedby.
 * <Field label="Postal code" hint="Like K1A 0B1" error={err}>{(p) => <Input {...p} autoComplete="postal-code" />}</Field>
 * <Input /> <Select options={[{value,label}]}/> <Textarea /> can also be used on their own.
 */
'use client';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type ControlProps = { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean };

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (p: ControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="m-0 text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={errId} className="m-0 text-[13px] font-medium text-maple-ink" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control =
  'w-full min-h-11 rounded-field border border-hair-2 bg-card px-3.5 text-[16px] text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] duration-200 focus:border-ink-3 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink aria-[invalid=true]:border-maple';

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  return <input className={cn(control, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<'textarea'>) {
  return <textarea className={cn(control, 'py-3 leading-normal', className)} {...rest} />;
}

export function Select({ className, options, ...rest }: ComponentProps<'select'> & { options: { value: string; label: string }[] }) {
  return (
    <span className="relative block">
      <select className={cn(control, 'appearance-none pe-10', className)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
    </span>
  );
}
