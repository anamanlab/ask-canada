'use client';
/**
 * The practice test's last screen: the score against the real pass mark (with the best score saved on this
 * device and a share button), then a review of the questions that were missed.
 */
import type { Ref } from 'react';
import { Share2 } from 'lucide-react';
import { Button, ExternalLink, NumberTicker, WidgetSection } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from './messages';
import { CHAPTERS, chapterUrl } from './data';
import type { Question } from './quiz';
import { useLang } from './shared';

export type Best = { correct: number; total: number };

export function Score({
  correct,
  total,
  pct,
  pass,
  best,
  headingRef,
  onShare,
  shared,
}: {
  correct: number;
  total: number;
  pct: number;
  pass: boolean;
  best?: Best;
  /** Receives the verdict heading when it mounts, so focus can follow the person to the score. */
  headingRef?: Ref<HTMLHeadingElement>;
  onShare: () => void;
  shared: boolean;
}) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  return (
    <div
      className={cn(
        'mt-4 rounded-card border px-5 py-5',
        pass
          ? 'border-pine/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--pine)_16%,transparent),color-mix(in_oklab,var(--glacier)_12%,transparent)_55%,transparent)]'
          : 'border-maple/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_9%,transparent),color-mix(in_oklab,var(--amber)_10%,transparent))]',
      )}
    >
      <div>
        <div>
          {/* "7/10" is a number pair: keep it left-to-right in RTL, where it would otherwise read "10/7". */}
          <p className="m-0 font-serif text-[56px] leading-none tracking-[-.03em] text-ink [font-variation-settings:'opsz'_72]">
            {/* The counting number is for the eye; a screen reader gets the final score once. */}
            <bdi dir="ltr" aria-hidden>
              <NumberTicker value={correct} format={(n) => fmt.number(Math.round(n))} />
              <span className="text-ink-3">/{fmt.number(total)}</span>
            </bdi>
            <span className="sr-only">{t('test.score.sr', { correct, total })}</span>
          </p>
          <h4 ref={headingRef} tabIndex={-1} className={cn('m-0 mt-2 font-serif text-[24px] leading-tight tracking-[-.02em] outline-none', pass ? 'text-pine' : 'text-maple-ink')}>
            {pass ? t('test.score.pass') : t('test.score.fail')}
          </h4>
        </div>
      </div>
      <p className="m-0 mt-1.5 text-[14.5px] leading-snug text-ink-2">{pass ? t('test.score.passSub', { pct }) : t('test.score.failSub', { pct })}</p>
      <div className="relative mt-4" aria-hidden>
        <div className="h-2.5 overflow-hidden rounded-full bg-card/70">
          <span
            className={cn('block h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none', pass ? 'bg-pine' : 'bg-maple')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-ink" style={{ insetInlineStart: '75%' }} />
      </div>
      {/* Verdict, explanation and bar read in order; sharing comes last, after the numbers it shares. */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <dl className="m-0 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-3">
          <div className="flex gap-1.5">
            <dt>{t('test.score.passMark')}</dt>
            <dd className="m-0 font-semibold text-ink">{fmt.number(0.75, { style: 'percent' })}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t('test.score.best')}</dt>
            <dd className="m-0 font-semibold text-ink">
              {best
                ? t('test.score.value', {
                    correct: best.correct,
                    total: best.total,
                  })
                : t('test.score.bestNone')}
            </dd>
          </div>
        </dl>
        <Button icon={Share2} size="md" onClick={onShare} className="@max-md:w-full">
          {shared ? t('test.shared') : t('test.share')}
        </Button>
        {/* Announced from its own live region: a label change on a focused button is not read reliably. */}
        <span role="status" className="sr-only">
          {shared ? t('test.shared') : ''}
        </span>
      </div>
    </div>
  );
}

export function Review({ questions, answers }: { questions: Question[]; answers: Record<string, number> }) {
  const t = useMessages(messages);
  const lang = useLang();
  const missed = questions.filter((x) => answers[x.id] !== x.answer);
  return (
    <WidgetSection title={t('test.missed.title')} className="mt-5 border-t border-hair">
      {missed.length ? (
        <ul className="m-0 grid list-none gap-3 p-0">
          {missed.map((x) => (
            <li key={x.id} className="rounded-field border border-hair bg-card px-4 py-3">
              <p className="m-0 text-[14.5px] font-medium leading-snug text-ink">{x.q[lang]}</p>
              {/* The miss first, in the "wrong" colour; the right answer in ink, so a list of misses never reads as a list of wins. */}
              {answers[x.id] != null ? <p className="m-0 mt-1.5 text-[14px] leading-snug text-maple-ink">{t('test.missed.chose', { answer: x.choices[lang][answers[x.id]] })}</p> : null}
              <p className="m-0 mt-0.5 text-[14px] font-medium leading-snug text-ink">{t('test.missed.answer', { answer: x.choices[lang][x.answer] })}</p>
              <p className="m-0 mt-1.5 text-[13px]">
                <ExternalLink href={chapterUrl(x.chapter, lang)}>{t('test.from', { chapter: CHAPTERS[x.chapter].title[lang] })}</ExternalLink>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 text-[14.5px] text-ink-2">{t('test.missed.none')}</p>
      )}
    </WidgetSection>
  );
}
