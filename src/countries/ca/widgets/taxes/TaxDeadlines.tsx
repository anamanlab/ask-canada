'use client';
/**
 * Tax deadlines countdown: days until the filing deadline for the return being prepared, every date that
 * matters for it (instalment, FHSA, RRSP, file + pay, self-employed), and a calendar file built on the device.
 */
import { useState } from 'react';
import { AlarmClock, CalendarCheck, CalendarClock, CalendarPlus, Clock } from 'lucide-react';
import { Badge, Button, DateTile, LiveRegion, Notice, Segmented, WidgetError, WidgetSection, WidgetShell } from '@/components/ui';
import { useToday } from '@/lib/hooks';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import type { WidgetProps } from '@/lib/widgets/types';
import { addDays, diffDays } from '@/lib/dates/business-days';
import { onTime, planDeadlines, type Deadline } from './calc/deadlines';
import { deadlinesArgs } from './args';
import { buildDeadlines } from './build';
import { CHECKED } from './data';
import { URLS, localizeSources } from './urls';
import { downloadIcs, toICS } from './ics';
import messages from './messages';
import { AnswerLang, Ring, SHELL, useDateFmt, useShortDate } from './shared';
import { TaxSkeleton } from './skeleton';
import type { DeadlinesInput, DeadlinesResult } from './types';

export function TaxDeadlines(props: WidgetProps<DeadlinesInput, DeadlinesResult>) {
  return (
    <AnswerLang lang={props.part.input?.lang}>
      <TaxDeadlinesView {...props} />
    </AnswerLang>
  );
}

function TaxDeadlinesView({ part }: WidgetProps<DeadlinesInput, DeadlinesResult>) {
  const t = useMessages(messages);
  const { locale } = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  // Until the tool answers with its own date, plan the loading state from the reader's.
  const today = useToday(CHECKED);
  if (part.state === 'output-error') {
    return <WidgetError title={t('dl.error.title')} message={t('error.body')} fallback={{ href: URLS.dates[lang], label: t('error.fallback') }} />;
  }
  if (part.state !== 'output-available' || !part.output) {
    // The widget itself, built from the input so far and drawn as a skeleton: same layout, so nothing jumps.
    return (
      <TaxSkeleton label={t('loading')}>
        <Countdown initial={buildDeadlines(deadlinesArgs(part.input, lang), today)} />
      </TaxSkeleton>
    );
  }
  return <Countdown initial={part.output} />;
}

