'use client';
/** The days calculator's trip list: add a trip, remove one, and see what each planned trip does to the date. */
import { useId, useRef, useState, type FormEvent } from 'react';
import { Plane, Plus, X } from 'lucide-react';
import { Badge, Button, Field, IconButton, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { DateInput } from './DateInput';
import { isISO, type PresenceResult, type Trip } from './presence';
import { firstOf, useLang } from './shared';

/** The fields the person can edit; the model's input seeds them. */
export type Details = {
  prDate: string | null;
  applyDate: string | null;
  tempStart: string | null;
  trips: Trip[];
};

export function Trips({
  result,
  trips,
  onChange,
  active,
  onActive,
  rowRef,
}: {
  result: PresenceResult;
  trips: Trip[];
  onChange: (t: Trip[]) => void;
  /** The trip (by id) under the pointer or with focus, here or on the timeline. */
  active: string | null;
  onActive: (id: string | null) => void;
  /** Hands each trip's row to the calculator (null when the row goes away), so the timeline can scroll to it. */
  rowRef: (id: string, el: HTMLLIElement | null) => void;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [left, setLeft] = useState('');
  const [back, setBack] = useState('');
  // Which date the message under the form is about (null: no error).
  const [invalid, setInvalid] = useState<'left' | 'back' | null>(null);
  const errId = useId();
  const leftRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  // Each row's remove button by trip id: where focus goes when the row it was on is removed.
  const removeEls = useRef(new Map<string, HTMLButtonElement>());
  // Same figure as "Days away" under the timeline: full days away inside the 5-year window.
  const planned = result.trips.filter((tr) => tr.future).length;
  const summary = t(planned ? 'presence.trips.summaryPlanned' : 'presence.trips.summary', {
    count: trips.length,
    past: trips.length - planned,
    planned,
    days: result.pr.absent + result.temp.absent,
  });
  // Newest first. Rows are keyed and removed by the trip's own id, so deleting one never shifts another's state.
  const rows = [...result.trips].sort((a, b) => b.left.localeCompare(a.left));
  // Each date stays on one line; a long range wraps only at the dash.
  const lang = useLang();
  const d = (iso: string) => firstOf(fmt.date(iso, { month: 'short', day: 'numeric', year: 'numeric' }), lang).replace(/ /g, ' ');
  const add = (e: FormEvent) => {
    e.preventDefault();
    // Go to the date that needs fixing, so the message is read with its field.
    if (!isISO(left)) return (setInvalid('left'), leftRef.current?.focus());
    if (!isISO(back) || back < left) return (setInvalid('back'), backRef.current?.focus());
    // A stable key for the new row: the first "n…" id no other trip in the list has.
    let n = trips.length;
    while (trips.some((x) => x.id === `n${n}`)) n++;
    onChange([...trips, { id: `n${n}`, left, returned: back }]);
    setLeft('');
    setBack('');
    setInvalid(null);
  };
  const remove = (id: string | undefined) => {
    // Move focus before the row goes away: to the next trip's button, else the previous one, else the add form.
    const i = rows.findIndex((x) => x.id === id);
    const neighbour = rows[i + 1]?.id ?? rows[i - 1]?.id;
    (neighbour ? removeEls.current.get(neighbour) : leftRef.current)?.focus();
    onChange(trips.filter((x) => x.id !== id));
  };
  // The message names its field through aria-describedby; the red border comes from aria-invalid.
  const fieldProps = (field: 'left' | 'back', describedBy?: string) =>
    invalid === field ? { 'aria-invalid': true, 'aria-describedby': [describedBy, errId].filter(Boolean).join(' ') } : {};
  return (
    <WidgetSection
      title={t('presence.trips.title')}
      aside={
        <span className="hidden text-[13px] tabular-nums text-ink-3 @md:inline" aria-live="polite">
          <bdi>{summary}</bdi>
        </span>
      }
      className="mt-7 border-t border-hair"
    >
      <p className="m-0 -mt-2 mb-3 text-[13px] tabular-nums text-ink-3 @md:hidden" aria-live="polite">
        <bdi>{summary}</bdi>
      </p>
      {rows.length ? (
        // One quiet group: past trips stay neutral, colour is kept for the planned trip that moves the date.
        <ul className="m-0 list-none divide-y divide-hair overflow-hidden rounded-tile border border-hair p-0" aria-label={t('presence.trips.listLabel')}>
          {rows.map((tr) => {
            const range = t('presence.trips.range', {
              from: d(tr.left),
              to: d(tr.returned),
            });
            const outside = !tr.future && tr.daysInWindow === 0 && tr.daysAway > 0;
            const id = tr.id ?? null;
            return (
              <li
                key={tr.id}
                ref={(el) => {
                  if (id) rowRef(id, el);
                }}
                className={cn('flex items-center gap-3 py-1 ps-3.5 pe-1 transition-colors duration-150 motion-reduce:transition-none', active != null && id === active ? 'bg-paper-2' : 'bg-card')}
                onPointerEnter={() => onActive(id)}
                onPointerLeave={() => onActive(null)}
                onFocus={() => onActive(id)}
                onBlur={() => onActive(null)}
              >
                <Plane className={cn('size-4 shrink-0 flip-rtl', tr.future ? 'text-glacier' : 'text-ink-3')} strokeWidth={1.8} aria-hidden />
                <div className="min-w-0 flex-1 py-1 @md:flex @md:items-baseline @md:justify-between @md:gap-4">
                  <p className="m-0 text-[14.5px] font-medium tabular-nums text-ink">
                    <bdi>{range}</bdi>
                  </p>
                  <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-ink-3 @md:justify-end">
                    {tr.future ? (
                      <>
                        {tr.delays != null ? <bdi className={tr.delays ? 'font-medium text-maple-ink' : ''}>{t('presence.trips.delays', { count: tr.delays })}</bdi> : null}
                        <Badge tone="info">{t('presence.trips.planned')}</Badge>
                      </>
                    ) : null}
                    {/* Isolated so "20 days away" keeps its number first in right-to-left text. One string either way, so the separator is always the same dot. */}
                    <bdi className="tabular-nums">{t(outside ? 'presence.trips.outside' : 'presence.trips.away', { count: tr.daysAway })}</bdi>
                  </p>
                </div>
                <IconButton
                  ref={(el) => {
                    if (!id) return;
                    if (el) removeEls.current.set(id, el);
                    else removeEls.current.delete(id);
                  }}
                  icon={X}
                  size="md"
                  label={t('presence.trips.remove', { range })}
                  onClick={() => remove(tr.id)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 rounded-tile border border-dashed border-hair-2 px-4 py-3.5 text-[14px] leading-snug text-ink-3">{t('presence.trips.empty')}</p>
      )}
      <form onSubmit={add} className="mt-4 grid gap-2.5 @md:grid-cols-[1fr_1fr_auto] @md:items-end" noValidate>
        <Field label={t('presence.trips.left')}>
          {(p) => <DateInput {...p} {...fieldProps('left', p['aria-describedby'])} ref={leftRef} value={left} onChange={(e) => (setLeft(e.target.value), setInvalid(null))} />}
        </Field>
        <Field label={t('presence.trips.returned')}>
          {(p) => (
            <DateInput {...p} {...fieldProps('back', p['aria-describedby'])} ref={backRef} value={back} min={left || undefined} onChange={(e) => (setBack(e.target.value), setInvalid(null))} />
          )}
        </Field>
        {/* Becomes the primary action once both dates are in. */}
        <Button type="submit" icon={Plus} size="md" variant={left && back ? 'primary' : 'secondary'} className="@max-md:w-full">
          {t('presence.trips.add')}
        </Button>
        {invalid ? (
          <p id={errId} className="m-0 text-[13px] font-medium text-maple-ink @md:col-span-3" role="alert">
            {t(invalid === 'left' ? 'presence.trips.invalidLeft' : 'presence.trips.invalid')}
          </p>
        ) : null}
      </form>
    </WidgetSection>
  );
}
