'use client';
/**
 * Life event checklist: one list across every department for moving, a new baby, marriage or a name change,
 * losing a job, retiring, or the death of a loved one. Ticks, "not for me" and the event date are saved on
 * this device only. Renders the `lifeEventsChecklist` tool part in every state.
 *
 * In a conversation the answer above already states the verdict, so the hero carries state instead: a
 * countdown on a calendar leaf, progress, and who's involved. The event's lead line only appears when the
 * person switches to another event from inside the widget.
 *
 * The tool sends the finished checklist; the planner itself (planner.ts) is only downloaded when the person
 * switches events or changes the date.
 */
import { useMemo, useRef, useState } from 'react';
import { WidgetError } from '@/components/ui';
import { useDeviceItem } from '@/lib/device-store';
import { prefersReducedMotion, useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { LINKS, isEvent, type EventId, type Lang } from './facts';
import messages from './messages';
import { acceptDate, type ChecklistInput, type ChecklistOutput } from './model';
import { Picker } from './Picker';
import { PlannerError } from './PlannerError';
import { usePlanner, wantPlanner } from './planner';
import { PlanView } from './PlanView';
import { LifeEventsSkeleton } from './Skeleton';

/**
 * `dateFrom` is the conversation's date at the moment the person set `date` here: a correction made in the
 * widget outlives a reload of the same answer, and a new date from a later conversation still wins.
 */
type Saved = { done: string[]; skipped: string[]; date?: string | null; dateFrom?: string | null };
type Seed = ChecklistInput['preview'];

export function LifeEventsChecklist({ part }: WidgetProps<ChecklistInput, ChecklistOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return (
      <WidgetError
        title={t('error.title')}
        message={t('error.body')}
        fallback={{ href: LINKS.lifeEvents[locale === 'fr' ? 'fr' : 'en'], label: t('error.fallback') }}
      />
    );
  }
  if (part.state !== 'output-available' || !part.output) {
    const ev = part.input?.event;
    return <LifeEventsSkeleton event={isEvent(ev) ? ev : null} />;
  }
  return <Checklist initial={part.output} seed={part.input?.preview} />;
}

function Checklist({ initial, seed }: { initial: ChecklistOutput; seed?: Seed }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  // Lab fixtures are planned for a fixed day and stay on it, so the day counts in their names hold.
  const today = useToday(initial.today, { pinned: !!seed?.pinned });
  const lang: Lang = locale === 'fr' ? 'fr' : locale === 'en' ? 'en' : initial.lang;

  const [event, setEvent] = useState<EventId | null>(initial.event);
  const [saved, save] = useDeviceItem<Saved>(`life-events:${event ?? 'none'}`, {
    label: t('saved.label', { event: event ? t(`event.${event}.name`) : '' }),
    kind: 'checklist',
  });
  // The date: what was just typed; else, for the event the conversation was about, the person's own correction
  // to this answer's date (even "no date"), then the conversation's date; else whatever is saved on this device.
  const [dateEdit, setDateEdit] = useState<{ event: EventId | null; value: string | null } | null>(null);
  const fromChat = event === initial.event ? initial.date : null;
  const corrected = !!saved && saved.date !== undefined && saved.dateFrom === fromChat;
  const wanted = dateEdit && dateEdit.event === event ? dateEdit.value : corrected ? (saved.date ?? null) : (fromChat ?? saved?.date ?? null);
  // A date saved before, or for another day, that is now further ahead than the event allows is left out.
  const date = acceptDate(event, wanted, today);

  // The tool's own checklist is used as it came; anything else (another event, date, day or language) is
  // planned here, once the planner has arrived.
  const asSent = event === initial.event && date === initial.date && today === initial.today && lang === initial.lang;
  const { build, failed } = usePlanner(!asSent);
  const planned = useMemo(
    () => (asSent ? initial : build ? build({ event, date, region: initial.region, lang }, today) : null),
    [asSent, build, event, date, today, lang, initial],
  );
  // While the planner is on its way: the same event keeps the checklist it has, another one shows its skeleton.
  const data = planned ?? (event === initial.event ? initial : null);
  // The planner didn't arrive (offline): say so, with a way to try again and a way back to the answer's checklist.
  const stuck = failed && !planned;

  const pick = (id: EventId | null) => {
    wantPlanner();
    setEvent(id);
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    // The chip or card that was pressed is gone with its view: focus moves to the view that replaced it.
    requestAnimationFrame(() => {
      rootRef.current?.focus({ preventScroll: true });
      rootRef.current?.scrollIntoView({ behavior, block: 'nearest' });
    });
  };

  const plan = data?.plan ?? null;
  const preview = event === initial.event ? seed : undefined;
  const done = saved?.done ?? preview?.done ?? [];
  const skipped = saved?.skipped ?? preview?.skipped ?? [];
  const persist = (next: Partial<Saved>) => {
    if (!plan) return;
    const s: Saved = { done, skipped, date, dateFrom: saved?.dateFrom, ...next };
    const counted = plan.tasks.filter((x) => x.phase !== 'auto' && !s.skipped.includes(x.id));
    save(s, { detail: t('saved.detail', { done: counted.filter((x) => s.done.includes(x.id)).length, total: counted.length }) });
  };
  const setDate = (value: string | null) => {
    wantPlanner();
    setDateEdit({ event, value });
    persist({ date: value, dateFrom: fromChat });
  };

  // One wrapper around every view, so switching (to an event, or back to all six) scrolls the same element.
  return (
    <div ref={rootRef} tabIndex={-1} className="scroll-mt-4 rounded-card outline-none">
      {stuck ? <PlannerError onRetry={wantPlanner} onBack={event !== initial.event ? () => pick(initial.event) : undefined} /> : null}
      {!data ? (
        stuck ? null : <LifeEventsSkeleton event={event} />
      ) : !plan ? (
        <Picker data={data} onPick={pick} />
      ) : (
        <PlanView
          key={plan.event}
          data={data}
          plan={plan}
          intro={event !== initial.event}
          origin={event !== initial.event ? initial.event : null}
          done={done}
          skipped={skipped}
          date={date}
          onDate={setDate}
          onToggle={(id) => persist({ done: done.includes(id) ? done.filter((x) => x !== id) : [...done, id] })}
          onSkip={(id, on) => persist({ skipped: on ? [...skipped, id] : skipped.filter((x) => x !== id) })}
          onPick={pick}
        />
      )}
    </div>
  );
}
