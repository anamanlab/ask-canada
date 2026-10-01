'use client';
/**
 * One practice question: the chapter it comes from, the choices (shuffled by the parent), and once
 * answered, the explanation with its Discover Canada chapter and the button to move on.
 */
import type { KeyboardEvent, Ref } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Button, ExternalLink } from '@/components/ui';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { CHAPTERS, chapterUrl } from './data';
import type { Question as QuizQuestion } from './quiz';
import { useLang } from './shared';

const LETTERS = ['A', 'B', 'C', 'D'];

/**
 * The explanation and the "Next" button appear below the choices, often under the chat's question bar on a
 * phone: bring them into view when they mount (the scroll margins on the block leave room for the bars).
 */
const reveal = (el: HTMLDivElement | null) => el?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

export function PracticeQuestion({
  q,
  order,
  picked,
  last,
  onChoose,
  onNext,
  headingRef,
}: {
  q: QuizQuestion;
  /** Display position -> index in the question's choice list. */
  order: number[];
  /** The chosen answer (index in the choice list), once answered. */
  picked?: number;
  last: boolean;
  onChoose: (choice: number) => void;
  onNext: () => void;
  /** Receives the question heading when it mounts, so focus can follow the person from question to question. */
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const t = useMessages(messages);
  const lang = useLang();
  const answered = picked != null;
  /** Enter moves on once answered, from the question heading or a choice (links and the Next button keep their own Enter). */
  const onEnter = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' || !answered) return;
    e.preventDefault();
    onNext();
  };
  return (
    <div className="pt-5 motion-safe:animate-[fade-in_.35s_ease_both]">
      <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-glacier">{t(`test.chapter.${q.chapter}`)}</p>
      <h4 ref={headingRef} tabIndex={-1} onKeyDown={onEnter} className="m-0 mt-1.5 font-serif text-[23px] leading-[1.2] tracking-[-.015em] text-ink outline-none [font-variation-settings:'opsz'_32]">
        {q.q[lang]}
      </h4>
      <ul className="m-0 mt-4 grid list-none gap-2 p-0" aria-label={t('test.choicesLabel')}>
        {order.map((i, pos) => {
          const isPicked = picked === i;
          const state = !answered ? 'idle' : i === q.answer ? 'right' : isPicked ? 'wrong' : 'dim';
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onChoose(i)}
                onKeyDown={onEnter}
                aria-pressed={isPicked}
                aria-disabled={answered}
                className={cn(
                  'flex min-h-[52px] w-full items-center gap-3 rounded-field border px-3.5 py-3 text-start text-[15px] leading-snug transition-[background-color,border-color,opacity,transform] duration-200',
                  state === 'idle' && 'border-hair bg-card hover:-translate-y-px hover:border-hair-2 hover:shadow-sm',
                  state === 'right' && 'border-pine/40 bg-pine-wash',
                  state === 'wrong' && 'border-maple/40 bg-maple-wash',
                  state === 'dim' && 'border-hair bg-card opacity-60',
                  answered && 'cursor-default',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full border font-mono text-[12px] font-semibold',
                    state === 'right' ? 'border-pine bg-pine text-card' : state === 'wrong' ? 'border-maple bg-maple text-card' : 'border-hair-2 text-ink-2',
                  )}
                >
                  {state === 'right' ? <Check className="size-4" strokeWidth={3} /> : state === 'wrong' ? <X className="size-4" strokeWidth={3} /> : LETTERS[pos]}
                </span>
                <span className="min-w-0 text-ink">{q.choices[lang][i]}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {answered ? (
        <div ref={reveal} className="scroll-mt-24 scroll-mb-28">
          <div className="mt-3 rounded-tile bg-paper-2 px-4 py-3.5" role="status">
            <p className={cn('m-0 text-[15px] font-semibold', picked === q.answer ? 'text-pine' : 'text-maple-ink')}>
              {picked === q.answer ? t('test.correct') : t('test.wrong', { answer: q.choices[lang][q.answer] })}
            </p>
            <p className="m-0 mt-1 text-[14.5px] leading-snug text-ink-2">{q.why[lang]}</p>
            <p className="m-0 mt-2 text-[13.5px]">
              <ExternalLink href={chapterUrl(q.chapter, lang)}>{t('test.from', { chapter: CHAPTERS[q.chapter].title[lang] })}</ExternalLink>
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" iconEnd={ArrowRight} onClick={onNext}>
              {last ? t('test.finish') : t('test.next')}
            </Button>
          </div>
        </div>
      ) : (
        // Keyboard tip where there is likely a keyboard (wide column); always shown, so the spacing never looks accidental.
        <p className="m-0 mt-3 hidden text-[13px] leading-snug text-ink-3 @md:block">
          {t('test.keys', { n: String(order.length) })}
        </p>
      )}
    </div>
  );
}
