'use client';
/**
 * Express Entry eligibility ("Come to Canada" check): the 3 programs with each minimum requirement ticked or
 * missing, the Federal Skilled Worker selection grid (out of 100, pass mark 67), settlement funds by family size, and the official tool.
 *
 * No verdict without the facts: until age, education, language and work experience are known (from the question
 * or the editor), it shows a neutral "Tell us about you" state with IRCC's program finder and Come to Canada tool
 * first, as IRCC's own guidance asks. Anything still assumed is tagged in the editor and listed under the verdict.
 * Parts: EligibilitySkeleton (loading), EligibilityResult (programs, selection grid, money).
 */
import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Calculator, Signpost } from 'lucide-react';
import { Button, WidgetError, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswersNeeded, useAnswers, useEarlierAnswers, useFieldTargets, useProfileQuestion, useProfileSummary } from './answers';
import type { EligibilityOutput } from './build';
import { programs, type Profile } from './crs';
import { URLS } from './data';
import { Money, OfficialFirst, OtherPrograms, Programs, SelectionGrid, Verdict } from './EligibilityResult';
import { EligibilitySkeleton } from './EligibilitySkeleton';
import messages from './messages';
import { ELIGIBILITY_FIELDS, ProfileEditor } from './ProfileEditor';
import { Fold, HandoffHint, Section } from './Shared';

export function Eligibility({ part, locale }: WidgetProps<Partial<Profile> & { familySize?: number }, EligibilityOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('elig.error.title')} message={t('elig.error.body')} fallback={{ href: URLS.comeToCanada[locale === 'fr' ? 'fr' : 'en'], label: t('elig.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <EligibilitySkeleton input={part.input ?? {}} lang={locale === 'fr' ? 'fr' : 'en'} />;
  }
  return <Check data={part.output} />;
}

function Check({ data }: { data: EligibilityOutput }) {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const a = useAnswers(data.profile, data.given, 'eligibility', data.pinned);
  const profile = a.profile;
  const summary = useProfileSummary();
  const question = useProfileQuestion();
  const earlier = useEarlierAnswers(profile, a.given, data.pinned);
  const verdict = useRef<HTMLDivElement>(null);
  /** The button that was pressed leaves with the "answers needed" panel: focus moves to the verdict that replaces it. */
  const reveal = (apply: () => void) => {
    flushSync(apply);
    verdict.current?.focus();
  };
  const results = programs(profile);
  const targets = useFieldTargets();
  const editor = <ProfileEditor profile={profile} onChange={a.setProfile} onAnswer={a.touch} fields={ELIGIBILITY_FIELDS} assumed={a.assumed} foreignScale="fsw" fieldRef={targets.register} />;

  return (
    <WidgetShell
      icon={Signpost}
      tone="pine"
      title={t('elig.title')}
      subtitle={t('elig.subtitle')}
      sources={data.sources}
      handoff={{ href: URLS.comeToCanada[data.lang], label: t('elig.handoff') }}
      // With a second button beside it, the hint moves into the footnote (one quiet provenance line).
      secondaryAction={
        a.ready ? (
          <Button icon={Calculator} variant="quiet" onClick={() => send(question('ask.crs', profile, a.given))}>
            {t('elig.crs')}
          </Button>
        ) : (
          <HandoffHint>{t('elig.handoffNote')}</HandoffHint>
        )
      }
      footnote={a.ready ? `${t('elig.handoffNote')} ${t('elig.footnote')}` : t('elig.footnote')}
      className="@container"
    >
      {!a.ready ? (
        <>
          <AnswersNeeded
            title={t('elig.need.title')}
            body={t('elig.need.body')}
            missing={a.missing}
            earlier={earlier}
            onUseEarlier={() => earlier && reveal(() => a.adopt(earlier))}
            onConfirm={() => reveal(a.confirm)}
            onJump={targets.jump}
          />
          <OfficialFirst lang={data.lang} />
          <Section title={t('crs.answers.title')}>{editor}</Section>
        </>
      ) : (
        <>
          <Verdict profile={profile} assumed={a.assumed} results={results} focusRef={verdict} />
          <Programs results={results} lang={data.lang} profile={profile} occupationKnown={!a.assumed.includes('occupation')} />
          <SelectionGrid profile={profile} />
          <Money results={results} familySize={data.familySize} fee={data.fees.economicPr} />
          {/* Closed by default: the verdict already lists, in words, every answer we assumed, and the editor is one tap away. */}
          <Fold title={t('crs.answers.title')} summary={<bdi>{summary(profile, { secondLanguage: true })}</bdi>}>
            {editor}
          </Fold>
          {results.some((r) => r.eligible) ? null : <OtherPrograms lang={data.lang} />}
        </>
      )}
    </WidgetShell>
  );
}