function Countdown({ initial }: { initial: DeadlinesResult }) {
  const t = useMessages(messages);
  const { fmt, locale } = useLocale();
  const df = useDateFmt();
  const shortDate = useShortDate();
  const lang = locale === 'fr' ? 'fr' : 'en';
  // The reader's own date (the server plans in the capital region's time); a replayed answer keeps its date.
  const today = useToday(initial.today, { maxDriftDays: 1 });
  const [selfEmployed, setSelfEmployed] = useState(initial.selfEmployed);
  // Which set of dates the calendar file was last made for: the button confirms it until the dates change.
  const [downloadedFor, setDownloadedFor] = useState<string | null>(null);
  const plan = today === initial.today && selfEmployed === initial.selfEmployed ? initial : { ...initial, ...planDeadlines({ today, selfEmployed, lang: initial.lang }) };
  const main = plan.main;
  // "When is the RRSP deadline?": lead with the RRSP date until it passes, then the filing date again.
  const rrspD = plan.deadlines.find((d) => d.kind === 'rrsp');
  const rrspHero = initial.focus === 'rrsp' && rrspD != null && !rrspD.past;
  const hero = rrspHero ? rrspD : main;
  const heroSpan = rrspHero ? diffDays(onTime(addDays(`${plan.taxYear}-01-01`, 59)), rrspD.onTimeBy) : plan.seasonSpan;
  const long = (d: string) => df(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const short = (d: string) => df(d, { month: 'long', day: 'numeric', year: 'numeric' });
  const progress = heroSpan > 0 ? Math.min(1, Math.max(0, 1 - hero.daysLeft / heroSpan)) : 1;
  const taxYear = String(plan.taxYear);
  const filingYear = String(plan.filingYear);

  const title = (d: Deadline) => t(`dl.item.${d.kind}.title`, { year: taxYear });
  const detail = (d: Deadline) => t(`dl.item.${d.kind}.detail`, { year: taxYear, next: filingYear });

  const calendarKey = `${plan.taxYear}:${selfEmployed}`;
  const downloaded = downloadedFor === calendarKey;
  const addToCalendar = () => {
    const items = plan.deadlines
      .filter((d) => !d.past)
      .map((d) => ({ date: d.onTimeBy, title: title(d), detail: `${detail(d)} ${URLS.dates[lang]}` }));
    downloadIcs(`${t('dl.ics.file', { year: taxYear })}.ics`, toICS(items, plan.today));
    setDownloadedFor(calendarKey);
  };

  const days = Math.max(0, hero.daysLeft);
  const eyebrow = hero.past ? t('dl.hero.passed') : rrspHero ? t('dl.hero.eyebrowRrsp') : selfEmployed ? t('dl.hero.eyebrowSelf') : t('dl.hero.eyebrow');
  const heroSub = rrspHero
    ? t('dl.hero.subRrsp', { year: taxYear, file: short(main.onTimeBy).replace(/ /g, '\u00a0') })
    : selfEmployed
      ? t('dl.hero.subSelf', { pay: short(plan.deadlines.find((d) => d.kind === 'file')!.onTimeBy) })
      : t('dl.hero.sub');

  return (
    <WidgetShell
      icon={CalendarClock}
      tone="maple"
      title={t('dl.title')}
      subtitle={<bdi>{t('dl.subtitle', { year: taxYear, next: filingYear })}</bdi>}
      sources={localizeSources(plan.sources, lang)}
      handoff={{ href: URLS.dates[lang], label: t('dl.handoff'), note: t('dl.handoffNote') }}
      secondaryAction={
        plan.deadlines.some((d) => !d.past) ? (
          <Button icon={downloaded ? CalendarCheck : CalendarPlus} size="lg" onClick={addToCalendar} className="max-sm:w-full">
            {t(downloaded ? 'dl.ics.done' : 'dl.ics.button')}
          </Button>
        ) : null
      }
      footnote={t('dl.ics.note')}
      className={SHELL}
    >
      {/* Said once after the file is made: a silent download and a changed button label are easy to miss. */}
      <LiveRegion text={downloaded ? t('dl.ics.done') : ''} delay={200} />
      {/* Hero countdown */}
      <div className="mx-3 overflow-hidden rounded-[22px] border border-maple/15 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--maple)_7%,transparent),color-mix(in_oklab,var(--a-rose)_12%,transparent)_55%,color-mix(in_oklab,var(--a-violet)_10%,transparent))] px-5 py-5 sm:mx-4">
        {/* The eyebrow has the band's full width (one line in both languages), so the number below never shifts. */}
        <p className="m-0 font-mono text-[11.5px] font-medium uppercase tracking-[.1em] text-maple-ink">{eyebrow}</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 font-serif text-[64px] leading-[.95] tracking-[-.04em] text-ink [font-variation-settings:'opsz'_96]">
              <span className="tabular-nums">{fmt.number(days)}</span>
              <span className="font-sans text-[16px] font-medium tracking-[-.005em] text-ink-2">{t('dl.hero.days', { count: days })}</span>
            </p>
            <p className="m-0 mt-2 text-[15px] leading-snug text-ink-2">
              <b className="font-semibold text-ink">{long(hero.onTimeBy)}</b>
            </p>
            <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{heroSub}</p>
            {/* Switching "employee / self-employed" changes the countdown: say the new one once. */}
            <LiveRegion text={`${eyebrow}, ${fmt.number(days)} ${t('dl.hero.days', { count: days })}. ${long(hero.onTimeBy)}. ${heroSub}`} delay={400} />
          </div>
          <Ring value={progress} size={96} tone="maple" label={t('dl.ring', { pct: Math.round(progress * 100) })}>
            <span className="flex flex-col items-center leading-none">
              <AlarmClock className="size-5 text-maple" strokeWidth={1.9} aria-hidden />
              <span className="mt-1 font-mono text-[11px] font-medium uppercase text-ink-2">{shortDate(hero.onTimeBy)}</span>
            </span>
          </Ring>
        </div>
      </div>

      <div className="px-5 pt-5 sm:px-6">
        <Segmented
          label={t('dl.who.label')}
          value={selfEmployed ? 'self' : 'employee'}
          onChange={(v) => setSelfEmployed(v === 'self')}
          options={[
            { value: 'employee', label: t('dl.who.employee'), sub: t('dl.who.employeeSub', { date: df(`${filingYear}-04-30`, { month: 'short', day: 'numeric' }) }) },
            { value: 'self', label: t('dl.who.self'), sub: t('dl.who.selfSub', { date: df(`${filingYear}-06-15`, { month: 'short', day: 'numeric' }) }) },
          ]}
        />
      </div>

      <WidgetSection title={t('dl.list.title', { year: taxYear })}>
        <ol className="m-0 list-none p-0">
          {plan.deadlines.map((d) => {
            const isNext = plan.next === d.kind;
            const isMain = d.kind === hero.kind;
            // Colour means one thing: maple is the date the countdown is for, glacier any other date still
            // ahead, grey a date that has passed or only applies to some people.
            // Instalments only concern people the CRA asked to pay that way: a quiet tile and an
            // "If it applies" tag show why "Next up" skips it.
            const optional = d.kind === 'instalment' && !d.past;
            return (
              <li key={d.kind} className="relative flex items-start gap-3.5 border-t border-hair py-3.5 first:border-t-0 first:pt-1">
                <DateTile
                  date={d.onTimeBy}
                  tone={isMain ? 'maple' : 'glacier'}
                  className={d.past || optional ? 'shadow-none [&>b]:border-b [&>b]:border-hair [&>b]:bg-paper-2 [&>b]:text-ink-2' : undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15.5px] font-semibold leading-snug text-ink">
                    <span className={d.past ? 'line-through decoration-hair-2 decoration-[1.5px]' : undefined}>{title(d)}</span>
                    {isNext ? (
                      <Badge tone={d.daysLeft <= 14 ? 'danger' : 'info'} icon={Clock}>
                        {t('dl.next')}
                      </Badge>
                    ) : optional ? (
                      <Badge tone="neutral">{t('dl.ifApplies')}</Badge>
                    ) : null}
                  </p>
                  <p className="m-0 mt-0.5 text-[14px] leading-snug text-ink-2">{detail(d)}</p>
                  <p className="m-0 mt-1 font-mono text-[12px] text-ink-3">
                    {long(d.onTimeBy)}
                    {d.rolled ? ` · ${t('dl.rolled', { date: df(d.date, { weekday: 'long', month: 'long', day: 'numeric' }) })}` : ''}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 text-end">
                  {d.past ? (
                    <Badge tone="neutral">{t('dl.passed')}</Badge>
                  ) : (
                    <span className="block font-serif text-[22px] leading-none tracking-[-.02em] text-ink tabular-nums">
                      {fmt.number(d.daysLeft)}
                      <span className="mt-1 block font-sans text-[12px] font-medium tracking-normal text-ink-3">{t('dl.daysShort', { count: d.daysLeft })}</span>
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
        {plan.deadlines.some((d) => d.rolled) ? (
          <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3">{t('dl.rollover')}</p>
        ) : null}
      </WidgetSection>

      <div className="px-5 pt-4 sm:px-6">
        <Notice tone="warn" title={t('dl.penalty.title')}>
          {t('dl.penalty.body', { base: plan.penalty.base, month: plan.penalty.perMonth, max: plan.penalty.maxMonths })}
        </Notice>
      </div>
    </WidgetShell>
  );
}
