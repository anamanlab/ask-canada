'use client';
/** The checklist's rows: a step to tick (with its deadline, condition and detail) and a step that needs no action. */
import { useCallback, useId, useState, type Ref } from 'react';
import { ArrowUpRight, Building2, CalendarClock, Check, EyeOff, Globe, Mail, PenLine, Phone, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { Channel, EventId } from './facts';
import messages from './messages';
import { messageValues, taskKey, type Due, type PlanTask } from './model';
import { useDate } from './parts';

type TaskRowProps = {
  /** The step's checkbox, so the list can move focus to it (after a neighbour is set aside, or this one is added back). */
  ref?: Ref<HTMLButtonElement>;
  ev: EventId;
  task: PlanTask;
  /** Today's year: deadlines in it drop the year. */
  year: string;
  done: boolean;
  /** The step to do next: shown as a card, with its detail in full. The others keep one line of detail. */
  featured: boolean;
  /** The list's width while this row's group is open (0 while closed): the detail is measured again when it changes. */
  width: number;
  onToggle: () => void;
  onSkip: () => void;
};

const CHANNEL_ICONS: Record<Channel, LucideIcon> = { online: Globe, phone: Phone, mail: Mail, 'in-person': Building2, 'kitchen-table': PenLine };

/**
 * One step. Not the shared `Checklist` from '@/components/ui': that one wraps the whole row in a <label>, and
 * this row's title is itself a link to the official page, with a deadline chip, a condition and "Not for me"
 * beside it (interactive content can't sit inside a label, and the list needs a ref to each tick to move
 * focus). The tick keeps Checklist's look: a pine disc, a 3px check that scales in, a struck-through title.
 *
 * The title is its own anchor rather than `ExternalLink`, because the whole title is the target (44px tall)
 * and its label already says it opens in a new tab.
 */
export function TaskRow({ ref, ev, task, year, done, featured, width, onToggle, onSkip }: TaskRowProps) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const fmtDate = useDate();
  const reduce = useReducedMotion();
  const titleId = useId();
  const vals = messageValues(intl);
  const title = t(taskKey(ev, task.id, 'title', task.variant), vals);
  let detail = t(taskKey(ev, task.id, 'detail', task.variant), vals);
  if (task.variant === 'note') detail += ` ${t(`task.${ev}.${task.id}.note`)}`;
  const cut = title.lastIndexOf(' ') + 1;
  const [head, tail] = [title.slice(0, cut), title.slice(cut)];
  // Why the chip shows the next business day: never behind "More".
  // One vocabulary: the "due date" is the date the rule gives, and filing is "on time until" the business day after it.
  const rolled = task.due?.rolledFrom
    ? t(task.due.passed ? 'due.rolled.passed' : 'due.rolled', {
        date: fmtDate(task.due.rolledFrom, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        until: fmtDate(task.due.date, { weekday: 'long', month: 'long', day: 'numeric' }),
      })
    : null;
  return (
    <li
      className={cn(
        'flex gap-2.5 border-t py-3 first:border-t-0',
        // The card stands in for the rules above and below it.
        featured ? '-mx-3 my-1.5 rounded-[20px] border-transparent bg-paper-2/70 px-3 py-3.5 ring-1 ring-inset ring-hair [&+li]:border-transparent' : 'border-hair',
      )}
    >
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={t('task.check', { task: title })}
        onClick={onToggle}
        className="group relative -ms-2 grid size-11 shrink-0 place-items-center rounded-full"
      >
        {done && !reduce ? (
          <motion.span
            key="burst"
            aria-hidden
            initial={{ scale: 0.8, opacity: 0.45 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute size-[26px] rounded-full bg-pine"
          />
        ) : null}
        <span
          aria-hidden
          className={cn(
            'relative grid size-[26px] place-items-center rounded-full border-[1.5px] transition-[background-color,border-color,transform] duration-200 group-active:scale-90 motion-reduce:transition-none',
            done ? 'border-pine bg-pine text-card' : 'border-ink-3 bg-card text-transparent group-hover:border-ink-2',
          )}
        >
          <Check className={cn('size-4 transition-transform duration-200 ease-spring motion-reduce:transition-none', done ? 'scale-100' : 'scale-50')} strokeWidth={3} />
        </span>
      </button>
      <div className="min-w-0 flex-1 pt-[5px]">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] leading-5 text-ink-3">
          {featured ? <span className="rounded-full bg-ink px-2 py-px text-[11.5px] font-semibold leading-5 text-paper">{t('task.next')}</span> : null}
          <span className="font-semibold text-ink-2">{t(`agency.${task.agency}`)}</span>
          {task.channels.length ? <Channels channels={task.channels} /> : null}
          {task.due ? <DueChip due={task.due} year={year} done={done} /> : null}
          {/* From @md up the condition and "Not for me" ride the meta line; in a narrow column they sit under the detail. */}
          {task.cond ? <Applies cond={task.cond} title={title} featured={featured} onSkip={done ? null : onSkip} className="contents @max-md:hidden" /> : null}
        </div>
        <a
          id={titleId}
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('task.openLabel', { task: title })}
          className={cn(
            // The ::after reaches a 44px hit area on a one-line title without moving anything.
            'relative mt-1.5 block text-balance font-semibold leading-snug tracking-[-.005em] no-underline decoration-hair-2 underline-offset-[3px] hover:underline after:absolute after:inset-x-0 after:-inset-y-[11px]',
            featured ? 'text-[17.5px]' : 'text-[16px]',
            done ? 'text-ink-3 line-through' : 'text-ink',
          )}
        >
          {head}
          <span className="whitespace-nowrap">
            {tail}
            <ArrowUpRight className="ms-1 inline size-4 align-[-2px] text-ink-3 flip-rtl" aria-hidden />
          </span>
        </a>
        {rolled ? <p className="m-0 mt-1 text-[14.5px] font-medium leading-[1.45] text-ink">{rolled}</p> : null}
        {featured ? <p className="m-0 mt-1 text-[14.5px] leading-[1.45] text-ink-2 text-pretty">{detail}</p> : <Clamp text={detail} describedBy={titleId} width={width} />}
        {task.cond ? (
          <Applies cond={task.cond} title={title} featured={featured} onSkip={done ? null : onSkip} className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] leading-5 @md:hidden" />
        ) : null}
      </div>
    </li>
  );
}

