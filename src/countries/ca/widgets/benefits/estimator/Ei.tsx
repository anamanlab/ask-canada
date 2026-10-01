'use client';
/** EI regular benefits estimator: 55% of average weekly earnings up to the yearly maximum, for 14 to 45 weeks. */
import { useState } from 'react';
import { LinkButton, Notice, WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { eiEstimate } from '../calc';
import { AssumedHint, isolate, WHOLE } from '../parts';
import { Range } from '../Range';
import { EI } from '../rates';
import { Frame, Hero, InfoList, Tile, useTypical, type Out } from './shared';

export default function EiEstimator({ data }: { data: Out<'ei'> }) {
  const t = useMessages(messages);
  const [earnings, setEarnings] = useState(data.initial.earnings);
  const { typical, touch } = useTypical(data.given);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const e = eiEstimate(earnings);
  const share = e.weekly / EI.maxWeekly;
  return (
    <Frame
      program="ei"
      data={data}
      handoff={{ href: data.links.apply, label: t('est.ei.handoff'), note: isolate(t('est.ei.handoffNote')) }}
      secondary={
        <LinkButton href={data.links.estimator} external variant="secondary" size="lg" className="@max-xl:w-full">
          {t('est.ei.official')}
        </LinkButton>
      }
    >
      <Hero
        tone="glacier"
        value={e.weekly}
        format={money}
        unit={t('est.ei.hero')}
        sub={
          typical('income')
            ? t('est.ei.subTypical', { earnings: money(earnings) })
            : e.capped
              ? t('est.ei.subCapped', { max: money(EI.maxInsurable) })
              : t('est.ei.sub', { avg: money(e.averageWeekly) })
        }
        approx={typical('income')}
      />
      <div className="px-5 pt-5 @xl:px-6">
        <Notice tone="warn">
          <bdi>
            <strong className="font-semibold text-ink">{t('est.ei.apply.title')}</strong> {t('est.ei.apply.body')}
          </bdi>
        </Notice>
      </div>
      <WidgetSection>
        <Range
          entry="money"
          label={t('est.ei.earnings')}
          max={120_000}
          step={500}
          value={earnings}
          onChange={(n) => {
            touch('income');
            setEarnings(n);
          }}
          format={money}
          state={typical('income') ? 'typical' : 'set'}
        />
        {/* A placeholder to start from, not a statistic: the hero says so, and says what to do. */}
        {typical('income') ? <AssumedHint label={t('est.example')} /> : null}
        {/* EI never uses family income: said here, because the finder's Estimate button can't carry a couple's figure. */}
        <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{t('est.ei.earningsHint')}</bdi></p>
        {/* Not a second control: a labelled meter, set apart from the slider, for how close this is to the cap. */}
        <div className="mt-6 rounded-tile border border-hair bg-paper-2 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="font-medium text-ink-2">
              <bdi>{t('est.ei.meter', { max: money(EI.maxWeekly) })}</bdi>
            </span>
            <span className="font-mono tabular-nums text-ink">{fmt.number(share, { style: 'percent', maximumFractionDigits: 0 })}</span>
          </div>
          {/* The fill is full width and slides in from the start edge (the track is mirrored in RTL): only `transform` animates. */}
          <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-hair rtl:-scale-x-100" aria-hidden>
            <span
              className="absolute inset-0 rounded-full bg-glacier transition-[translate] duration-500 ease-spring motion-reduce:transition-none"
              style={{ translate: `${(share - 1) * 100}% 0` }}
            />
          </div>
        </div>
      </WidgetSection>
      <WidgetSection>
        <div className="grid gap-2.5 @md:grid-cols-2">
          <Tile label={t('est.ei.range')} value={<bdi dir="ltr">{t('est.ei.rangeValue', { low: money(e.minTotal), high: money(e.maxTotal) })}</bdi>} note={t('est.ei.rangeNote')} />
          <Tile label={t('est.ei.hours')} value={<bdi dir="ltr">{t('est.ei.hoursValue')}</bdi>} note={t('est.ei.hoursNote')} />
        </div>
        <InfoList items={[t('est.ei.tax'), t('est.ei.supplement', { amount: money(EI.familySupplement.income) })]} />
      </WidgetSection>
    </Frame>
  );
}
