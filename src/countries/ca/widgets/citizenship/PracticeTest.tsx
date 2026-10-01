'use client';
/**
 * Citizenship practice test (citizenshipPracticeTest): one question at a time, instant feedback with the
 * Discover Canada chapter each answer comes from, and a score against the real pass mark (75%).
 * The answer carries its questions in both languages, so they follow the reader's language. The full
 * question bank is a separate chunk behind `import('./quiz-bank')`, the only client path to it: it is fetched
 * when the last question is answered, so a new set is instant from the score screen. (In `next dev` a ~600-byte
 * Turbopack loader stub named quiz-bank loads with the widget; the bank itself does not.)
 */
import { Suspense, use, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { GraduationCap, RotateCcw, Shuffle, Trophy } from 'lucide-react';
import { Badge, Button, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import messages from './messages';
import { TEST, URLS, testSources } from './data';
import { PracticeQuestion } from './PracticeQuestion';
import { Review, Score, type Best } from './PracticeScore';
import { choiceOrder, type Question, type QuizOutput, type Topic } from './quiz';
import { useLang } from './shared';
import { CzSkeleton } from './Skeletons';

/** The whole question bank (both languages): its own chunk, fetched the first time a new set is wanted. */
type Bank = typeof import('./quiz-bank');
let bankPromise: Promise<Bank> | undefined;
/** One cached promise (so `use()` can read it); a failed fetch is forgotten, so the next request tries again. */
const loadBank = () =>
  (bankPromise ??= import('./quiz-bank').catch((e: unknown) => {
    bankPromise = undefined;
    throw e;
  }));
let settledBank: Promise<Bank | null> | undefined;
/** The bank for `use()`: resolves to null when it can't be fetched, so the widget shows its error state. */
const bankOrNull = () => (settledBank ??= loadBank().catch(() => null));
/** A ref callback with a stable identity: focuses the heading it is given when that heading mounts. */
const focusOnMount = (el: HTMLHeadingElement | null) => el?.focus();
const newSeed = () => Math.floor(Math.random() * 2_000_000_000);

type Input = { count?: number; topic?: Topic | 'all' };

export function CitizenshipPracticeTest({ part }: WidgetProps<Input, QuizOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  const error = <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.guide[lang], label: t('test.errorFallback') }} />;
  if (part.state === 'output-error') return error;
  const skeleton = <CzSkeleton kind="test" title={t('test.title')} subtitle={t('test.subtitle')} icon={GraduationCap} tone="glacier" label={t('test.loading')} />;
  if (part.state !== 'output-available' || !part.output) return skeleton;
  if (!part.output.items) {
    return (
      <Suspense fallback={skeleton}>
        <SavedQuiz output={part.output} error={error} />
      </Suspense>
    );
  }
  return <Quiz output={part.output} items={part.output.items} />;
}

/** An answer saved on this device before the questions travelled with it: look its ids up in the bank. */
function SavedQuiz({ output, error }: { output: QuizOutput; error: ReactNode }) {
  const items = use(bankOrNull())?.questionsFor(output.ids);
  return items?.length ? <Quiz output={output} items={items} /> : error;
}

