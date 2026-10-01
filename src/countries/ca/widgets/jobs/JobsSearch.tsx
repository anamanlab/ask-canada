'use client';
/**
 * Job Bank search results (tool: jobsSearch). Live postings with instant, on-device filtering and sorting
 * of the 25 newest matches, a by-province breakdown that continues the conversation, pay context from
 * Job Bank wages, and jobs saved on this device only.
 */
import { useState } from 'react';
import { Bookmark, BookmarkCheck, Briefcase, MapPin, SearchX, WifiOff } from 'lucide-react';
import { Badge, Button, EmptyState, LinkButton, Notice, WidgetError, WidgetShell } from '@/components/ui';
import { useChatActions } from '@/components/chat/actions';
import { useDeviceItem } from '@/lib/device-store';
import { useToday } from '@/lib/hooks';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS, fold, frDe, inLocation, inProvince, inSearchPlace, jobBankSearchUrl } from './data';
import { JobList, useListView } from './JobList';
import messages from './messages';
import { SubtitleWithBadge, useJobsLang, useProvinceName } from './parts';
import { ProvinceBars } from './ProvinceBars';
import { SearchHero } from './SearchHero';
import { savedPostings, toggleSaved, type SavedJob } from './search-model';
import { JobsSkeleton } from './skeletons';
import { isolate, lcFirst } from './text';
import type { JobPosting, SearchInput, SearchOutput } from './types';

