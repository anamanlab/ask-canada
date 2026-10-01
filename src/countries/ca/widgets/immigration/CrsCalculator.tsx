'use client';
/**
 * Express Entry CRS calculator: the score (out of 1,200) with a spring ticker, where it sits against the live
 * cut-offs of recent rounds and the pool, the points breakdown, what would raise it, and every answer editable.
 *
 * Two ways in:
 *  - mode "score": the person's estimate. Until age, education, language and work are known, it asks for them
 *    instead of showing a score built on guesses; anything still assumed is listed under the score.
 *  - mode "rounds": someone asked about the draws. It leads with the latest round and the recent cut-offs, and
 *    keeps the estimate one tap away behind "Estimate my score".
 *
 * Parts: CrsSkeleton (loading), CrsRounds (latest round + table), CutoffTrack, CrsTips, CrsBreakdown.
 */
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Bookmark, BookmarkCheck, Gauge, Signpost } from 'lucide-react';
import { Button, NumberTicker, WidgetError, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswersNeeded, AssumedNote, SAVED_SCORE_KEY, useAnswers, useEarlierAnswers, useFieldTargets, useProfileQuestion, useProfileSummary, type Answers, type SavedScore } from './answers';
import type { CrsMode, CrsOutput } from './build';
import { changedKeys, crsScore, givenKeys, missingAnswers, type CrsResult, type Profile } from './crs';
import { boosts, inAnyProgram, poolShareBelow, referenceDraw } from './crs-insights';
import { Breakdown } from './CrsBreakdown';
import { LatestRound, Rounds, useRoundDate, useRoundName } from './CrsRounds';
import { CrsSkeleton } from './CrsSkeleton';
import { Tips } from './CrsTips';
import { CutoffTrack } from './CutoffTrack';
import { URLS } from './data';
import messages from './messages';
import { CRS_FIELDS, ProfileEditor } from './ProfileEditor';
import { AskRow, Eyebrow, Fold, Hero, LastKnown, LiveBadge, Section } from './Shared';

type CrsInput = Partial<Profile> & { mode?: CrsMode };

