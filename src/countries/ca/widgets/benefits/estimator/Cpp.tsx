'use client';
/** CPP retirement pension estimator: the pension at 65 and the start age (60 to 70), with the total by 85. */
import { useState } from 'react';
import { LinkButton, NumberTicker, WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { cppEstimate } from '../calc';
import { AssumedHint, CENTS, isolate, NextPay, useUpcoming, WHOLE } from '../parts';
import { Range } from '../Range';
import { CPP } from '../rates';
import { Bars } from './Bars';
import { Frame, Hero, InfoList, Tile, useTypical, type Out } from './shared';

export default function CppEstimator({ data }: { data: Out<'cpp'> }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const [at65, setAt65] = useState(data.initial.at65);
  const [start, setStart] = useState(data.initial.startAge);
  const { typical, touch } = useTypical(data.given);
  const e = cppEstimate(at65, start);
  const next = useUpcoming(data.payments.next, data.today, data.pinned).cpp?.[0];
  // A true minus sign (U+2212), like the rows elsewhere; some locales format with a hyphen-minus.
  const pct = fmt.number(e.pct, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }).replace(/^[-\u2010-\u2012]/, '\u2212');
  const bars = e.series.map((s) => ({ key: s.age, value: s.monthly, label: fmt.number(s.age) }));
  // Until they give or slide to their own pension at 65, the hero is a typical pension, never "your amount".
  const typ = typical('at65');
  const sub = typ ? (start === 65 ? t('est.cpp.sub65Typical') : t('est.cpp.subTypical', { pct })) : start === 65 ? t('est.cpp.sub65') : t('est.cpp.sub', { pct });

  return (
    <Frame
      program="cpp"
      data={data}
      handoff={{ href: data.links.calculator, label: t('est.cpp.handoff'), note: isolate(t('est.cpp.handoffNote')) }}
      secondary={
        <LinkButton href={data.links.msca} external variant="secondary" size="lg" className="@max-xl:w-full">
          {t('est.cpp.msca')}
        </LinkButton>
      }
    >
      <Hero
        tone="amber"
        value={e.monthly}
        format={(n) => fmt.money(n, CENTS)}
        unit={t('est.cpp.hero')}
        sub={sub}
        approx={typ}
        aside={next ? <NextPay date={next} /> : null}
      />
      <WidgetSection>
        <div className="grid gap-4">
          <Range label={t('est.cpp.start')} min={CPP.minAge} max={CPP.maxAge} value={start} onChange={setStart} format={(n) => fmt.number(n)} />
          <div>
            <Range
              entry="money"
              cents
              label={t('est.cpp.at65')}
              max={CPP.max65}
              step={0.01}
              value={at65}
              onChange={(n) => {
                touch('at65');
                setAt65(n);
              }}
              format={(n) => fmt.money(n, CENTS)}
              state={typ ? 'typical' : 'set'}
            />
            {typ ? <AssumedHint /> : null}
            <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{t('est.cpp.at65Hint', { average: fmt.money(CPP.average65, CENTS) })}</bdi></p>
          </div>
        </div>
      </WidgetSection>
      <WidgetSection>
        <div className="grid gap-5 @xl:grid-cols-[1.2fr_1fr] @xl:items-end">
          <Bars
            items={bars}
            selected={start}
            onPick={setStart}
            label={t('est.cpp.bars')}
            sr={t('est.cpp.barsSr', { at60: fmt.money(e.series[0].monthly, CENTS), at65: fmt.money(e.series[5].monthly, CENTS), at70: fmt.money(e.series[10].monthly, CENTS) })}
            itemLabel={(it) => t('est.pick', { age: String(it.key), amount: fmt.money(it.value, CENTS) })}
          />
          <Tile label={t('est.cpp.total', { age: e.horizon })} value={<NumberTicker value={e.byHorizon} format={money} />} note={t('est.cpp.totalNote')} />
        </div>
        <InfoList items={[t('est.cpp.rule'), t('est.cpp.advice')]} />
      </WidgetSection>
    </Frame>
  );
}