type AppliesProps = { cond: NonNullable<PlanTask['cond']>; title: string; featured: boolean; onSkip: (() => void) | null; className: string };

/**
 * Who the step is for, with "Not for me" right after it. Rendered in two places, one shown at a time: inside
 * the meta line from @md up, under the detail in a narrow column (so every row on a phone starts organization,
 * then title). The hidden copy is `display: none`: out of the tab order and the accessibility tree.
 * A step that's done obviously applies: it keeps its condition and loses "Not for me" (`onSkip` is null).
 */
function Applies({ cond, title, featured, onSkip, className }: AppliesProps) {
  const t = useMessages(messages);
  return (
    <span className={className}>
      <span className="inline-flex max-w-full items-center rounded-[8px] border border-hair-2 px-2 py-px text-[12.5px] font-medium leading-5 text-ink-2">{t(`cond.${cond}`)}</span>
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          aria-label={t('task.skipLabel', { task: title })}
          className={cn(
            'relative z-[1] inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-px text-[12.5px] font-medium leading-5 text-ink-2 transition-colors hover:bg-hair hover:text-ink motion-reduce:transition-none after:absolute after:-inset-x-1 after:-inset-y-3',
            featured ? 'bg-card' : 'bg-paper-2',
          )}
        >
          <EyeOff className="size-3.5 shrink-0" aria-hidden />
          {t('task.skip')}
        </button>
      ) : null}
    </span>
  );
}

