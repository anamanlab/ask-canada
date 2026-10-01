'use client';
/**
 * How to become a citizen (citizenshipSteps): live fee and processing time, a family fee total, the age
 * that decides whether the test applies, and the journey from eligibility to passport.
 */
import { useState, type ReactNode } from 'react';
import { Route, SearchCheck } from 'lucide-react';
import { Badge, LinkButton, Notice, NumberTicker, Segmented, Stepper, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import messages from './messages';
import { Mark } from '../../brand/Mark';
import { RULES, URLS } from './data';
import { localizeSteps, type StepId, type StepsInput, type StepsOutput } from './steps';
import { Counter, useLang } from './shared';
import { CzSkeleton } from './Skeletons';

type AgeBand = 'minor' | 'adult' | 'senior';
const bandOf = (age: number | null): AgeBand => (age == null ? 'adult' : age < 18 ? 'minor' : age >= 55 ? 'senior' : 'adult');

export function CitizenshipSteps({ part }: WidgetProps<StepsInput, StepsOutput>) {
  const t = useMessages(messages);
  const lang = useLang();
  if (part.state === 'output-error') {
    return <WidgetError title={t('error.title')} message={t('error.body')} fallback={{ href: URLS.how[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    return <CzSkeleton kind="steps" title={t('steps.title')} subtitle={t('steps.subtitle')} icon={Route} tone="maple" label={t('steps.loading')} />;
  }
  return <Steps data={localizeSteps(part.output, lang)} />;
}

function Steps({ data }: { data: StepsOutput }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const [adults, setAdults] = useState(data.adults);
  const [minors, setMinors] = useState(data.minors);
  const [band, setBand] = useState<AgeBand>(bandOf(data.age));
  const money = (n: number) => fmt.money(n, { cents: 'never' });
  const f = data.fees;
  const totalFee = adults * f.adultTotal + minors * f.minor;
  const needsTest = band === 'adult';
  const minor = band === 'minor';
  const short = (iso: string) => fmt.date(iso, { month: 'short', day: 'numeric', year: 'numeric' });
  const lang = useLang();

  const ids: StepId[] = data.steps.filter((s) => s !== 'test' || needsTest);
  if (needsTest && !ids.includes('test')) ids.splice(3, 0, 'test');
  const steps = ids.map((id, i) => ({
    // The goal gets a maple leaf, not the red status ring (red stays for warnings).
    title:
      id === 'passport' ? (
        // The leaf is glued to the last word (U+00A0), so it wraps with the title instead of sitting alone.
        <>
          {t(`steps.step.${id}.title`)}
          {'\u00a0'}
          <Mark className="inline-block size-3.5 translate-y-[1px] align-baseline text-maple" />
        </>
      ) : (
        t(`steps.step.${id}.title`)
      ),
    detail: minor && (id === 'check' || id === 'apply' || id === 'ceremony') ? t(`steps.step.${id}.detailMinor`, { min: RULES.oathMinAge }) : t(`steps.step.${id}.detail`),
    state: (i === 0 ? 'current' : 'upcoming') as 'current' | 'upcoming',
    aside:
      id === 'test' ? (
        <Badge tone="info">
          <bdi>{t('steps.step.test.aside')}</bdi>
        </Badge>
      ) : id === 'ceremony' && band === 'minor' ? (
        <Badge tone="info">
          <bdi>{t('steps.step.ceremony.asideMinor', { min: RULES.oathMinAge })}</bdi>
        </Badge>
      ) : undefined,
  }));

  return (
    <WidgetShell
      icon={Route}
      tone="maple"
      title={t('steps.title')}
      subtitle={t('steps.subtitle')}
      badge={data.processing.live ? <Badge tone="live">{t('steps.live')}</Badge> : undefined}
      sources={data.sources}
      handoff={{
        href: data.links.applyOnline,
        label: t('steps.handoff'),
      }}
      // What happens there, under the buttons: the same footer in every citizenship widget, in any language.
      footnote={t('steps.handoffNote')}
      secondaryAction={
        <LinkButton href={data.links.status} external variant="secondary" size="lg" icon={SearchCheck} className="max-sm:w-full">
          {t('steps.statusLink')}
        </LinkButton>
      }
      className="@container"
    >
      {/* Phones: one compact card of three rows, so the family calculator starts sooner. Wider: three tiles. */}
      <dl className="mx-5 my-0 grid rounded-tile border border-hair bg-paper-2 px-4 sm:mx-6 @xl:grid-cols-3 @xl:gap-2.5 @xl:border-0 @xl:bg-transparent @xl:px-0">
        {/* The headline figures follow the age chosen below: a child pays less and may not need the days. */}
        <Figure
          label={t(minor ? 'steps.stat.feeMinor' : 'steps.stat.fee')}
          value={<NumberTicker value={minor ? f.minor : f.adultTotal} format={(n) => money(Math.round(n))} />}
          note={
            <bdi>
              {minor
                ? t('steps.stat.feeMinorNote')
                : t('steps.stat.feeNote', {
                    processing: money(f.adultProcessing),
                    right: money(f.rightOfCitizenship),
                  })}
            </bdi>
          }
        />
        <Figure
          label={
            <>
              {t('steps.stat.time')}
              {/* Hung after the last word (it takes no room in the line), so the dot never wraps onto a line of its own. */}
              {data.processing.live ? (
                <span className="relative" aria-hidden>
                  <span className="absolute start-full top-1/2 ms-1.5 size-1.5 -translate-y-1/2 rounded-full bg-pine" />
                </span>
              ) : null}
            </>
          }
          value={data.processing.text}
          words
          note={
            <>
              {data.processing.updated ? t(data.processing.live ? 'steps.stat.timeNote' : 'steps.stat.timeSnapshot', { date: short(data.processing.updated) }) : null}
              {data.processing.waiting ? <span className="block">{data.processing.waiting}</span> : null}
            </>
          }
        />
        {/* A child with a Canadian parent (or one applying at the same time) needs no minimum days, so the headline says so. */}
        <Figure
          label={t('steps.stat.days')}
          value={minor ? t('steps.stat.daysMinor') : fmt.number(data.rules.requiredDays)}
          words={minor}
          note={t(minor ? 'steps.stat.daysNoteMinor' : 'steps.stat.daysNote', {
            days: fmt.number(data.rules.requiredDays),
          })}
        />
      </dl>

      <WidgetSection title={t('steps.family.title')} className="mt-6 border-t border-hair">
        <div className="grid gap-2 @xl:grid-cols-2">
          <Counter
            label={t('steps.family.adults')}
            sub={t('steps.family.adultsSub', { fee: money(f.adultTotal) })}
            value={adults}
            max={12}
            onChange={setAdults}
            fewer={t('steps.family.fewer')}
            more={t('steps.family.more')}
          />
          <Counter
            label={t('steps.family.minors')}
            sub={t('steps.family.minorsSub', { fee: money(f.minor) })}
            value={minors}
            max={20}
            onChange={setMinors}
            fewer={t('steps.family.fewer')}
            more={t('steps.family.more')}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-tile bg-paper-2 px-4 py-3.5" aria-live="polite">
          <span className="font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{t('steps.family.total')}</span>
          <span className="font-serif text-[32px] leading-none tracking-[-.02em] text-ink">
            <NumberTicker value={totalFee} format={(n) => money(Math.round(n))} />
          </span>
        </div>
        <p className="m-0 mt-2.5 text-[13.5px] leading-snug text-ink-3">
          {/* The refund applies to an adult's right of citizenship fee; children never pay it. */}
          {t(adults > 0 ? 'steps.family.note' : 'steps.family.noteMinors', {
            right: money(f.rightOfCitizenship),
          })}
        </p>
      </WidgetSection>

      <WidgetSection title={t('steps.journey.title')}>
        <p className="m-0 mb-2 text-[14px] font-medium text-ink" aria-hidden>
          {t('steps.age.label')}
        </p>
        <Segmented
          label={t('steps.age.label')}
          value={band}
          onChange={setBand}
          options={(['minor', 'adult', 'senior'] as AgeBand[]).map((b) => ({
            value: b,
            // Isolated: "18 to 54" keeps its number first in right-to-left text.
            label: <bdi className="text-balance">{t(`steps.age.${b}`)}</bdi>,
            // Mono spreads French apostrophes and longer words; French gets the sans face here.
            sub: <span className={cn(lang === 'fr' && 'font-sans text-[12px] tracking-normal')}>{t(`steps.age.${b}Sub`)}</span>,
          }))}
        />
        <Stepper className="mt-5" steps={steps} />
        <p className="m-0 mt-4 text-[13.5px] leading-snug text-ink-2" aria-live="polite">
          {needsTest ? t('steps.language') : t('steps.noTest', { age: band === 'minor' ? 'minor' : 'senior' })}
        </p>
        <Notice tone="info" className="mt-4" title={t('steps.already')}>
          {t('steps.alreadyBody')}
        </Notice>
        <p className="m-0 mt-3 text-[13px] leading-snug text-ink-3">{t(minor ? 'steps.returnedMinor' : 'steps.returned')}</p>
      </WidgetSection>
    </WidgetShell>
  );
}

/**
 * A headline figure. Below @xl it is a row of a shared card (label and note at the start, value at the
 * end); from @xl it is a tile, like Stat. `words` is a text value ("About 12 months"): a size smaller, on
 * one line beside its label, with the note under both at full width so neither is squeezed on a phone.
 */
function Figure({ label, value, note, words }: { label: ReactNode; value: ReactNode; note?: ReactNode; words?: boolean }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3 @max-xl:not-first:border-t @max-xl:not-first:border-hair @xl:grid-cols-1 @xl:content-start @xl:rounded-tile @xl:border @xl:border-hair @xl:bg-paper-2 @xl:px-4 @xl:py-3.5">
      <dt className="col-start-1 row-start-1 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-ink-2">{label}</dt>
      <dd
        className={cn(
          'col-start-2 row-start-1 m-0 text-end font-serif leading-[1.05] tracking-[-.03em] text-ink [font-variation-settings:"opsz"_48]',
          '@xl:col-start-1 @xl:row-span-1 @xl:row-start-2 @xl:mt-1.5 @xl:text-start',
          words ? 'max-w-[16ch] text-[19px] leading-tight text-balance @xl:max-w-none @xl:text-[26px]' : 'row-span-2 text-[26px] @xl:text-[30px]',
        )}
      >
        {value}
      </dd>
      {note ? (
        <dd className={cn('col-start-1 row-start-2 m-0 mt-0.5 text-[12.5px] leading-snug text-ink-3 @xl:row-start-3 @xl:mt-1', words && 'col-span-2 @xl:col-span-1')}>{note}</dd>
      ) : null}
    </div>
  );
}
