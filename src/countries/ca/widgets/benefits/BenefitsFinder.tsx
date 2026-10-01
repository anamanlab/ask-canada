'use client';
/**
 * Benefits finder: a life-situation questionnaire that matches people to federal programs, with estimated
 * amounts, next payment dates and the official page for each. Answers recalculate instantly on the device
 * (same pure functions as the tool), and can be saved on this device only.
 *
 * This file holds the widget's states and the answers; the parts live in ./finder (Hero, ProgramCard, Others,
 * and the Questionnaire, which is loaded on demand).
 */
import { lazy, Suspense, useReducer, useRef, useState, useTransition } from 'react';
import { Bookmark, BookmarkCheck, FileText, HandCoins, Smartphone } from 'lucide-react';
import { Badge, Button, LiveRegion, Notice, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { prefersReducedMotion } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import type { FinderOutput } from './build';
import { DEFAULT_PROFILE, findBenefits, sameProfile, type Profile } from './calc';
import { answers, initialAnswers, isSaved, saidIn, type Saved } from './finder/answers';
import { Hero } from './finder/Hero';
import { Others } from './finder/Others';
import { ProgramCard } from './finder/ProgramCard';
import { OFFICIAL } from './links';
import messages from './messages';
import { AgesPrompt, isolate, useFooterSources, useUpcoming, WHOLE } from './parts';
import { FinderSkeleton } from './skeletons';

type Input = Partial<Profile> & { lang?: 'en' | 'fr' };

const loadQuestionnaire = () => import('./finder/Questionnaire');
const Questionnaire = lazy(() => loadQuestionnaire().then((m) => ({ default: m.Questionnaire })));
/** Pointer or focus reached an "edit" control: fetch the questions before the click lands. */
const wantQuestionnaire = () => {
  void loadQuestionnaire().catch(() => {});
};

export function BenefitsFinder(props: WidgetProps<Input, FinderOutput>) {
  // The widget speaks the answer's language (a French question in an English interface gets a French widget).
  // While that language's core strings load, the skeleton holds the widget's place.
  return (
    <AnswerLang lang={props.part.output?.lang ?? props.part.input?.lang} fallback={<FinderLoading />}>
      <FinderStates {...props} />
    </AnswerLang>
  );
}

function FinderLoading() {
  const t = useMessages(messages);
  return <FinderSkeleton title={t('title')} subtitle={isolate(t('subtitle'))} icon={HandCoins} tone="pine" label={t('loading')} />;
}

function FinderStates({ part }: WidgetProps<Input, FinderOutput>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: OFFICIAL.finder[locale === 'fr' ? 'fr' : 'en'], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <FinderLoading />;
  // The same skeleton stays up while the questions load (a question with no income opens on them).
  return (
    <Suspense fallback={<FinderLoading />}>
      <Finder data={part.output} />
    </Suspense>
  );
}

function Finder({ data }: { data: FinderOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [{ profile, known, ages }, change] = useReducer(answers, data, initialAnswers);
  const [editing, setEditing] = useState(!data.ready);
  const [, startTransition] = useTransition();
  const result = findBenefits(profile, { earningsKnown: known.income, workKnown: known.work });
  const payments = useUpcoming(data.payments.next, data.today, data.pinned);
  const sources = useFooterSources(data.sources, data.lead);
  const [stored, save] = useDeviceItem<Saved>('benefits:answers', { label: t('saved.label'), kind: 'plan' });
  const saved = isSaved(stored) ? stored : null;

  const set = (patch: Partial<Profile>) => change({ type: 'answer', patch });

  // Each of these unmounts the button that was pressed: move focus (and the view) to what replaced it.
  const heroRef = useRef<HTMLDivElement>(null);
  const questionsHeading = useRef<HTMLHeadingElement | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement | null>(null);
  /** Which heading takes the focus when it mounts (nothing does on first load). */
  const focusNext = useRef<'questions' | 'results' | null>(null);
  const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');
  const toQuestions = (el: HTMLHeadingElement) => {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
  };
  const toResults = (el: HTMLHeadingElement) => {
    el.focus({ preventScroll: true });
    heroRef.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
  };
  const onQuestions = (el: HTMLHeadingElement | null) => {
    questionsHeading.current = el;
    if (!el || focusNext.current !== 'questions') return;
    focusNext.current = null;
    toQuestions(el);
  };
  const onResults = (el: HTMLHeadingElement | null) => {
    resultsHeading.current = el;
    if (!el || focusNext.current !== 'results') return;
    focusNext.current = null;
    toResults(el);
  };
  /** Show the questions or the results, and send the focus to their heading: now if it is on screen, else when it mounts. */
  const show = (what: 'questions' | 'results') => {
    const el = what === 'questions' ? questionsHeading.current : resultsHeading.current;
    focusNext.current = el ? null : what;
    if (what === 'questions') {
      // A transition: the results stay on screen until the questions have loaded.
      startTransition(() => setEditing(true));
      if (el) toQuestions(el);
    } else {
      setEditing(false);
      if (el) toResults(el);
    }
  };
  const done = () => {
    change({ type: 'reviewed' });
    show('results');
  };
  // Saved answers are offered only while this answer has no income of its own: the question gave none and
  // nothing has been typed yet. They load with what this question did say ("I lost my job") on top.
  const said = saidIn(data);
  const offerSaved = saved != null && !data.ready && !known.income && !sameProfile({ ...saved, ...said }, profile);
  const loadSaved = () => {
    if (!saved) return;
    change({ type: 'load', saved, said });
    // Saved without an income: the questions stay open, as they were when it was saved.
    show(saved.given?.income === false && said.income === undefined ? 'questions' : 'results');
  };

  const shown = result.matches.filter((m) => m.status !== 'no');
  const others = result.matches.filter((m) => m.status === 'no');
  const savedNow = saved != null && sameProfile(saved, profile);
  // Nothing to save until an answer is the person's own: one the question gave, or one they set or confirmed here.
  const canSave = data.answered.length > 0 || Object.values(known).some(Boolean) || !sameProfile(profile, DEFAULT_PROFILE);
  const kids = profile.childrenUnder6 + profile.children6to17;
  // What the estimates are based on, for the programs actually shown: OAS/GIS rates are quarterly and the workers
  // benefit uses tax-year amounts. With nothing shown, no estimates or payment dates to explain.
  const estimated = new Set(shown.filter((m) => m.annual != null || m.upTo != null).map((m) => m.id));
  const note = shown.length
    ? [
        t('note.estimate'),
        estimated.has('oas') || estimated.has('gis') ? t('note.oasRates') : '',
        estimated.has('cwb') ? t('note.cwbRates') : '',
      ]
        .filter(Boolean)
        .join(' ') + ` · ${data.payments.live ? t('note.live') : t('note.fallback')}`
    : t('note.checked');

  return (
    <WidgetShell
      icon={HandCoins}
      tone="pine"
      title={t('title')}
      subtitle={isolate(t('subtitle'))}
      badge={<Badge icon={Smartphone} mono>{t('badge.device')}</Badge>}
      sources={sources}
      handoff={{ href: data.handoff.finder, label: t('handoff.finder'), note: isolate(t('handoff.finderNote')) }}
      secondaryAction={
        canSave ? (
          <Button
            icon={savedNow ? BookmarkCheck : Bookmark}
            size="lg"
            className="@max-xl:w-full"
            onClick={() => save({ ...profile, given: known }, { detail: t('saved.detail', { count: shown.length, amount: fmt.money(result.total, WHOLE) }) })}
          >
            {savedNow ? t('action.saved') : t('action.save')}
          </Button>
        ) : undefined
      }
      footnote={<bdi>{t('footnote.device')}</bdi>}
      className="@container"
    >
      {/* The button's label swaps; a region of its own announces the save reliably. */}
      <LiveRegion text={savedNow ? t('action.saved') : ''} delay={200} />
      <Hero
        heroRef={heroRef}
        result={result}
        payments={payments}
        eiApply={data.links.ei.action}
        onEdit={() => show('questions')}
        onUseSaved={offerSaved ? loadSaved : undefined}
        onEditIntent={wantQuestionnaire}
        profile={profile}
        known={known}
        editing={editing}
      />

      {/* A count without ages: one question, until it's answered here (then it stays, marked done). Once the
          questionnaire's two child counters have been set or seen, the ages are theirs and the question goes. */}
      {(ages === 'unknown' || ages === 'prompt') && !editing && kids > 0 ? (
        <AgesPrompt kids={kids} under6={profile.childrenUnder6} done={ages === 'prompt'} className="mx-3 mt-3 @xl:mx-4" onChange={(n) => change({ type: 'under6', count: n })} />
      ) : null}

      {editing ? (
        <Questionnaire headingRef={onQuestions} profile={profile} set={set} result={result} known={known} onDone={done} />
      ) : (
        <>
          <WidgetSection>
            {/* With no matches the hero already says so (and points to provincial programs): no empty list here. */}
            <div className={cn('flex items-center justify-between gap-3', shown.length ? 'mb-3.5' : 'sr-only')}>
              <h4 ref={onResults} tabIndex={-1} className="m-0 scroll-mt-24 font-mono text-[12px] font-medium uppercase tracking-[.12em] text-ink-2 focus:outline-none">
                <bdi>{t('results.title')}</bdi>
              </h4>
              <span className="font-mono text-[12px] text-ink-3">
                <bdi>{t('results.count', { count: shown.length })}</bdi>
              </span>
            </div>
            {shown.length ? (
              <ul className="m-0 mb-3 grid list-none gap-2.5 p-0">
                {shown.map((m, i) => (
                  <ProgramCard key={m.id} m={m} i={i} links={data.links} payments={payments} profile={profile} known={known} agesUnknown={ages === 'unknown'} />
                ))}
              </ul>
            ) : null}
            {/* Title and body in one isolate, so an English or French notice reads in order on a right-to-left page. */}
            <Notice tone="info" icon={FileText}>
              <bdi>
                <strong className="font-semibold text-ink">{t('notice.taxes.title')}</strong> {shown.length ? t('notice.taxes.body') : t('notice.taxes.bodyNone')}
              </bdi>
            </Notice>
          </WidgetSection>
          {others.length ? <Others others={others} links={data.links} /> : null}
          <p className="m-0 px-5 pt-4 text-[12.5px] leading-snug text-ink-3 @xl:px-6">
            <bdi>{note}</bdi>
          </p>
        </>
      )}
    </WidgetShell>
  );
}