export function CrsCalculator({ part, locale }: WidgetProps<CrsInput, CrsOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('crs.error.title')} message={t('crs.error.body')} fallback={{ href: URLS.crsTool[locale === 'fr' ? 'fr' : 'en'], label: t('crs.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <CrsSkeleton shape={part.input?.mode === 'rounds' ? 'rounds' : missingAnswers(givenKeys(part.input)).length ? 'needs' : 'score'} input={part.input ?? {}} />;
  }
  return <Calculator data={part.output} />;
}

function Calculator({ data }: { data: CrsOutput }) {
  const t = useMessages(messages);
  const a = useAnswers(data.profile, data.given, 'crs', data.pinned);
  const profile = a.profile;
  const score = crsScore(profile);
  const rounds = data.mode === 'rounds';
  const [estimate, setEstimate] = useState(!rounds);
  const [saved, save] = useDeviceItem<SavedScore>(SAVED_SCORE_KEY, { label: t('crs.saved.label'), kind: 'plan' });
  // Saved means these exact answers: another profile that happens to reach the same total is not "saved".
  const isSaved = !!saved?.profile && saved.score === score.total && changedKeys(saved.profile, profile).length === 0;
  const draws = data.draws.draws;
  const showScore = estimate && a.ready;

  return (
    <WidgetShell
      icon={Gauge}
      tone="maple"
      title={t('crs.title')}
      subtitle={t('crs.subtitle')}
      badge={data.draws.live ? <LiveBadge /> : undefined}
      sources={data.sources}
      // One primary action; what it means lives in the footnote, not in a second note beside the buttons.
      handoff={rounds && !estimate ? { href: URLS.roundsData[data.lang], label: t('crs.handoff.rounds') } : { href: URLS.crsTool[data.lang], label: t('crs.handoff') }}
      secondaryAction={
        showScore ? (
          <Button variant="quiet" icon={isSaved ? BookmarkCheck : Bookmark} onClick={() => save({ score: score.total, profile, given: a.given }, { detail: t('crs.saved.detail', { score: score.total }) })}>
            {isSaved ? t('action.saved') : t('crs.save')}
          </Button>
        ) : undefined
      }
      // "On this device" is only said where Save is offered, and "saved" only once it has been.
      footnote={rounds && !estimate ? t('crs.footnoteRounds') : showScore ? `${t('crs.footnote')} ${t(isSaved ? 'crs.footnoteSaved' : 'crs.footnoteSave')}` : t('crs.footnote')}
      className="@container"
    >
      {rounds ? (
        <>
          {draws[0] ? <LatestRound draw={draws[0]} live={data.draws.live} /> : null}
          {data.draws.live ? null : <LastKnown what="rounds" date={draws[0]?.date} />}
          <CutoffTrack score={showScore ? score.total : null} draws={draws} live={data.draws.live} />
          <Section title={t('crs.rounds.title')}>
            <Rounds draws={draws} score={showScore ? score.total : null} />
          </Section>
          <Fold title={t('crs.estimate.title')} summary={t('crs.estimate.summary')} open={estimate} onOpenChange={setEstimate}>
            <div className="-mx-5 sm:-mx-6">
              <Estimate data={data} a={a} score={score} nested />
            </div>
          </Fold>
        </>
      ) : (
        <Estimate data={data} a={a} score={score} />
      )}
    </WidgetShell>
  );
}

/**
 * The personal part: "Tell us about you" until the key answers are in, then the score as the single hero
 * (number, one verdict line against a round the person could actually be in), the cut-off track and the top
 * ideas to raise it. The breakdown, the answers and the rounds stay one tap away.
 */
function Estimate({ data, a, score, nested }: { data: CrsOutput; a: Answers; score: CrsResult; nested?: boolean }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const roundName = useRoundName();
  const summary = useProfileSummary();
  const targets = useFieldTargets();
  const { send } = useChatActions();
  const question = useProfileQuestion();
  const profile = a.profile;
  const earlier = useEarlierAnswers(profile, a.given, data.pinned);
  const hero = useRef<HTMLDivElement>(null);
  /** The button that was pressed leaves with the "answers needed" panel: focus moves to the score that replaces it. */
  const reveal = (apply: () => void) => {
    flushSync(apply);
    hero.current?.focus();
  };
  const draws = data.draws.draws;
  const rdate = useRoundDate(draws[0]?.date);
  const editor = <ProfileEditor profile={profile} onChange={a.setProfile} onAnswer={a.touch} fields={CRS_FIELDS} assumed={a.assumed} fieldRef={targets.register} />;

  if (!a.ready) {
    return (
      <div className={nested ? 'pt-1' : undefined}>
        <AnswersNeeded
          title={t('crs.need.title')}
          body={t('crs.need.body')}
          missing={a.missing}
          earlier={earlier}
          onUseEarlier={() => earlier && reveal(() => a.adopt(earlier))}
          onConfirm={() => reveal(a.confirm)}
          onJump={targets.jump}
        />
        <Section title={t('crs.answers.title')}>{editor}</Section>
      </div>
    );
  }

  const tips = boosts(profile);
  const ref = referenceDraw(draws, profile);
  const gap = ref ? score.total - ref.crs : 0;
  const pool = data.draws.pool;
  const share = pool ? poolShareBelow(score.total, pool.bands) : null;
  const poolKey = share == null ? null : share < 0.01 ? 'crs.pool.low' : share > 0.99 ? 'crs.pool.high' : 'crs.pool.about';

  return (
    <div className={nested ? 'pt-1' : undefined}>
      <Hero tone={ref && gap >= 0 ? 'pine' : 'glacier'} focusRef={hero}>
        <Eyebrow>{t('crs.yourScore')}</Eyebrow>
        <p className="m-0 mt-3 flex flex-wrap items-baseline gap-x-3 font-serif text-[84px] leading-[.86] tracking-[-.045em] text-ink [font-variation-settings:'opsz'_144] max-sm:text-[72px]">
          <NumberTicker value={score.total} format={(n) => fmt.number(Math.round(n))} />
          <bdi className="font-sans text-[16px] font-medium tracking-normal text-ink-2">{t('crs.outOf', { max: fmt.number(1200) })}</bdi>
        </p>
        <div className="mt-5" aria-live="polite">
          <p className={cn("m-0 font-serif text-[24px] leading-[1.2] max-sm:text-[22px] tracking-[-.015em] [font-variation-settings:'opsz'_36]", ref && gap >= 0 ? 'text-pine' : 'text-ink')}>
            <bdi>
              {ref
                ? gap > 0
                  ? t('crs.verdict.above', { gap, cut: ref.crs })
                  : gap === 0
                    ? t('crs.verdict.equal', { cut: ref.crs })
                    : t('crs.verdict.below', { gap: -gap, cut: ref.crs })
                : t('crs.verdict.none')}
            </bdi>
          </p>
          <p className="m-0 mt-1 max-w-[60ch] text-[14.5px] leading-snug text-ink-2">
            {ref
              ? t('crs.verdict.round', { round: roundName(ref), date: rdate(ref.date, 'long') })
              : inAnyProgram(profile)
                ? t('crs.verdict.noneRound', { count: draws.length })
                : t('crs.verdict.noProgram')}
          </p>
        </div>
        {poolKey && pool ? (
          <p className="m-0 mt-3 max-w-[60ch] text-[13.5px] leading-snug text-ink-2">
            {t(poolKey, { pct: fmt.number(share ?? 0, { style: 'percent', maximumFractionDigits: 0 }), total: fmt.number(pool.total) })}
          </p>
        ) : null}
        <AssumedNote className="mt-3" profile={profile} assumed={a.assumed} />
      </Hero>
      {nested || data.draws.live ? null : <LastKnown what="rounds" date={draws[0]?.date} />}

      {!nested && draws.length ? <CutoffTrack score={score.total} draws={draws} live={data.draws.live} /> : null}

      {tips.length ? <Tips tips={tips} profile={profile} total={score.total} ahead={!!ref && gap > 0} onChange={a.setProfile} /> : null}

      <Fold
        title={t('crs.points.title')}
        summary={t('crs.points.summary', { core: score.core.total + (score.spouse?.total ?? 0), transfer: score.transferability.total, extra: score.additional.total })}
      >
        <Breakdown score={score} />
      </Fold>

      <Fold title={t('crs.answers.title')} summary={<bdi>{summary(profile, { secondLanguage: true })}</bdi>}>
        {editor}
      </Fold>

      {!nested && draws[0] ? (
        <Fold
          title={t('crs.rounds.title')}
          summary={t('crs.rounds.summary', { date: rdate(draws[0].date, 'short'), round: roundName(draws[0]), cut: draws[0].crs })}
        >
          <Rounds draws={draws} score={score.total} />
        </Fold>
      ) : null}

      {/* The next question, asked with these answers written out, so the eligibility check doesn't ask again. */}
      <AskRow icon={Signpost} className="pt-6" onClick={() => send(question('ask.eligibility', profile, a.given))}>
        {t('crs.checkElig')}
      </AskRow>
    </div>
  );
}
