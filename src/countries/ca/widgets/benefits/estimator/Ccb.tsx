'use client';
/** Canada child benefit estimator: family income and children, plus the child disability benefit. */
import { useState } from 'react';
import { LinkButton, WidgetSection } from '@/components/ui';
import { useLocale } from '@/lib/i18n/provider';
import { useMessages } from '@/lib/i18n/widget';
import messages from '../messages';
import { ccbAnnual, childDisabilityAnnual } from '../calc';
import { AgesPrompt, AssumedHint, Counter, isolate, NextPay, useUpcoming, WHOLE } from '../parts';
import { Range } from '../Range';
import { CCB } from '../rates';
import { CcbCurve } from './CcbCurve';
import { Frame, Hero, Row, useTypical, type Out } from './shared';

export default function CcbEstimator({ data }: { data: Out<'ccb'> }) {
  const t = useMessages(messages);
  const { fmt } = useLocale();
  const money = (n: number) => fmt.money(n, WHOLE);
  const [income, setIncome] = useState(data.initial.income);
  const [u6, setU6] = useState(data.initial.childrenUnder6);
  const [o6, setO6] = useState(data.initial.children6to17);
  const [dis, setDis] = useState(data.initial.childDisability);
  const { typical, touch } = useTypical(data.given);
  // A count without ages (like the finder): ask how many are under 6, and until then say they're counted as 6 to 17.
  const [agesAsked, setAgesAsked] = useState(false);
  const [agesSet, setAgesSet] = useState(false);
  const agesUnknown = !!data.kidsAgesUnknown && !agesSet;
  const kids = u6 + o6;
  const ccb = ccbAnnual(income, u6, o6);
  const cd = childDisabilityAnnual(income, Math.min(dis, kids));
  const annual = ccb + cd;
  const max = u6 * CCB.under6 + o6 * CCB.age6to17;
  const next = useUpcoming(data.payments.next, data.today, data.pinned).ccb?.[0];

  return (
    <Frame
      program="ccb"
      data={data}
      handoff={{ href: data.links.apply, label: t('est.ccb.handoff'), note: isolate(t('est.ccb.handoffNote')) }}
      secondary={
        <LinkButton href={data.links.calculator} external variant="secondary" size="lg" className="@max-xl:w-full">
          {t('est.ccb.calculator')}
        </LinkButton>
      }
    >
      <Hero
        value={kids ? annual / 12 : 0}
        format={money}
        unit={t('est.ccb.hero')}
        sub={
          !kids
            ? t('est.ccb.noKids')
            : typical('income')
              ? t('est.ccb.subTypical', { amount: money(annual), income: money(income) })
              : agesUnknown
                ? t('est.ccb.subAges', { amount: money(annual) })
              : cd > 0
                ? t('est.ccb.subWithCd', { amount: money(annual), cd: money(cd) })
                : t('est.ccb.sub', { amount: money(annual) })
        }
        approx={kids > 0 && (typical('income') || agesUnknown)}
        aside={next && kids && annual > 0 ? <NextPay date={next} /> : null}
      />
      <WidgetSection>
        <div className="grid gap-4">
          <div>
            <Range
              entry="money"
              label={t('est.ccb.income')}
              max={250_000}
              step={500}
              value={income}
              onChange={(n) => {
                touch('income');
                setIncome(n);
              }}
              format={money}
              state={typical('income') ? 'typical' : 'set'}
            />
            {typical('income') ? <AssumedHint label={t('est.example')} /> : null}
            <p className="m-0 mt-0.5 text-[13px] text-ink-3"><bdi>{t('est.ccb.incomeHint')}</bdi></p>
          </div>
          {/* Ages not given: one question first. Once answered it stays (marked done) and the full counters appear below it. */}
          {data.kidsAgesUnknown && (agesUnknown || agesAsked) && kids > 0 ? (
            <AgesPrompt
              kids={kids}
              under6={u6}
              done={!agesUnknown}
              onChange={(n) => {
                setAgesSet(true);
                setAgesAsked(true);
                setU6(n);
                setO6(kids - n);
              }}
            />
          ) : null}
          {!agesUnknown || kids === 0 ? (
            <div className="grid gap-2 @md:grid-cols-2">
              <Counter label={t('est.ccb.under6')} value={u6} onChange={setU6} max={8} />
              <Counter label={t('est.ccb.age6to17')} value={o6} onChange={setO6} max={8} />
            </div>
          ) : null}
          {kids > 0 ? <Counter label={t('est.ccb.disability')} value={Math.min(dis, kids)} onChange={setDis} max={kids} /> : null}
        </div>
      </WidgetSection>
      {kids > 0 ? (
        <WidgetSection>
          <CcbCurve income={income} u6={u6} o6={o6} dis={Math.min(dis, kids)} />
          <dl className="m-0 mt-4">
            <Row label={t('est.ccb.max')} value={money(max)} />
            <Row
              label={t('est.ccb.reduction')}
              value={max - ccb > 0 ? `−${money(max - ccb)}` : money(0)}
              note={max - ccb > 0 ? null : t('est.ccb.reductionNone', { amount: money(CCB.t1) })}
              tone={max - ccb > 0 ? 'minus' : undefined}
            />
            {dis > 0 ? <Row label={t('est.ccb.cd')} value={`+${money(cd)}`} tone="plus" /> : null}
          </dl>
        </WidgetSection>
      ) : null}
    </Frame>
  );
}
