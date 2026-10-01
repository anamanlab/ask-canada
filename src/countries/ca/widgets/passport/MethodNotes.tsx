'use client';
/**
 * The conditions and fine print for the chosen way to apply, folded under one row with a one-line summary.
 * With a trip that needs express or urgent pick-up, the pick-up specifics replace the generic in-person notes.
 */
import { Disclosure } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { isolate, isolateItem } from './shared';
import type { Rush } from './timelineModel';
import type { Method, PlannerOutput } from './types';

/** Online has one more condition to state (damaged/seized/surrendered, observations). */
const NOTES: Record<Method | 'rush', string[]> = { online: ['1', '2', '3', '4'], 'in-person': ['1', '2', '3'], mail: ['1', '2', '3'], rush: ['1', '2', '3'] };

export function MethodNotes({ plan, method, rush, headingLevel }: { plan: PlannerOutput; method: Method; rush: Rush | null; headingLevel?: 4 | 5 }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // Express may also make the trip (see the answer card): the cheaper service is the second note, not tile copy.
  const notes = rush
    ? [
        t('notes.rush.1', { kind: rush.kind }),
        ...(rush.kind === 'urgent' && plan.trip?.expressMayFit ? [t('notes.rush.expressToo', { fee: fmt.money(plan.fees.expressPickup) })] : []),
        ...NOTES.rush.slice(1).map((n) => t(`notes.rush.${n}`)),
      ]
    : NOTES[method].map((n) => t(`notes.${method}.${n}`, { pickup: fmt.money(plan.fees.standardPickup) }));
  const kind = rush ? 'rush' : method;
  return (
    <Disclosure title={isolate(t(`notes.title.${kind}`))} summary={isolate(t(`notes.summary.${kind}`))} headingLevel={headingLevel}>
      <ul className="m-0 mb-3 grid list-none gap-2.5 p-0">
        {notes.map((n) => (
          <li key={n} className="flex gap-2.5 text-[14.5px] leading-snug text-ink-2">
            <span className="mt-[8px] size-[5px] shrink-0 rounded-full bg-ink-3 opacity-60" aria-hidden />
            {isolateItem(n)}
          </li>
        ))}
      </ul>
    </Disclosure>
  );
}
