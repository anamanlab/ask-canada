'use client';
/** One event's checklist: the hero, the steps in groups (first, soon after, later, no action needed), what was set aside, and the other events. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Copy, Flower2, Sparkles, TriangleAlert } from 'lucide-react';
import { Button, Disclosure, ExternalLink, LiveRegion, Notice, WidgetShell } from '@/components/ui';
import { useElementSize } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { LINKS, type EventId, type Phase } from './facts';
import { useFocusView } from './Focus';
import { Hero } from './Hero';
import messages from './messages';
import { checklistText, countAgencies, messageValues, pickKeyDue, taskKey, type ChecklistOutput, type Plan, type PlanTask } from './model';
import { DeviceBadge, EVENT_ICONS, useDate } from './parts';
import { SkippedList, SwitchNav } from './PlanParts';
import { AutoRow, TaskRow } from './rows';

const PHASES: Phase[] = ['now', 'next', 'later'];
const hasDeadline = (tasks: PlanTask[], p: Phase) => tasks.some((x) => x.phase === p && x.due?.kind === 'by' && !x.due.passed);

/**
 * "Copied" for two seconds after a copy, or "Couldn't copy" for a little longer when the clipboard is blocked
 * (an insecure context, a denied permission); the timer is cleared if the widget goes away first.
 */
function useCopy() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (status === 'idle') return;
    const id = window.setTimeout(() => setStatus('idle'), status === 'copied' ? 2000 : 4000);
    return () => window.clearTimeout(id);
  }, [status]);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  };
  return [status, copy] as const;
}
const COPY_ICONS = { idle: Copy, copied: Check, failed: TriangleAlert };

type PlanProps = {
  data: ChecklistOutput;
  plan: Plan;
  intro: boolean;
  origin: EventId | null;
  done: string[];
  skipped: string[];
  date: string | null;
  onDate: (v: string | null) => void;
  onToggle: (id: string) => void;
  onSkip: (id: string, on: boolean) => void;
  onPick: (id: EventId | null) => void;
};

