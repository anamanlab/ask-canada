'use client';
/**
 * Youth, student and government job programs (tool: jobsPrograms). Stage + age re-rank every program
 * instantly; each card says why it fits (or doesn't) and links to the official page and its postings.
 */
import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BellRing, Check, GraduationCap, X } from 'lucide-react';
import { Button, Disclosure, LiveRegion, Notice, Segmented, Slider, WidgetError, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useDeviceItem } from '@/lib/device-store';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { STUDENT_PAY, URLS } from './data';
import messages from './messages';
import { useJobsLang } from './parts';
import { ProgramCard } from './ProgramCard';
import { evaluatePrograms } from './programs';
import { JobsSkeleton } from './skeletons';
import { frFirst } from './text';
import type { ProgramsInput, ProgramsOutput, Stage } from './types';

export function JobsPrograms({ part }: WidgetProps<ProgramsInput, ProgramsOutput>) {
  const t = useMessages(messages);
  const lang = useJobsLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('programs.error')} fallback={{ href: URLS.youthJobs[lang], label: t('programs.errorFallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <JobsSkeleton kind="programs" icon={GraduationCap} tone="amber" title={t('programs.title')} subtitle={t('programs.subtitle')} label={t('programs.loading')} />;
  }
  return <Finder data={part.output} />;
}

const STAGES: Stage[] = ['high-school', 'post-secondary', 'graduate', 'not-student'];
/** Until a stage is chosen, no segment is selected. */
type StageChoice = Stage | 'unset';
/** Cards shown before "Show more" (the best fits come first). */
const LIMIT = 6;
/** Where the age slider starts when the person chooses to set an age. */
const DEFAULT_AGE = 20;
/** The ages the programs are about; an age given in the question (12 to 80) widens the slider to include it. */
const AGE_RANGE = { min: 14, max: 40 };

function Finder({ data }: { data: ProgramsOutput }) {
  const t = useMessages(messages);
  // Links follow the interface language (canada.ca / Job Bank pages exist in both).
  const lang = useJobsLang();
  const { fmt } = useLocale();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage | undefined>(data.stage);
  const [age, setAge] = useState<number | undefined>(data.age);
  const [showAll, setShowAll] = useState(false);
  // The slider always reaches the age the person gave ("I'm 55"), so the thumb and the value agree.
  const minAge = Math.min(AGE_RANGE.min, data.age ?? AGE_RANGE.min);
  const maxAge = Math.max(AGE_RANGE.max, data.age ?? AGE_RANGE.max);
  const [reminder, setReminder, clearReminder] = useDeviceItem<{ month: number }>('jobs:csj-reminder', { label: t('programs.reminder.label'), kind: 'reminder' });

  const list = evaluatePrograms({ age, stage, interest: data.interest });
  const fits = list.filter((p) => p.fit !== 'no');
  const others = list.filter((p) => p.fit === 'no');
  const yes = list.filter((p) => p.fit === 'yes').length;
  // Canada Summer Jobs postings go live each spring: from September to February, offer a reminder instead.
  const offSeason = data.month >= 9 || data.month <= 2;
  const csjFits = list.find((p) => p.id === 'csj')?.fit !== 'no';
  const summary = stage || age != null ? t('programs.summary', { yes, maybe: fits.length - yes }) : t('programs.summaryNone');

  return (
    <WidgetShell
      icon={GraduationCap}
      tone="amber"
      title={t('programs.title')}
      subtitle={t('programs.subtitle')}
      sources={data.sources}
      handoff={{ href: URLS.gcJobsSearch[lang], label: t('programs.handoff'), note: t('programs.handoffNote') }}
      footnote={t('programs.footnote', { date: frFirst(fmt.date(STUDENT_PAY.effective, { month: 'long', day: 'numeric', year: 'numeric' }), lang) })}
      className="@container"
    >
      <div className="px-5 sm:px-6">
        <p className="m-0 mb-2 text-[14px] font-medium text-ink">{t('programs.stageLabel')}</p>
        <Segmented<StageChoice>
          label={t('programs.stageLabel')}
          value={stage ?? 'unset'}
          onChange={(v) => v !== 'unset' && setStage(v)}
          className="grid auto-rows-fr grid-cols-2 @lg:flex"
          options={STAGES.map((s) => ({ value: s, label: t(`programs.stage.${s}`) }))}
        />
        {/* One button adds the age and takes it back: it never leaves the page, so the keyboard keeps its place. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {age == null ? (
            <p className="m-0 text-[14px] font-medium text-ink">{t('programs.ageLabel')}</p>
          ) : (
            <Slider className="w-full" label={t('programs.ageLabel')} min={minAge} max={maxAge} value={age} onChange={setAge} format={(n) => t('programs.ageValue', { age: n })} />
          )}
          <Button
            size="md"
            variant={age == null ? 'secondary' : 'quiet'}
            icon={age == null ? undefined : X}
            className={cn('text-[14px]', age != null && '-ms-2.5 px-2.5 text-ink-2 hover:text-ink')}
            onClick={() => setAge(age == null ? DEFAULT_AGE : undefined)}
          >
            {age == null ? t('programs.setAge') : t('programs.clearAge')}
          </Button>
        </div>
      </div>

      <p className="m-0 mt-4 px-5 text-[14.5px] text-ink-2 sm:px-6">{summary}</p>
      {/* Read once the age slider comes to rest, not at every step. */}
      <LiveRegion text={summary} />

      {csjFits && offSeason ? (
        <div className="px-5 pt-3 sm:px-6">
          <Notice tone="info" icon={BellRing} title={t('programs.csjSeason.title')}>
            <span className="block">{t('programs.csjSeason.body')}</span>
            <Button
              size="md"
              variant="secondary"
              icon={reminder ? Check : BellRing}
              aria-pressed={!!reminder}
              onClick={() => (reminder ? clearReminder() : setReminder({ month: 3 }, { detail: t('programs.reminder.detail') }))}
              className="mt-2.5"
            >
              {reminder ? t('programs.reminder.saved') : t('programs.reminder.save')}
            </Button>
          </Notice>
        </div>
      ) : null}

      <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-2.5 px-5 pt-4 sm:px-6 @xl:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {(showAll ? fits : fits.slice(0, LIMIT)).map((p) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              // An odd card out takes the whole row instead of leaving an empty cell beside it.
              className="flex @xl:last:odd:col-span-2"
            >
              <ProgramCard p={p} lang={lang} stage={stage} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {fits.length > LIMIT && !showAll ? (
        <div className="flex justify-center px-5 pt-3 sm:px-6">
          <Button size="md" variant="secondary" onClick={() => setShowAll(true)}>
            {t('programs.more', { count: fits.length - LIMIT })}
          </Button>
        </div>
      ) : null}

      {others.length ? (
        <Disclosure title={t('programs.others', { count: others.length })} lazy className="mx-5 mt-4 sm:mx-6">
          <ul className="m-0 grid list-none gap-2.5 p-0 pb-1 @xl:grid-cols-2">
            {others.map((p) => (
              <li key={p.id} className="flex @xl:last:odd:col-span-2">
                <ProgramCard p={p} lang={lang} stage={stage} />
              </li>
            ))}
          </ul>
        </Disclosure>
      ) : null}
    </WidgetShell>
  );
}
