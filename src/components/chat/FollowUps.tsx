'use client';
/**
 * "Ask next": suggested follow-up questions under the latest answer.
 *
 * When an answer has just finished streaming (`nudge`) and its chips landed under the docked composer,
 * they ease into view, but only while the reader is still at the top of that answer, the answer's start
 * stays on screen, and a short nudge reveals all of them (a long answer keeps its reading position).
 */
import { useEffect, useId, useRef, type RefObject } from 'react';
import { CornerDownRight } from 'lucide-react';
import { useLocale } from '@/lib/i18n/provider';
import { useChatCommands } from './actions';
import { useChatLayout } from './ChatLayout';

export function FollowUps({ questions, nudge, answerRef }: { questions: string[]; nudge: boolean; answerRef: RefObject<HTMLElement | null> }) {
  const { t } = useLocale();
  const { send } = useChatCommands();
  const layout = useChatLayout();
  const headingId = useId();
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!nudge) return;
    let inner = 0;
    // Two frames: the answer's final layout (sources, actions) has been painted.
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const answer = answerRef.current;
        const chips = section.current;
        if (!answer || !chips) return;
        const { top: bandTop, bottom: bandBottom } = layout.band();
        const top = answer.getBoundingClientRect().top;
        const overlap = chips.getBoundingClientRect().bottom + 16 - bandBottom;
        if (overlap <= 0 || top > bandBottom || top < bandTop) return;
        if (overlap > Math.max(0, top - bandTop - 12)) return;
        if (overlap > 4) layout.scrollBy(overlap);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [nudge, answerRef, layout]);

  return (
    <section ref={section} className="ac-followups no-print" aria-labelledby={headingId}>
      <h3 id={headingId}>{t('chat.askNext')}</h3>
      <ul>
        {questions.map((q) => (
          <li key={q}>
            <button type="button" className="ac-fu" onClick={() => send(q)}>
              <CornerDownRight className="size-4 shrink-0 text-maple flip-rtl" aria-hidden />
              <span dir="auto">{q}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
