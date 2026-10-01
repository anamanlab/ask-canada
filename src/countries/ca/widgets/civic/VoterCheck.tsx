'use client';
/**
 * civicVoterCheck renderer: can you vote federally (answers change the verdict instantly), how to check or
 * complete your registration (Elections Canada handoff), the 3 ID options with a "what do I have?" pick,
 * the 4 ways to vote, and a device-only "ready to vote" checklist. Sentences sit in <bdi> so English fallback
 * text keeps its punctuation in place on a right-to-left page.
 */
import { useId, useState } from 'react';
import { CalendarCheck2, Check, CircleAlert, FileCheck2, Vote } from 'lucide-react';
import { Badge, Checklist, Disclosure, ExternalLink, Notice, Segmented, Tabs, WidgetError, WidgetSection, WidgetShell, useChecklist } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { URLS } from './data';
import messages from './messages';
import { langOf, voterVerdict } from './select';
import { isolate } from './shared';
import { VoterSkeleton } from './skeletons/vote';
import { IdPanel, RegisterPanel, WaysPanel } from './VoterPanels';
import type { VoterInput, VoterOutput, VoterVerdict } from './types';

export function CivicVoterCheck({ part, locale }: WidgetProps<VoterInput, VoterOutput>) {
  const t = useMessages(messages);
  if (part.state === 'output-error') {
    return <WidgetError title={t('vote.error.title')} message={t('vote.error.body')} fallback={{ href: URLS.register[langOf(locale)], label: t('vote.error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) return <VoterSkeleton />;
  return <Voter data={part.output} />;
}

type Age = 'under14' | '14to17' | '18plus';
const ageBand = (age?: number): Age | undefined => (age == null ? undefined : age < 14 ? 'under14' : age < 18 ? '14to17' : '18plus');
const bandAge: Record<Age, number> = { under14: 13, '14to17': 16, '18plus': 18 };

function Voter({ data }: { data: VoterOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  // Federal and Quebec election dates are Eastern: the answer's date first, then the reader's clock in that zone.
  const today = useToday(data.today, { timeZone: 'America/Toronto' });
  const [citizen, setCitizen] = useState<boolean | undefined>(data.citizen);
  const [age, setAge] = useState<Age | undefined>(ageBand(data.age));
  // Unknown until they say: nothing is pre-selected that the person didn't tell us.
  const [abroad, setAbroad] = useState<boolean | undefined>(data.livesAbroad);
  const verdict = voterVerdict({ citizen, age: age ? bandAge[age] : undefined, livesAbroad: abroad });

  const handoff =
    verdict === 'future-elector'
      ? { href: data.links.futureElectors, label: t('vote.handoff.future'), note: isolate(t('vote.handoff.futureNote')) }
      : verdict === 'too-young'
        ? { href: data.links.futureElectors, label: t('vote.handoff.tooYoung'), note: isolate(t('vote.handoff.tooYoungNote')) }
        : verdict === 'future-abroad'
          ? { href: data.links.abroad, label: t('vote.handoff.futureAbroad'), note: isolate(t('vote.handoff.futureAbroadNote')) }
          : verdict === 'abroad'
            ? { href: data.links.abroad, label: t('vote.handoff.abroad'), note: isolate(t('vote.handoff.abroadNote')) }
            : verdict === 'not-citizen'
              ? { href: data.links.register, label: t('vote.handoff.citizenship'), note: isolate(t('vote.handoff.citizenshipNote')) }
              : { href: data.links.ereg, label: t('vote.handoff.check'), note: isolate(t('vote.handoff.checkNote')) };

  // The election notice names a date, so it expires: after election day it becomes the general note.
  const quebec = data.quebecNotice === 'election' && data.quebecElection && today && today > data.quebecElection ? 'generic' : data.quebecNotice;

  return (
    <WidgetShell
      icon={Vote}
      tone="pine"
      title={t('vote.title')}
      subtitle={t('vote.subtitle')}
      badge={<Badge icon={FileCheck2}>{t('vote.badge')}</Badge>}
      sources={data.sources}
      handoff={handoff}
      // Non-breaking hyphens keep each phone number on one line.
      footnote={<bdi>{t('vote.footnote', { phone: data.phone.replace(/-/g, '\u2011'), tty: data.tty.replace(/-/g, '\u2011') })}</bdi>}
      className="@container"
    >
      <VerdictCard verdict={verdict} />

      <WidgetSection title={t('vote.q.title')}>
        <div className="flex flex-col gap-3.5">
          <Question
            label={t('vote.q.citizen')}
            value={citizen == null ? '' : citizen ? 'yes' : 'no'}
            onChange={(v) => setCitizen(v === 'yes')}
            options={[
              { value: 'yes', label: t('vote.a.yes') },
              { value: 'no', label: t('vote.a.no') },
            ]}
          />
          <Question
            label={t('vote.q.age')}
            value={age ?? ''}
            onChange={(v) => setAge(v || undefined)}
            options={[
              { value: 'under14', label: t('vote.a.under14') },
              { value: '14to17', label: t('vote.a.14to17') },
              { value: '18plus', label: t('vote.a.18plus') },
            ]}
          />
          <Question
            label={t('vote.q.where')}
            value={abroad == null ? '' : abroad ? 'abroad' : 'canada'}
            onChange={(v) => setAbroad(v === 'abroad')}
            options={[
              { value: 'canada', label: t('vote.a.canada') },
              { value: 'abroad', label: t('vote.a.abroad') },
            ]}
          />
        </div>
      </WidgetSection>

      {quebec ? (
        <div className="px-5 pt-5 sm:px-6">
          <Notice
            tone="info"
            icon={CalendarCheck2}
            title={
              quebec === 'election' && data.quebecElection
                ? t('vote.quebec.title', { date: fmt.date(data.quebecElection, { month: 'long', day: 'numeric', year: 'numeric' }) })
                : t('vote.quebec.titleGeneric')
            }
          >
            {t('vote.quebec.body')} <ExternalLink href={URLS.quebecElections[data.lang]}>{t('vote.quebec.link')}</ExternalLink>
          </Notice>
        </div>
      ) : null}

      {verdict === 'not-citizen' ? null : verdict === 'too-young' || verdict === 'future-abroad' ? (
        // Years away from voting: what happens when, and the polling-day detail folded away for later.
        <div className="px-5 pt-1 sm:px-6">
          <RegisterPanel data={data} verdict={verdict} />
          <Disclosure lazy className="mt-2" title={t('vote.later.title')} summary={<bdi>{t('vote.later.sub')}</bdi>}>
            <Tabs
              label={t('vote.tab.label')}
              className={TAB_TARGET}
              tabs={[
                { id: 'id', label: t('vote.tab.id'), content: <IdPanel data={data} /> },
                { id: 'ways', label: t('vote.tab.ways'), content: <WaysPanel data={data} /> },
              ]}
            />
          </Disclosure>
        </div>
      ) : (
        <div className="px-5 pt-5 sm:px-6">
          <Tabs
            label={t('vote.tab.label')}
            className={TAB_TARGET}
            defaultTab={data.focus}
            tabs={[
              { id: 'register', label: t('vote.tab.register'), content: <RegisterPanel data={data} verdict={verdict} /> },
              { id: 'id', label: t('vote.tab.id'), content: <IdPanel data={data} /> },
              { id: 'ways', label: t('vote.tab.ways'), content: <WaysPanel data={data} /> },
            ]}
          />
        </div>
      )}

      {verdict === 'eligible' || verdict === 'unknown' ? <Ready /> : null}
    </WidgetShell>
  );
}

/**
 * A question with two or three answers: the question beside (on narrow widths, above) a core `Segmented`.
 * `''` is "not answered yet": nothing is selected that the person didn't tell us.
 */
function Question<T extends string>({ label, value, onChange, options }: { label: string; value: T | ''; onChange: (v: T | '') => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 @xl:flex-row @xl:items-center @xl:gap-4">
      <span id={id} className="shrink-0 text-[14px] font-medium text-ink @xl:w-[150px]">
        <bdi>{label}</bdi>
      </span>
      {/* Isolated: a label that opens with a number ("14 to 17") keeps its order in a right-to-left page. */}
      <Segmented<T | ''> label={label} value={value} onChange={onChange} options={options.map((o) => ({ value: o.value, label: <bdi>{o.label}</bdi> }))} className="min-w-0 @xl:flex-1" />
    </div>
  );
}

/** A short tab label ("ID") still gets a 44px-wide target. */
const TAB_TARGET = '[&_[role=tab]]:min-w-11';

const GOOD: VoterVerdict[] = ['eligible', 'abroad', 'future-elector'];

function VerdictCard({ verdict }: { verdict: VoterVerdict }) {
  const t = useMessages(messages);
  const good = GOOD.includes(verdict);
  const stop = verdict === 'not-citizen';
  return (
    <div
      className={cn(
        'relative mx-3 overflow-hidden rounded-card border px-5 py-5 sm:mx-4',
        good
          ? 'border-pine/15 bg-[linear-gradient(135deg,var(--pine-wash),transparent_60%),linear-gradient(320deg,var(--glacier-wash),transparent_55%)]'
          : stop
            ? 'border-maple/20 bg-[linear-gradient(135deg,var(--maple-wash),transparent_65%)]'
            : 'border-hair bg-[linear-gradient(135deg,var(--glacier-wash),transparent_65%)]',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3.5">
        {/* text-paper flips with the theme, so the glyph keeps its contrast on the light dark-mode pine. */}
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center rounded-full text-paper',
            good ? 'bg-pine shadow-[0_0_0_6px_var(--pine-wash)]' : stop ? 'bg-maple shadow-[0_0_0_6px_var(--maple-wash)]' : 'bg-glacier shadow-[0_0_0_6px_var(--glacier-wash)]',
          )}
          aria-hidden
        >
          {good ? <Check className="size-[18px]" strokeWidth={2.6} /> : stop ? <CircleAlert className="size-[18px]" strokeWidth={2.4} /> : <Vote className="size-[18px]" strokeWidth={2.2} />}
        </span>
        <div className="min-w-0">
          <p className="m-0 font-serif text-[25px] leading-[1.15] tracking-[-.02em] text-ink [font-variation-settings:'opsz'_36] [text-wrap:balance]">
            <bdi>{t(`vote.verdict.${verdict}`)}</bdi>
          </p>
          <p className="m-0 mt-1.5 max-w-[60ch] text-[15px] leading-snug text-ink-2">
            <bdi>{t(`vote.verdict.${verdict}Sub`)}</bdi>
          </p>
        </div>
      </div>
    </div>
  );
}

const READY = ['reg', 'id', 'plan'] as const;

/** "Ready to vote" checklist, saved on this device; the count in the heading comes from the same saved state. */
function Ready() {
  const t = useMessages(messages);
  const list = useChecklist('civic:vote-ready', t('vote.saved.label'), READY.length);
  const done = READY.filter((id) => list.value.includes(id)).length;
  return (
    <WidgetSection
      title={t('vote.ready.title')}
      className="mt-5 border-t border-hair"
      aside={
        <span className="font-mono text-[12px] text-pine" aria-live="polite">
          <bdi>{t('vote.ready.progress', { done, total: READY.length })}</bdi>
        </span>
      }
    >
      <Checklist
        label={t('vote.saved.label')}
        items={READY.map((id) => ({ id, title: t(`vote.ready.${id}`), detail: t(`vote.ready.${id}Detail`) }))}
        value={list.value}
        onChange={list.onChange}
      />
    </WidgetSection>
  );
}