export function JobsSearch({ part }: WidgetProps<SearchInput, SearchOutput>) {
  const t = useMessages(messages);
  const lang = useJobsLang();
  if (part.state === 'output-error') {
    const q = part.input?.query;
    return <WidgetError title={t('error.title')} message={t('search.error')} fallback={{ href: q ? jobBankSearchUrl(lang, q) : URLS.jobBankSearch[lang], label: t('search.errorFallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The query only once it's complete (never "nur…" mid-stream).
    const input = part.state === 'input-available' ? part.input : undefined;
    const q = input?.query;
    return <JobsSkeleton kind="search" located={!!input?.location?.trim()} icon={Briefcase} tone="glacier" title={t('search.title')} subtitle={q ? t('search.loadingFor', { query: q }) : t('search.subtitle')} label={t('search.loading')} />;
  }
  return <Results data={part.output} />;
}

function Results({ data }: { data: SearchOutput }) {
  const t = useMessages(messages);
  const { send } = useChatActions();
  const provinceName = useProvinceName();
  // Sentences are composed in the interface language, even when the answer came in the other one.
  const lang = useJobsLang();
  const today = useToday(data.fetchedAt.slice(0, 10));
  const view = useListView();
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved, clearSaved] = useDeviceItem<SavedJob[]>('jobs:saved', { label: t('saved.label'), kind: 'plan' });
  const savedList = saved ?? [];

  const loc = data.location;
  const place =
    loc.kind === 'city' ? `${loc.name}, ${loc.province}`
    : loc.kind === 'province' ? provinceName(loc.province)
    : loc.kind === 'postal' ? t('search.nearPostal', { postal: `${loc.postal.slice(0, 3)} ${loc.postal.slice(3)}` })
    : t('search.canada');
  const inPlace = inSearchPlace(lang, loc);
  const province = loc.kind === 'province' || loc.kind === 'city' ? loc.province : undefined;
  const query = isolate(data.query);
  // "student jobs in Toronto": no keyword, only Job Bank's student filter.
  const studentOnly = !data.query && !!data.filters.student;

  const occ = data.occupation;
  const occTitle = occ ? (occ.titles?.[lang] ?? occ.title) : undefined;
  // A follow-up is a new question in the interface language: "infirmier" becomes "nurse" in English.
  const askQuery = occ?.search && fold(data.query) === fold(occ.search[data.lang]) ? occ.search[lang] : data.query;
  const askIn = (inPlace: string) => send(studentOnly ? t('search.askStudent', { inPlace }) : t('search.askProvince', { query: askQuery, deQuery: frDe(askQuery), inPlace }));
  const askCanada = () => {
    const inPlace = inLocation(lang, { kind: 'canada' });
    send(studentOnly ? t('search.askStudent', { inPlace }) : t('search.askCanada', { query: askQuery, deQuery: frDe(askQuery), inPlace }));
  };
  // From a Quebec search, ask about Quebec: the wage explorer then opens on that province's regions.
  const askWages = (title: string) => send(province ? t('search.askWagesIn', { title: lcFirst(title), inPlace: inProvince(lang, province) }) : t('search.askWages', { title: lcFirst(title) }));

  const showSaved = (on: boolean) => {
    setSavedOnly(on);
    view.reset();
  };
  const toggleSave = (job: JobPosting) => {
    const next = toggleSaved(savedList, job);
    if (next.length) return setSaved(next, { detail: t('saved.detail', { count: next.length }) });
    clearSaved();
    showSaved(false);
  };
  const isSaved = (id: string) => savedList.some((s) => s.id === id);
  const jobs = savedOnly ? savedPostings(savedList, data.jobs) : data.jobs;
  const badge = data.live ? <Badge tone="live">{t('badge.live')}</Badge> : <Badge tone="warn" icon={WifiOff}>{t('badge.offline')}</Badge>;

  return (
    <WidgetShell
      icon={Briefcase}
      tone="glacier"
      title={t('search.title')}
      subtitle={<SubtitleWithBadge badge={badge}>{isolate(studentOnly ? t('search.subtitleStudent', { place: isolate(place) }) : t('search.subtitleFor', { query, place: isolate(place) }))}</SubtitleWithBadge>}
      badge={badge}
      sources={data.sources}
      handoff={{
        href: data.searchUrl,
        label: data.total ? t('search.handoff', { count: data.total }) : t('search.handoffPlain'),
        note: t('search.handoffNote'),
      }}
      secondaryAction={
        savedList.length ? (
          <Button icon={savedOnly ? BookmarkCheck : Bookmark} size="lg" className="max-sm:w-full" aria-pressed={savedOnly} onClick={() => showSaved(!savedOnly)}>
            {t('search.savedToggle', { count: savedList.length })}
          </Button>
        ) : null
      }
      footnote={t('search.footnote')}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        {data.live && data.total === 0 ? null : (
          <SearchHero data={data} query={query} inPlace={inPlace} studentOnly={studentOnly} occupationTitle={occTitle} onCompareWages={() => occTitle && askWages(occTitle)} />
        )}
        {data.unresolvedLocation ? (
          <Notice tone="info" icon={MapPin} className="mt-3" title={t('search.unresolved', { place: data.unresolvedLocation })}>
            {t('search.unresolvedBody')}
          </Notice>
        ) : null}
      </div>

      <ProvinceBars byProvince={data.byProvince} onPick={(code) => askIn(inProvince(lang, code))} />

      {jobs.length || savedOnly ? (
        <JobList
          view={view}
          jobs={jobs}
          today={today}
          lang={data.lang}
          total={savedOnly ? null : data.total}
          province={province}
          // Reposts of the same job were folded into one card: say so, or "16 open postings" / "Top 10" looks wrong.
          duplicates={data.live && !savedOnly ? (data.duplicates ?? 0) : 0}
          savedView={savedOnly}
          onLeaveSaved={() => showSaved(false)}
          isSaved={isSaved}
          onSave={toggleSave}
        />
      ) : data.live ? (
        <div className="px-5 pt-5 sm:px-6">
          <EmptyState
            icon={SearchX}
            title={t('search.empty.title')}
            action={
              <div className="flex flex-wrap justify-center gap-2 max-sm:flex-col max-sm:items-stretch">
                {loc.kind !== 'canada' ? (
                  <Button size="md" onClick={askCanada}>
                    {t('search.empty.widen')}
                  </Button>
                ) : null}
                <LinkButton size="md" variant="secondary" href={URLS.jobBankFind[lang]} external>
                  {t('search.empty.alerts')}
                </LinkButton>
              </div>
            }
          >
            {isolate(studentOnly ? t('search.empty.bodyStudent', { inPlace }) : t('search.empty.body', { query, inPlace }))}
          </EmptyState>
        </div>
      ) : null /* Job Bank unreachable: the hero already says so and the handoff opens the same search. */}
    </WidgetShell>
  );
}
