'use client';
/** The checklist's hero: who's involved, the countdown (Focus) beside the progress ring, and the event date saved on this device. */
import { useId, useRef, useState } from 'react';
import { CalendarDays, Check, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { cn } from '@/lib/cn';
import type { Agency, EventId } from './facts';
import { Focus, stacks, type FocusView } from './Focus';
import messages from './messages';
import { dateWindow, type Plan } from './model';
import { MetaLine, useDate } from './parts';
import { wantPlanner } from './planner';

type HeroProps = {
  plan: Plan;
  focus: FocusView;
  agencies: Agency[];
  intro: boolean;
  /** The event the answer above was about, when this checklist is another one the person switched to. */
  origin: EventId | null;
  onBack: () => void;
  doneCount: number;
  total: number;
  date: string | null;
  onDate: (v: string | null) => void;
  today: string;
};

export function Hero({ plan, focus, agencies, intro, origin, onBack, doneCount, total, date, onDate, today }: HeroProps) {
  const t = useMessages(messages);
  const ev = plan.event;
  // What the event accepts (a death or a marriage can't be ahead; see model.ts).
  const { min, max } = dateWindow(ev, today);
  const stack = stacks(focus);
  const lead = intro ? (
    <>
      <p className="m-0 font-serif text-[24px] leading-[1.18] tracking-[-.02em] text-ink text-balance [font-variation-settings:'opsz'_36] @xl:text-[27px]">{t(`event.${ev}.lead`)}</p>
      <p className="m-0 mt-2 text-[15px] leading-snug text-ink-2 text-pretty">{t(`event.${ev}.sub`)}</p>
      {origin ? (
        <p className="m-0 mt-2 text-[13.5px] leading-snug text-ink-3 text-pretty">
          {t('switch.outside')}{' '}
          <button type="button" onClick={onBack} className="relative font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink after:absolute after:-inset-x-2 after:-inset-y-3.5">
            {t('switch.back', { event: t(`event.${origin}.name`) })}
          </button>
        </p>
      ) : null}
    </>
  ) : null;
  return (
    <div className="px-5 pt-1 sm:px-6">
      {focus.kind === 'hint' ? (
        // Switched to an event with no date yet: there is no countdown, so the lead is the hero. Who's involved
        // sits under it and the ring beside it, in one block (no empty band between two rules).
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4">
          <div className="min-w-0">
            {lead}
            <p className="m-0 mt-3.5 text-[13.5px] font-medium tabular-nums text-ink-3">
              <MetaLine agencies={agencies} steps={total} />
            </p>
          </div>
          <ProgressRing done={doneCount} total={total} className="row-start-1" />
        </div>
      ) : (
        <>
          {lead ? <div className="mb-5 border-b border-hair pb-5">{lead}</div> : null}
          {/* Row 1: who's involved. Row 2: the focal point, the ring beside both. A sentence (missed or done) stacks
              below @md: the leaf and the ring share row 2, and the sentence takes the full width of row 3. */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
            <p className={cn('col-start-1 row-start-1 m-0 mb-3 min-w-0 text-[13.5px] font-medium tabular-nums text-ink-3 @xl:mb-4', stack && '@max-md:col-span-2')}>
              <MetaLine agencies={agencies} steps={total} />
            </p>
            <Focus view={focus} />
            <ProgressRing done={doneCount} total={total} className={stack ? 'row-start-2 @md:row-span-2 @md:row-start-1' : 'row-span-2 row-start-1 self-start @md:self-center'} />
          </div>
        </>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-t border-hair pt-4">
        <DateField label={t(`event.${ev}.date`)} hint={ev === 'retiring' ? t('date.hint.retiring') : t('date.hint')} value={date} min={min} max={max} today={today} onChange={onDate} />
      </div>
    </div>
  );
}

/** Keys that move on, cancel or open the picker instead of editing the date's segments. */
const QUIET_KEYS = new Set(['Tab', 'Shift', 'Escape', 'Enter', ' ', 'Control', 'Alt', 'Meta', 'CapsLock']);

type DateFieldProps = { label: string; hint: string; value: string | null; min: string; max: string; today: string; onChange: (v: string | null) => void };

/**
 * The event date as people say it ("Mon, Oct 12") instead of the browser's yyyy-mm-dd. The native date input
 * lies over the words: invisible at rest, it still takes the tap (opening the system picker) and the keyboard.
 * It shows its own segments only while someone is typing in it (from the first key until focus leaves), so a
 * date picked, cleared or tabbed past always reads as words. "Remove date" sits inside the field.
 */
function DateField({ label, hint, value, min, max, today, onChange }: DateFieldProps) {
  const t = useMessages(messages);
  const fmtDate = useDate();
  const { intl } = useLocale();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [typing, setTyping] = useState(false);
  const change = (next: string) => {
    if (!next) return onChange(null);
    if (/^\d{4}-\d{2}-\d{2}$/.test(next) && next >= min && next <= max) onChange(next);
  };
  // French abbreviates Tuesday to "mar.", which collides with the month ("mar. 3 mars"): there the day is written out.
  const said = value ? fmtDate(value, { weekday: intl.startsWith('fr') ? 'long' : 'short', month: 'short', day: 'numeric', ...(value.startsWith(today.slice(0, 4)) ? {} : { year: 'numeric' }) }) : null;
  return (
    <>
      <div className="min-w-0 flex-[1_1_14rem]">
        <label htmlFor={id} className="block text-[14.5px] font-medium text-ink">
          {label}
        </label>
        <p id={`${id}-hint`} className="m-0 mt-0.5 text-[13.5px] leading-snug text-ink-3 text-pretty">
          {hint}
        </p>
      </div>
      <div className="group/date relative inline-flex min-h-11 min-w-[12.5rem] max-w-full items-center rounded-field border border-hair-2 bg-card shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-ink-3 has-[input:focus-visible]:border-ink-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-1 has-[input:focus-visible]:outline-ink motion-reduce:transition-none">
        <CalendarDays className="pointer-events-none absolute start-3.5 z-[1] size-[17px] text-ink-3" strokeWidth={1.8} aria-hidden />
        <span aria-hidden className={`pointer-events-none whitespace-nowrap pe-12 ps-11 text-[15.5px] font-medium tabular-nums ${said ? 'text-ink' : 'text-ink-3'}`}>
          {said ?? t('date.add')}
        </span>
        <input
          ref={inputRef}
          id={id}
          type="date"
          aria-describedby={`${id}-hint`}
          min={min}
          max={max}
          value={value ?? ''}
          onFocus={wantPlanner}
          onBlur={() => setTyping(false)}
          onKeyDown={(e) => {
            // Digits and arrows edit the segments: show them. Tab, Escape, Enter and Space (the picker) don't.
            if (!QUIET_KEYS.has(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) setTyping(true);
          }}
          onChange={(e) => change(e.target.value)}
          onClick={(e) => {
            // The system picker, wherever the field is tapped (browsers without showPicker open it themselves).
            try {
              e.currentTarget.showPicker?.();
            } catch {
              /* not allowed right now: the field is still editable by keyboard */
            }
          }}
          className={cn('absolute inset-0 size-full cursor-pointer rounded-field bg-card pe-12 ps-11 text-[16px] tabular-nums text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden', typing ? 'opacity-100' : 'opacity-0')}
        />
        {value ? (
          <button
            type="button"
            aria-label={t('date.clear')}
            title={t('date.clear')}
            onClick={() => {
              // The button goes away with the date: hand focus back to the field it cleared.
              onChange(null);
              setTyping(false);
              inputRef.current?.focus();
            }}
            className="absolute end-0 top-1/2 z-[1] grid size-11 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-colors hover:text-ink motion-reduce:transition-none"
          >
            <span className="grid size-6 place-items-center rounded-full bg-paper-2 group-hover/date:bg-hair">
              <X className="size-3.5" strokeWidth={2.2} aria-hidden />
            </span>
          </button>
        ) : null}
      </div>
    </>
  );
}

/** Steps done out of the steps that apply, as a ring; a check once everything is done. */
function ProgressRing({ done, total, className }: { done: number; total: number; className: string }) {
  const t = useMessages(messages);
  const reduce = useReducedMotion();
  const r = 27;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <div className={cn('col-start-2 shrink-0', className)}>
      <div className="relative grid size-14 place-items-center @md:size-[76px]" aria-hidden>
        <svg viewBox="0 0 64 64" className="absolute inset-0 size-full -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-hair" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            className="stroke-pine transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        {complete ? (
          <motion.span
            key="done"
            initial={reduce ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            className="relative grid size-8 place-items-center rounded-full bg-pine text-card @md:size-10"
          >
            <Check className="size-4 @md:size-5" strokeWidth={3} />
          </motion.span>
        ) : (
          <span className="relative font-serif text-[17px] tabular-nums tracking-[-.01em] text-ink @md:text-[22px]">
            <bdi dir="ltr">
              {done}
              <span className="text-ink-3">/{total}</span>
            </bdi>
          </span>
        )}
      </div>
      {/* Read in place; changes are spoken by the checklist's one announcer (PlanView). */}
      <span className="sr-only">{t('progress.sr', { done, total })}</span>
    </div>
  );
}
