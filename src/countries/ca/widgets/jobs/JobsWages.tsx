'use client';
/**
 * Wage explorer (tool: jobsWages). Median, low and high pay for one occupation, everywhere in Canada, with
 * Job Bank's 3-year outlook and the economic regions of the province that was asked about.
 */
import { Coins, SearchX } from 'lucide-react';
import { Chip, EmptyState, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import messages from './messages';
import { useJobsLang } from './parts';
import { JobsSkeleton } from './skeletons';
import { lcFirst } from './text';
import type { WagesInput, WagesOutput } from './types';
import { WagesExplorer } from './WagesExplorer';

export function JobsWages({ part }: WidgetProps<WagesInput, WagesOutput>) {
  const t = useMessages(messages);
  const lang = useJobsLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('wages.error')} fallback={{ href: URLS.trendAnalysis[lang], label: t('wages.errorFallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The title only once the input is complete, capitalised like a heading ("Registered nurse").
    const asked = part.state === 'input-available' ? part.input?.occupation?.trim() : undefined;
    return (
      <JobsSkeleton
        kind={part.input?.province ? 'wagesRegions' : 'wages'}
        icon={Coins}
        tone="pine"
        title={asked ? t('wages.titleFor', { title: asked.charAt(0).toUpperCase() + asked.slice(1) }) : t('wages.title')}
        subtitle={t('wages.subtitle')}
        label={t('wages.loading')}
      />
    );
  }
  const { occupation } = part.output;
  if (part.output.status === 'not-found' || !occupation) return <NotFound data={part.output} />;
  return <WagesExplorer data={part.output} occupation={occupation} />;
}

function NotFound({ data }: { data: WagesOutput }) {
  const t = useMessages(messages);
  const lang = useJobsLang();
  const { send } = useChatActions();
  return (
    <WidgetShell icon={Coins} tone="pine" title={t('wages.title')} subtitle={t('wages.subtitle')} sources={data.sources} handoff={{ href: data.links.wages, label: t('wages.exploreHandoff'), note: t('wages.exploreNote') }}>
      <div className="px-5 sm:px-6">
        <EmptyState icon={SearchX} title={t('wages.notFound.title', { query: data.query })}>
          {t('wages.notFound.body')}
        </EmptyState>
      </div>
      <WidgetSection title={t('wages.notFound.try')}>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {data.suggestions.map((s) => {
            const title = s.titles?.[lang] ?? s.title;
            return (
              <li key={s.key}>
                <Chip onClick={() => send(t('wages.ask', { title: lcFirst(title), vowel: /^[aeiou]/i.test(title) ? 'yes' : 'no' }))}>{title}</Chip>
              </li>
            );
          })}
        </ul>
      </WidgetSection>
    </WidgetShell>
  );
}