function Quiz({ output, items }: { output: QuizOutput; items: Question[] }) {
  const t = useMessages(messages);
  const lang = useLang();
  const [questions, setQuestions] = useState(items);
  // The topic of the set on screen: a full mock test started from a topic quiz covers every topic.
  const [topic, setTopic] = useState(output.topic);
  // Shuffles the choices of each question; a new one for every new round.
  const [seed, setSeed] = useState(output.seed ?? 1);
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [best, saveBest] = useDeviceItem<Best>('citizenship:test', {
    label: t('test.savedLabel'),
    kind: 'plan',
  });
  const [shared, setShared] = useState(false);
  /** A new set is on its way (the bank is being fetched). */
  const [drawing, setDrawing] = useState(false);
  /** Questions already answered in this sitting, so a "new" set really is new while the bank allows. */
  const seen = useRef(items.map((x) => x.id));
  // Each question (and the score) mounts fresh; once the person has moved on from the first one, focus goes to
  // the new heading so keyboard and screen reader users follow along. Stable, so a re-render never refocuses.
  const focusHeading = index > 0 || round > 0 ? focusOnMount : undefined;

  const total = questions.length;
  const done = index >= total;
  const q = questions[Math.min(index, total - 1)];
  // `answers` and `picked` hold the index in the original choice list; `order` maps display -> original.
  const picked = q ? answers[q.id] : undefined;
  const order = q ? choiceOrder(q, seed) : [];
  const correct = questions.filter((x) => answers[x.id] === x.answer).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  // The real pass mark (15 of 20), on the exact ratio, never on the rounded percentage.
  const pass = total > 0 && correct / total >= TEST.toPass / TEST.questions;

  const choose = (i: number) => {
    if (!q || picked != null) return;
    const next = { ...answers, [q.id]: i };
    setAnswers(next);
    if (index === total - 1) {
      // The score screen offers new sets: start fetching the bank now so they are instant.
      void loadBank().catch(() => {});
      const c = questions.filter((x) => next[x.id] === x.answer).length;
      if (!best || c / total > best.correct / best.total || (c / total === best.correct / best.total && total > best.total)) {
        saveBest({ correct: c, total }, { detail: t('test.savedDetail', { correct: c, total }) });
      }
    }
  };
  const next = () => setIndex((n) => n + 1);
  const restart = (set: Question[], of: Topic | 'all' = topic) => {
    setQuestions(set);
    setTopic(of);
    setSeed(newSeed());
    setAnswers({});
    setIndex(0);
    setRound((r) => r + 1);
    setShared(false);
  };
  /** A new set from the bank; if it can't be fetched (offline), the same questions again, reshuffled. */
  const draw = async (count: number, of: Topic | 'all') => {
    if (drawing) return;
    setDrawing(true);
    try {
      const bank = await loadBank();
      const set = bank.drawQuestions(count, of, newSeed(), seen.current);
      const ids = set.map((x) => x.id);
      // The bank ran out of unseen questions for this request: it started over, and so does the list.
      seen.current = ids.some((id) => seen.current.includes(id)) ? ids : [...seen.current, ...ids];
      restart(set, of);
    } catch {
      restart(questions);
    } finally {
      setDrawing(false);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (done || !q) return;
    const n = Number(e.key);
    if (n >= 1 && n <= order.length) {
      e.preventDefault();
      choose(order[n - 1]);
    }
  };

  const share = async () => {
    const text = t('test.shareText', { correct, total });
    const url = `${window.location.origin}/?q=${encodeURIComponent(t('test.shareQuestion'))}`;
    try {
      if (navigator.share) await navigator.share({ text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShared(true);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <WidgetShell
      icon={GraduationCap}
      tone="glacier"
      title={t('test.title')}
      subtitle={t('test.subtitle')}
      badge={
        <Badge mono>
          <bdi>{t('test.badge', { count: total })}</bdi>
        </Badge>
      }
      sources={output.lang === lang ? output.sources : testSources(lang)}
      handoff={{
        href: URLS.guide[lang],
        label: t('test.handoff'),
      }}
      footnote={
        <>
          <span className="block leading-snug text-pretty">{t('test.handoffNote')}</span>
          <span className="mt-1.5 block leading-snug text-pretty">{t('test.footnote')}</span>
        </>
      }
      className="@container"
    >
      {/* The number keys answer once focus is in here; Enter (next question) is handled by the question itself. */}
      <div className="px-5 sm:px-6" onKeyDown={onKey}>
        {/* Progress: one segment per question */}
        <div className="flex items-center justify-between gap-3">
          <p className="m-0 font-mono text-[12px] font-medium uppercase tracking-[.1em] text-ink-2" aria-hidden>
            {done ? t('test.score.label') : t('test.progress', { n: index + 1, total })}
          </p>
          {topic !== 'all' ? <Badge tone="info">{t(`test.topic.${topic}`)}</Badge> : null}
        </div>
        <ol className="m-0 mt-2.5 flex list-none gap-1 p-0" aria-hidden>
          {questions.map((x, i) => {
            const a = answers[x.id];
            return (
              <li
                key={x.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-300',
                  a == null ? (i === index ? 'bg-ink-3' : 'bg-hair-2') : a === x.answer ? 'bg-pine' : 'bg-maple',
                )}
              />
            );
          })}
        </ol>
        <p className="sr-only" aria-live="polite">
          {done ? '' : t('test.progressSr', { n: index + 1, total, correct })}
        </p>

        {!done && q ? (
          <PracticeQuestion key={`${round}-${q.id}`} q={q} order={order} picked={picked} last={index === total - 1} onChoose={choose} onNext={next} headingRef={focusHeading} />
        ) : null}

        {done ? <Score correct={correct} total={total} pct={pct} pass={pass} best={best} headingRef={focusHeading} onShare={share} shared={shared} /> : null}
      </div>

      {done ? (
        <>
          <Review questions={questions} answers={answers} />
          <div className="flex flex-wrap gap-2 px-5 pt-5 sm:px-6">
            <Button className="@max-md:w-full" icon={Shuffle} variant="primary" disabled={drawing} onClick={() => draw(total, topic)}>
              {t('test.again')}
            </Button>
            {correct < total ? (
              <Button className="@max-md:w-full" icon={RotateCcw} onClick={() => restart(questions.filter((x) => answers[x.id] !== x.answer))}>
                {t('test.retryMissed')}
              </Button>
            ) : null}
            {total < TEST.questions ? (
              <Button className="@max-md:w-full" icon={Trophy} disabled={drawing} onClick={() => draw(TEST.questions, 'all')}>
                {t('test.full')}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {/* The real test's four facts under their own label: equal cells in a narrow column, one dotted line when there is room. */}
      <div className="px-5 pt-6 sm:px-6">
        <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('test.real.label')}</p>
        <ul className="m-0 mt-1.5 grid list-none grid-cols-2 gap-x-4 gap-y-1 p-0 text-[13.5px] text-ink-2 @2xl:flex @2xl:gap-x-0">
          {(['questions', 'minutes', 'pass', 'attempts'] as const).map((k) => (
            <li key={k} className="@2xl:whitespace-nowrap @2xl:not-first:before:px-2 @2xl:not-first:before:text-ink-3 @2xl:not-first:before:content-['·']">
              {/* Isolated, so "20 questions" keeps its order in a right-to-left page. */}
              <bdi>{t(`test.real.${k}`, { count: { questions: TEST.questions, minutes: TEST.minutes, pass: TEST.toPass, attempts: TEST.attempts }[k], total: TEST.questions })}</bdi>
            </li>
          ))}
        </ul>
      </div>
    </WidgetShell>
  );
}

