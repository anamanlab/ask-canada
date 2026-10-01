'use client';
/**
 * Career match (tool: jobsResumeMatch). The model passes skills/titles from the conversation; the person
 * can also drop in a resume (PDF, Word or text) that is read in the browser — never uploaded or stored.
 *
 * The matcher re-scores on the device, so it needs the occupations catalog: it is its own chunk, fetched
 * only when a career match is on screen (the other jobs widgets never load it).
 */
import { Suspense, lazy } from 'react';
import { ScanSearch } from 'lucide-react';
import { WidgetError } from '@/components/ui';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import messages from './messages';
import { useJobsLang } from './parts';
import { JobsSkeleton } from './skeletons';
import type { MatchInput, MatchOutput } from './types';

const Matcher = lazy(() => import('./Matcher').then((m) => ({ default: m.Matcher })));

export function JobsResumeMatch({ part }: WidgetProps<MatchInput, MatchOutput>) {
  const t = useMessages(messages);
  const lang = useJobsLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('match.error')} fallback={{ href: URLS.jobBankFind[lang], label: t('match.errorFallback') }} />;
  }
  const given = part.output?.given ?? part.input;
  const skeleton = (
    <JobsSkeleton
      kind={(given?.skills?.length ?? 0) + (given?.titles?.length ?? 0) > 0 ? 'match' : 'matchUpload'}
      icon={ScanSearch}
      tone="maple"
      title={t('match.title')}
      subtitle={t('match.subtitle')}
      label={t('match.loading')}
    />
  );
  if (part.state !== 'output-available' || !part.output) return skeleton;
  return (
    <Suspense fallback={skeleton}>
      <Matcher data={part.output} />
    </Suspense>
  );
}
