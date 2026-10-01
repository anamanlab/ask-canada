'use client';
/**
 * Estimators with sliders and animated numbers: Canada child benefit, EI regular benefits, Old Age
 * Security and the CPP retirement pension. Same pure functions as the tool, recomputed on every change.
 *
 * An answer shows one program, so each estimator (./estimator) is its own chunk, loaded behind the skeleton.
 */
import { lazy, Suspense } from 'react';
import { WidgetError } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import type { EstimatorOutput } from './build';
import { ICON, TONE, type Program } from './estimator/shared';
import { EstimatorSkeleton } from './estimator/skeleton';
import { OFFICIAL } from './links';
import messages from './messages';
import { isolate } from './parts';

type Input = { program?: Program; lang?: 'en' | 'fr' };

const Ccb = lazy(() => import('./estimator/Ccb'));
const Ei = lazy(() => import('./estimator/Ei'));
const Oas = lazy(() => import('./estimator/Oas'));
const Cpp = lazy(() => import('./estimator/Cpp'));

export function BenefitsEstimator(props: WidgetProps<Input, EstimatorOutput>) {
  // The widget speaks the answer's language, like the finder; its skeleton holds the place while that loads.
  const program: Program = props.part.output?.program ?? props.part.input?.program ?? 'ccb';
  return (
    <AnswerLang lang={props.part.output?.lang ?? props.part.input?.lang} fallback={<EstimatorLoading program={program} />}>
      <EstimatorStates {...props} program={program} />
    </AnswerLang>
  );
}

function EstimatorLoading({ program }: { program: Program }) {
  const t = useMessages(messages);
  return <EstimatorSkeleton program={program} title={t(`est.${program}.title`)} subtitle={isolate(t(`est.${program}.subtitle`))} icon={ICON[program]} tone={TONE[program]} label={t('loading')} />;
}

function EstimatorStates({ part, program }: WidgetProps<Input, EstimatorOutput> & { program: Program }) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  if (part.state === 'output-error') {
    return (
      <WidgetError
        title={t(`est.${program}.errorTitle`)}
        message={t('est.error.body')}
        fallback={{ href: OFFICIAL[program][locale === 'fr' ? 'fr' : 'en'], label: t('est.error.fallback', { program: t(`program.${program}`) }) }}
      />
    );
  }
  if (part.state !== 'output-available' || !part.output) return <EstimatorLoading program={program} />;
  return (
    <Suspense fallback={<EstimatorLoading program={program} />}>
      <Estimator data={part.output} />
    </Suspense>
  );
}

function Estimator({ data }: { data: EstimatorOutput }) {
  switch (data.program) {
    case 'ccb':
      return <Ccb data={data} />;
    case 'ei':
      return <Ei data={data} />;
    case 'oas':
      return <Oas data={data} />;
    case 'cpp':
      return <Cpp data={data} />;
  }
}
