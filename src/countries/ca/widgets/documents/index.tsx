'use client';
/**
 * Renderers for the `documents` widget: { [toolName]: Component }.
 *   documentsExplain — letter explainer (identify picker, explained letter, scam check)
 *   documentsForms   — forms finder
 * Each card is its own chunk, fetched when its tool has answered: a letter explainer never downloads the
 * forms finder, and the loading and error states (./states) need neither. Both follow the answer's language.
 */
import { lazy, Suspense } from 'react';
import type { Renderers, WidgetProps } from '@/lib/widgets/types';
import { AnswerLang } from './AnswerLang';
import type { Lang } from './data';
import type { ExplainInput, ExplainOutput } from './explain';
import type { FormsOutput } from './forms';
import { ExplainError, ExplainPending, FormsError, FormsPending } from './states';

const Explainer = lazy(() => import('./DocumentExplainer'));
const Finder = lazy(() => import('./FormsFinder'));

type FormsInput = { query?: string; department?: 'cra' | 'esdc' | 'ircc'; lang?: Lang };

function DocumentsExplain({ part }: WidgetProps<ExplainInput, ExplainOutput>) {
  const pending = <ExplainPending input={part.input} />;
  return (
    <Suspense fallback={pending}>
      <AnswerLang lang={part.input?.lang}>
        {part.state === 'output-error' ? <ExplainError input={part.input} /> : part.state === 'output-available' && part.output ? <Explainer data={part.output} /> : pending}
      </AnswerLang>
    </Suspense>
  );
}

function DocumentsForms({ part }: WidgetProps<FormsInput, FormsOutput>) {
  return (
    <Suspense fallback={<FormsPending />}>
      <AnswerLang lang={part.input?.lang}>
        {part.state === 'output-error' ? <FormsError /> : part.state === 'output-available' && part.output ? <Finder data={part.output} /> : <FormsPending />}
      </AnswerLang>
    </Suspense>
  );
}

export const renderers: Renderers = {
  documentsExplain: DocumentsExplain,
  documentsForms: DocumentsForms,
};
export default renderers;
