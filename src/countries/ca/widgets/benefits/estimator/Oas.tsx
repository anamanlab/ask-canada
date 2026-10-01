'use client';
/** Old Age Security estimator: years in Canada, start age 65 to 70, age 75+, the recovery tax and a GIS estimate. */
import { useState } from 'react';
import { LinkButton, Notice, Toggle, WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { gisIncome, gisMonthly, oasEstimate, oasShortfall } from '../calc';
import { AssumedHint, CENTS, isolate, NextPay, useUpcoming, WHOLE } from '../parts';
import { Range } from '../Range';
import { OAS } from '../rates';
import { Bars } from './Bars';
import { Frame, Hero, Row, useTypical, type Out } from './shared';

export default function OasEstimator({ data }: { data: Out<'oas'> }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const [years, setYears] = useState(data.initial.yearsInCanada);
  const [start, setStart] = useState(data.initial.startAge);
  const [age75, setAge75] = useState(data.initial.age75);
  const [income, setIncome] = useState(data.initial.income);
  const { typical, touch } = useTypical(data.given);
  const o = oasEstimate({ years, startAge: start, age75, income });
  // GIS counts income without OAS (work income unknown here, so no work exemption: a cautious estimate).
  // GIS isn't paid while OAS is deferred, so it's based on the pension from 65.
  const gisBase = gisIncome(income, oasEstimate({ years, startAge: 65, age75, income: 0 }).gross * 12, 0);
  // With a partial pension the GIS is raised by what the pension is short of the full one.
  const partial = years < OAS.fullYears;
  const gis = o.eligible ? gisMonthly('single', gisBase, oasShortfall(years, age75)) : 0;
  // The next payment date sits beside the figure only when the figure is a pension in pay: from 65, or already 75.
  // A start age after 65 that is still ahead is a plan, and nothing lands on that date for it.
  const paidNow = start === 65 || age75;
  const next = useUpcoming(data.payments.next, data.today, data.pinned).oas?.[0];
  const bars = [65, 66, 67, 68, 69, 70].map((a) => ({ key: a, value: oasEstimate({ years, startAge: a, age75, income: 0 }).gross, label: fmt.number(a) }));
  const pct = (n: number) => fmt.number(n, { style: 'percent', maximumFractionDigits: 1 });

  return (
    <Frame
      program="oas"
      data={data}
      handoff={{ href: data.links.estimator, label: t('est.oas.handoff'), note: isolate(t('est.oas.handoffNote')) }}
      secondary={
        <LinkButton href={data.links.apply} external variant="secondary" size="lg" className="@max-xl:w-full">
          {t('est.oas.apply')}
        </LinkButton>
      }
    >
      <Hero
        tone="glacier"
        value={o.monthly}
        format={(n) => fmt.money(n, CENTS)}
        unit={t('est.oas.hero')}
        sub={!o.eligible ? t('est.oas.notEligible') : typical('yearsInCanada') ? t('est.oas.subTypical', { amount: money(o.annual) }) : t('est.oas.sub', { amount: money(o.annual) })}
        approx={o.eligible && typical('yearsInCanada')}
        aside={next && o.monthly > 0 && paidNow ? <NextPay date={next} /> : null}
      />
      <WidgetSection>
        <div className="grid gap-5">
          <div>
            <Range
              label={t('est.oas.years')}
              max={40}
              step={1}
              value={Math.min(years, 40)}
              onChange={(n) => {
                touch('yearsInCanada');
                setYears(n);
              }}
              format={(n) => (n >= 40 ? t('q.yearsMax') : t('q.yearsValue', { count: n }))}
              state={typical('yearsInCanada') ? 'typical' : 'set'}
            />
            {typical('yearsInCanada') ? <AssumedHint /> : null}
          </div>
          {/* At 75 the deferral earned by starting later stays (on top of the 10%), so the start age stays too. */}
          <Range
            label={age75 ? t('est.oas.startedAt') : t('est.oas.start')}
            min={65}
            max={70}
            step={0.5}
            value={start}
            onChange={setStart}
            format={(n) => fmt.number(n, { maximumFractionDigits: 1 })}
          />
          <Toggle label={isolate(t('est.oas.age75'))} description={isolate(t('est.oas.age75Sub'))} checked={age75} onChange={setAge75} />
          <div>
            <Range
              entry="money"
              label={t('est.oas.income')}
              max={200_000}
              step={1_000}
              value={income}
              onChange={(n) => {
                touch('income');
                setIncome(n);
              }}
              format={money}
              state={typical('income') ? 'typical' : 'set'}
            />
            {typical('income') ? <AssumedHint hint /> : null}
            <p className="m-0 mt-2 text-[13px] leading-snug text-ink-3"><bdi>{t('est.oas.incomeHint', { amount: money(OAS.recovery.threshold), amountNext: money(OAS.recovery.next.threshold) })}</bdi></p>
          </div>
        </div>
      </WidgetSection>
      <WidgetSection>
        <div className="grid gap-5 @xl:grid-cols-[1fr_1.1fr] @xl:items-end">
          <dl className="m-0">
            <Row label={t('est.oas.base')} value={fmt.money(age75 ? OAS.monthly75 : OAS.monthly65, CENTS)} />
            <Row label={t('est.oas.residency')} value={t('est.oas.residencyValue', { years: Math.min(years, 40) })} />
            <Row label={t('est.oas.deferral')} value={`+${pct(o.deferral)}`} tone={o.deferral > 0 ? 'plus' : undefined} />
            <Row label={t('est.oas.recovery')} value={o.recovery > 0 ? `−${fmt.money(o.recovery, CENTS)}` : money(0)} tone={o.recovery > 0 ? 'minus' : undefined} />
          </dl>
          <Bars
            items={bars}
            selected={Math.floor(start)}
            onPick={setStart}
            label={t('est.oas.bars')}
            sr={t('est.oas.barsSr', { at65: fmt.money(bars[0].value, CENTS), at70: fmt.money(bars[5].value, CENTS) })}
            itemLabel={(it) => t('est.pick', { age: String(it.key), amount: fmt.money(it.value, CENTS) })}
          />
        </div>
        {gis > 0 ? (
          <Notice tone="ok" className="mt-4">
            <bdi>
              {t('est.oas.gisEst', { income: money(gisBase), amount: fmt.money(gis, CENTS) })}
              {partial ? ` ${t('est.oas.gisPartial')}` : ''}
            </bdi>
          </Notice>
        ) : null}
      </WidgetSection>
    </Frame>
  );
}
