'use client';
/** The quieter parts under a checklist's steps: what was set aside ("Not for me"), and the way to another event. */
import { useId, useState, type Ref } from 'react';
import { LayoutGrid, Undo2 } from 'lucide-react';
import { Chip } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { EVENTS, type EventId } from './facts';
import messages from './messages';
import { messageValues, taskKey, type PlanTask } from './model';
import { EVENT_ICONS } from './parts';
import { wantPlanner } from './planner';

type SkippedProps = {
  ev: EventId;
  tasks: PlanTask[];
  onRestore: (task: PlanTask) => void;
  /** The Show/Hide toggle: where focus lands when a skipped step leaves no row to move to. */
  toggleRef: Ref<HTMLButtonElement>;
};

/** Steps marked "Not for me": one quiet row, with the list (and "Add back") a tap away. */
export function SkippedList({ ev, tasks, onRestore, toggleRef }: SkippedProps) {
  const t = useMessages(messages);
  const { intl } = useLocale();
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="border-t border-hair py-2">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        {/* One phrase in one direction, so a fallback-language count keeps its order in a right-to-left page. */}
        <bdi id={`${id}-n`} className="text-[14px] text-ink-2">
          {t('skipped.title', { count: tasks.length })}
        </bdi>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={show}
          aria-controls={id}
          aria-describedby={`${id}-n`}
          onClick={() => setShow(!show)}
          className="min-h-11 rounded-full px-2 text-[14px] font-medium text-ink underline decoration-hair-2 underline-offset-[3px] hover:decoration-ink"
        >
          {show ? t('skipped.hide') : t('skipped.show')}
        </button>
      </div>
      {/* Always in the DOM (hidden when collapsed) so the toggle's aria-controls points at something. */}
      <ul id={id} hidden={!show} className="m-0 grid list-none gap-0.5 p-0">
        {tasks.map((task) => {
          const title = t(taskKey(ev, task.id, 'title', task.variant), messageValues(intl));
          return (
            <li key={task.id} className="flex min-h-11 items-center justify-between gap-3 text-[14.5px] text-ink-3">
              <span className="min-w-0">{title}</span>
              <button
                type="button"
                onClick={() => onRestore(task)}
                aria-label={t('task.restoreLabel', { task: title })}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 font-medium text-ink hover:text-ink-2"
              >
                <Undo2 className="size-4 flip-rtl" aria-hidden />
                {t('task.restore')}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** The other events. The chips wrap at every width, so each destination (and "All life events") is always in view: no sideways scroll. */
export function SwitchNav({ current, onPick }: { current: EventId; onPick: (id: EventId | null) => void }) {
  const t = useMessages(messages);
  const id = useId();
  return (
    <nav aria-labelledby={id} className="mt-3 border-t border-hair px-5 pt-4 sm:px-6">
      <h4 id={id} className="m-0 mb-2.5 text-[13.5px] font-medium text-ink-3">
        {t('switch.label')}
      </h4>
      {/* Hovering or focusing a chip starts the planner download, so the switch itself is instant. */}
      <ul onPointerEnter={wantPlanner} onFocus={wantPlanner} className="m-0 flex list-none flex-wrap gap-2 p-0">
        {EVENTS.filter((x) => x !== current).map((x) => (
          <li key={x}>
            <Chip icon={EVENT_ICONS[x]} onClick={() => onPick(x)} className="min-h-11 whitespace-nowrap text-[14px]">
              {t(`event.${x}.name`)}
            </Chip>
          </li>
        ))}
        <li>
          <Chip icon={LayoutGrid} onClick={() => onPick(null)} className="min-h-11 whitespace-nowrap text-[14px]">
            {t('switch.all')}
          </Chip>
        </li>
      </ul>
    </nav>
  );
}
