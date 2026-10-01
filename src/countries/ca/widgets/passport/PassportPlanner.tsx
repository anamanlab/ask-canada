'use client';
/**
 * Passport renewal planner (reference widget for the whole pipeline).
 * Renders the `passportPlanner` tool part: a skeleton holding the plan's exact room while the call streams
 * (PlannerSkeleton.tsx), the plan when output arrives (Planner.tsx), and a plain-language error with the
 * official page (in the reader's language) as fallback.
 */
import { Suspense } from 'react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLanguage, AnswerLanguagePending } from './AnswerLanguage';
import { URLS } from './data';
import messages from './messages';
import { Planner } from './Planner';
import { PlannerSkeleton } from './PlannerSkeleton';
import type { Lang, PlannerInput, PlannerOutput } from './types';

export function PassportPlanner(props: WidgetProps<PlannerInput, PlannerOutput>) {
  // The planner speaks the language of the answer: the one the tool was called in ("Combien coûte un
  // passeport?" asked in the English interface is answered, and planned, in French), else the interface's.
  // Until the planner ships in another interface language, it shows whole in English (see AnswerLanguage).
  const asked = props.part.input?.lang;
  const lang: Lang = asked === 'en' || asked === 'fr' ? asked : props.locale === 'fr' ? 'fr' : 'en';
  if (lang === props.locale) return <PlannerPart {...props} />;
  return (
    <Suspense
      fallback={
        <AnswerLanguagePending lang={lang}>
          <PlannerSkeleton input={props.part.input} />
        </AnswerLanguagePending>
      }
    >
      <AnswerLanguage lang={lang}>
        <PlannerPart part={props.part} locale={lang} />
      </AnswerLanguage>
    </Suspense>
  );
}

function PlannerPart({ part, locale }: WidgetProps<PlannerInput, PlannerOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.renew[locale === 'fr' ? 'fr' : 'en'], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <PlannerSkeleton input={part.input} />;
  return <Planner initial={part.output} />;
}

