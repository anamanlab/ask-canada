'use client';
/**
 * Loading states of the eligibility check. Everything this widget shows follows from the answers in the tool
 * input, so each part of the result is laid out invisibly and sets the size of its placeholder (`Sized`): the
 * skeleton is exactly as tall as the result, in every language and at every width, with nothing measured by hand.
 */
import { Calculator, Signpost } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import { AnswersNeeded, useEarlierAnswers, useProfileSummary } from './answers';
import { assumedFields, givenKeys, missingAnswers, normalizeProfile, programs, type Profile } from './crs';
import { FEES, type Lang } from './data';
import { Money, OfficialFirst, OtherPrograms, Programs, SelectionGrid, Verdict } from './EligibilityResult';
import messages from './messages';
import { ELIGIBILITY_FIELDS, ProfileEditor } from './ProfileEditor';
import { Fold, Section } from './Shared';
import { Ghost, ShellSkeleton, Sized, SkActions, SkDisclosure, SkEditor, SkHeroFrame, SkSection, SkText } from './Skeletons';

const noop = () => {};

export function EligibilitySkeleton({ input, lang }: { input: Partial<Profile> & { familySize?: number }; lang: Lang }) {
  const t = useMessages(messages);
  const summary = useProfileSummary();
  const given = givenKeys(input);
  const missing = missingAnswers(given);
  const needs = missing.length > 0;
  const profile = normalizeProfile(input);
  const assumed = assumedFields(given, 'eligibility');
  const results = programs(profile);
  const earlier = useEarlierAnswers(profile, given);
  const editor = <ProfileEditor profile={profile} onChange={noop} fields={ELIGIBILITY_FIELDS} assumed={assumed} foreignScale="fsw" />;
  return (
    <ShellSkeleton
      title={t('elig.title')}
      subtitle={t('elig.subtitle')}
      icon={Signpost}
      tone="pine"
      label={t('elig.loading')}
      sourceBar={lang === 'fr' ? 'h-[83px]' : undefined}
      actionBar={
        needs ? (
          <SkActions primary={t('elig.handoff')} note={t('elig.handoffNote')} footnote={t('elig.footnote')} />
        ) : (
          <SkActions
            primary={t('elig.handoff')}
            secondary={
              <Ghost shape="rounded-chip">
                <Button icon={Calculator} variant="quiet">
                  {t('elig.crs')}
                </Button>
              </Ghost>
            }
            footnote={`${t('elig.handoffNote')} ${t('elig.footnote')}`}
          />
        )
      }
    >
      {needs ? (
        <>
          <Sized real={<AnswersNeeded title={t('elig.need.title')} body={t('elig.need.body')} missing={missing} earlier={earlier} onConfirm={noop} onJump={noop} />}>
            <SkHeroFrame className="h-full">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-3 h-7 w-3/5" />
              <Skeleton className="mt-3 h-3.5 w-full" />
              <Skeleton className="mt-2 h-3.5 w-2/3" />
              <div className="mt-5 flex flex-wrap gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-chip" />
                ))}
              </div>
            </SkHeroFrame>
          </Sized>
          <Sized real={<OfficialFirst lang={lang} />}>
            <div className="h-full px-5 pt-4 sm:px-6">
              <div className="flex h-full flex-wrap items-center gap-x-4 gap-y-3 rounded-tile border border-hair px-4 py-3.5">
                <div className="min-w-[24ch] flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="mt-2 h-3.5 w-3/4" />
                </div>
                <Skeleton className="h-11 w-48 rounded-chip @max-md:w-full" />
              </div>
            </div>
          </Sized>
          <div aria-hidden inert>
            <Section title={<SkText>{t('crs.answers.title')}</SkText>}>
              <Sized real={editor}>
                <SkEditor fields={8} toggles={4} />
              </Sized>
            </Section>
          </div>
        </>
      ) : (
        <>
          <Sized real={<Verdict profile={profile} assumed={assumed} results={results} />}>
            <SkHeroFrame className="h-full">
              <Skeleton className="h-7 w-3/5 max-sm:w-4/5" />
              <Skeleton className="mt-3 h-3.5 w-4/5" />
              <Skeleton className="mt-4 h-3 w-1/2" />
            </SkHeroFrame>
          </Sized>
          <Sized real={<Programs results={results} lang={lang} profile={profile} occupationKnown={!assumed.includes('occupation')} />}>
            <SkSection className="h-full">
              <div className="grid h-[calc(100%-36px)] gap-2.5 @xl:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex flex-col rounded-tile border border-hair px-4 pt-3.5">
                    <Skeleton className="h-6 w-24 rounded-chip" />
                    <Skeleton className="mt-3 h-4 w-4/5" />
                    <Skeleton className="mt-2 h-3 w-3/5" />
                    <div className="mt-4 flex flex-col gap-3">
                      {Array.from({ length: 3 }, (_, j) => (
                        <div key={j} className="flex items-center gap-2.5">
                          <Skeleton className="size-5" round />
                          <Skeleton className="h-3.5 flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SkSection>
          </Sized>
          <Sized real={<SelectionGrid profile={profile} />}>
            <SkSection>
              <Skeleton className="h-10 w-28" />
              <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
              <div className="mt-4 grid gap-x-6 gap-y-4 @xl:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-4 h-3 w-4/5" />
            </SkSection>
          </Sized>
          <Sized real={<Money results={results} familySize={Math.max(1, Math.min(12, Math.round(input.familySize ?? (profile.spouse ? 2 : 1))))} fee={FEES.economicPr} />}>
            <SkSection className="h-full">
              <div className="grid h-[calc(100%-36px)] gap-3 @xl:grid-cols-2">
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={i} className="rounded-tile border border-hair px-4 py-3.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="mt-4 h-8 w-28" />
                    <Skeleton className="mt-3 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-2/3" />
                  </div>
                ))}
              </div>
            </SkSection>
          </Sized>
          <Sized
            real={
              <Fold className="first:mt-6" title={t('crs.answers.title')} summary={<bdi>{summary(profile, { secondLanguage: true })}</bdi>}>
                {null}
              </Fold>
            }
          >
            <SkDisclosure className="mt-0 h-full" />
          </Sized>
          {results.some((r) => r.eligible) ? null : (
            <Sized real={<OtherPrograms lang={lang} />}>
              <div className="h-full px-5 pt-5 sm:px-6">
                <Skeleton className="h-[calc(100%-56px)] w-full rounded-tile" />
                <Skeleton className="mt-3 h-11 w-52 rounded-chip" />
              </div>
            </Sized>
          )}
        </>
      )}
    </ShellSkeleton>
  );
}
