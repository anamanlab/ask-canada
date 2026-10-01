'use client';
/** The dates of the month on screen (or of the chosen day), beside the month grid, each with its own "add to calendar". */
import { useState } from 'react';
import { CalendarPlus, ChevronDown } from 'lucide-react';
import { IconButton, Notice } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { Mark, MiniDate, cap, useDate, useRel, Ord } from '../parts';
import type { CalEvent } from '../types';
import { AGENDA_CAP } from './layout';
import { toneOf, type EventText } from './text';

export function Agenda({
  events,
  month,
  selected,
  today,
  unpublished,
  text,
  onClear,
  onAdd,
}: {
  /** Everything followed, soonest first. */
  events: CalEvent[];
  month: string;
  selected: string | null;
  today: string;
  /** Payment dates for this month aren't published yet. */
  unpublished: boolean;
  text: EventText;
  onClear: () => void;
  onAdd: (events: CalEvent[], id: string) => void;
}) {
  const t = useMessages(messages);
  const fmtDate = useDate();
  const rel = useRel();
  const list = events.filter((e) => (selected ? e.date === selected : e.date.startsWith(month)));
  // A busy month shows 5 dates (from the next one on) beside the grid, and the rest on request.
  const [expanded, setExpanded] = useState<string | null>(null);
  const foldable = !selected && list.length > AGENDA_CAP;
  const open = expanded === month;
  const capped = foldable && !open;
  const from = capped ? Math.max(0, Math.min(list.findIndex((e) => e.date >= today), list.length - AGENDA_CAP)) : 0;
  const shown = capped ? list.slice(from, from + AGENDA_CAP) : list;

  return (
    <div className="min-w-0 @xl:pt-1.5">
      {/* The chosen day and the way back, each on one line; a column too narrow for both stacks them, start-aligned. */}
      <div className="mb-1 flex min-h-11 flex-wrap items-center justify-between gap-x-3">
        <h4 className="m-0 whitespace-nowrap font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2">
          {/* <bdi>: "2 dates" keeps its order in right-to-left text. */}
          <bdi>{selected ? <Ord>{cap(text.long(selected))}</Ord> : t('month.count', { count: list.length })}</bdi>
        </h4>
        {selected ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={t('day.clear')}
            className="-mx-2 min-h-11 whitespace-nowrap rounded-full px-2 text-[13px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] hover:text-ink"
          >
            {t('day.clearShort')}
          </button>
        ) : null}
      </div>
      {list.length ? (
        <ul className="m-0 list-none p-0">
          {shown.map((e) => {
            const past = e.date < today;
            return (
              <li key={e.id} className="flex items-center gap-3 border-t border-hair py-2 first:border-t-0">
                <MiniDate date={e.date} tone={toneOf(e)} muted={past} />
                <div className="min-w-0 flex-1">
                  <p className={cn('m-0 flex items-baseline gap-2 text-[15px] font-medium leading-snug', past ? 'text-ink-2' : 'text-ink')}>
                    {/* Deadlines and holidays share the maple tile: the mark tells them apart, as in the filters. */}
                    {e.kind !== 'payment' ? <Mark kind={e.kind} className="relative top-[-1px] size-2" /> : null}
                    <span className="min-w-0">{text.name(e)}</span>
                  </p>
                  <p className="m-0 mt-0.5 text-[13px] leading-snug text-ink-3">
                    {cap(fmtDate(e.date, { weekday: 'long' }))} · <span className="whitespace-nowrap">{rel(today, e.date)}</span>
                  </p>
                  {/* The detail line only for a chosen day, so the month agenda stays scannable. */}
                  {selected || e.kind === 'holiday' ? <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-ink-3"><Ord>{text.sub(e)}</Ord></p> : null}
                  {e.onTimeBy ? <p className="m-0 mt-0.5 text-[12.5px] leading-snug text-amber"><Ord>{t('tax.onTime', { date: text.short(e.onTimeBy) })}</Ord></p> : null}
                </div>
                {!past ? <IconButton label={t('action.addOne', { name: text.name(e), date: text.long(e.date) })} icon={CalendarPlus} onClick={() => onAdd([e], e.id)} /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="m-0 py-3 text-[14.5px] text-ink-3">{selected ? <Ord>{t('day.empty', { date: text.long(selected) })}</Ord> : t('month.empty')}</p>
      )}
      {/* A real toggle that stays under the list: keyboard focus never falls off a button that removed itself. */}
      {foldable ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setExpanded(open ? null : month)}
          className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-hair bg-card text-[14px] font-medium text-ink shadow-sm transition-colors hover:border-hair-2"
        >
          {open ? t('month.showFewer') : t('month.showAll', { count: list.length - AGENDA_CAP })}
          <ChevronDown className={cn('size-4 text-ink-3 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      ) : null}
      {unpublished ? (
        <Notice tone="info" className="mt-3">
          {t('month.notPublished', { year: month.slice(0, 4) })}
        </Notice>
      ) : null}
    </div>
  );
}