/** How the step is done, as icons (each with its name for screen readers and on hover). "At home" keeps its words: the minute is the point. */
function Channels({ channels }: { channels: Channel[] }) {
  const t = useMessages(messages);
  return (
    <span className="inline-flex items-center gap-1.5">
      {channels.map((ch) => {
        const Icon = CHANNEL_ICONS[ch];
        const label = t(`channel.${ch}`);
        return (
          <span key={ch} title={ch === 'kitchen-table' ? undefined : label} className="inline-flex items-center gap-1">
            <Icon className="size-[15px]" strokeWidth={1.8} aria-hidden />
            <span className={ch === 'kitchen-table' ? undefined : 'sr-only'}>{label}</span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * The start of the detail, with "More" beside it when it is cut: two lines in a narrow column (one line of a
 * phone holds four or five words, which says nothing), one line from @md up. No line-height arithmetic: the
 * paragraph is clamped while closed, and "cut" means its content is taller than its box. It is measured from
 * its own ref, again whenever the list's `width` changes (one observer for the whole list, none per row).
 */
function Clamp({ text, describedBy, width }: { text: string; describedBy: string; width: number }) {
  const t = useMessages(messages);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);
  const measure = useCallback(
    (el: HTMLParagraphElement | null) => {
      // Skipped while open (nothing is cut then) and while the group is closed (width 0: nothing to measure).
      if (el && width > 0 && !open) setCut(el.scrollHeight > el.clientHeight + 1);
    },
    [width, open],
  );
  return (
    <div className="mt-1 flex items-end gap-3">
      {/* A cut line takes its direction from its own text, so the ellipsis lands at the end of the sentence even
          when the text is in a fallback language (English inside a right-to-left page). */}
      <p ref={measure} dir={cut && !open ? 'auto' : undefined} className={cn('m-0 min-w-0 flex-1 text-[14.5px] leading-[1.45] text-ink-2', !open && 'line-clamp-2 @md:line-clamp-1')}>
        {text}
      </p>
      {cut ? (
        <button
          type="button"
          aria-expanded={open}
          aria-describedby={describedBy}
          onClick={() => setOpen((o) => !o)}
          className="relative shrink-0 text-[13.5px] font-medium leading-[21px] text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink after:absolute after:-inset-x-3 after:-inset-y-3"
        >
          {open ? t('task.less') : t('task.more')}
        </button>
      ) : null}
    </div>
  );
}

/** A step that's handled for the person: nothing to tick, just what happens and where it's explained. */
export function AutoRow({ ev, task }: { ev: EventId; task: PlanTask }) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const vals = messageValues(intl);
  const title = t(taskKey(ev, task.id, 'title', task.variant), vals);
  return (
    <li className="rounded-[16px] bg-pine-wash px-4 py-3">
      <a
        href={task.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('task.openLabel', { task: title })}
        className="text-[15px] font-semibold leading-snug text-ink no-underline decoration-hair-2 underline-offset-[3px] hover:underline"
      >
        {title}
        <ArrowUpRight className="ms-1 inline size-3.5 align-[-2px] text-ink-3 flip-rtl" aria-hidden />
      </a>
      <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{t(taskKey(ev, task.id, 'detail', task.variant), vals)}</p>
    </li>
  );
}

function DueChip({ due, year, done }: { due: Due; year: string; done?: boolean }) {
  const t = useMessages(messages);
  const fmtDate = useDate();
  // The date never breaks inside itself ("11 nov. | 2026"): a narrow column wraps before it instead.
  // This year's dates drop the year, so most chips stay on one line on a phone.
  const date = fmtDate(due.date, { month: 'short', day: 'numeric', ...(due.date.startsWith(year) ? {} : { year: 'numeric' }) })
    .replace(/\s/g, '\u00a0');
  const text = t(`due.${due.rule}${due.passed ? '.passed' : ''}`, { date });
  // One accent: maple for a deadline that's close or missed, green once something can start, neutral otherwise.
  // A step that's done has nothing to warn about: its date stays, quietly.
  const tone = done ? 'quiet' : due.kind === 'from' ? (due.passed ? 'ok' : 'plain') : due.passed || due.days <= 14 ? 'urgent' : 'plain';
  return (
    <span
      className={cn(
        // A soft rectangle, not a pill: when a long French label wraps, it still reads as one chip.
        'inline-flex max-w-full items-start gap-1.5 rounded-[10px] px-2 py-px text-[12.5px] font-semibold leading-5',
        tone === 'ok' && 'bg-pine-wash text-pine',
        tone === 'plain' && 'bg-paper-2 text-ink',
        tone === 'quiet' && 'bg-paper-2 font-medium text-ink-3',
        tone === 'urgent' && 'bg-maple-wash text-maple-ink',
      )}
    >
      <CalendarClock className="mt-[3px] size-3.5 shrink-0" aria-hidden />
      <span>{text}</span>
    </span>
  );
}
