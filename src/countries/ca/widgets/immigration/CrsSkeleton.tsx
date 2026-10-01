'use client';
/**
 * Loading states of the CRS calculator, one per final layout (rounds, answers needed, score). Whatever follows
 * from the answers in the tool input (the questions, the ideas, the points summary, the actions) is laid out
 * invisibly and sets the size of its placeholder (`Sized`). Only what depends on the live rounds (the hero's
 * verdict, the table of rounds) keeps a measured height.
 */
import type { ReactNode } from 'react';
import { Bookmark, Gauge, Signpost } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import { AnswersNeeded, useEarlierAnswers, useProfileSummary } from './answers';
import { assumedFields, crsScore, givenKeys, missingAnswers, normalizeProfile, type Profile } from './crs';
import { boosts } from './crs-insights';
import { Tips } from './CrsTips';
import messages from './messages';
import { CRS_FIELDS, ProfileEditor } from './ProfileEditor';
import { AskRow, Fold, Section } from './Shared';
import { Ghost, ShellSkeleton, Sized, SkActions, SkDisclosure, SkEditor, SkHeroFrame, SkRows, SkSection, SkText } from './Skeletons';

const noop = () => {};

export function CrsSkeleton({ shape, input }: { shape: 'rounds' | 'needs' | 'score'; input: Partial<Profile> }) {
  const t = useMessages(messages);
  const fr = useLocale().locale === 'fr';
  const summary = useProfileSummary();
  const given = givenKeys(input);
  const profile = normalizeProfile(input);
  const score = crsScore(profile);
  const tips = boosts(profile);
  const earlier = useEarlierAnswers(profile, given);
  const fold = (title: string, text: ReactNode) => (
    <Sized
      real={
        <Fold className="first:mt-6" title={title} summary={text}>
          {null}
        </Fold>
      }
    >
      <SkDisclosure className="mt-0 h-full" />
    </Sized>
  );
  return (
    <ShellSkeleton
      title={t('crs.title')}
      subtitle={t('crs.subtitle')}
      icon={Gauge}
      tone="maple"
      label={t('crs.loading')}
      sourceBar={shape === 'rounds' ? undefined : 'h-[83px]'}
      actionBar={
        <SkActions
          primary={t(shape === 'rounds' ? 'crs.handoff.rounds' : 'crs.handoff')}
          secondary={
            shape === 'score' ? (
              <Ghost shape="rounded-chip">
                <Button variant="quiet" icon={Bookmark}>
                  {t('crs.save')}
                </Button>
              </Ghost>
            ) : null
          }
          footnote={shape === 'rounds' ? t('crs.footnoteRounds') : shape === 'score' ? `${t('crs.footnote')} ${t('crs.footnoteSave')}` : t('crs.footnote')}
        />
      }
    >
      {shape === 'rounds' ? (
        <>
          <SkHeroFrame className={fr ? 'h-[216px] max-sm:h-[251px]' : 'h-[216px] max-sm:h-[233px]'}>
            <Skeleton className="h-3.5 w-52" />
            <div className="mt-3 flex items-end justify-between gap-6">
              <Skeleton className="h-[58px] w-36" />
              <Skeleton className="h-[30px] w-20" />
            </div>
            <Skeleton className="mt-5 h-4 w-3/5" />
            <Skeleton className="mt-2.5 h-3 w-4/5" />
          </SkHeroFrame>
          <SkTrack />
          <SkSection className={cn('overflow-hidden', fr ? 'h-[470px] max-sm:h-[634px]' : 'h-[449px] max-sm:h-[491px]')}>
            <SkRows rows={7} className={fr ? '[&>div]:min-h-[50px] max-sm:[&>div]:min-h-[72px]' : '[&>div]:min-h-[46px] max-sm:[&>div]:min-h-[52px]'} />
          </SkSection>
          {fold(t('crs.estimate.title'), t('crs.estimate.summary'))}
        </>
      ) : shape === 'needs' ? (
        <>
          <Sized real={<AnswersNeeded title={t('crs.need.title')} body={t('crs.need.body')} missing={missingAnswers(given)} earlier={earlier} onConfirm={noop} onJump={noop} />}>
            <SkHeroFrame className="h-full">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-3 h-7 w-3/4" />
              <Skeleton className="mt-3 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
              <div className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-chip" />
                ))}
              </div>
            </SkHeroFrame>
          </Sized>
          <div aria-hidden inert>
            <Section title={<SkText>{t('crs.answers.title')}</SkText>}>
              <Sized real={<ProfileEditor profile={profile} onChange={noop} fields={CRS_FIELDS} assumed={assumedFields(given, 'crs')} />}>
                <SkEditor fields={6} />
              </Sized>
            </Section>
          </div>
        </>
      ) : (
        <>
          <SkHeroFrame className={fr ? 'h-[300px] max-sm:h-[388px]' : 'h-[282px] max-sm:h-[326px]'}>
            <Skeleton className="h-3.5 w-40" />
            <div className="mt-3 flex items-end gap-3">
              <Skeleton className="h-[70px] w-44 max-sm:h-[60px]" />
              <Skeleton className="mb-1 h-4 w-14" />
            </div>
            <Skeleton className="mt-5 h-6 w-3/5 max-sm:w-4/5" />
            <Skeleton className="mt-2.5 h-3.5 w-4/5" />
            <Skeleton className="mt-4 h-3 w-2/3" />
          </SkHeroFrame>
          <SkTrack score />
          {tips.length ? (
            <Sized real={<Tips tips={tips} profile={profile} total={score.total} onChange={noop} />}>
              <SkSection>
                <div className="grid gap-2.5 @xl:grid-cols-2">
                  {Array.from({ length: Math.min(2, tips.length) }, (_, i) => (
                    <div key={i} className="flex min-h-[68px] items-center gap-3.5 rounded-tile border border-hair px-4 py-3">
                      <Skeleton className="h-7 w-11" />
                      <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-3.5 w-4/5" />
                        <Skeleton className="h-3.5 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-16 rounded-chip @max-sm:w-8" />
                    </div>
                  ))}
                </div>
                {tips.length > 2 ? <Skeleton className="mt-1.5 h-11 w-32 rounded-chip" /> : null}
              </SkSection>
            </Sized>
          ) : null}
          {fold(t('crs.points.title'), t('crs.points.summary', { core: score.core.total + (score.spouse?.total ?? 0), transfer: score.transferability.total, extra: score.additional.total }))}
          {fold(t('crs.answers.title'), <bdi>{summary(profile, { secondLanguage: true })}</bdi>)}
          {/* The rounds line names the latest round: live data, so a measured height (one line, two on a phone). */}
          <SkDisclosure className="h-[58px] max-sm:h-[77px]" />
          <Sized real={<AskRow icon={Signpost} className="pt-6">{t('crs.checkElig')}</AskRow>}>
            <div className="h-full px-5 pt-6 sm:px-6">
              <Skeleton className="h-full w-full rounded-field" />
            </div>
          </Sized>
        </>
      )}
    </ShellSkeleton>
  );
}

/** Same box as `CutoffTrack` with the usual 3 lanes (CEC, provincial nominees, categories). */
function SkTrack({ score }: { score?: boolean }) {
  const t = useMessages(messages);
  const TOP = score ? 30 : 4;
  const height = TOP + 3 * 40;
  return (
    <div className="px-5 pt-7 sm:px-6" aria-hidden>
      <p className="m-0 text-[15px] font-semibold leading-snug">
        <SkText>{t('crs.track.title')}</SkText>
      </p>
      <div className="relative mt-3" style={{ height: height + 22 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute inset-x-0" style={{ top: TOP + i * 40 }}>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="absolute inset-x-0 top-[24px] h-1 rounded-full" />
          </div>
        ))}
        <div className="absolute inset-x-0 flex justify-between" style={{ top: height + 6 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-2.5 w-6" />
          ))}
        </div>
      </div>
    </div>
  );
}