export function PlanView({ data, plan, intro, origin, done, skipped, date, onDate, onToggle, onSkip, onPick }: PlanProps) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const formatDay = useDate();
  const ev = plan.event;
  const [copyStatus, copy] = useCopy();
  // One measurement for every row's "More" clamp (instead of an observer per row): the list's width.
  const [listRef, { w: listWidth }] = useElementSize<HTMLDivElement>();

  const actionable = plan.tasks.filter((x) => x.phase !== 'auto');
  const active = actionable.filter((x) => !skipped.includes(x.id));
  const doneCount = active.filter((x) => done.includes(x.id)).length;
  const skippedTasks = actionable.filter((x) => skipped.includes(x.id));
  const auto = plan.tasks.filter((x) => x.phase === 'auto');
  const phases = PHASES.filter((p) => active.some((x) => x.phase === p));
  const allDone = active.length > 0 && doneCount === active.length;
  // Who's still involved follows "Not for me", like the step count beside it.
  const agencies = countAgencies(active);
  // The step to do next, shown as a card: the one the hero's deadline belongs to, else the first one still open.
  const todo = PHASES.flatMap((p) => active.filter((x) => x.phase === p && !done.includes(x.id)));
  const heroDue = pickKeyDue(todo);
  const next = todo.find((x) => x.due === heroDue) ?? todo[0];
  // Open the first group, any group holding an upcoming deadline, and the group with the next step (even a
  // missed deadline); the rest wait behind their headers.
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(phases.map((p, i) => [p, i === 0 || p === next?.phase || hasDeadline(active, p)])));
  // A new date (a re-planned checklist) can put a deadline in a group that's closed: open it. Nothing closes.
  const [seenPlan, setSeenPlan] = useState(plan);
  if (seenPlan !== plan) {
    setSeenPlan(plan);
    const due = phases.filter((p) => !open[p] && hasDeadline(active, p));
    if (due.length) setOpen({ ...open, ...Object.fromEntries(due.map((p) => [p, true])) });
  }

  const fmtDate = (iso: string) => formatDay(iso, { month: 'long', day: 'numeric', year: 'numeric' });

  // "Not for me" and "Add back" remove the control that was pressed: focus moves on to a neighbouring step (or
  // to the restored one) instead of falling back to the top of the page, and the change is said aloud.
  const checks = useRef(new Map<string, HTMLButtonElement>());
  const skippedToggle = useRef<HTMLButtonElement>(null);
  const [action, setAction] = useState('');
  const titleOf = (task: PlanTask) => t(taskKey(ev, task.id, 'title', task.variant), messageValues(intl));
  const skip = (task: PlanTask) => {
    const group = active.filter((x) => x.phase === task.phase);
    const i = group.findIndex((x) => x.id === task.id);
    const neighbour = group[i + 1] ?? group[i - 1];
    onSkip(task.id, true);
    setAction(t('skipped.said', { task: titleOf(task) }));
    requestAnimationFrame(() => ((neighbour && checks.current.get(neighbour.id)) ?? skippedToggle.current)?.focus());
  };
  const restore = (task: PlanTask) => {
    onSkip(task.id, false);
    setOpen((o) => ({ ...o, [task.phase]: true }));
    setAction(t('skipped.restored', { task: titleOf(task) }));
    requestAnimationFrame(() => (checks.current.get(task.id) ?? skippedToggle.current)?.focus());
  };

  // One announcer for the whole checklist. A tick, "Not for me" or a new date changes the progress, sometimes
  // the hero's focus and sometimes completes the list: said as one sentence, once it has settled.
  const focus = useFocusView({ plan, date, today: data.today, intro, done, skipped });
  const progress = t('progress.sr', { done: doneCount, total: active.length });
  const [heard, setHeard] = useState({ progress, focus: focus.sr, action, text: '' });
  if (heard.progress !== progress || heard.focus !== focus.sr || heard.action !== action) {
    const doneTitle = allDone ? (ev === 'death' ? t('done.titleDeath') : t('done.title')) : '';
    const parts = [heard.action !== action ? action : '', progress, heard.focus !== focus.sr && !allDone ? focus.sr : '', doneTitle];
    setHeard({ progress, focus: focus.sr, action, text: parts.filter(Boolean).join(' · ') });
  }

  return (
    <WidgetShell
      icon={EVENT_ICONS[ev]}
      tone={plan.tone}
      title={t(`event.${ev}.title`)}
      subtitle={t(`event.${ev}.subtitle`)}
      badge={<DeviceBadge />}
      sources={data.sources}
      handoff={{ href: plan.hubUrl, label: t(`event.${ev}.handoff`) }}
      secondaryAction={
        <>
          <Button variant="quiet" className="max-sm:w-full" icon={COPY_ICONS[copyStatus]} onClick={() => copy(checklistText(plan, t, { done, skipped, fmtDate }))}>
            {t(`action.${copyStatus === 'idle' ? 'copy' : copyStatus}`)}
          </Button>
          <LiveRegion text={copyStatus === 'copied' ? t('action.copied') : copyStatus === 'failed' ? t('action.failedSr') : ''} delay={0} />
        </>
      }
      // What the button leads to, then the privacy line: one quiet paragraph under the buttons.
      footnote={`${t(`event.${ev}.handoffNote`)} ${t('footnote.device')}`}
      className="@container"
    >
      <Hero plan={plan} focus={focus} agencies={agencies} intro={intro} origin={origin} onBack={() => onPick(origin)} doneCount={doneCount} total={active.length} date={date} onDate={onDate} today={data.today} />

      {ev === 'death' ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" icon={Flower2} title={t('grief.title')}>
            {t('grief.body')}{' '}
            <ExternalLink href={LINKS.mentalHealth[data.lang]} icon={false}>
              {t('grief.link')}
            </ExternalLink>
          </Notice>
        </div>
      ) : null}

      {allDone ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="ok" icon={ev === 'death' ? Check : Sparkles} title={ev === 'death' ? t('done.titleDeath') : t('done.title')} />
        </div>
      ) : null}

      <div ref={listRef} className="mt-4 px-5 sm:px-6">
        {phases.map((p) => {
          const list = active.filter((x) => x.phase === p);
          const n = list.filter((x) => done.includes(x.id)).length;
          return (
            <Disclosure
              key={p}
              lazy
              className="first:border-t-0"
              title={<GroupTitle count={<bdi dir="ltr">{`${n}/${list.length}`}</bdi>} countSr={t('progress.sr', { done: n, total: list.length })}>{t(`phase.${ev}.${p}`)}</GroupTitle>}
              open={!!open[p]}
              onOpenChange={(v) => setOpen((o) => ({ ...o, [p]: v }))}
            >
              <ol className="m-0 list-none p-0">
                {list.map((task) => (
                  <TaskRow
                    key={task.id}
                    ref={(el) => {
                      if (el) checks.current.set(task.id, el);
                      else checks.current.delete(task.id);
                    }}
                    ev={ev}
                    task={task}
                    year={data.today.slice(0, 4)}
                    done={done.includes(task.id)}
                    featured={task.id === next?.id}
                    width={open[p] ? listWidth : 0}
                    onToggle={() => onToggle(task.id)}
                    onSkip={() => skip(task)}
                  />
                ))}
              </ol>
            </Disclosure>
          );
        })}

        {auto.length ? (
          <Disclosure
            lazy
            className="first:border-t-0"
            title={
              <GroupTitle count={<bdi>{t('group.steps', { count: auto.length })}</bdi>}>
                {/* The badge leads, aligned with the first line, so a wrapped French title keeps it in place. */}
                <span className="flex items-start gap-2">
                  <span className="mt-[5px] grid size-[18px] shrink-0 place-items-center rounded-full bg-pine text-card" aria-hidden>
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">{t('phase.auto')}</span>
                </span>
              </GroupTitle>
            }
            open={!!open.auto}
            onOpenChange={(v) => setOpen((o) => ({ ...o, auto: v }))}
          >
            <ul className="m-0 grid list-none gap-2 p-0 pb-2">
              {auto.map((task) => (
                <AutoRow key={task.id} ev={ev} task={task} />
              ))}
            </ul>
          </Disclosure>
        ) : null}

        {skippedTasks.length ? <SkippedList ev={ev} tasks={skippedTasks} onRestore={restore} toggleRef={skippedToggle} /> : null}
        <LiveRegion text={heard.text} delay={700} />
      </div>

      <SwitchNav current={ev} onPick={onPick} />
    </WidgetShell>
  );
}

/**
 * A group's header inside the shared Disclosure: the name, then how far along it is. A fraction is shown but
 * not spoken ("0/5" reads as "zero slash five"): `countSr` says it in words instead.
 */
function GroupTitle({ count, countSr, children }: { count: ReactNode; countSr?: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 items-center justify-between gap-3 font-serif text-[20px] font-normal tracking-[-.015em] [font-variation-settings:'opsz'_36]">
      <span className="min-w-0">{children}</span>
      <span className="shrink-0 font-sans text-[13.5px] font-medium tracking-normal tabular-nums text-ink-3" aria-hidden={countSr ? true : undefined}>
        {count}
      </span>
      {countSr ? <span className="sr-only">{`, ${countSr}`}</span> : null}
    </span>
  );
}
