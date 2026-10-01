/**
 * Toggle: accessible switch (role="switch").
 * <Toggle label="Remind me" checked={on} onChange={setOn} description="Saved on this device" />
 */
'use client';
import { useId } from 'react';
import { cn } from '@/lib/cn';

export function Toggle({
  label,
  description,
  checked,
  onChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-4', className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {description ? <span className="block text-[13px] text-ink-3">{description}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
          checked ? 'bg-pine' : 'bg-hair-2',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'size-6 rounded-full bg-white shadow-sm transition-transform duration-200 ease-spring',
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
