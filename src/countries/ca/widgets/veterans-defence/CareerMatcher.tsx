'use client';
/**
 * CAF career matcher (`veteransDefenceCareers`). The tool returns every forces.ca career (live), and the
 * quiz re-matches on the device as answers change. Shortlist saved on this device only.
 */
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Anchor, Briefcase, ChefHat, Compass, Cpu, HardHat, HeartPulse, Megaphone, Plane, Shield, Siren, Truck, Wrench, X, type LucideIcon } from 'lucide-react';
import { Badge, Button, EmptyState, LinkButton, LiveRegion, Notice, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { CareerCard } from './CareerCard';
import { CATEGORIES, DEFAULT_ANSWERS, countsByCategory, matchCareers, type Answers, type CareersInput, type CareersOutput, type Category } from './careers';
import { FALLBACK, inLanguage, langOf } from './facts';
import { useListJoin, useSavedList } from './hooks';
import { CareersIcon, ServicePatches } from './HeroArt';
import { JoinFacts } from './JoinFacts';
import messages from './messages';
import { ChipGroup, Hero, Question } from './parts';
import { RefinePanel, refinementCount } from './RefinePanel';
import { ResultNotes, Shortlist } from './ResultExtras';
import { ShapedSkeleton } from './skeletons';

const CAT_ICON: Record<Category, LucideIcon> = {
  health: HeartPulse,
  computing: Cpu,
  engineering: HardHat,
  maintenance: Wrench,
  aviation: Plane,
  naval: Anchor,
  combat: Shield,
  safety: Siren,
  logistics: Truck,
  administration: Briefcase,
  hospitality: ChefHat,
  'public-relations': Megaphone,
};
/** Matches shown at first: 3 in a phone-width column, 4 (two rows of two) from @xl. */
const FIRST = 3;
const FIRST_WIDE = 4;
/**
 * "Show more" adds this many cards at a time, in any layout: the full list (110 careers) is never mounted in
 * one go, and in a phone-width column (one card wide) the rest of the widget stays in reach.
 */
const PAGE = 8;
/** Cards slide to their new place while the list is short; a long list just re-renders. */
const ANIMATE_UP_TO = FIRST_WIDE + PAGE;
/** Interest chips visible in a phone-width column before "Show all". */
const CHIPS_FIRST = 6;

export function CareerMatcher({ part, locale }: WidgetProps<CareersInput, CareersOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('careers.error.title')} message={t('careers.error.body')} fallback={{ href: FALLBACK.careers[langOf(locale, 'en')], label: t('careers.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <ShapedSkeleton title={t('careers.title')} subtitle={t('careers.subtitle')} iconNode={<CareersIcon />} label={t('careers.loading')} variant="careers" />;
  }
  return <Matcher output={part.output} />;
}

function Matcher({ output }: { output: CareersOutput }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  // The widget follows the UI language (names, links, source titles), like the passport planner: one language per card.
  const lang = langOf(locale, output.lang);
  const data = inLanguage(output, lang);
  const reduce = useReducedMotion();
  const join = useListJoin();
  const [answers, setAnswers] = useState<Answers>({ ...DEFAULT_ANSWERS, ...output.answers });
  const [query, setQuery] = useState(output.query);
  const [limit, setLimit] = useState(FIRST_WIDE);
  const listRef = useRef<HTMLDivElement>(null);
  const showMore = () => setLimit((n) => n + PAGE);
  const set = (patch: Partial<Answers>) => {
    setAnswers((a) => ({ ...a, ...patch }));
    setLimit(FIRST_WIDE);
  };
  const reset = () => {
    setAnswers(DEFAULT_ANSWERS);
    setQuery(null);
    setLimit(FIRST_WIDE);
  };
  const showFewer = () => {
    setLimit(FIRST_WIDE);
    // Back to the top of the list, so nobody is left far down the page under a list that just got short.
    listRef.current?.focus({ preventScroll: true });
    listRef.current?.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  const hits = query ? data.queryHits : [];
  const matches = matchCareers(data.careers, answers, hits);
  const counts = countsByCategory(data.careers, answers);
  // With a named job active ("pilot"), the list is that job's matches plus any interest picked: a category's
  // whole-catalogue count would promise more than the hero shows, so the chips drop their counts until it is removed.
  const queryActive = !!query && hits.length > 0;
  const shortlist = useSavedList('veterans-defence:shortlist', t('shortlist.label'), (next) => t('shortlist.detail', { count: next.length }));
  const savedCareers = data.careers.filter((c) => shortlist.has(c.slug));
  const shown = matches.slice(0, limit);
  const expanded = limit > FIRST_WIDE;
  // How many cards the next "Show more" adds: before the first tap a phone-width column shows one card fewer.
  const nextWide = Math.min(PAGE, matches.length - limit);
  const nextNarrow = expanded ? nextWide : Math.min(matches.length, FIRST_WIDE + PAGE) - FIRST;
  const narrowed = answers.interests.length > 0 || !!query || refinementCount(answers) > 0;
  const officerNeedsSchool = answers.path === 'officer' && answers.education === 1;
  // The recruiting allowance and signing bonuses are Regular Force only (forces.ca): hide them for the Reserve.
  const regular = answers.hours !== 'part-time';
  const asOf = fmt.date(data.asOf.slice(0, 10), { month: 'short', day: 'numeric', year: 'numeric' });
  const anyPriority = regular && shown.some((m) => m.career.priority);
  const anyPaidEdOnly = regular && shown.some((m) => m.career.priority && m.career.priorityPaidEdOnly);
  const resultsTitle = narrowed ? t('results.title') : t('results.titleAll');
  const anyIncentive = regular && shown.some((m) => m.career.recruitingAllowance || m.career.signingBonus);

  return (
    <WidgetShell
      iconNode={<CareersIcon />}
      title={t('careers.title')}
      subtitle={<bdi>{t('careers.subtitle')}</bdi>}
      sources={data.sources}
      handoff={{ href: data.links.apply, label: t('handoff.label'), note: t('handoff.note') }}
      secondaryAction={
        <LinkButton href={data.links.recruitingCentre} external variant="secondary" size="lg" className="max-sm:w-full">
          {t('action.recruiter')}
        </LinkButton>
      }
      footnote={t('careers.footnote')}
      className="@container"
    >
      <Hero
        tone="maple"
        count={matches.length}
        label={t(narrowed ? 'careers.hero.label' : 'careers.hero.labelAll', { count: matches.length })}
        sub={queryActive ? t(answers.interests.length ? 'careers.hero.queryMixed' : 'careers.hero.query', { query }) : narrowed ? t('careers.hero.of', { total: data.careers.length }) : t('careers.hero.start')}
        // Where the list comes from sits with the number it explains, at every width (the header stays title-only).
        aside={data.live ? <Badge tone="live">{t('careers.badge.live')}</Badge> : <Badge>{t('careers.badge.saved', { date: asOf })}</Badge>}
        art={<ServicePatches />}
      />

      {!data.live ? (
        <div className="px-5 pt-4 sm:px-6">
          <Notice tone="info" title={t('fallback.title')}>
            {t('fallback.body', { date: asOf })}
          </Notice>
        </div>
      ) : null}

      <div className="px-5 pt-6 sm:px-6">
        <Question title={t('careers.q.interests')} hint={t('careers.q.interestsHint')} aside={narrowed ? <ResetButton onClick={reset} /> : null}>
          {(labelId) => (
            <>
              {queryActive ? (
                <p className="m-0 mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-2">
                  {t('careers.query.label')}
                  {/* What the conversation asked for, as a filter of its own: removing it keeps every other answer. */}
                  <button
                    type="button"
                    onClick={() => setQuery(null)}
                    aria-label={t('careers.query.remove', { query })}
                    title={t('careers.query.remove', { query })}
                    className="relative inline-flex min-h-9 items-center gap-1.5 rounded-chip border border-ink bg-ink pe-2 ps-3 text-[14px] font-medium text-paper shadow-sm transition-transform duration-200 ease-spring after:absolute after:-inset-y-1 after:inset-x-0 active:scale-[.98]"
                  >
                    <bdi>{t('careers.query.chip', { query })}</bdi>
                    <X className="size-4 shrink-0 opacity-80" strokeWidth={2.2} aria-hidden />
                  </button>
                </p>
              ) : null}
              <ChipGroup
                kind="checkbox"
                labelledBy={labelId}
                value={answers.interests}
                onChange={(v) => set({ interests: v })}
                collapse={{ visible: CHIPS_FIRST, more: t('chips.showAll', { count: CATEGORIES.length }), less: t('chips.showLess') }}
                options={CATEGORIES.map((k) => ({ value: k, label: t(`cat.${k}`), icon: CAT_ICON[k], count: queryActive ? undefined : counts[k], disabled: !counts[k] && !answers.interests.includes(k) }))}
              />
            </>
          )}
        </Question>
        <RefinePanel answers={answers} onChange={set} />
      </div>

      <WidgetSection
        title={resultsTitle}
        aside={
          narrowed ? (
            <span className="text-[13px] font-medium tabular-nums text-ink-3" aria-hidden>
              <bdi>{t('results.count', { count: matches.length })}</bdi>
            </span>
          ) : null
        }
      >
        <LiveRegion text={t('results.sr', { count: matches.length })} />
        {matches.length ? (
          <>
            {/* Focus lands here after "Show fewer". */}
            <div ref={listRef} tabIndex={-1} role="group" aria-label={resultsTitle} className="scroll-mt-24 outline-none">
              <ul className={cn('m-0 grid list-none gap-2.5 p-0', matches.length > 1 && '@xl:grid-cols-2')}>
                <AnimatePresence initial={false}>
                  {shown.map((m, i) => (
                    <motion.li
                      key={m.career.slug}
                      layout={reduce || limit > ANIMATE_UP_TO ? false : 'position'}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce || limit > ANIMATE_UP_TO ? undefined : { opacity: 0, transition: { duration: 0.12 } }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className={cn('min-w-0', !expanded && i >= FIRST && '@max-xl:hidden')}
                    >
                      <CareerCard
                        m={m}
                        lang={lang}
                        hours={answers.hours}
                        showMatched={answers.interests.length > 1}
                        saved={shortlist.has(m.career.slug)}
                        onSave={() => shortlist.toggle(m.career.slug)}
                        join={join}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            {matches.length > FIRST ? (
              <div className={cn('mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1', !expanded && matches.length <= FIRST_WIDE && '@xl:hidden')}>
                {nextNarrow > 0 ? (
                  <Button variant="secondary" size="md" onClick={showMore} className={cn(nextWide <= 0 && '@xl:hidden')}>
                    <span className="@xl:hidden">{t('results.showMore', { count: nextNarrow })}</span>
                    <span className="hidden @xl:inline">{t('results.showMore', { count: nextWide })}</span>
                  </Button>
                ) : null}
                {expanded ? (
                  <Button variant="quiet" size="md" onClick={showFewer}>
                    {t('results.showLess')}
                  </Button>
                ) : null}
                {expanded ? (
                  <p className="m-0 w-full text-center text-[13px] tabular-nums text-ink-3">
                    <bdi>{t('results.shown', { shown: shown.length, count: matches.length })}</bdi>
                  </p>
                ) : null}
              </div>
            ) : null}
            <ResultNotes priority={anyPriority} paidEdOnly={anyPaidEdOnly} incentive={anyIncentive} />
          </>
        ) : (
          <EmptyState
            icon={Compass}
            title={t('empty.title')}
            action={
              officerNeedsSchool ? (
                <Button variant="primary" onClick={() => set({ path: 'ncm' })}>
                  {t('empty.showNcm')}
                </Button>
              ) : (
                <Button onClick={reset}>{t('empty.reset')}</Button>
              )
            }
          >
            {officerNeedsSchool ? t('empty.bodyEducation') : t('empty.body')}
          </EmptyState>
        )}
      </WidgetSection>

      <Shortlist careers={savedCareers} lang={lang} />

      <JoinFacts facts={data.facts} regular={regular} allowanceCareers={data.careers.filter((c) => c.recruitingAllowance).length} />
    </WidgetShell>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  const t = useMessages(messages);
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex min-h-8 shrink-0 items-center rounded-full px-2 text-[13px] font-medium text-ink-2 underline decoration-hair-2 underline-offset-[3px] after:absolute after:-inset-y-1.5 after:inset-x-0 hover:text-ink"
    >
      {t('careers.reset')}
    </button>
  );
}
