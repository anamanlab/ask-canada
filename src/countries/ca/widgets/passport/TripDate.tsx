'use client';
/**
 * "Travelling before it arrives?": the departure date, added (or changed, or removed) right in the plan.
 * The planner re-runs with the expiry it already has, so express or urgent pick-up dates appear in place
 * instead of the conversation starting over. A native date field: accessible, and a real picker on phones.
 * The browser draws the field in its own language, so the chosen date is also written out in the page's.
 */
import { useId, useRef, useState } from 'react';
import { Plane, X } from 'lucide-react';
import { IconButton, Input } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { isolate, isolateItem, nb, ordinal } from './shared';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function TripDate({ today, value, onChange }: { today: string; value?: string; onChange: (v: string | undefined) => void }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const id = useId();
  const errId = `${id}-err`;
  // Uncontrolled: typing a year digit by digit passes through dates like 0002-10-01, which must not reset the field.
  const field = useRef<HTMLInputElement>(null);
  const [past, setPast] = useState(false);
  return (
    <div className="px-5 pt-5 sm:px-6">
      <div className="flex items-start gap-3 rounded-tile border border-hair bg-paper-2 py-2 pe-2 ps-3.5">
        <Plane className="mt-[14px] size-4 shrink-0 text-glacier flip-rtl" aria-hidden />
        {/* The label and the field share a row (and wrap on phones); the error takes its own line under them. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          {/* The label reads as a question, not a form caption. */}
          <label htmlFor={id} className="flex min-h-11 min-w-0 flex-1 basis-[220px] flex-wrap items-center gap-x-2 text-[14px] leading-snug text-ink-2">
            {isolateItem(t(value ? 'tripDate.labelSet' : 'tripDate.label'))}
            {value ? <span className="font-semibold text-ink">{ordinal(nb(fmt.date(value, { weekday: 'short', month: 'short', day: 'numeric' })))}</span> : null}
          </label>
          <span className="flex items-center gap-1">
            <Input
              id={id}
              type="date"
              min={today}
              ref={field}
              defaultValue={value ?? ''}
              aria-invalid={past || undefined}
              aria-describedby={past ? errId : undefined}
              onChange={(e) => {
                const v = e.target.value;
                // A four-digit year before today is a real past date; shorter years are still being typed.
                setPast(ISO.test(v) && v < today && v >= '1000');
                if (!v) onChange(undefined);
                else if (ISO.test(v) && v >= today) onChange(v);
              }}
              className="w-auto font-medium tabular-nums shadow-sm"
            />
            {value ? (
              <IconButton
                icon={X}
                label={t('tripDate.clear')}
                onClick={() => {
                  if (field.current) field.current.value = '';
                  setPast(false);
                  onChange(undefined);
                  // This button goes away with the date: keep keyboard focus in the row.
                  field.current?.focus();
                }}
              />
            ) : null}
          </span>
          {past ? (
            <p id={errId} role="alert" className="m-0 w-full pb-1.5 text-[13.5px] font-medium text-maple-ink">
              {isolate(t('tripDate.past'))}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
