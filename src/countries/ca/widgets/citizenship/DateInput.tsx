'use client';
/**
 * A date field dressed like the rest of the form. Underneath it is the browser's own date input (keyboard
 * entry, screen readers and the phone's date picker all keep working); at rest it shows the date the way
 * the widget writes dates everywhere else ("Dec 18, 2026") or a plain-language placeholder, with the
 * widget's own calendar icon. The browser's segments appear while the field has focus.
 *
 * <Field label="Left Canada">{(p) => <DateInput {...p} value={left} onChange={…} />}</Field>
 */
import type { ComponentProps } from 'react';
import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { isISO } from './presence';
import { firstOf, useLang } from './shared';

/** The browser's picker button, stretched over the calendar icon and made invisible (WebKit and Blink). */
const PICKER =
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:end-0 [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-11 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:opacity-0';

export function DateInput({ value, className, ...rest }: Omit<ComponentProps<'input'>, 'type' | 'value'> & { value: string }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const lang = useLang();
  return (
    <span className="relative block">
      <Input {...rest} type="date" value={value} className={cn('peer relative pe-11 not-focus:text-transparent', PICKER, className)} />
      <span
        aria-hidden
        className={cn('pointer-events-none absolute inset-y-0 start-3.5 end-11 flex items-center truncate text-[16px] tabular-nums peer-focus:hidden', isISO(value) ? 'text-ink' : 'text-ink-3')}
      >
        {isISO(value) ? firstOf(fmt.date(value, { month: 'short', day: 'numeric', year: 'numeric' }), lang) : t('date.placeholder')}
      </span>
      {/* Firefox keeps its own calendar button in the field, so ours steps aside there. */}
      <CalendarDays
        className="pointer-events-none absolute end-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3 supports-[-moz-appearance:none]:hidden"
        strokeWidth={1.8}
        aria-hidden
      />
    </span>
  );
}
